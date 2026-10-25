"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export type FilterState = { propertyType?: string; roomType?: string; minPrice?: number; maxPrice?: number; amenities?: string };

const propertyTypes = ["Any type", "House", "Apartment", "Cabin", "Villa", "Guesthouse"];
const amenityOptions = ["Wifi", "Kitchen", "Workspace", "Free parking", "Hot tub"];

export function FilterBar({ filters, onChange }: { filters: FilterState; onChange: (filters: FilterState) => void }) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;
  return (
    <div className="filter-bar">
      <button type="button" className={`filter-chip${open || activeCount ? " filter-chip--active" : ""}`} onClick={() => setOpen((current) => !current)}><Icon name="sliders" size={16} /> Filters {activeCount ? <b>{activeCount}</b> : null}</button>
      <div className="filter-scroll">
        {propertyTypes.slice(1).map((type) => <button type="button" key={type} className={filters.propertyType === type ? "filter-chip filter-chip--selected" : "filter-chip"} onClick={() => onChange({ ...filters, propertyType: filters.propertyType === type ? undefined : type })}>{type}</button>)}
      </div>
      {open ? <div className="filters-popover"><div className="filters-popover__header"><div><p className="eyebrow">Refine your stay</p><h3>Filters</h3></div><button type="button" className="icon-button" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button></div><label className="form-field"><span>Room type</span><select value={filters.roomType ?? ""} onChange={(event) => onChange({ ...filters, roomType: event.target.value || undefined })}><option value="">Any room type</option><option value="Entire home">Entire home</option><option value="Private room">Private room</option><option value="Shared room">Shared room</option></select></label><div className="filters-popover__row"><label className="form-field"><span>Min price</span><input type="number" min="0" placeholder="$0" value={filters.minPrice ?? ""} onChange={(event) => onChange({ ...filters, minPrice: event.target.value ? Number(event.target.value) : undefined })} /></label><label className="form-field"><span>Max price</span><input type="number" min="0" placeholder="$500+" value={filters.maxPrice ?? ""} onChange={(event) => onChange({ ...filters, maxPrice: event.target.value ? Number(event.target.value) : undefined })} /></label></div><div className="amenity-filter"><span className="form-field__label">Amenities</span><div className="amenity-filter__options">{amenityOptions.map((amenity) => { const selected = (filters.amenities ?? "").split(",").filter(Boolean).includes(amenity); return <button type="button" key={amenity} className={selected ? "filter-chip filter-chip--selected" : "filter-chip"} onClick={() => { const next = new Set((filters.amenities ?? "").split(",").filter(Boolean)); if (selected) next.delete(amenity); else next.add(amenity); onChange({ ...filters, amenities: next.size ? [...next].join(",") : undefined }); }}>{amenity}</button>; })}</div></div><div className="filters-popover__footer"><button type="button" className="button button--text" onClick={() => onChange({})}>Clear all</button><button type="button" className="button button--dark" onClick={() => setOpen(false)}>Show stays</button></div></div> : null}
    </div>
  );
}
