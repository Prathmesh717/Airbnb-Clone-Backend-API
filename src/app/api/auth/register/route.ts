import { registerUser } from "../../../../server/auth";
import { enforceRateLimit, jsonOk, withApiErrors } from "../../../../lib/server/http";
import { parseJson, registerSchema } from "../../../../lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    enforceRateLimit(`register:${address}`, 5, 60_000);
    const input = await parseJson(request, registerSchema);
    return jsonOk(await registerUser(input), { status: 201 });
  });
}
