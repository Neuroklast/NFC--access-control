import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("blocks after the limit is reached", () => {
    expect(rateLimit("limit-key", 2, 1000).ok).toBe(true);
    expect(rateLimit("limit-key", 2, 1000).ok).toBe(true);
    expect(rateLimit("limit-key", 2, 1000).ok).toBe(false);
  });

  it("uses a separate bucket per key", () => {
    expect(rateLimit("key-a", 1, 1000).ok).toBe(true);
    expect(rateLimit("key-a", 1, 1000).ok).toBe(false);
    expect(rateLimit("key-b", 1, 1000).ok).toBe(true);
  });

  it("starts a fresh window after reset", async () => {
    expect(rateLimit("window-key", 1, 20).ok).toBe(true);
    expect(rateLimit("window-key", 1, 20).ok).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(rateLimit("window-key", 1, 20).ok).toBe(true);
  });
});
