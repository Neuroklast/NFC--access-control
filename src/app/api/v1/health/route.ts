import { getStore } from "@/lib/store";
import { isDemoMode } from "@/lib/store/mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let db = true;
  let admin = false;
  try {
    admin = (await getStore().countAdmins()) > 0;
  } catch {
    db = false;
  }
  return Response.json(
    {
      status: db ? "ok" : "degraded",
      db,
      admin,
      demo: isDemoMode(),
      version: process.env.APP_VERSION ?? "unknown",
    },
    { status: db ? 200 : 503 },
  );
}
