export function ListingCardSkeleton() {
  return <div className="listing-card listing-card--skeleton"><div className="skeleton skeleton--image" /><div className="skeleton skeleton--line skeleton--line-wide" /><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--line-short" /></div>;
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return <div className="listing-grid">{Array.from({ length: count }, (_, index) => <ListingCardSkeleton key={index} />)}</div>;
}

export function PageSkeleton() {
  return <div className="shell-container page-skeleton"><div className="skeleton skeleton--heading" /><div className="skeleton skeleton--line skeleton--line-wide" /><ListingGridSkeleton count={4} /></div>;
}
