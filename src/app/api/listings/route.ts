import { createListing, listListings } from "../../../server/listings";
import { ensureAuthUser, requireAuth } from "../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../lib/server/http";
import { parseJson, parseSearchParams, listingCreateSchema, listingSearchSchema } from "../../../lib/server/validation";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listListings(parseSearchParams(request, listingSearchSchema))));
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson(request, listingCreateSchema);
    return jsonOk(await createListing(context, input), { status: 201 });
  });
}
