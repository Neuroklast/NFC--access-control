import { PrismaClient } from "@prisma/client";

if (process.env.SEED_DEMO !== "1") {
  console.log("[seed-demo] SEED_DEMO!=1 - uebersprungen");
  process.exit(0);
}

const prisma = new PrismaClient();

const cards = [
  {
    cardUid: "DEMO-ACTIVE",
    firstName: "Anna",
    lastName: "Meier",
    role: "staff",
    isActive: true,
  },
  {
    cardUid: "DEMO-BLOCKED",
    firstName: "Ben",
    lastName: "Schulz",
    role: "vip",
    isActive: false,
  },
];

for (const card of cards) {
  await prisma.cardholder.upsert({
    where: { cardUid: card.cardUid },
    update: {},
    create: card,
  });
}

console.log("[seed-demo] Demo-Karten bereit");
await prisma.$disconnect();
