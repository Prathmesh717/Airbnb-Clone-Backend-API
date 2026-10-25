import { ApiError } from "./http";

export type PriceBreakdown = {
  currency: string;
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
};

export function reservationNights(checkIn: Date, checkOut: Date) {
  const start = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const end = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  const nights = Math.round((end - start) / 86_400_000);
  if (nights < 1 || nights > 365) {
    throw new ApiError(400, "A reservation must be between 1 and 365 nights");
  }
  return nights;
}

export function calculateReservationPrice(input: {
  nightlyRate: number;
  cleaningFee?: number;
  serviceFee?: number;
  checkIn: Date;
  checkOut: Date;
  currency?: string;
}): PriceBreakdown {
  const nights = reservationNights(input.checkIn, input.checkOut);
  const subtotal = input.nightlyRate * nights;
  const cleaningFee = input.cleaningFee ?? 0;
  const serviceFee = input.serviceFee ?? Math.round(subtotal * 0.12);
  const taxes = Math.round((subtotal + cleaningFee + serviceFee) * 0.08);
  return {
    currency: (input.currency ?? "USD").toUpperCase(),
    nightlyRate: input.nightlyRate,
    nights,
    subtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total: subtotal + cleaningFee + serviceFee + taxes,
  };
}

export function calculateCancellationRefund(checkIn: Date, total: number, now = new Date()) {
  const daysUntilCheckIn = (checkIn.getTime() - now.getTime()) / 86_400_000;
  const refundRate = daysUntilCheckIn >= 7 ? 1 : daysUntilCheckIn >= 2 ? 0.5 : 0;
  return {
    daysUntilCheckIn,
    refundRate,
    refundAmount: Math.round(total * refundRate),
  };
}
