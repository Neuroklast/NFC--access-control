export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET fehlt oder ist zu kurz (min. 16 Zeichen).");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL fehlt.");
  }
}
