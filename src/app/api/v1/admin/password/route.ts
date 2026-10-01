import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { problemResponse } from "@/lib/http/problem";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/admin/password";

const bodySchema = z
  .object({
    current_password: z.string().min(1).max(200),
    new_password: z.string().min(12).max(200),
  })
  .strict();

export async function PATCH(request: Request) {
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return problemResponse(
      422,
      "Validation failed",
      "Neues Passwort braucht mindestens 12 Zeichen.",
      INSTANCE,
    );
  }

  const admin = await getStore().findAdminById(session.sub);
  if (!admin) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  const ok = await verifyPassword(parsed.data.current_password, admin.passwordHash);
  if (!ok) {
    return problemResponse(403, "Forbidden", "Aktuelles Passwort ist falsch.", INSTANCE);
  }

  const passwordHash = await hashPassword(parsed.data.new_password);
  await getStore().updateAdminPassword(admin.id, passwordHash);

  return new Response(null, { status: 204 });
}
