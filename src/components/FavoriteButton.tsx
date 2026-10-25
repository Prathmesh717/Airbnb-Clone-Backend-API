"use client";

import { useState } from "react";
import { addFavorite, removeFavorite } from "../lib/client/api";
import { isFavorite, pushToast, setFavorite, useFavorite } from "../store/useUiStore";
import { Icon } from "./Icon";

export function FavoriteButton({ listingId, initial = false, label = "Save" }: { listingId: string; initial?: boolean; label?: string }) {
  const favorite = useFavorite(listingId, initial);
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    const next = !isFavorite(listingId, favorite);
    setFavorite(listingId, next);
    setBusy(true);
    try {
      if (next) await addFavorite(listingId);
      else await removeFavorite(listingId);
      pushToast(next ? "Saved to your wishlist" : "Removed from your wishlist", "success");
    } catch (error) {
      setFavorite(listingId, !next);
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 401) {
        pushToast("Sign in to save this stay", "default");
      } else {
        pushToast("We couldn’t update your wishlist. Try again.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" aria-label={favorite ? `Remove ${label.toLowerCase()}` : label} className={`favorite-button${favorite ? " favorite-button--active" : ""}`} onClick={toggle} disabled={busy}>
      <Icon name="heart" size={20} filled={favorite} />
      {label !== "Save" ? <span>{label}</span> : null}
    </button>
  );
}
