import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { problemResponse } from "@/lib/http/problem";
import { verifyPhotoToken } from "@/lib/photos/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTANCE = "/api/v1/cardholders/{id}/photo";
const MAX_BYTES = 200 * 1024;
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

  const row = await prisma.cardholder.findUnique({
    where: { id },
    select: { photo: true, photoMime: true },
  });
  if (!row?.photo || !row.photoMime) {
    return problemResponse(404, "Not found", "Kein Foto vorhanden.", INSTANCE);
  }

  return new Response(new Uint8Array(row.photo), {
    headers: {
      "Content-Type": row.photoMime,
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

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    return problemResponse(422, "Validation failed", "Foto max. 200 KB.", INSTANCE);
  }

  try {
    await prisma.cardholder.update({
      where: { id },
      data: { photo: buffer, photoMime: mime, photoUpdatedAt: new Date() },
    });
    return new Response(null, { status: 204 });
  } catch {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  const { id } = await context.params;
  if (!session) {
    return problemResponse(401, "Unauthorized", "Anmeldung erforderlich.", INSTANCE);
  }

  try {
    await prisma.cardholder.update({
      where: { id },
      data: { photo: null, photoMime: null, photoUpdatedAt: null },
    });
    return new Response(null, { status: 204 });
  } catch {
    return problemResponse(404, "Not found", "Karte nicht gefunden.", INSTANCE);
  }
}
