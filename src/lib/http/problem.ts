export function problemResponse(
  status: number,
  title: string,
  detail: string,
  instance: string,
  extra?: Record<string, unknown>,
): Response {
  return Response.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
      instance,
      ...extra,
    },
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    },
  );
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // The last hop is the one the nearest proxy appended; earlier values are
    // caller-supplied and must not be trusted.
    const parts = forwarded.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) {
      return last;
    }
  }
  return "unknown";
}
