import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), setSessionCookie: vi.fn(), clearSessionCookie: vi.fn(),
  verifyPassword: vi.fn(), listCardholders: vi.fn(), findCardholder: vi.fn(),
  createCardholder: vi.fn(), updateCardholder: vi.fn(), deleteCardholder: vi.fn(),
  findAdminByEmail: vi.fn(), bumpSessionVersion: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => mocks);
vi.mock("@/lib/auth/password", () => mocks);
vi.mock("@/lib/store", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/store")>(), getStore: () => mocks,
}));
import { GET as sessionGet, POST as sessionPost, DELETE as sessionDelete } from "./sessions/route";
import { GET as list, POST as create } from "./cardholders/route";
import { GET as read, PATCH as update, DELETE as remove } from "./cardholders/[id]/route";

const id = crypto.randomUUID();
const admin = { id, email: "review@example.com", passwordHash: "hash", sessionVersion: 0 };
const row = { id, cardUid: "TEST-CACHE", firstName: "Test", lastName: "Review", role: "staff", isActive: true,
  photoUpdatedAt: null, createdAt: new Date(0), updatedAt: new Date(0) };
const context = { params: Promise.resolve({ id }) };
function request(method = "GET", body?: object) {
  return new Request("http://localhost/api/v1/cardholders", {
    method, headers: { "Content-Type": "application/json", "X-Forwarded-For": crypto.randomUUID() },
    body: body ? JSON.stringify(body) : undefined,
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ sub: id, email: admin.email, sv: 0 });
  mocks.findAdminByEmail.mockResolvedValue(admin);
  mocks.verifyPassword.mockResolvedValue(true);
  mocks.listCardholders.mockResolvedValue([row]);
  for (const fn of [mocks.findCardholder, mocks.createCardholder, mocks.updateCardholder]) fn.mockResolvedValue(row);
  mocks.deleteCardholder.mockResolvedValue(true);
});

describe("private API cache policy", () => {
  it.each([
    { name: "session read", status: 200, run: () => sessionGet() },
    { name: "login", status: 204, run: () => sessionPost(request("POST", { email: admin.email, password: "password" })) },
    { name: "logout", status: 204, run: () => sessionDelete() },
    { name: "cardholder list", status: 200, run: () => list() },
    { name: "cardholder read", status: 200, run: () => read(request(), context) },
    { name: "cardholder create", status: 201, run: () => create(request("POST", { card_uid: "TEST-CACHE", first_name: "Test", last_name: "Review" })) },
    { name: "cardholder update", status: 200, run: () => update(request("PATCH", { is_active: false }), context) },
    { name: "cardholder delete", status: 204, run: () => remove(request("DELETE"), context) },
  ])("prevents caching $name", async ({ run, status }) => {
    const response = await run();
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
