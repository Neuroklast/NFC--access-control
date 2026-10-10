import { beforeAll, describe, expect, it } from "vitest";
import { createPhotoToken, photoTokenMatches, verifyPhotoToken } from "./token";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-at-least-16-chars";
});

describe("photo token", () => {
  it("returns the subject it was created for", async () => {
    const token = await createPhotoToken("11111111-1111-1111-1111-111111111111");
    expect(await verifyPhotoToken(token)).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejects a token that is not for the requested cardholder", () => {
    expect(photoTokenMatches("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222")).toBe(false);
    expect(photoTokenMatches("11111111-1111-1111-1111-111111111111", "11111111-1111-1111-1111-111111111111")).toBe(true);
    expect(photoTokenMatches(null, "11111111-1111-1111-1111-111111111111")).toBe(false);
  });
});
