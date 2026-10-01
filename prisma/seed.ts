import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEMO !== "1") {
    console.log("seed: SEED_DEMO!=1, nur Demo-Karten werden uebersprungen");
    return;
  }

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
