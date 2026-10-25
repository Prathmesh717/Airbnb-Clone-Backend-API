import { PaymentStatus, Prisma, ReservationStatus } from "@prisma/client";
import { prisma } from "../lib/server/db";
import { serverEnv } from "../lib/server/env";
import { ApiError } from "../lib/server/http";
import type { AuthContext } from "../lib/server/auth";
import { calculateCancellationRefund, calculateReservationPrice } from "../lib/server/pricing";
import type { ReservationCreateInput, ReservationUpdateInput } from "../lib/server/validation";

const activeStatuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED];

export async function assertNoReservationOverlap(
  client: Prisma.TransactionClient | typeof prisma,
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeId?: string,
) {
  const existing = await client.reservation.findFirst({
    where: {
      listingId,
      status: { in: activeStatuses },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) throw new ApiError(409, "Those dates are no longer available");
}

export async function createReservation(context: AuthContext, input: ReservationCreateInput) {
  if (context.role === "ADMIN") {
    throw new ApiError(400, "Administrators cannot create guest reservations");
  }
  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      hostId: true,
      status: true,
      maxGuests: true,
      pricePerNight: true,
      cleaningFee: true,
      serviceFee: true,
    },
  });
  if (!listing || listing.status !== "PUBLISHED") throw new ApiError(404, "Listing not found");
  if (listing.hostId === context.userId) throw new ApiError(400, "Hosts cannot reserve their own listing");
  if (input.guests > listing.maxGuests) throw new ApiError(400, "Guest count exceeds this listing's limit");

  const pricing = calculateReservationPrice({
    nightlyRate: listing.pricePerNight,
    cleaningFee: listing.cleaningFee,
    serviceFee: listing.serviceFee || undefined,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    currency: input.currency,
  });

  try {
    return await prisma.$transaction(
      async (tx) => {
        await assertNoReservationOverlap(tx, listing.id, input.checkIn, input.checkOut);
        return tx.reservation.create({
          data: {
            listingId: listing.id,
            guestId: context.userId,
            hostId: listing.hostId,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            guests: input.guests,
            status: ReservationStatus.PENDING,
            ...pricing,
          },
          include: { listing: { select: { id: true, title: true } }, payments: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new ApiError(409, "Those dates were booked by another guest");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "23P01") {
      throw new ApiError(409, "Those dates are no longer available");
    }
    throw error;
  }
}

export async function listReservations(context: AuthContext) {
  const where = context.role === "ADMIN" ? {} : { OR: [{ guestId: context.userId }, { hostId: context.userId }] };
  return prisma.reservation.findMany({
    where,
    orderBy: { checkIn: "desc" },
    include: {
      listing: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
      payments: true,
    },
  });
}

export async function getReservation(context: AuthContext, id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { listing: true, payments: true, reviews: true },
  });
  if (!reservation) throw new ApiError(404, "Reservation not found");
  if (context.role !== "ADMIN" && reservation.guestId !== context.userId && reservation.hostId !== context.userId) {
    throw new ApiError(403, "You do not have access to this reservation");
  }
  return reservation;
}

export async function cancelReservation(context: AuthContext, id: string) {
  const reservation = await getReservation(context, id);
  if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.CONFIRMED) {
    throw new ApiError(400, "This reservation cannot be cancelled");
  }
  const refund = calculateCancellationRefund(reservation.checkIn, reservation.total);
  const successfulPayment = reservation.payments.find((payment) => payment.status === PaymentStatus.SUCCEEDED);
  const paymentRefundAmount = successfulPayment ? Math.min(refund.refundAmount, successfulPayment.amount) : 0;
  if (successfulPayment && paymentRefundAmount > 0 && serverEnv.stripeSecretKey && successfulPayment.provider === "stripe") {
    const body = new URLSearchParams({
      payment_intent: successfulPayment.stripePaymentIntentId,
      amount: String(paymentRefundAmount),
      "metadata[reservationId]": reservation.id,
    });
    const response = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.stripeSecretKey}`,
        "content-type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `reservation-${reservation.id}-refund-${paymentRefundAmount}`,
      },
      body,
    });
    if (!response.ok) throw new ApiError(502, "The payment provider could not issue the refund");
  }
  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED, payments: { updateMany: { where: { status: PaymentStatus.SUCCEEDED }, data: { status: paymentRefundAmount > 0 ? PaymentStatus.REFUNDED : PaymentStatus.SUCCEEDED, metadata: { cancellation: { ...refund, paymentRefundAmount } } } } } },
    include: { listing: true, payments: true },
  });
}

export async function updateReservationStatus(context: AuthContext, id: string, input: ReservationUpdateInput) {
  const reservation = await getReservation(context, id);
  if (context.role !== "ADMIN" && reservation.hostId !== context.userId) {
    throw new ApiError(403, "Only the host can update this reservation");
  }
  if (reservation.status !== ReservationStatus.PENDING) {
    throw new ApiError(400, "Only pending reservations can be accepted or declined");
  }
  return prisma.reservation.update({
    where: { id },
    data: { status: input.status as ReservationStatus },
    include: { listing: true, payments: true },
  });
}
