import { describe, expect, it, vi } from "vitest";
import { assertNoReservationOverlap } from "../src/server/reservations";
import { calculateCancellationRefund, calculateReservationPrice, reservationNights } from "../src/lib/server/pricing";

describe("booking invariants", () => {
  it("calculates nights and a complete price breakdown", () => {
    expect(
      calculateReservationPrice({
        nightlyRate: 200,
        cleaningFee: 50,
        serviceFee: 30,
        checkIn: new Date("2027-01-10T00:00:00.000Z"),
        checkOut: new Date("2027-01-13T00:00:00.000Z"),
      }),
    ).toEqual({
      currency: "USD",
      nightlyRate: 200,
      nights: 3,
      subtotal: 600,
      cleaningFee: 50,
      serviceFee: 30,
      taxes: 54,
      total: 734,
    });
  });

  it("rejects stays outside the one-to-365-night invariant", () => {
    expect(() => reservationNights(new Date("2027-01-10"), new Date("2027-01-10"))).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
    expect(() => reservationNights(new Date("2027-01-10"), new Date("2028-02-01"))).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
  });

  it("rejects an overlapping active reservation", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: "existing-reservation" });
    const client = { reservation: { findFirst } };

    await expect(
      assertNoReservationOverlap(
        client as unknown as Parameters<typeof assertNoReservationOverlap>[0],
        "listing-1",
        new Date("2027-02-10"),
        new Date("2027-02-12"),
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          listingId: "listing-1",
          checkIn: { lt: new Date("2027-02-12") },
          checkOut: { gt: new Date("2027-02-10") },
        }),
      }),
    );
  });

  it("allows adjacent stays when checkout equals the next check-in", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const client = { reservation: { findFirst } };

    await expect(
      assertNoReservationOverlap(
        client as unknown as Parameters<typeof assertNoReservationOverlap>[0],
        "listing-1",
        new Date("2027-02-12"),
        new Date("2027-02-14"),
      ),
    ).resolves.toBeUndefined();
  });

  it("applies the documented cancellation refund tiers", () => {
    const checkIn = new Date("2027-02-20T00:00:00.000Z");
    expect(calculateCancellationRefund(checkIn, 1_000, new Date("2027-02-01T00:00:00.000Z")).refundAmount).toBe(1_000);
    expect(calculateCancellationRefund(checkIn, 1_000, new Date("2027-02-19T00:00:00.000Z")).refundAmount).toBe(0);
  });
});
