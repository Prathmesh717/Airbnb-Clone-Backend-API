"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Listing } from "../lib/client/types";
import { Icon } from "./Icon";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="map-fallback map-fallback--loading"><span className="spinner" /> Loading map</div> });

class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // A tile provider or browser restriction should not block the listing flow.
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function StaticMapFallback({ listings }: { listings: Listing[] }) {
  return <div className="map-fallback"><div className="map-fallback__texture" /><div className="map-fallback__legend"><Icon name="pin" size={17} /> Map preview</div>{listings.slice(0, 8).map((listing, index) => <span className="map-dot" key={listing.id} style={{ left: `${18 + ((index * 21) % 67)}%`, top: `${28 + ((index * 17) % 48)}%` }} title={listing.title}>${listing.pricePerNight}</span>)}</div>;
}

export function MapPreview({ listings, selectedId, onSelect }: { listings: Listing[]; selectedId?: string; onSelect?: (id: string) => void }) {
  if (!listings.length) return <StaticMapFallback listings={listings} />;
  return <div className="map-preview"><MapErrorBoundary fallback={<StaticMapFallback listings={listings} />}><LeafletMap listings={listings} selectedId={selectedId} onSelect={onSelect} /></MapErrorBoundary><div className="map-preview__label"><Icon name="pin" size={15} /> Explore the map</div></div>;
}
