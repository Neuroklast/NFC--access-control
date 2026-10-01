import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@club.local";
  const password = process.env.ADMIN_PASSWORD ?? "changeme";

  const passwordHash = await hashPassword(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  await prisma.cardholder.upsert({
    where: { cardUid: "DEMO-ACTIVE" },
    update: {},
    create: {
      cardUid: "DEMO-ACTIVE",
      firstName: "Anna",
      lastName: "Meier",
      role: "staff",
      isActive: true,
    },
  });

  await prisma.cardholder.upsert({
    where: { cardUid: "DEMO-BLOCKED" },
    update: {},
    create: {
      cardUid: "DEMO-BLOCKED",
      firstName: "Ben",
      lastName: "Schulz",
      role: "vip",
      isActive: false,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
