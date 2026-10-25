import { createThread, listThreads } from "../../../../server/messaging";
import { ensureAuthUser, requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";
import { messageThreadCreateSchema, parseJson } from "../../../../lib/server/validation";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listThreads(await requireAuth(request))));
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson(request, messageThreadCreateSchema);
    return jsonOk(await createThread(context, input.listingId), { status: 201 });
  });
}
