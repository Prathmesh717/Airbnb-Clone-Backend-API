import type {
  Listing,
  ListingSearchResult,
  Message,
  MessageThread,
  Reservation,
  Review,
  SearchFilters,
} from "./types";
import { demoListings, demoReservations, demoSearchResult, demoThreads } from "./demo-data";

export class ClientApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
  }
}

function serializeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ClientApiError("The service is unavailable right now", 503);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload.error === "string" ? payload.error : "Something went wrong";
    throw new ClientApiError(message, response.status);
  }
  return payload as T;
}

function queryFromFilters(filters: SearchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, serializeValue(value));
  });
  return params.toString();
}

export async function searchListings(filters: SearchFilters = {}) {
  const suffix = queryFromFilters(filters);
  return request<ListingSearchResult>(`/api/listings/search${suffix ? `?${suffix}` : ""}`);
}

export async function getListing(id: string) {
  return request<Listing>(`/api/listings/${encodeURIComponent(id)}`);
}

export async function getListingOrDemo(id: string) {
  try {
    return await getListing(id);
  } catch {
    return demoListings.find((listing) => listing.id === id) ?? demoListings[0];
  }
}

export async function getFavorites() {
  return request<Array<{ listing: Listing }>>("/api/favorites");
}

export async function getHostListings() {
  return request<Listing[]>("/api/host/listings");
}

export async function addFavorite(listingId: string) {
  return request(`/api/favorites`, { method: "POST", body: JSON.stringify({ listingId }) });
}

export async function removeFavorite(listingId: string) {
  return request(`/api/favorites/${encodeURIComponent(listingId)}`, { method: "DELETE" });
}

export async function getReservations() {
  return request<Reservation[]>("/api/reservations");
}

export async function createReservation(input: {
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  currency?: string;
}) {
  return request<Reservation>("/api/reservations", {
    method: "POST",
    body: JSON.stringify({ ...input, checkIn: input.checkIn.toISOString(), checkOut: input.checkOut.toISOString() }),
  });
}

export async function cancelReservation(id: string) {
  return request<Reservation>(`/api/reservations/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateReservationStatus(id: string, status: "CONFIRMED" | "DECLINED") {
  return request<Reservation>(`/api/reservations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function createPaymentIntent(reservationId: string, depositPercent: 20 | 100 = 100) {
  return request<{ id: string; clientSecret?: string }>("/api/payments/intents", {
    method: "POST",
    body: JSON.stringify({ reservationId, depositPercent }),
  });
}

export async function getReviews(listingId: string) {
  return request<Review[]>(`/api/listings/${encodeURIComponent(listingId)}/reviews`);
}

export async function createReview(
  listingId: string,
  input: { rating: number; comment: string; reservationId?: string },
) {
  return request<Review>(`/api/listings/${encodeURIComponent(listingId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getThreads() {
  return request<MessageThread[]>("/api/messages/threads");
}

export async function createThread(listingId: string) {
  return request<MessageThread>("/api/messages/threads", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });
}

export async function getThread(id: string) {
  return request<MessageThread>(`/api/messages/threads/${encodeURIComponent(id)}`);
}

export async function sendMessage(threadId: string, body: string) {
  return request<Message>(`/api/messages/threads/${encodeURIComponent(threadId)}`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function markThreadRead(threadId: string) {
  return request<{ read: boolean }>(`/api/messages/threads/${encodeURIComponent(threadId)}`, { method: "PATCH" });
}

export const demoFallbacks = {
  listings: demoSearchResult,
  reservations: () => demoReservations,
  threads: () => demoThreads,
};
