"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoFallbacks } from "../lib/client/api";
import { getFavorites } from "../lib/client/api";
import type { Listing } from "../lib/client/types";
import { DashboardNav } from "./DashboardNav";
import { EmptyState } from "./EmptyState";
import { ListingCard } from "./ListingCard";
import { ListingGridSkeleton } from "./Skeletons";

export function FavoritesExperience() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  useEffect(() => { let active = true; getFavorites().then((favorites) => { if (active) setListings(favorites.map((favorite) => favorite.listing)); }).catch(() => { if (active) { setListings(demoFallbacks.listings().items.slice(0, 3)); setDemo(true); } }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <main className="shell-container dashboard-page"><div className="dashboard-page__top"><div><p className="eyebrow">The good ones</p><h1>Wishlists</h1><p className="page-lede">The stays you want to remember, all in one place.</p></div><Link href="/" className="button button--dark">Find inspiration</Link></div><DashboardNav />{demo ? <div className="demo-banner"><span>Preview mode</span> Save a stay while browsing, then sign in to keep it synced across devices.</div> : null}{loading ? <ListingGridSkeleton count={3} /> : listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard listing={listing} key={listing.id} />)}</div> : <EmptyState title="Your wishlist is waiting" description="Tap the heart on a stay to keep it close while you make up your mind." action="Explore stays" />}</main>;
}
