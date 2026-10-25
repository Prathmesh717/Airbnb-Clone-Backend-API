import Link from "next/link";
import type { Listing } from "../lib/client/types";
import { FavoriteButton } from "./FavoriteButton";
import { Icon } from "./Icon";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function ListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  const image = listing.images?.[0]?.url;
  const reviews = listing._count?.reviews ?? 0;
  return (
    <article className="listing-card">
      <Link href={`/listing/${listing.id}`} className="listing-card__image-wrap">
        {image ? <img className="listing-card__image" src={image} alt={listing.images?.[0]?.alt ?? listing.title} loading={priority ? "eager" : "lazy"} /> : <div className="image-placeholder image-placeholder--warm"><Icon name="home" size={32} /></div>}
        <span className="listing-card__badge">Guest favorite</span>
        <FavoriteButton listingId={listing.id} />
      </Link>
      <Link href={`/listing/${listing.id}`} className="listing-card__body">
        <div className="listing-card__topline"><h3>{listing.city}</h3><span className="rating"><Icon name="star" size={13} filled /> {reviews ? "4.9" : "New"}</span></div>
        <p className="listing-card__title">{listing.title}</p>
        <p className="listing-card__meta">{listing.roomType} · {listing.bedrooms} {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}</p>
        <p className="listing-card__price"><strong>{formatCurrency(listing.pricePerNight)}</strong> night <span className="listing-card__dot">·</span> {reviews} reviews</p>
      </Link>
    </article>
  );
}

export function ListingRow({ listing }: { listing: Listing }) {
  const image = listing.images?.[0]?.url;
  return (
    <Link className="listing-row" href={`/listing/${listing.id}`}>
      <div className="listing-row__image">{image ? <img src={image} alt="" /> : <div className="image-placeholder image-placeholder--warm"><Icon name="home" size={22} /></div>}</div>
      <div className="listing-row__body"><p className="eyebrow">{listing.city}</p><h3>{listing.title}</h3><p>{listing.roomType} · up to {listing.maxGuests} guests</p><strong>{formatCurrency(listing.pricePerNight)} <span>/ night</span></strong></div>
      <FavoriteButton listingId={listing.id} />
    </Link>
  );
}
