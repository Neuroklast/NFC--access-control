import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { cardholderPatchSchema, serializeCardholder } from "@/lib/cardholders/schema";
import { prisma } from "@/lib/db/prisma";
import { problemResponse } from "@/lib/http/problem";

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

  const row = await prisma.cardholder.findUnique({ where: { id } });
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

  const data: Prisma.CardholderUpdateInput = {};
  if (parsed.data.card_uid !== undefined) data.cardUid = parsed.data.card_uid;
  if (parsed.data.first_name !== undefined) data.firstName = parsed.data.first_name;
  if (parsed.data.last_name !== undefined) data.lastName = parsed.data.last_name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;

  try {
    const updated = await prisma.cardholder.update({ where: { id }, data });
    return Response.json(serializeCardholder(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return problemResponse(404, "Not found", "Karte nicht gefunden.", instance(id));
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
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

  try {
    await prisma.cardholder.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return problemResponse(404, "Not found", "Karte nicht gefunden.", instance(id));
    }
    throw error;
  }
}
