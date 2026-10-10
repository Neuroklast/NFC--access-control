import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import { loginBodySchema } from "@/lib/cardholders/schema";
import { BodyTooLargeError, readJsonBody } from "@/lib/http/body";
import { clientIp, problemResponse } from "@/lib/http/problem";
import { rateLimit } from "@/lib/http/rate-limit";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/sessions";

// Compared when the email is unknown so login takes the same time either way.
const DUMMY_PASSWORD_HASH = "$2b$12$iLfjTtSs6evPja77icl6xeExtr1rLY6.P8Eo8qaBk3vDmfZ8P/aGm";

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
    json = await readJsonBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return problemResponse(413, "Payload too large", "Anfrage zu gross.", INSTANCE);
    }
    return problemResponse(400, "Bad request", "JSON-Body erwartet.", INSTANCE);
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(401, "Unauthorized", "E-Mail oder Passwort ungültig.", INSTANCE);
  }

  const admin = await getStore().findAdminByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!admin || !ok) {
    return problemResponse(401, "Unauthorized", "E-Mail oder Passwort ungültig.", INSTANCE);
  }

  await setSessionCookie({ sub: admin.id, email: admin.email, sv: admin.sessionVersion });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  const session = await getSession();
  if (session) {
    await getStore().bumpSessionVersion(session.sub);
  }
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
