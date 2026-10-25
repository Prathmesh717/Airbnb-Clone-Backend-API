"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { demoFallbacks } from "../lib/client/api";
import { searchListings } from "../lib/client/api";
import type { Listing } from "../lib/client/types";
import { FilterBar, type FilterState } from "./FilterBar";
import { Icon } from "./Icon";
import { ListingCard } from "./ListingCard";
import { ListingGridSkeleton } from "./Skeletons";
import { MapPreview } from "./MapPreview";
import { SearchBar } from "./SearchBar";

const categories = [
  { label: "All stays", icon: "✦" },
  { label: "Amazing views", icon: "◒" },
  { label: "Cabins", icon: "⌂" },
  { label: "Beachfront", icon: "⌁" },
  { label: "Design", icon: "◇" },
  { label: "Countryside", icon: "♧" },
  { label: "Pools", icon: "∿" },
  { label: "Pet friendly", icon: "♡" },
];

function fallbackForQuery(city?: string) {
  const all = demoFallbacks.listings().items;
  if (!city) return all;
  const query = city.toLowerCase();
  const matching = all.filter((listing) => `${listing.city} ${listing.country} ${listing.title}`.toLowerCase().includes(query));
  return matching.length ? matching : all;
}

export function HomeExperience() {
  const params = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [activeCategory, setActiveCategory] = useState("All stays");
  const [filters, setFilters] = useState<FilterState>({});
  const city = params.get("city") ?? "";
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = params.get("guests");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = { city: city || undefined, guests: guests ? Number(guests) : undefined, checkIn: checkIn ? new Date(checkIn) : undefined, checkOut: checkOut ? new Date(checkOut) : undefined, ...filters };
    searchListings(query).then((result) => { if (active) setListings(result.items); }).catch(() => { if (active) setListings(fallbackForQuery(city)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [city, checkIn, checkOut, guests, filters]);

  const visibleListings = useMemo(() => {
    if (activeCategory === "All stays") return listings;
    const category = activeCategory.toLowerCase();
    return listings.filter((listing) => `${listing.title} ${listing.propertyType} ${listing.amenities?.join(" ")}`.toLowerCase().includes(category.replace("amazing views", "view").replace("beachfront", "ocean"))) || listings;
  }, [activeCategory, listings]);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__glow home-hero__glow--one" /><div className="home-hero__glow home-hero__glow--two" />
        <div className="shell-container home-hero__content"><p className="eyebrow eyebrow--light">A softer way to get away</p><h1>Go somewhere<br /><em>you’ll remember.</em></h1><p className="home-hero__lede">Handpicked places to stay, hosted by people who care about the details.</p><SearchBar large /></div>
        <div className="home-hero__art" aria-hidden="true"><span className="home-hero__sun" /><span className="home-hero__mountain home-hero__mountain--back" /><span className="home-hero__mountain home-hero__mountain--front" /><span className="home-hero__water" /></div>
      </section>
      <section className="shell-container category-bar"><div className="category-bar__items">{categories.map((category) => <button type="button" key={category.label} className={activeCategory === category.label ? "category-item category-item--active" : "category-item"} onClick={() => setActiveCategory(category.label)}><span>{category.icon}</span>{category.label}</button>)}</div><button type="button" className="category-scroll" aria-label="Next categories"><Icon name="chevron-right" size={18} /></button></section>
      <section className={`shell-container explore-section${showMap ? " explore-section--map" : ""}`}><div className="explore-section__header"><div><p className="eyebrow">{city ? `Stays in ${city}` : "For your next escape"}</p><h2>{city ? "Make it a good one" : "Find a place that feels like yours"}</h2></div><div className="explore-section__actions"><FilterBar filters={filters} onChange={setFilters} /><button type="button" className={showMap ? "map-toggle map-toggle--active" : "map-toggle"} onClick={() => setShowMap((current) => !current)}><Icon name="pin" size={17} /> {showMap ? "Hide map" : "Show map"}</button></div></div>{showMap ? <div className="explore-split"><div className="explore-split__list">{loading ? <ListingGridSkeleton count={4} /> : visibleListings.length ? <div className="listing-grid listing-grid--split">{visibleListings.map((listing, index) => <ListingCard listing={listing} key={listing.id} priority={index < 2} />)}</div> : <div className="soft-empty">No stays match those filters yet. Try widening your search.</div>}</div><div className="explore-split__map"><MapPreview listings={visibleListings} selectedId={selectedId} onSelect={setSelectedId} /></div></div> : loading ? <ListingGridSkeleton /> : visibleListings.length ? <div className="listing-grid">{visibleListings.map((listing, index) => <ListingCard listing={listing} key={listing.id} priority={index < 4} />)}</div> : <div className="soft-empty">No stays match those filters yet. Try widening your search.</div>}</section>
      <section className="shell-container editorial-banner"><div><p className="eyebrow">Stay curious</p><h2>Small places.<br /><em>Big reset.</em></h2><p>From hidden cabins to city homes with good light, find the kind of place that changes the pace of a weekend.</p><Link href="/?city=South%20Lake%20Tahoe" className="button button--dark">Browse slow stays <Icon name="arrow-right" size={16} /></Link></div><div className="editorial-banner__image"><img src="https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=84" alt="Cabin in a green valley" /></div></section>
      <section className="shell-container reassurance-row"><div><Icon name="shield" size={23} /><h3>Thoughtful stays</h3><p>Every home is chosen for the feeling it gives you.</p></div><div><Icon name="heart" size={23} /><h3>Hosts with heart</h3><p>Real people who care about your arrival.</p></div><div><Icon name="star" size={23} /><h3>Easy from here</h3><p>Simple booking and support when you need it.</p></div></section>
    </>
  );
}
