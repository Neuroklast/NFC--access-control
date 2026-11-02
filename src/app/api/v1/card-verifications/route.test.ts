import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verifyLookup: vi.fn(), createPhotoToken: vi.fn() }));
vi.mock("@/lib/store", () => ({ getStore: () => mocks }));
vi.mock("@/lib/photos/token", () => mocks);
import { POST } from "./route";

function request(cardUid: unknown = "TEST-CARD", ip = crypto.randomUUID()) {
  return new Request("http://localhost/api/v1/card-verifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify({ card_uid: cardUid }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyLookup.mockResolvedValue({ id: "card-id", firstName: "Test", lastName: "Person", role: "staff", isActive: true, photoUpdatedAt: null });
  mocks.createPhotoToken.mockResolvedValue("photo-token");
});

describe("card verification", () => {
  it("normalizes the UID and returns only public fields", async () => {
    const response = await POST(request(" test-card "));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ granted: true, first_name: "Test", last_name: "Person", role: "staff", photo_url: null });
    expect(mocks.verifyLookup).toHaveBeenCalledWith("TEST-CARD");
  });

  it("does not disclose the holder of a blocked card", async () => {
    mocks.verifyLookup.mockResolvedValue({ firstName: "Private", isActive: false });
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(JSON.stringify(await response.json())).not.toContain("Private");
  });

  it("rejects an unknown card", async () => {
    mocks.verifyLookup.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(404);
  });

  it("rejects invalid card input before lookup", async () => {
    expect((await POST(request(42))).status).toBe(422);
    expect(mocks.verifyLookup).not.toHaveBeenCalled();
  });

  it("returns a retry hint after the scan limit", async () => {
    const ip = crypto.randomUUID();
    for (let i = 0; i < 30; i++) await POST(request("TEST-CARD", ip));
    const response = await POST(request("TEST-CARD", ip));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
