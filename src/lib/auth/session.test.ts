import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

const SECRET = "test-secret-at-least-16-chars";

let readSessionToken!: typeof import("./session").readSessionToken;

beforeAll(async () => {
  process.env.SESSION_SECRET = SECRET;
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  ({ readSessionToken } = await import("./session"));
});

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SECRET));
}

describe("readSessionToken", () => {
  it("reads a valid token with a session version", async () => {
    const token = await sign({ sub: "a", email: "a@b.c", sv: 0 });
    expect(await readSessionToken(token)).toEqual({ sub: "a", email: "a@b.c", sv: 0 });
  });

  it("rejects a token without a session version", async () => {
    const token = await sign({ sub: "a", email: "a@b.c" });
    expect(await readSessionToken(token)).toBeNull();
  });

  it("rejects a token with a non-numeric session version", async () => {
    const token = await sign({ sub: "a", email: "a@b.c", sv: "0" });
    expect(await readSessionToken(token)).toBeNull();
  });
});
