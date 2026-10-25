import { prisma } from "../lib/server/db";
import { ApiError } from "../lib/server/http";
import type { AuthContext } from "../lib/server/auth";

export async function listFavorites(context: AuthContext) {
  return prisma.favorite.findMany({
    where: { userId: context.userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          host: { select: { id: true, name: true, image: true } },
          _count: { select: { reviews: true, favorites: true } },
        },
      },
    },
  });
}

export async function addFavorite(context: AuthContext, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) throw new ApiError(404, "Listing not found");
  return prisma.favorite.upsert({
    where: { userId_listingId: { userId: context.userId, listingId } },
    create: { userId: context.userId, listingId },
    update: {},
  });
}

export async function removeFavorite(context: AuthContext, listingId: string) {
  await prisma.favorite.deleteMany({ where: { userId: context.userId, listingId } });
  return { removed: true };
}
