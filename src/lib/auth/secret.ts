import { isDemoMode } from "@/lib/store/mode";

const DEMO_SECRET = "demo-mode-insecure-session-secret";

export function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }
  if (isDemoMode()) {
    return new TextEncoder().encode(DEMO_SECRET);
  }
  throw new Error("SESSION_SECRET must be at least 16 characters");
}
