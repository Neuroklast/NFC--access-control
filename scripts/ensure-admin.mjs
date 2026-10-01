import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.log("[ensure-admin] ADMIN_EMAIL/ADMIN_PASSWORD nicht gesetzt - uebersprungen");
  await prisma.$disconnect();
  process.exit(0);
}

if (password.length < 12) {
  console.error("[ensure-admin] ADMIN_PASSWORD muss mindestens 12 Zeichen haben");
  await prisma.$disconnect();
  process.exit(1);
}

const existing = await prisma.adminUser.findFirst({ select: { id: true } });
if (existing) {
  console.log("[ensure-admin] Admin existiert bereits - uebersprungen");
  await prisma.$disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 12);
await prisma.adminUser.create({ data: { email, passwordHash } });
console.log(`[ensure-admin] Admin angelegt: ${email}`);
await prisma.$disconnect();
