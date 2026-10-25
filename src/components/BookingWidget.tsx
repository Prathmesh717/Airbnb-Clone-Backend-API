"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import type { Listing } from "../lib/client/types";
import { createReservation } from "../lib/client/api";
import { pushToast } from "../store/useUiStore";
import { DateRangePicker } from "./DateRangePicker";
import { GuestPicker } from "./GuestPicker";
import { Icon } from "./Icon";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const nightsBetween = (from?: Date, to?: Date) => from && to ? Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000)) : 0;

export function BookingWidget({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange>();
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const nights = nightsBetween(range?.from, range?.to);
  const subtotal = nights * listing.pricePerNight;
  const serviceFee = listing.serviceFee || Math.round(subtotal * 0.12);
  const cleaningFee = listing.cleaningFee || 0;
  const taxes = Math.round((subtotal + serviceFee + cleaningFee) * 0.08);
  const total = subtotal + serviceFee + cleaningFee + taxes;

  async function reserve() {
    if (!range?.from || !range?.to) {
      pushToast("Choose check-in and check-out dates first", "default");
      return;
    }
    setBusy(true);
    try {
      const reservation = await createReservation({ listingId: listing.id, checkIn: range.from, checkOut: range.to, guests });
      pushToast("Your dates are held — continue to payment", "success");
      router.push(`/trips?reservationId=${encodeURIComponent(reservation.id)}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "We couldn’t reserve those dates", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="booking-card">
      <div className="booking-card__price"><strong>{money(listing.pricePerNight)}</strong> <span>night</span><span className="booking-card__rating"><Icon name="star" size={14} filled /> 4.9 · {listing._count?.reviews ?? 0} reviews</span></div>
      <div className="booking-fields"><DateRangePicker value={range} onChange={setRange} /><GuestPicker value={guests} onChange={setGuests} /></div>
      <button type="button" className="button button--accent button--full" onClick={reserve} disabled={busy}>{busy ? <><span className="spinner spinner--light" /> Requesting…</> : nights ? "Reserve" : "Check availability"}</button>
      <p className="booking-card__hint">You won’t be charged yet</p>
      {nights ? <div className="price-breakdown"><div><span>{money(listing.pricePerNight)} × {nights} nights</span><span>{money(subtotal)}</span></div><div><span>Cleaning fee</span><span>{money(cleaningFee)}</span></div><div><span>Service fee</span><span>{money(serviceFee)}</span></div><div><span>Taxes</span><span>{money(taxes)}</span></div><div className="price-breakdown__total"><strong>Total before taxes</strong><strong>{money(total)}</strong></div></div> : <div className="booking-card__trust"><Icon name="shield" size={18} /><span><strong>Stayfolk protection</strong><small>Every booking is covered by our guest support promise.</small></span></div>}
      <Link href={`/messages?listingId=${encodeURIComponent(listing.id)}`} className="booking-card__message"><Icon name="send" size={16} /> Ask the host a question</Link>
    </aside>
  );
}
