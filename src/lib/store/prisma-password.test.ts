import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ updateMany: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { adminUser: mocks } }));
import { createPrismaStore } from "./prisma-store";

beforeEach(() => vi.clearAllMocks());
describe("database password rotation", () => {
  it("changes password and session version in one conditional database write", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    expect(await createPrismaStore().rotateAdminPassword("admin", "old", 4, "new")).toBe(5);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "admin", passwordHash: "old", sessionVersion: 4 },
      data: { passwordHash: "new", sessionVersion: { increment: 1 } },
    });
  });
  it("reports a conflict when a concurrent update already changed the account", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await createPrismaStore().rotateAdminPassword("admin", "old", 4, "new")).toBeNull();
  });
});
