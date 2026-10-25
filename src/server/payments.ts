import { PaymentStatus, ReservationStatus } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../lib/server/db";
import { serverEnv } from "../lib/server/env";
import { ApiError } from "../lib/server/http";
import type { AuthContext } from "../lib/server/auth";

export async function createPaymentIntent(context: AuthContext, reservationId: string, depositPercent: 20 | 100 = 100) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { payments: true } });
  if (!reservation) throw new ApiError(404, "Reservation not found");
  if (context.role !== "ADMIN" && reservation.guestId !== context.userId) throw new ApiError(403, "Only the guest can pay for this reservation");
  if (reservation.status !== ReservationStatus.PENDING) throw new ApiError(400, "This reservation is not awaiting payment");

  const amount = Math.round((reservation.total * depositPercent) / 100);
  const existing = reservation.payments.find((payment) => payment.status !== PaymentStatus.FAILED && payment.amount === amount);
  if (existing) return { payment: existing, clientSecret: existing.metadata && typeof existing.metadata === "object" && "clientSecret" in existing.metadata ? (existing.metadata as { clientSecret?: string }).clientSecret : null, mock: existing.stripePaymentIntentId.startsWith("pi_mock_") };

  let intentId = `pi_mock_${reservation.id}_${depositPercent}`;
  let clientSecret: string | null = `pi_mock_secret_${reservation.id}_${depositPercent}`;
  let provider = "stripe-mock";
  let metadata: Record<string, string> = { reservationId: reservation.id };

  if (serverEnv.stripeSecretKey) {
    const body = new URLSearchParams({
      amount: String(amount),
      currency: reservation.currency.toLowerCase(),
      "metadata[reservationId]": reservation.id,
      "metadata[depositPercent]": String(depositPercent),
      "automatic_payment_methods[enabled]": "true",
    });
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.stripeSecretKey}`,
        "content-type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `reservation-${reservation.id}-deposit-${depositPercent}`,
      },
      body,
    });
    if (!response.ok) throw new ApiError(502, "Stripe payment intent creation failed");
    const stripeIntent = (await response.json()) as { id: string; client_secret?: string; metadata?: Record<string, string> };
    intentId = stripeIntent.id;
    clientSecret = stripeIntent.client_secret ?? null;
    provider = "stripe";
    metadata = { ...metadata, ...(stripeIntent.metadata ?? {}), ...(clientSecret ? { clientSecret } : {}) };
  }

  const payment = await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      provider,
      stripePaymentIntentId: intentId,
      amount,
      currency: reservation.currency,
      status: PaymentStatus.REQUIRES_ACTION,
      metadata: { ...metadata, depositPercent: String(depositPercent) },
    },
  });
  return { payment, clientSecret, mock: provider === "stripe-mock" };
}

function validStripeSignature(payload: string, signature: string) {
  if (!serverEnv.stripeWebhookSecret) return true;
  const timestamp = signature.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const signatureHash = signature.split(",").find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !signatureHash) return false;
  const expected = createHmac("sha256", serverEnv.stripeWebhookSecret).update(`${timestamp}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHash));
  } catch {
    return false;
  }
}

export async function handleStripeWebhook(payload: string, signature: string | null) {
  if (!validStripeSignature(payload, signature ?? "")) throw new ApiError(400, "Invalid Stripe signature");
  let event: { type?: string; data?: { object?: { id?: string; metadata?: { reservationId?: string }; payment_intent?: string } } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    throw new ApiError(400, "Invalid webhook payload");
  }
  const object = event.data?.object;
  const paymentIntentId = object?.id ?? object?.payment_intent;
  if (!paymentIntentId) return { received: true, ignored: true };
  const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!payment) return { received: true, ignored: true };

  if (event.type === "payment_intent.succeeded") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.SUCCEEDED } }),
      prisma.reservation.update({ where: { id: payment.reservationId }, data: { status: ReservationStatus.CONFIRMED } }),
    ]);
  } else if (event.type === "payment_intent.payment_failed") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
  }
  return { received: true, paymentId: payment.id, eventType: event.type ?? null };
}
