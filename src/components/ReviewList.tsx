"use client";

import { useEffect, useState } from "react";
import type { Review } from "../lib/client/types";
import { getReviews } from "../lib/client/api";
import { Icon } from "./Icon";

export function ReviewList({ listingId, reviewCount = 0 }: { listingId: string; reviewCount?: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => { let active = true; getReviews(listingId).then((data) => { if (active) setReviews(data); }).catch(() => undefined); return () => { active = false; }; }, [listingId]);
  const shown = reviews.slice(0, 4);
  return <section className="detail-section"><div className="section-heading"><div><p className="eyebrow">Guest notes</p><h2><Icon name="star" size={20} filled /> 4.9 · {reviewCount || reviews.length || "New"} reviews</h2></div><button type="button" className="button button--outline">Show all reviews</button></div>{shown.length ? <div className="review-grid">{shown.map((review) => <article className="review-card" key={review.id}><div className="review-card__header"><span className="review-avatar">{review.author?.name?.slice(0, 1) ?? "G"}</span><span><strong>{review.author?.name ?? "Guest"}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(review.createdAt))}</small></span></div><div className="review-stars">{Array.from({ length: 5 }, (_, index) => <Icon name="star" size={12} filled={index < review.rating} key={index} />)}</div><p>{review.comment}</p></article>)}</div> : <div className="soft-empty">No reviews yet. Be the first to share a note after your stay.</div>}</section>;
}
