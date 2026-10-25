export type ListingImage = {
  id?: string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
};

export type ListingHost = {
  id: string;
  name?: string | null;
  image?: string | null;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  roomType: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities?: string[] | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  images: ListingImage[];
  host?: ListingHost | null;
  _count?: { reviews?: number; favorites?: number };
};

export type ListingSearchResult = {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
};

export type Reservation = {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "DECLINED" | "COMPLETED";
  currency: string;
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  createdAt?: string;
  listing?: Partial<Listing> & { images?: ListingImage[] };
  payments?: Array<{ id: string; status: string; amount: number }>;
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author?: { id: string; name?: string | null; image?: string | null };
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  sender?: { id: string; name?: string | null; image?: string | null };
};

export type MessageThread = {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  listing?: Partial<Listing> & { images?: ListingImage[] };
  guest?: ListingHost;
  host?: ListingHost;
  messages?: Message[];
};

export type SearchFilters = {
  city?: string;
  country?: string;
  propertyType?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  amenities?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  checkIn?: Date;
  checkOut?: Date;
  page?: number;
  pageSize?: number;
};
