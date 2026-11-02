import { describe, expect, it } from "vitest";
import { problemResponse, rateLimitResponse } from "./problem";

describe("problem responses", () => {
  it("prevents caching failures that may contain account or card information", async () => {
    const response = problemResponse(403, "Forbidden", "Denied", "/api/v1/test");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await response.json()).toMatchObject({ status: 403, detail: "Denied" });
  });

  it("returns the remaining wait time in the standard Retry-After header", async () => {
    const response = rateLimitResponse("Wait", "/api/v1/test", 42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(await response.json()).toMatchObject({ status: 429 });
  });
});
