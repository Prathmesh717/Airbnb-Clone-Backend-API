"use client";

import Link from "next/link";
import { useState } from "react";
import type { Reservation } from "../lib/client/types";
import { cancelReservation, updateReservationStatus } from "../lib/client/api";
import { pushToast } from "../store/useUiStore";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";

function dates(reservation: Reservation) {
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(reservation.checkIn))} – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(reservation.checkOut))}`;
}

export function ReservationCard({ reservation, hostView = false, onChange }: { reservation: Reservation; hostView?: boolean; onChange?: () => void }) {
  const [busy, setBusy] = useState(false);
  const listing = reservation.listing;
  const image = listing?.images?.[0]?.url;
  async function cancel() {
    if (!window.confirm("Cancel this reservation?")) return;
    setBusy(true);
    try { await cancelReservation(reservation.id); pushToast("Reservation cancelled", "success"); onChange?.(); } catch (error) { pushToast(error instanceof Error ? error.message : "Couldn’t cancel reservation", "error"); } finally { setBusy(false); }
  }
  async function updateStatus(status: "CONFIRMED" | "DECLINED") {
    setBusy(true);
    try { await updateReservationStatus(reservation.id, status); pushToast(status === "CONFIRMED" ? "Reservation accepted" : "Reservation declined", "success"); onChange?.(); } catch (error) { pushToast(error instanceof Error ? error.message : "Couldn’t update reservation", "error"); } finally { setBusy(false); }
  }
  return <article className="reservation-card"><div className="reservation-card__image">{image ? <img src={image} alt="" /> : <div className="image-placeholder image-placeholder--warm"><Icon name="home" size={28} /></div>}</div><div className="reservation-card__body"><div className="reservation-card__top"><div><p className="eyebrow">{hostView ? "Guest reservation" : reservation.status === "COMPLETED" ? "Past stay" : "Upcoming stay"}</p><h3>{listing?.title ?? "Your Stayfolk reservation"}</h3></div><StatusBadge status={reservation.status} /></div><p className="reservation-card__dates"><Icon name="calendar" size={16} /> {dates(reservation)}</p><p className="reservation-card__meta">{reservation.guests} {reservation.guests === 1 ? "guest" : "guests"} · {reservation.nights} {reservation.nights === 1 ? "night" : "nights"}</p><div className="reservation-card__actions"><Link href={`/listing/${reservation.listingId}`} className="button button--outline">View listing</Link>{hostView && reservation.status === "PENDING" ? <><button type="button" className="button button--accent" onClick={() => updateStatus("CONFIRMED")} disabled={busy}>Accept</button><button type="button" className="button button--text" onClick={() => updateStatus("DECLINED")} disabled={busy}>Decline</button></> : null}{!hostView && (reservation.status === "PENDING" || reservation.status === "CONFIRMED") ? <button type="button" className="button button--text" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Cancel"}</button> : null}<Link href="/messages" className="button button--text">Message host</Link></div></div></article>;
}
