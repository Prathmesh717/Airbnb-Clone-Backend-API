import { createReview, listReviews } from "../../../../../server/reviews";
import { ensureAuthUser, requireAuth } from "../../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../../lib/server/http";
import { parseJson, reviewCreateSchema } from "../../../../../lib/server/validation";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await listReviews(params.id)));
}

export async function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson<typeof reviewCreateSchema>(request, reviewCreateSchema);
    return jsonOk(await createReview(context, params.id, input), { status: 201 });
  });
}
