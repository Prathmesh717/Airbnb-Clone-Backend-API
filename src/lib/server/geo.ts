import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export function haversineMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function syncListingLocation(id: string, latitude: number, longitude: number) {
  try {
    await prisma.$executeRaw`
      UPDATE "Listing"
      SET "location" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      WHERE "id" = ${id}
    `;
  } catch (error) {
    // The scalar coordinates remain the source of truth when PostGIS is not enabled.
    console.warn("PostGIS location sync skipped", error);
  }
}

export async function findListingIdsWithinRadius(
  latitude: number,
  longitude: number,
  radiusMeters: number,
) {
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "Listing"
      WHERE "location" IS NOT NULL
        AND ST_DWithin(
          "location",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
    `);
    return rows.map((row) => row.id);
  } catch (error) {
    console.warn("PostGIS radius search skipped", error);
    return null;
  }
}
