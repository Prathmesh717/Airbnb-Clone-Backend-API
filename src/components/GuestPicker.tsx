"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function GuestPicker({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`guest-picker${compact ? " guest-picker--compact" : ""}`}>
      <button type="button" className="field-button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <Icon name="users" size={18} /><span><small>Guests</small>{value} {value === 1 ? "guest" : "guests"}</span><Icon name="chevron-down" size={15} />
      </button>
      {open ? <div className="guest-popover"><div><span><strong>Guests</strong><small>Including infants</small></span><div className="stepper"><button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}><Icon name="minus" size={15} /></button><b>{value}</b><button type="button" onClick={() => onChange(Math.min(16, value + 1))} disabled={value >= 16}><Icon name="plus" size={15} /></button></div></div><button type="button" className="popover-done" onClick={() => setOpen(false)}>Done</button></div> : null}
    </div>
  );
}
