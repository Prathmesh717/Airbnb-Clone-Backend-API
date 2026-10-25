"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoFallbacks, getReservations } from "../lib/client/api";
import type { Reservation } from "../lib/client/types";
import { DashboardNav } from "./DashboardNav";
import { ReservationCard } from "./ReservationCard";
import { PageSkeleton } from "./Skeletons";

export function HostReservationsExperience() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [filter, setFilter] = useState("all");
  useEffect(() => { getReservations().then(setReservations).catch(() => { setReservations(demoFallbacks.reservations()); setDemo(true); }).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => filter === "all" ? reservations : reservations.filter((reservation) => reservation.status.toLowerCase() === filter), [filter, reservations]);
  if (loading) return <PageSkeleton />;
  return <main className="shell-container dashboard-page"><div className="dashboard-page__top"><div><p className="eyebrow">Your hosting calendar</p><h1>Reservations</h1><p className="page-lede">A clear view of who’s arriving, when, and what they’ll need.</p></div><Link href="/host/listings" className="button button--outline">Manage listings</Link></div><DashboardNav area="host" />{demo ? <div className="demo-banner"><span>Preview mode</span> Connect your host account to manage real reservations and guest messages.</div> : null}<div className="dashboard-tabs"><button type="button" className={filter === "all" ? "dashboard-tab dashboard-tab--active" : "dashboard-tab"} onClick={() => setFilter("all")}>All <b>{reservations.length}</b></button><button type="button" className={filter === "confirmed" ? "dashboard-tab dashboard-tab--active" : "dashboard-tab"} onClick={() => setFilter("confirmed")}>Confirmed</button><button type="button" className={filter === "pending" ? "dashboard-tab dashboard-tab--active" : "dashboard-tab"} onClick={() => setFilter("pending")}>Needs attention</button></div><section className="reservation-list reservation-list--host">{visible.length ? visible.map((reservation) => <ReservationCard reservation={reservation} hostView key={reservation.id} onChange={() => { setLoading(true); getReservations().then(setReservations).catch(() => {}).finally(() => setLoading(false)); }} />) : <div className="soft-empty">No reservations in this view.</div>}</section></main>;
}
