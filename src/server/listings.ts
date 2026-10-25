import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/server/db";
import { cacheAside, cacheDeleteByPrefix } from "../lib/server/cache";
import { assertOwnerOrAdmin, type AuthContext } from "../lib/server/auth";
import { ApiError } from "../lib/server/http";
import { findListingIdsWithinRadius, haversineMeters, syncListingLocation } from "../lib/server/geo";
import {
  listingCreateSchema,
  listingSearchSchema,
  listingUpdateSchema,
  type ListingCreateInput,
  type ListingSearchInput,
  type ListingUpdateInput,
} from "../lib/server/validation";

const listingInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  host: { select: { id: true, name: true, image: true } },
  _count: { select: { reviews: true, favorites: true } },
};

export async function listListings(rawInput: ListingSearchInput) {
  const input = listingSearchSchema.parse(rawInput);
  const cacheKey = `listings:v2:${JSON.stringify(input)}`;
  return cacheAside(cacheKey, async () => {
    if ((input.checkIn && !input.checkOut) || (!input.checkIn && input.checkOut)) {
      throw new ApiError(400, "checkIn and checkOut must be provided together");
    }

    const where: Prisma.ListingWhereInput = { status: ListingStatus.PUBLISHED };
    if (input.city) where.city = { contains: input.city, mode: "insensitive" };
    if (input.country) where.country = { contains: input.country, mode: "insensitive" };
    if (input.propertyType) where.propertyType = input.propertyType;
    if (input.roomType) where.roomType = input.roomType;
    if (input.amenities?.length) where.amenities = { array_contains: input.amenities as Prisma.InputJsonValue };
    if (input.guests) where.maxGuests = { gte: input.guests };
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      where.pricePerNight = {
        ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
        ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
      };
    }
    if (input.checkIn && input.checkOut) {
      where.reservations = {
        none: {
          status: { in: ["PENDING", "CONFIRMED"] },
          checkIn: { lt: input.checkOut },
          checkOut: { gt: input.checkIn },
        },
      };
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      const radiusMeters = input.radiusKm * 1_000;
      const postGisIds = await findListingIdsWithinRadius(
        input.latitude,
        input.longitude,
        radiusMeters,
      );
      if (postGisIds) {
        if (postGisIds.length === 0) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        where.id = { in: postGisIds };
      } else {
        const latitudeDelta = input.radiusKm / 111;
        const longitudeDelta = input.radiusKm / Math.max(1, 111 * Math.cos((input.latitude * Math.PI) / 180));
        where.latitude = { gte: input.latitude - latitudeDelta, lte: input.latitude + latitudeDelta };
        where.longitude = { gte: input.longitude - longitudeDelta, lte: input.longitude + longitudeDelta };
      }
    }

    const [rows, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    const items =
      input.latitude !== undefined && input.longitude !== undefined
        ? rows.filter(
            (row) =>
              haversineMeters(input.latitude!, input.longitude!, row.latitude, row.longitude) <=
              input.radiusKm * 1_000,
          )
        : rows;
    return { items, total: input.latitude !== undefined && input.longitude !== undefined ? items.length : total, page: input.page, pageSize: input.pageSize };
  });
}

export async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
  if (!listing) throw new ApiError(404, "Listing not found");
  return listing;
}

export async function listHostListings(context: AuthContext) {
  if (context.role !== "HOST" && context.role !== "ADMIN") {
    throw new ApiError(403, "Only hosts can view host listings");
  }
  return prisma.listing.findMany({
    where: context.role === "ADMIN" ? {} : { hostId: context.userId },
    include: listingInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function createListing(context: AuthContext, input: ListingCreateInput) {
  if (context.role !== "HOST" && context.role !== "ADMIN") {
    throw new ApiError(403, "Only hosts can create listings");
  }
  const parsed = listingCreateSchema.parse(input);
  const listing = await prisma.listing.create({
    data: {
      hostId: context.userId,
      title: parsed.title,
      description: parsed.description,
      propertyType: parsed.propertyType,
      roomType: parsed.roomType,
      address: parsed.address,
      city: parsed.city,
      country: parsed.country,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      pricePerNight: parsed.pricePerNight,
      cleaningFee: parsed.cleaningFee,
      serviceFee: parsed.serviceFee,
      maxGuests: parsed.maxGuests,
      bedrooms: parsed.bedrooms,
      beds: parsed.beds,
      bathrooms: parsed.bathrooms,
      amenities: parsed.amenities as Prisma.InputJsonValue,
      status: parsed.status as ListingStatus,
      images: {
        create: parsed.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          sortOrder: image.sortOrder ?? 0,
        })),
      },
    },
    include: listingInclude,
  });
  await syncListingLocation(listing.id, listing.latitude, listing.longitude);
  await cacheDeleteByPrefix("listings:v2:");
  return listing;
}

export async function updateListing(context: AuthContext, id: string, input: ListingUpdateInput) {
  const current = await prisma.listing.findUnique({ where: { id }, select: { hostId: true } });
  if (!current) throw new ApiError(404, "Listing not found");
  assertOwnerOrAdmin(context, current.hostId);
  const parsed = listingUpdateSchema.parse(input);
  const { images, amenities, status, ...scalarFields } = parsed;
  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...scalarFields,
      ...(amenities !== undefined ? { amenities: amenities as Prisma.InputJsonValue } : {}),
      ...(status !== undefined ? { status: status as ListingStatus } : {}),
      ...(images !== undefined
        ? {
            images: {
              deleteMany: {},
              create: images.map((image) => ({
                url: image.url,
                alt: image.alt,
                sortOrder: image.sortOrder ?? 0,
              })),
            },
          }
        : {}),
    },
    include: listingInclude,
  });
  if (parsed.latitude !== undefined || parsed.longitude !== undefined) {
    await syncListingLocation(listing.id, listing.latitude, listing.longitude);
  }
  await cacheDeleteByPrefix("listings:v2:");
  return listing;
}

export async function archiveListing(context: AuthContext, id: string) {
  const current = await prisma.listing.findUnique({ where: { id }, select: { hostId: true } });
  if (!current) throw new ApiError(404, "Listing not found");
  assertOwnerOrAdmin(context, current.hostId);
  const listing = await prisma.listing.update({
    where: { id },
    data: { status: ListingStatus.ARCHIVED },
    include: listingInclude,
  });
  await cacheDeleteByPrefix("listings:v2:");
  return listing;
}
