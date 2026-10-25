import { createReservation, listReservations } from "../../../server/reservations";
import { ensureAuthUser, requireAuth } from "../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../lib/server/http";
import { parseJson, reservationCreateSchema } from "../../../lib/server/validation";

export async function GET(request: Request) {
  return withApiErrors(async () => jsonOk(await listReservations(await requireAuth(request))));
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const context = await requireAuth(request);
    await ensureAuthUser(context);
    const input = await parseJson<typeof reservationCreateSchema>(request, reservationCreateSchema);
    return jsonOk(await createReservation(context, input), { status: 201 });
  });
}
