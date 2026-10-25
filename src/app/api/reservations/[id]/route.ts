import { cancelReservation, getReservation, updateReservationStatus } from "../../../../server/reservations";
import { requireAuth } from "../../../../lib/server/auth";
import { jsonOk, withApiErrors } from "../../../../lib/server/http";
import { parseJson, reservationUpdateSchema } from "../../../../lib/server/validation";

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await getReservation(await requireAuth(request), params.id)));
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await cancelReservation(await requireAuth(request), params.id)));
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return withApiErrors(async () => jsonOk(await updateReservationStatus(await requireAuth(request), params.id, await parseJson(request, reservationUpdateSchema))));
}
