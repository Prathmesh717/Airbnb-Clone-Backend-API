import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`brand-mark${compact ? " brand-mark--compact" : ""}`} aria-label="Stayfolk home">
      <span className="brand-mark__symbol" aria-hidden="true">⌂</span>
      {!compact ? <span>stayfolk</span> : null}
    </Link>
  );
}
