import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "./memory-store";

const id = crypto.randomUUID();
const original = { id, email: "review@example.com", passwordHash: "old-hash", sessionVersion: 5 };
beforeEach(() => {
  vi.stubGlobal("__nfcMemoryDb", {
    seeded: Promise.resolve(),
    admins: new Map([[id, { ...original }]]),
    cardholders: new Map(),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("atomic password rotation", () => {
  it("allows only one simultaneous change with the same credentials", async () => {
    const store = createMemoryStore();
    const versions = await Promise.all([
      store.rotateAdminPassword(id, "old-hash", 5, "winner-hash"),
      store.rotateAdminPassword(id, "old-hash", 5, "loser-hash"),
    ]);
    expect(versions).toEqual([6, null]);
    expect(await store.findAdminById(id)).toMatchObject({ passwordHash: "winner-hash", sessionVersion: 6 });
  });

  it("does not replace the password after logout revoked the session", async () => {
    const store = createMemoryStore();
    await store.bumpSessionVersion(id);
    expect(await store.rotateAdminPassword(id, "old-hash", 5, "new-hash")).toBeNull();
    expect(await store.findAdminById(id)).toMatchObject({ passwordHash: "old-hash", sessionVersion: 6 });
  });

  it("rejects stale password hashes without altering the session version", async () => {
    const store = createMemoryStore();
    expect(await store.rotateAdminPassword(id, "stale-hash", 5, "new-hash")).toBeNull();
    expect(await store.findAdminById(id)).toEqual(original);
  });
});
