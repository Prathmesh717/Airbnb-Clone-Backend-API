"use client";

import { useState } from "react";
import type { Listing } from "../lib/client/types";
import { FavoriteButton } from "./FavoriteButton";
import { Icon } from "./Icon";

export function ListingGallery({ listing }: { listing: Listing }) {
  const images = listing.images?.length ? listing.images : [{ url: "", alt: listing.title }];
  const [active, setActive] = useState(0);
  return (
    <div className="listing-gallery">
      <div className="listing-gallery__main">{images[active].url ? <img src={images[active].url} alt={images[active].alt ?? listing.title} /> : <div className="image-placeholder image-placeholder--warm"><Icon name="home" size={48} /></div>}<button type="button" className="gallery-arrow gallery-arrow--left" aria-label="Previous image" onClick={() => setActive((current) => (current - 1 + images.length) % images.length)}><Icon name="chevron-left" size={21} /></button><button type="button" className="gallery-arrow gallery-arrow--right" aria-label="Next image" onClick={() => setActive((current) => (current + 1) % images.length)}><Icon name="chevron-right" size={21} /></button><span className="gallery-counter">{active + 1} / {images.length}</span></div>
      <div className="listing-gallery__thumbs">{images.map((image, index) => <button type="button" className={index === active ? "gallery-thumb gallery-thumb--active" : "gallery-thumb"} key={`${image.url}-${index}`} onClick={() => setActive(index)}>{image.url ? <img src={image.url} alt="" /> : <span className="image-placeholder image-placeholder--warm" />}</button>)}</div>
      <div className="listing-gallery__actions"><FavoriteButton listingId={listing.id} label="Save" /><button type="button" className="share-button"><Icon name="arrow-right" size={17} /> Share</button></div>
    </div>
  );
}
