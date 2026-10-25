import { prisma } from "../lib/server/db";
import { ApiError } from "../lib/server/http";
import type { AuthContext } from "../lib/server/auth";
import type { ReviewCreateInput } from "../lib/server/validation";

export async function listReviews(listingId: string) {
  return prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
}

export async function createReview(
  context: AuthContext,
  listingId: string,
  input: ReviewCreateInput,
) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      ...(input.reservationId ? { id: input.reservationId } : {}),
      listingId,
      guestId: context.userId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      checkOut: { lte: new Date() },
    },
    select: { id: true },
  });
  if (!reservation) {
    throw new ApiError(400, "You can review a listing after completing a stay");
  }
  try {
    return await prisma.review.create({
      data: {
        listingId,
        authorId: context.userId,
        reservationId: reservation.id,
        rating: input.rating,
        comment: input.comment,
      },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      throw new ApiError(409, "You have already reviewed this listing");
    }
    throw error;
  }
}
