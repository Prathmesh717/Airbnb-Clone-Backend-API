import { removeFavorite } from "../../../../server/favorites";
import { requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";

type RouteContext = { params: { listingId: string } };

export async function DELETE(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await removeFavorite(await requireAuth(request), params.listingId)));
}
