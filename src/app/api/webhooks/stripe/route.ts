import { handleStripeWebhook } from "../../../../server/payments";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const payload = await request.text();
    return jsonOk(await handleStripeWebhook(payload, request.headers.get("stripe-signature")));
  });
}
