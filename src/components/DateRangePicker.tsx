"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Icon } from "./Icon";

function formatDate(date?: Date) {
  if (!date) return "Add dates";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function DateRangePicker({ value, onChange, compact = false }: { value: DateRange | undefined; onChange: (range: DateRange | undefined) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = value?.from && value?.to ? `${formatDate(value.from)} – ${formatDate(value.to)}` : value?.from ? `${formatDate(value.from)} – Add date` : "Add dates";
  return (
    <div className={`date-picker${compact ? " date-picker--compact" : ""}`}>
      <button type="button" className="field-button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <Icon name="calendar" size={18} /><span><small>When</small>{label}</span><Icon name="chevron-down" size={15} />
      </button>
      {open ? (
        <div className="calendar-popover">
          <DayPicker mode="range" selected={value} onSelect={onChange} numberOfMonths={compact ? 1 : 2} disabled={{ before: new Date() }} showOutsideDays />
          <div className="calendar-fallback"><Icon name="calendar" size={15} /> Prefer typing? <input aria-label="Check-in date" type="date" value={value?.from ? value.from.toISOString().slice(0, 10) : ""} onChange={(event) => onChange({ from: new Date(`${event.target.value}T12:00:00`), to: value?.to })} /><span>→</span><input aria-label="Check-out date" type="date" value={value?.to ? value.to.toISOString().slice(0, 10) : ""} onChange={(event) => onChange({ from: value?.from, to: new Date(`${event.target.value}T12:00:00`) })} /></div>
          <button type="button" className="calendar-done" onClick={() => setOpen(false)}>Done</button>
        </div>
      ) : null}
    </div>
  );
}
