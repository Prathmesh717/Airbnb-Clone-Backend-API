import { createPaymentIntent } from "../../../../server/payments";
import { requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";
import { parseJson, paymentIntentSchema } from "../../../../lib/server/validation";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    const input = await parseJson(request, paymentIntentSchema);
    return jsonOk(await createPaymentIntent(context, input.reservationId, input.depositPercent), { status: 201 });
  });
}
