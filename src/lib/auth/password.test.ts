import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes and verifies the complete supported password", async () => {
    const password = "a".repeat(72);
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword(`${"a".repeat(71)}b`, hash)).toBe(false);
  });

  it("rejects passwords bcrypt would silently truncate, including UTF-8", async () => {
    await expect(hashPassword("a".repeat(73))).rejects.toThrow("72 UTF-8 bytes");
    await expect(hashPassword("ä".repeat(37))).rejects.toThrow("72 UTF-8 bytes");
  });
});
