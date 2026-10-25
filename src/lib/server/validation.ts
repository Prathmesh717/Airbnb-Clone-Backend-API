import { z, type ZodTypeAny } from "zod";
import { ApiError } from "./http";

const isoDate = z.coerce.date();

export const listingImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(160).optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
});

export const listingCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(10_000),
  propertyType: z.string().trim().min(2).max(60),
  roomType: z.string().trim().min(2).max(60),
  address: z.string().trim().min(3).max(240),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  pricePerNight: z.number().int().positive().max(10_000_000),
  cleaningFee: z.number().int().nonnegative().max(10_000_000).default(0),
  serviceFee: z.number().int().nonnegative().max(10_000_000).default(0),
  maxGuests: z.number().int().positive().max(100),
  bedrooms: z.number().int().positive().max(100).default(1),
  beds: z.number().int().positive().max(100).default(1),
  bathrooms: z.number().positive().max(100).default(1),
  amenities: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
  images: z.array(listingImageSchema).max(50).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export const listingSearchSchema = z.object({
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  propertyType: z.string().trim().max(60).optional(),
  roomType: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  guests: z.coerce.number().int().positive().max(100).optional(),
  amenities: z.string().trim().optional().transform((value) => value ? value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20) : undefined),
  latitude: z.coerce.number().finite().min(-90).max(90).optional(),
  longitude: z.coerce.number().finite().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).default(50),
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const reservationCreateSchema = z
  .object({
    listingId: z.string().min(1),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.number().int().positive().max(100),
    currency: z.string().trim().length(3).toUpperCase().default("USD"),
  })
  .refine((value) => value.checkOut > value.checkIn, {
    path: ["checkOut"],
    message: "checkOut must be after checkIn",
  });

export const reservationUpdateSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
});

export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2_000),
  reservationId: z.string().min(1).optional(),
});

export const messageThreadCreateSchema = z.object({
  listingId: z.string().min(1),
});

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1).max(5_000),
});

export const paymentIntentSchema = z.object({
  reservationId: z.string().min(1),
  depositPercent: z.union([z.literal(20), z.literal(100)]).default(100),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchSchema>;
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export async function parseJson<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  return schema.parse(body) as z.output<TSchema>;
}

export function parseSearchParams<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): z.output<TSchema> {
  const url = new URL(request.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries())) as z.output<TSchema>;
}
