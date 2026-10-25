"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { toast as hotToast } from "react-hot-toast";

export type Toast = { id: number; message: string; tone: "default" | "success" | "error" };

type UiState = {
  toasts: Toast[];
  favoriteIds: string[];
  addToast: (toast: Toast) => void;
  removeToast: (id: number) => void;
  setFavoriteId: (listingId: string, next: boolean) => void;
  hydrateFavoriteIds: (ids: string[]) => void;
};

let toastId = 0;

export const useUiState = create<UiState>((set) => ({
  toasts: [],
  favoriteIds: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setFavoriteId: (listingId, next) => set((state) => {
    const ids = new Set(state.favoriteIds);
    if (next) ids.add(listingId);
    else ids.delete(listingId);
    if (typeof window !== "undefined") window.localStorage.setItem("stayfolk:favorites", JSON.stringify([...ids]));
    return { favoriteIds: [...ids] };
  }),
  hydrateFavoriteIds: (ids) => set({ favoriteIds: ids }),
}));

export function pushToast(message: string, tone: Toast["tone"] = "default") {
  if (tone === "success") hotToast.success(message);
  else if (tone === "error") hotToast.error(message);
  else hotToast(message);
}

export function dismissToast(id: number) {
  useUiState.getState().removeToast(id);
}

export function useToasts() {
  return useUiState((state) => state.toasts);
}

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem("stayfolk:favorites") ?? "[]");
    if (Array.isArray(stored)) useUiState.getState().hydrateFavoriteIds(stored.filter((id): id is string => typeof id === "string"));
  } catch {
    useUiState.getState().hydrateFavoriteIds([]);
  }
}

export function isFavorite(listingId: string, initial = false) {
  return useUiState.getState().favoriteIds.includes(listingId) || initial;
}

export function setFavorite(listingId: string, next: boolean) {
  useUiState.getState().setFavoriteId(listingId, next);
}

export function useFavorite(listingId: string, initial = false) {
  const favorite = useUiState((state) => state.favoriteIds.includes(listingId) || initial);
  useEffect(() => { hydrateFromStorage(); }, []);
  return favorite;
}

export function useFavoriteIds() {
  const ids = useUiState((state) => state.favoriteIds);
  useEffect(() => { hydrateFromStorage(); }, []);
  return new Set(ids);
}
