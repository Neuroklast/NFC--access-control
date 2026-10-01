import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory-store";
import { ConflictError } from "./types";

describe("memory store", () => {
  it("should seed an active and a blocked demo card", async () => {
    const store = createMemoryStore();

    const active = await store.verifyLookup("DEMO-ACTIVE");
    expect(active?.isActive).toBe(true);
    expect(active?.firstName).toBe("Anna");

    const blocked = await store.verifyLookup("DEMO-BLOCKED");
    expect(blocked?.isActive).toBe(false);

    expect(await store.verifyLookup("UNKNOWN")).toBeNull();
  });

  it("should reject a duplicate card uid", async () => {
    const store = createMemoryStore();
    await store.createCardholder({
      cardUid: "UNIQUE-1",
      firstName: "Cara",
      lastName: "Klein",
      role: "staff",
      isActive: true,
    });

    await expect(
      store.createCardholder({
        cardUid: "UNIQUE-1",
        firstName: "Doro",
        lastName: "Gross",
        role: "staff",
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("should update and delete a card", async () => {
    const store = createMemoryStore();
    const created = await store.createCardholder({
      cardUid: "TEMP-1",
      firstName: "Emil",
      lastName: "Wolf",
      role: "staff",
      isActive: true,
    });

    const updated = await store.updateCardholder(created.id, { isActive: false });
    expect(updated?.isActive).toBe(false);

    expect(await store.deleteCardholder(created.id)).toBe(true);
    expect(await store.findCardholder(created.id)).toBeNull();
    expect(await store.deleteCardholder(created.id)).toBe(false);
  });
});
