import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import { loginBodySchema } from "@/lib/cardholders/schema";
import { clientIp, problemResponse } from "@/lib/http/problem";
import { rateLimit } from "@/lib/http/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/sessions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response(null, { status: 401 });
  }
  return Response.json({ email: session.email });
}

export async function POST(request: Request) {
  const limited = rateLimit(`login:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return problemResponse(429, "Too many requests", "Zu viele Anmeldeversuche.", INSTANCE);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return problemResponse(400, "Bad request", "JSON-Body erwartet.", INSTANCE);
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(401, "Unauthorized", "E-Mail oder Passwort ungültig.", INSTANCE);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (!admin) {
    return problemResponse(401, "Unauthorized", "E-Mail oder Passwort ungültig.", INSTANCE);
  }

  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return problemResponse(401, "Unauthorized", "E-Mail oder Passwort ungültig.", INSTANCE);
  }

  await setSessionCookie({ sub: admin.id, email: admin.email });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
