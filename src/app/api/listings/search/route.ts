import { listListings } from "../../../../server/listings";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";
import { parseSearchParams, listingSearchSchema } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listListings(parseSearchParams(request, listingSearchSchema))));
}
