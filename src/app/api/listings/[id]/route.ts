import { archiveListing, getListing, updateListing } from "../../../../server/listings";
import { ensureAuthUser, requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";
import { listingUpdateSchema, parseJson } from "../../../../lib/server/validation";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await getListing(params.id)));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson(request, listingUpdateSchema);
    return jsonOk(await updateListing(context, params.id, input));
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    return jsonOk(await archiveListing(context, params.id));
  });
}
