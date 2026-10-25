import { getThread, markThreadRead, sendMessage } from "../../../../../server/messaging";
import { ensureAuthUser, requireAuth } from "../../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../../lib/server/http";
import { messageCreateSchema, parseJson } from "../../../../../lib/server/validation";

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await getThread(await requireAuth(request), params.id)));
}

export async function POST(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson(request, messageCreateSchema);
    return jsonOk(await sendMessage(context, params.id, input.body), { status: 201 });
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await markThreadRead(await requireAuth(request), params.id)));
}
