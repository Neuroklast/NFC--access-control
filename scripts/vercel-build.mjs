import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

const databaseUrl = process.env.DATABASE_URL;

run("node node_modules/prisma/build/index.js generate");

if (!databaseUrl) {
  console.log("[vercel-build] Keine DATABASE_URL - Demo-Modus ohne Datenbank. Migration und Seed werden uebersprungen.");
} else {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.error("[vercel-build] SESSION_SECRET fehlt oder ist zu kurz (min. 16 Zeichen).");
    process.exit(1);
  }
  if (!process.env.DIRECT_URL) {
    console.log("[vercel-build] DIRECT_URL nicht gesetzt - verwende DATABASE_URL.");
    process.env.DIRECT_URL = databaseUrl;
  }
  run("node node_modules/prisma/build/index.js migrate deploy");
  run("node scripts/ensure-admin.mjs");
  run("node scripts/seed-demo.mjs");
}

run("node node_modules/next/dist/bin/next build");
