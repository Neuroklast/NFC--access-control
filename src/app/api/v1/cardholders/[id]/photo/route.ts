import { getSession } from "@/lib/auth/session";
import { problemResponse } from "@/lib/http/problem";
import { toOptimizedWebp } from "@/lib/photos/process";
import { verifyPhotoToken } from "@/lib/photos/token";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/cardholders/{id}/photo";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type RouteContext = { params: Promise<{ id: string }> };

async function isAuthorized(request: Request): Promise<boolean> {
  const session = await getSession();
  if (session) {
    return true;
  }
  const token = new URL(request.url).searchParams.get("t");
  if (!token) {
    return false;
  }
  return (await verifyPhotoToken(token)) !== null;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!(await isAuthorized(request))) {
    return problemResponse(401, "Unauthorized", "Nicht berechtigt.", INSTANCE);
  }

  const record = await getStore().getCardholderPhoto(id);
  if (!record) {
    return problemResponse(404, "Not found", "Kein Foto vorhanden.", INSTANCE);
  }

  return new Response(new Uint8Array(record.photo), {
    headers: {
      "Content-Type": record.photoMime,
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
    },
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  const mime = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    return problemResponse(422, "Validation failed", "Nur JPEG, PNG oder WebP.", INSTANCE);
  }

  const upload = Buffer.from(await request.arrayBuffer());
  if (upload.byteLength === 0 || upload.byteLength > MAX_UPLOAD_BYTES) {
    return problemResponse(422, "Validation failed", "Bild max. 8 MB.", INSTANCE);
  }

  let webp: Uint8Array<ArrayBuffer>;
  try {
    webp = await toOptimizedWebp(upload);
  } catch {
    return problemResponse(422, "Validation failed", "Bild konnte nicht verarbeitet werden.", INSTANCE);
  }

  const saved = await getStore().setCardholderPhoto(id, webp, "image/webp");
  if (!saved) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }
  return new Response(null, { status: 204 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  const cleared = await getStore().clearCardholderPhoto(id);
  if (!cleared) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }
  return new Response(null, { status: 204 });
}
