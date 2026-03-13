import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getAllDependencies } from "../src/lib/dependencies/static-map";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding dependency map...");

  // Clear existing dependency data
  await prisma.dependencyMap.deleteMany();

  const entries = getAllDependencies();

  for (const entry of entries) {
    await prisma.dependencyMap.create({
      data: {
        provider: entry.provider,
        dependentService: entry.dependentService,
        confidence: entry.confidence,
        region: entry.region,
        source: entry.source,
      },
    });
  }

  console.log(`Seeded ${entries.length} dependency mappings.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
