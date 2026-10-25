import { createCloudinaryUploadSignature } from "../../../../server/uploads";
import { requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withApiErrors(async () => jsonOk(createCloudinaryUploadSignature(await requireAuth(request))));
}
