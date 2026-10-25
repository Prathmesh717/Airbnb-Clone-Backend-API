"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "./DateRangePicker";
import { GuestPicker } from "./GuestPicker";
import { Icon } from "./Icon";

export function SearchBar({ large = false, initialDestination = "" }: { large?: boolean; initialDestination?: string }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [range, setRange] = useState<DateRange>();
  const [guests, setGuests] = useState(2);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("city", destination.trim());
    if (range?.from) params.set("checkIn", range.from.toISOString());
    if (range?.to) params.set("checkOut", range.to.toISOString());
    if (guests) params.set("guests", String(guests));
    router.push(`/?${params.toString()}`);
  }

  return (
    <form className={`search-bar${large ? " search-bar--large" : ""}`} onSubmit={submit}>
      <label className="search-bar__destination"><Icon name="pin" size={18} /><span><small>Where</small><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Search destinations" /></span></label>
      <DateRangePicker value={range} onChange={setRange} compact={!large} />
      <GuestPicker value={guests} onChange={setGuests} compact={!large} />
      <button type="submit" className="search-submit" aria-label="Search"><Icon name="search" size={20} /><span>Search</span></button>
    </form>
  );
}
