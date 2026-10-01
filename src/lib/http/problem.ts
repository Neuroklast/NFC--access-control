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
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return "unknown";
}
