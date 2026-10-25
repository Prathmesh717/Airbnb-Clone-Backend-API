"use client";

import Link from "next/link";
import { Icon } from "../../../components/Icon";

export default function ListingError({ reset }: { reset: () => void }) {
  return <main className="shell-container error-inline"><div className="error-screen__mark"><Icon name="home" size={24} /></div><p className="eyebrow">Stay temporarily unavailable</p><h1>We couldn’t load this listing.</h1><p>Try again, or discover another place that might fit the trip.</p><div className="error-screen__actions"><button type="button" className="button button--dark" onClick={() => reset()}>Try again</button><Link className="button button--outline" href="/">Explore stays</Link></div></main>;
}
