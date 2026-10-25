import { addFavorite, listFavorites } from "../../../server/favorites";
import { ensureAuthUser, requireAuth } from "../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../lib/server/http";
import { ApiError } from "../../../lib/server/http";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listFavorites(await requireAuth(request))));
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const body = (await request.json().catch(() => null)) as { listingId?: string } | null;
    if (!body?.listingId) throw new ApiError(400, "listingId is required");
    return jsonOk(await addFavorite(context, body.listingId), { status: 201 });
  });
}
