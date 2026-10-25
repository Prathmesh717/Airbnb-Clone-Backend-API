"use client";

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Listing } from "../lib/client/types";
import { useEffect } from "react";

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (!listings.length) return;
    const points = listings.map((listing) => [listing.latitude, listing.longitude] as [number, number]);
    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }
    map.fitBounds(points, { padding: [32, 32] });
  }, [listings, map]);
  return null;
}

export default function LeafletMap({ listings, selectedId, onSelect }: { listings: Listing[]; selectedId?: string; onSelect?: (id: string) => void }) {
  const center: [number, number] = listings[0] ? [listings[0].latitude, listings[0].longitude] : [39.8283, -98.5795];
  return (
    <MapContainer className="leaflet-map" center={center} zoom={3} scrollWheelZoom={false} zoomControl={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds listings={listings} />
      {listings.map((listing) => <CircleMarker key={listing.id} center={[listing.latitude, listing.longitude]} radius={selectedId === listing.id ? 11 : 8} pathOptions={{ color: selectedId === listing.id ? "#fff" : "#d45c4f", weight: 3, fillColor: "#d45c4f", fillOpacity: 1 }} eventHandlers={{ click: () => onSelect?.(listing.id) }}><Popup><strong>{listing.title}</strong><br />${listing.pricePerNight} night</Popup></CircleMarker>)}
    </MapContainer>
  );
}
