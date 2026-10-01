import { prisma } from "@/lib/db/prisma";
import { clientIp, problemResponse } from "@/lib/http/problem";
import { rateLimit } from "@/lib/http/rate-limit";
import { verifyCardBodySchema } from "@/lib/cardholders/schema";
import { verifyCard } from "@/lib/verify/verify-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/card-verifications";

export async function POST(request: Request) {
  const limited = rateLimit(`verify:${clientIp(request)}`, 30, 60_000);
  if (!limited.ok) {
    return problemResponse(429, "Too many requests", "Bitte kurz warten.", INSTANCE);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return problemResponse(400, "Bad request", "JSON-Body erwartet.", INSTANCE);
  }

  const parsed = verifyCardBodySchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(422, "Validation failed", "card_uid ist ungültig.", INSTANCE);
  }

  const row = await prisma.cardholder.findUnique({
    where: { cardUid: parsed.data.card_uid },
    select: {
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  const result = verifyCard(row);
  if (result.granted) {
    return Response.json(result);
  }
  if (result.reason === "unknown") {
    return problemResponse(404, "Unknown card", "Karte unbekannt.", INSTANCE);
  }
  return problemResponse(403, "Inactive card", "Inhaber ist gesperrt.", INSTANCE);
}
