"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getListingOrDemo } from "../lib/client/api";
import type { Listing } from "../lib/client/types";
import { BookingWidget } from "./BookingWidget";
import { Icon } from "./Icon";
import { ListingGallery } from "./ListingGallery";
import { ReviewList } from "./ReviewList";
import { SkeletonDetail } from "./SkeletonDetail";

export function ListingDetailExperience({ id }: { id: string }) {
  const [listing, setListing] = useState<Listing>();
  const [error, setError] = useState(false);
  useEffect(() => { let active = true; getListingOrDemo(id).then((data) => { if (active) setListing(data); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [id]);
  if (error) return <main className="shell-container detail-error"><p className="eyebrow">Couldn’t find that stay</p><h1>This listing is no longer available.</h1><Link href="/" className="button button--dark">Explore other stays</Link></main>;
  if (!listing) return <SkeletonDetail />;
  const amenities = listing.amenities?.length ? listing.amenities : ["Wi-Fi", "Kitchen", "Free parking", "Workspace"];
  return <main className="shell-container detail-page"><Link href="/" className="back-link"><Icon name="arrow-left" size={16} /> Back to search</Link><div className="detail-header"><div><p className="eyebrow">{listing.propertyType} in {listing.city}</p><h1>{listing.title}</h1><div className="detail-header__meta"><span><Icon name="star" size={14} filled /> 4.9 · {listing._count?.reviews ?? 0} reviews</span><span>·</span><span>{listing.city}, {listing.country}</span></div></div><div className="detail-header__host"><span className="host-avatar">{listing.host?.name?.slice(0, 1) ?? "S"}</span><span><small>Hosted by</small><strong>{listing.host?.name ?? "Stayfolk host"}</strong></span></div></div><ListingGallery listing={listing} /><div className="detail-layout"><div className="detail-content"><section className="detail-intro"><div><p className="eyebrow">The stay</p><h2>{listing.roomType} hosted by {listing.host?.name ?? "a thoughtful host"}</h2><p>{listing.maxGuests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} bathrooms</p></div><span className="detail-intro__icon"><Icon name="home" size={25} /></span></section><section className="detail-section detail-description"><p>{listing.description}</p><button type="button" className="text-link">Show more <Icon name="arrow-right" size={15} /></button></section><section className="detail-section"><p className="eyebrow">What this place offers</p><h2>Everything you need to settle in</h2><div className="amenities-grid">{amenities.map((amenity) => <div key={amenity}><Icon name={amenity.toLowerCase().includes("wifi") ? "globe" : amenity.toLowerCase().includes("parking") ? "pin" : amenity.toLowerCase().includes("workspace") ? "settings" : "check"} size={19} /><span>{amenity}</span></div>)}</div><button type="button" className="button button--outline">Show all amenities</button></section><section className="detail-section host-section"><div className="host-section__avatar">{listing.host?.name?.slice(0, 1) ?? "S"}</div><div><p className="eyebrow">A note from your host</p><h2>“Come for the view, stay for the quiet.”</h2><p>{listing.host?.name ?? "Your host"} loves sharing the small details that make this place feel like home.</p><Link href={`/messages?listingId=${encodeURIComponent(listing.id)}`} className="text-link">Message host <Icon name="arrow-right" size={15} /></Link></div></section><ReviewList listingId={listing.id} reviewCount={listing._count?.reviews} /></div><div className="detail-sidebar"><BookingWidget listing={listing} /></div></div><section className="detail-location"><div><p className="eyebrow">Where you’ll be</p><h2>{listing.city}, {listing.country}</h2><p>{listing.address}</p></div><div className="location-art"><Icon name="pin" size={34} /><span>Explore the neighborhood</span></div></section></main>;
}
