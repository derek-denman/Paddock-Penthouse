import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL ?? "owner@example.com";

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: "ADMIN" },
    create: {
      email: ownerEmail,
      displayName: "Repository Owner",
      role: "ADMIN"
    }
  });

  const league = await prisma.league.upsert({
    where: { code: "SEASON0" },
    update: { name: "Season 0 Founders League" },
    create: {
      name: "Season 0 Founders League",
      code: "SEASON0",
      ownerId: owner.id
    }
  });

  const season = await prisma.season.upsert({
    where: { key: "season-0" },
    update: { name: "Season 0" },
    create: {
      key: "season-0",
      name: "Season 0",
      year: 2026,
      series: "F1"
    }
  });

  const crownJewels = [
    { key: "monaco-gp", name: "Monaco GP" },
    { key: "indy-500", name: "Indy 500" },
    { key: "daytona-500", name: "Daytona 500" },
    { key: "le-mans-24", name: "Le Mans 24" }
  ];

  for (const event of crownJewels) {
    await prisma.event.upsert({
      where: { key: event.key },
      update: { name: event.name, isCrownJewel: true },
      create: {
        key: event.key,
        name: event.name,
        seasonId: season.id,
        series: "F1",
        isCrownJewel: true,
        startsAt: new Date("2026-06-01T12:00:00.000Z")
      }
    });
  }

  await prisma.leagueMembership.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: owner.id
      }
    },
    update: { role: "OWNER" },
    create: {
      leagueId: league.id,
      userId: owner.id,
      role: "OWNER"
    }
  });

  process.stdout.write("Seed completed: admin, sample league, sample season, crown jewel events.\n");
}

main()
  .catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
