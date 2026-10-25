"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoFallbacks, getHostListings } from "../lib/client/api";
import type { Listing } from "../lib/client/types";
import { DashboardNav } from "./DashboardNav";
import { Icon } from "./Icon";
import { ListingRow } from "./ListingCard";
import { PageSkeleton } from "./Skeletons";
import { StatusBadge } from "./StatusBadge";

export function HostListingsExperience() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  useEffect(() => { getHostListings().then(setListings).catch(() => { setListings(demoFallbacks.listings().items.slice(0, 4)); setDemo(true); }).finally(() => setLoading(false)); }, []);
  if (loading) return <PageSkeleton />;
  return <main className="shell-container dashboard-page"><div className="dashboard-page__top"><div><p className="eyebrow">Make room for good things</p><h1>Your listings</h1><p className="page-lede">Keep your homes feeling like somewhere guests want to return to.</p></div><Link href="/host/listings/new" className="button button--accent"><Icon name="plus" size={17} /> Add a listing</Link></div><DashboardNav area="host" />{demo ? <div className="demo-banner"><span>Preview mode</span> These sample listings show how your host dashboard will look once your account is connected.</div> : null}<div className="host-overview"><div><span className="stat-label">Active listings</span><strong>{listings.length}</strong><small>Ready for guests</small></div><div><span className="stat-label">This month</span><strong>$2,840</strong><small>Estimated earnings</small></div><div><span className="stat-label">Response rate</span><strong>98%</strong><small>Last 30 days</small></div></div><section className="host-listings-panel"><div className="panel-heading"><div><p className="eyebrow">Your homes</p><h2>All listings</h2></div><button type="button" className="icon-button"><Icon name="more" size={19} /></button></div>{listings.length ? <div className="host-listing-list">{listings.map((listing) => <div className="host-listing-row" key={listing.id}><ListingRow listing={listing} /><StatusBadge status={listing.status ?? "PUBLISHED"} /></div>)}</div> : <div className="soft-empty">No listings yet. Start with the place you’re most excited to share.</div>}</section></main>;
}
