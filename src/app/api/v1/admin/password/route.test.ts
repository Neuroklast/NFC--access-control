import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  setSessionCookie: vi.fn(),
  findAdminById: vi.fn(),
  rotateAdminPassword: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => mocks);
vi.mock("@/lib/auth/password", () => mocks);
vi.mock("@/lib/store", () => ({ getStore: () => mocks }));

import { PATCH } from "./route";

function request(newPassword = "new-password-123") {
  return new Request("http://localhost/api/v1/admin/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: "current-password", new_password: newPassword }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  const id = crypto.randomUUID();
  mocks.getSession.mockResolvedValue({ sub: id, email: "admin@example.com", sv: 0 });
  mocks.findAdminById.mockResolvedValue({ id, email: "admin@example.com", passwordHash: "old", sessionVersion: 0 });
  mocks.verifyPassword.mockResolvedValue(true);
  mocks.hashPassword.mockResolvedValue("new");
  mocks.rotateAdminPassword.mockResolvedValue(1);
});

describe("password change", () => {
  it("requires an authenticated session", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await PATCH(request())).status).toBe(401);
    expect(mocks.rotateAdminPassword).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    mocks.verifyPassword.mockResolvedValue(false);
    expect((await PATCH(request())).status).toBe(403);
    expect(mocks.rotateAdminPassword).not.toHaveBeenCalled();
  });

  it.each(["a".repeat(73), "ä".repeat(37)])("rejects a truncated password before writing", async (password) => {
    expect((await PATCH(request(password))).status).toBe(422);
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.rotateAdminPassword).not.toHaveBeenCalled();
  });

  it("accepts exactly 72 UTF-8 bytes and refreshes the session", async () => {
    expect((await PATCH(request("ä".repeat(36)))).status).toBe(204);
    expect(mocks.rotateAdminPassword).toHaveBeenCalledWith(expect.any(String), "old", 0, "new");
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(expect.objectContaining({ sv: 1 }));
  });

  it("rejects a session revoked after the initial authentication check", async () => {
    mocks.findAdminById.mockResolvedValue({ id: "admin", email: "admin@example.com", passwordHash: "old", sessionVersion: 1 });
    expect((await PATCH(request())).status).toBe(401);
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.rotateAdminPassword).not.toHaveBeenCalled();
  });

  it("does not refresh the session when a concurrent change wins", async () => {
    mocks.rotateAdminPassword.mockResolvedValue(null);
    expect((await PATCH(request())).status).toBe(409);
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it("lets only one simultaneous password change refresh the session", async () => {
    let changed = false;
    mocks.rotateAdminPassword.mockImplementation(async () => {
      if (changed) return null;
      changed = true;
      return 1;
    });
    const responses = await Promise.all([PATCH(request()), PATCH(request())]);
    expect(responses.map((response) => response.status).sort()).toEqual([204, 409]);
    expect(mocks.setSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("limits repeated current-password guesses with a retry hint", async () => {
    mocks.verifyPassword.mockResolvedValue(false);
    for (let i = 0; i < 5; i++) {
      expect((await PATCH(request())).status).toBe(403);
    }
    const response = await PATCH(request());
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
