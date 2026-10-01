import { getSession } from "@/lib/auth/session";
import { cardholderCreateSchema, serializeCardholder } from "@/lib/cardholders/schema";
import { problemResponse } from "@/lib/http/problem";
import { ConflictError, getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/cardholders";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  const rows = await getStore().listCardholders();
  return Response.json({
    items: rows.map(serializeCardholder),
    next_cursor: null,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return problemResponse(400, "Bad request", "JSON-Body erwartet.", INSTANCE);
  }

  const parsed = cardholderCreateSchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(422, "Validation failed", "Kartendaten ungültig.", INSTANCE);
  }

  try {
    const created = await getStore().createCardholder({
      cardUid: parsed.data.card_uid,
      firstName: parsed.data.first_name,
      lastName: parsed.data.last_name,
      role: parsed.data.role,
      isActive: parsed.data.is_active,
    });
    return Response.json(serializeCardholder(created), {
      status: 201,
      headers: { Location: `/api/v1/cardholders/${created.id}` },
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return problemResponse(409, "Conflict", "Diese Karten-UID existiert bereits.", INSTANCE);
    }
    throw error;
  }
}
