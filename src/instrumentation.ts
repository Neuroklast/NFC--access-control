export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const demo = process.env.DEMO_MODE === "1" || !process.env.DATABASE_URL;
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 16) {
    if (demo) {
      console.warn(
        "[startup] Demo-Modus: SESSION_SECRET fehlt, es wird ein unsicherer Demo-Schluessel genutzt.",
      );
      return;
    }
    throw new Error("SESSION_SECRET fehlt oder ist zu kurz (min. 16 Zeichen).");
  }
}
