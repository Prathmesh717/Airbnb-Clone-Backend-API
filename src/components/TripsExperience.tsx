"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { demoFallbacks } from "../lib/client/api";
import { getReservations } from "../lib/client/api";
import type { Reservation } from "../lib/client/types";
import { DashboardNav } from "./DashboardNav";
import { EmptyState } from "./EmptyState";
import { ReservationCard } from "./ReservationCard";
import { PageSkeleton } from "./Skeletons";

export function TripsExperience() {
  const { status } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const load = () => { setLoading(true); getReservations().then(setReservations).catch(() => { setReservations(demoFallbacks.reservations()); setDemo(true); }).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => reservations.filter((reservation) => tab === "upcoming" ? reservation.status === "PENDING" || reservation.status === "CONFIRMED" : reservation.status === "COMPLETED" || reservation.status === "CANCELLED"), [reservations, tab]);
  if (loading) return <PageSkeleton />;
  return <main className="shell-container dashboard-page"><div className="dashboard-page__top"><div><p className="eyebrow">Your travel journal</p><h1>Trips</h1><p className="page-lede">Keep your plans close, from the first saved stay to the ride home.</p></div><Link href="/" className="button button--dark">Explore stays</Link></div><DashboardNav />{demo ? <div className="demo-banner"><span>Preview mode</span> Showing sample trips until you sign in or connect the reservations service.</div> : null}<div className="dashboard-tabs"><button type="button" className={tab === "upcoming" ? "dashboard-tab dashboard-tab--active" : "dashboard-tab"} onClick={() => setTab("upcoming")}>Upcoming <b>{reservations.filter((reservation) => reservation.status === "PENDING" || reservation.status === "CONFIRMED").length}</b></button><button type="button" className={tab === "past" ? "dashboard-tab dashboard-tab--active" : "dashboard-tab"} onClick={() => setTab("past")}>Past trips</button></div>{visible.length ? <div className="reservation-list">{visible.map((reservation) => <ReservationCard reservation={reservation} key={reservation.id} onChange={load} />)}</div> : <EmptyState title={tab === "upcoming" ? "No upcoming trips yet" : "Your travel story starts here"} description={tab === "upcoming" ? "When a place catches your eye, your next chapter will show up here." : "Completed trips and notes from your stays will live here."} action="Find a stay" />}{status === "unauthenticated" ? <p className="dashboard-footnote">You’re browsing a preview. <Link href="/auth/signin">Sign in</Link> to see your own trips.</p> : null}</main>;
}
