import { PrismaClient, Prisma, ListingStatus, ReservationStatus, PaymentStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/server/password";

const prisma = new PrismaClient();

const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const seededUsers = {
  hostSanFrancisco: {
    id: "usr_host_san_francisco",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80",
    role: "HOST" as const,
  },
  hostBarcelona: {
    id: "usr_host_barcelona",
    name: "Daniel Ortega",
    email: "daniel.ortega@example.com",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80",
    role: "HOST" as const,
  },
  guestDemo: {
    id: "usr_guest_demo",
    name: "Jordan Rivera",
    email: "jordan.rivera@example.com",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=256&q=80",
    role: "GUEST" as const,
  },
  guestAlex: {
    id: "usr_guest_alex",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&q=80",
    role: "GUEST" as const,
  },
  admin: {
    id: "usr_admin_demo",
    name: "Airbnb Clone Admin",
    email: "admin@example.com",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80",
    role: "ADMIN" as const,
  },
};

const seededListings = [
  {
    id: "listing_bayview_sf",
    hostId: seededUsers.hostSanFrancisco.id,
    title: "Sunlit Bayview Loft",
    description:
      "A design-forward loft with sweeping bay views, a chef-ready kitchen, and a quiet work nook for longer stays.",
    propertyType: "Loft",
    roomType: "Entire home",
    address: "2200 Mason Street",
    city: "San Francisco",
    country: "United States",
    latitude: 37.7956,
    longitude: -122.4103,
    pricePerNight: 245,
    cleaningFee: 85,
    serviceFee: 0,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Workspace", "Bay view", "Washer"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=85",
        alt: "Bright loft living room",
      },
      {
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=85&sat=-10",
        alt: "Loft seating area",
      },
    ],
  },
  {
    id: "listing_gothic_barcelona",
    hostId: seededUsers.hostBarcelona.id,
    title: "Gothic Quarter Balcony Flat",
    description:
      "A calm, character-filled apartment in the heart of Barcelona with original tilework and a private balcony.",
    propertyType: "Apartment",
    roomType: "Entire home",
    address: "Carrer dels Escudellers, 18",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.3809,
    longitude: 2.1763,
    pricePerNight: 180,
    cleaningFee: 60,
    serviceFee: 25,
    maxGuests: 3,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["Wifi", "Kitchen", "Balcony", "Air conditioning", "Elevator"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=85",
        alt: "Barcelona apartment living room",
      },
      {
        url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=85&hue=20",
        alt: "Warm apartment bedroom",
      },
    ],
  },
  {
    id: "listing_desert_joshua_tree",
    hostId: seededUsers.hostSanFrancisco.id,
    title: "Joshua Tree Stargazer Cabin",
    description:
      "A secluded desert cabin with a cedar hot tub, floor-to-ceiling windows, and dark-sky views just outside the park.",
    propertyType: "Cabin",
    roomType: "Entire home",
    address: "6175 Sunny Sands Drive",
    city: "Joshua Tree",
    country: "United States",
    latitude: 34.1347,
    longitude: -116.3131,
    pricePerNight: 320,
    cleaningFee: 95,
    serviceFee: 0,
    maxGuests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    amenities: ["Wifi", "Hot tub", "Fireplace", "Free parking", "Mountain view"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1600&q=85",
        alt: "Desert cabin exterior",
      },
      {
        url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1600&q=85",
        alt: "Cabin interior with large windows",
      },
    ],
  },
] as const;

async function upsertUser(user: (typeof seededUsers)[keyof typeof seededUsers]) {
  const passwordHash = await hashPassword("StayfolkDemo123!");
  return prisma.user.upsert({
    where: { id: user.id },
    create: { ...user, passwordHash },
    update: {
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      passwordHash,
    },
  });
}

async function upsertListing(listing: (typeof seededListings)[number]) {
  const record = await prisma.listing.upsert({
    where: { id: listing.id },
    create: {
      id: listing.id,
      hostId: listing.hostId,
      title: listing.title,
      description: listing.description,
      propertyType: listing.propertyType,
      roomType: listing.roomType,
      address: listing.address,
      city: listing.city,
      country: listing.country,
      latitude: listing.latitude,
      longitude: listing.longitude,
      pricePerNight: listing.pricePerNight,
      cleaningFee: listing.cleaningFee,
      serviceFee: listing.serviceFee,
      maxGuests: listing.maxGuests,
      bedrooms: listing.bedrooms,
      beds: listing.beds,
      bathrooms: listing.bathrooms,
      amenities: listing.amenities as unknown as Prisma.InputJsonValue,
      status: ListingStatus.PUBLISHED,
    },
    update: {
      hostId: listing.hostId,
      title: listing.title,
      description: listing.description,
      propertyType: listing.propertyType,
      roomType: listing.roomType,
      address: listing.address,
      city: listing.city,
      country: listing.country,
      latitude: listing.latitude,
      longitude: listing.longitude,
      pricePerNight: listing.pricePerNight,
      cleaningFee: listing.cleaningFee,
      serviceFee: listing.serviceFee,
      maxGuests: listing.maxGuests,
      bedrooms: listing.bedrooms,
      beds: listing.beds,
      bathrooms: listing.bathrooms,
      amenities: listing.amenities as unknown as Prisma.InputJsonValue,
      status: ListingStatus.PUBLISHED,
    },
  });

  await prisma.listingImage.deleteMany({ where: { listingId: record.id } });
  await prisma.listingImage.createMany({
    data: listing.images.map((image, sortOrder) => ({
      listingId: record.id,
      url: image.url,
      alt: image.alt,
      sortOrder,
    })),
  });

  try {
    await prisma.$executeRaw`
      UPDATE "Listing"
      SET "location" = ST_SetSRID(ST_MakePoint(${listing.longitude}, ${listing.latitude}), 4326)::geography
      WHERE "id" = ${record.id}
    `;
  } catch (error) {
    console.warn(`PostGIS location sync skipped for ${record.id}`, error);
  }

  return record;
}

async function upsertReservation(input: {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: ReservationStatus;
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
}) {
  return prisma.reservation.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      listingId: input.listingId,
      guestId: input.guestId,
      hostId: input.hostId,
      checkIn: asDate(input.checkIn),
      checkOut: asDate(input.checkOut),
      guests: input.guests,
      status: input.status,
      currency: "USD",
      nightlyRate: input.nightlyRate,
      nights: input.nights,
      subtotal: input.subtotal,
      cleaningFee: input.cleaningFee,
      serviceFee: input.serviceFee,
      taxes: input.taxes,
      total: input.total,
    },
    update: {
      listingId: input.listingId,
      guestId: input.guestId,
      hostId: input.hostId,
      checkIn: asDate(input.checkIn),
      checkOut: asDate(input.checkOut),
      guests: input.guests,
      status: input.status,
      nightlyRate: input.nightlyRate,
      nights: input.nights,
      subtotal: input.subtotal,
      cleaningFee: input.cleaningFee,
      serviceFee: input.serviceFee,
      taxes: input.taxes,
      total: input.total,
    },
  });
}

async function main() {
  for (const user of Object.values(seededUsers)) await upsertUser(user);

  for (const listing of seededListings) await upsertListing(listing);

  const completedBarcelonaStay = await upsertReservation({
    id: "res_completed_barcelona",
    listingId: "listing_gothic_barcelona",
    guestId: seededUsers.guestDemo.id,
    hostId: seededUsers.hostBarcelona.id,
    checkIn: "2026-06-12",
    checkOut: "2026-06-16",
    guests: 2,
    status: ReservationStatus.COMPLETED,
    nightlyRate: 180,
    nights: 4,
    subtotal: 720,
    cleaningFee: 60,
    serviceFee: 25,
    taxes: 64,
    total: 869,
  });

  const confirmedBayviewStay = await upsertReservation({
    id: "res_confirmed_bayview",
    listingId: "listing_bayview_sf",
    guestId: seededUsers.guestDemo.id,
    hostId: seededUsers.hostSanFrancisco.id,
    checkIn: "2027-01-14",
    checkOut: "2027-01-17",
    guests: 2,
    status: ReservationStatus.CONFIRMED,
    nightlyRate: 245,
    nights: 3,
    subtotal: 735,
    cleaningFee: 85,
    serviceFee: 88,
    taxes: 73,
    total: 981,
  });

  const pendingDesertStay = await upsertReservation({
    id: "res_pending_desert",
    listingId: "listing_desert_joshua_tree",
    guestId: seededUsers.guestAlex.id,
    hostId: seededUsers.hostSanFrancisco.id,
    checkIn: "2027-02-20",
    checkOut: "2027-02-22",
    guests: 4,
    status: ReservationStatus.PENDING,
    nightlyRate: 320,
    nights: 2,
    subtotal: 640,
    cleaningFee: 95,
    serviceFee: 77,
    taxes: 65,
    total: 877,
  });

  await prisma.payment.upsert({
    where: { stripePaymentIntentId: "pi_seed_completed_barcelona" },
    create: {
      reservationId: completedBarcelonaStay.id,
      provider: "stripe-mock",
      stripePaymentIntentId: "pi_seed_completed_barcelona",
      amount: completedBarcelonaStay.total,
      currency: "USD",
      status: PaymentStatus.SUCCEEDED,
      metadata: { source: "seed" } as Prisma.InputJsonValue,
    },
    update: {
      reservationId: completedBarcelonaStay.id,
      amount: completedBarcelonaStay.total,
      currency: "USD",
      status: PaymentStatus.SUCCEEDED,
      metadata: { source: "seed" } as Prisma.InputJsonValue,
    },
  });

  await prisma.payment.upsert({
    where: { stripePaymentIntentId: "pi_seed_confirmed_bayview" },
    create: {
      reservationId: confirmedBayviewStay.id,
      provider: "stripe-mock",
      stripePaymentIntentId: "pi_seed_confirmed_bayview",
      amount: confirmedBayviewStay.total,
      currency: "USD",
      status: PaymentStatus.SUCCEEDED,
      metadata: { source: "seed" } as Prisma.InputJsonValue,
    },
    update: {
      reservationId: confirmedBayviewStay.id,
      amount: confirmedBayviewStay.total,
      currency: "USD",
      status: PaymentStatus.SUCCEEDED,
      metadata: { source: "seed" } as Prisma.InputJsonValue,
    },
  });

  await prisma.payment.upsert({
    where: { stripePaymentIntentId: "pi_seed_pending_desert" },
    create: {
      reservationId: pendingDesertStay.id,
      provider: "stripe-mock",
      stripePaymentIntentId: "pi_seed_pending_desert",
      amount: pendingDesertStay.total,
      currency: "USD",
      status: PaymentStatus.REQUIRES_ACTION,
      metadata: {
        source: "seed",
        clientSecret: "pi_mock_secret_res_pending_desert",
      } as Prisma.InputJsonValue,
    },
    update: {
      reservationId: pendingDesertStay.id,
      amount: pendingDesertStay.total,
      currency: "USD",
      status: PaymentStatus.REQUIRES_ACTION,
      metadata: {
        source: "seed",
        clientSecret: "pi_mock_secret_res_pending_desert",
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.review.upsert({
    where: {
      listingId_authorId: {
        listingId: "listing_gothic_barcelona",
        authorId: seededUsers.guestDemo.id,
      },
    },
    create: {
      listingId: "listing_gothic_barcelona",
      authorId: seededUsers.guestDemo.id,
      reservationId: completedBarcelonaStay.id,
      rating: 5,
      comment: "Beautiful flat, perfect location, and a wonderfully thoughtful host.",
    },
    update: {
      reservationId: completedBarcelonaStay.id,
      rating: 5,
      comment: "Beautiful flat, perfect location, and a wonderfully thoughtful host.",
    },
  });

  await prisma.favorite.upsert({
    where: {
      userId_listingId: {
        userId: seededUsers.guestDemo.id,
        listingId: "listing_bayview_sf",
      },
    },
    create: {
      userId: seededUsers.guestDemo.id,
      listingId: "listing_bayview_sf",
    },
    update: {},
  });

  const thread = await prisma.messageThread.upsert({
    where: {
      listingId_guestId_hostId: {
        listingId: "listing_bayview_sf",
        guestId: seededUsers.guestDemo.id,
        hostId: seededUsers.hostSanFrancisco.id,
      },
    },
    create: {
      listingId: "listing_bayview_sf",
      guestId: seededUsers.guestDemo.id,
      hostId: seededUsers.hostSanFrancisco.id,
    },
    update: { updatedAt: new Date() },
  });

  await prisma.message.deleteMany({ where: { threadId: thread.id } });
  await prisma.message.createMany({
    data: [
      {
        threadId: thread.id,
        senderId: seededUsers.guestDemo.id,
        body: "Hi Maya! Is the workspace comfortable for a week of remote work?",
      },
      {
        threadId: thread.id,
        senderId: seededUsers.hostSanFrancisco.id,
        body: "Absolutely — it has a proper desk, monitor stand, and fast Wi-Fi.",
      },
    ],
  });

  console.log("Seed complete");
  console.log("Users:", Object.values(seededUsers).map((user) => `${user.name} (${user.id})`).join(", "));
  console.log("Listings:", seededListings.map((listing) => `${listing.title} (${listing.id})`).join(", "));
  console.log("Reservations: res_completed_barcelona, res_confirmed_bayview, res_pending_desert");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
