import { getSession } from "@/lib/auth/session";
import { isUuid } from "@/lib/cardholders/schema";
import { BodyTooLargeError, readLimited } from "@/lib/http/body";
import { problemResponse } from "@/lib/http/problem";
import { toOptimizedWebp } from "@/lib/photos/process";
import { photoTokenMatches, verifyPhotoToken } from "@/lib/photos/token";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/cardholders/{id}/photo";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type RouteContext = { params: Promise<{ id: string }> };

async function isAuthorized(request: Request, id: string): Promise<boolean> {
  const session = await getSession();
  if (session) {
    return true;
  }
  const token = new URL(request.url).searchParams.get("t");
  if (!token) {
    return false;
  }
  return photoTokenMatches(await verifyPhotoToken(token), id);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!(await isAuthorized(request, id))) {
    return problemResponse(401, "Unauthorized", "Nicht berechtigt.", INSTANCE);
  }
  if (!isUuid(id)) {
    return problemResponse(404, "Not found", "Kein Foto vorhanden.", INSTANCE);
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

  if (!isUuid(id)) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }

  const mime = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    return problemResponse(422, "Validation failed", "Nur JPEG, PNG oder WebP.", INSTANCE);
  }

  let upload: Buffer;
  try {
    upload = Buffer.from(await readLimited(request, MAX_UPLOAD_BYTES));
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return problemResponse(413, "Payload too large", "Bild max. 8 MB.", INSTANCE);
    }
    throw error;
  }
  if (upload.byteLength === 0) {
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
  if (!isUuid(id)) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }

  const cleared = await getStore().clearCardholderPhoto(id);
  if (!cleared) {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }
  return new Response(null, { status: 204 });
}
