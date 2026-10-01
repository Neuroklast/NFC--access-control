import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { cardholderCreateSchema, serializeCardholder } from "@/lib/cardholders/schema";
import { prisma } from "@/lib/db/prisma";
import { problemResponse } from "@/lib/http/problem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/cardholders";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const rows = await prisma.cardholder.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { cardUid: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

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
    const created = await prisma.cardholder.create({
      data: {
        cardUid: parsed.data.card_uid,
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
        role: parsed.data.role,
        isActive: parsed.data.is_active,
      },
    });
    return Response.json(serializeCardholder(created), {
      status: 201,
      headers: { Location: `/api/v1/cardholders/${created.id}` },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return problemResponse(409, "Conflict", "Diese Karten-UID existiert bereits.", INSTANCE);
    }
    throw error;
  }
}
