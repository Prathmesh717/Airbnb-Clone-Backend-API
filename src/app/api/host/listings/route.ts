import { listHostListings } from "../../../../server/listings";
import { requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listHostListings(await requireAuth(request))));
}
