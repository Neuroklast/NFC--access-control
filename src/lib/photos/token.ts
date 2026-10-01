import { jwtVerify, SignJWT } from "jose";
import { secretKey } from "@/lib/auth/secret";

const TTL_SECONDS = 60;

export async function createPhotoToken(cardholderId: string): Promise<string> {
  return new SignJWT({ scope: "photo" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(cardholderId)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyPhotoToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.scope !== "photo" || typeof payload.sub !== "string") {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}
