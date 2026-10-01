import { getSession } from "@/lib/auth/session";
import { cardholderPatchSchema, serializeCardholder } from "@/lib/cardholders/schema";
import { problemResponse } from "@/lib/http/problem";
import { ConflictError, getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function instance(id: string) {
  return `/api/v1/cardholders/${id}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", instance(id));
  }

  const row = await getStore().findCardholder(id);
  if (!row) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", instance(id));
  }
  return Response.json(serializeCardholder(row));
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", instance(id));
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return problemResponse(400, "Bad request", "JSON-Body erwartet.", instance(id));
  }

  const parsed = cardholderPatchSchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(422, "Validation failed", "Kartendaten ungültig.", instance(id));
  }

  try {
    const updated = await getStore().updateCardholder(id, {
      ...(parsed.data.card_uid !== undefined ? { cardUid: parsed.data.card_uid } : {}),
      ...(parsed.data.first_name !== undefined ? { firstName: parsed.data.first_name } : {}),
      ...(parsed.data.last_name !== undefined ? { lastName: parsed.data.last_name } : {}),
      ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      ...(parsed.data.is_active !== undefined ? { isActive: parsed.data.is_active } : {}),
    });
    if (!updated) {
      return problemResponse(404, "Not found", "Karte nicht gefunden.", instance(id));
    }
    return Response.json(serializeCardholder(updated));
  } catch (error) {
    if (error instanceof ConflictError) {
      return problemResponse(409, "Conflict", "Diese Karten-UID existiert bereits.", instance(id));
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", instance(id));
  }

  const deleted = await getStore().deleteCardholder(id);
  if (!deleted) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", instance(id));
  }
  return new Response(null, { status: 204 });
}
