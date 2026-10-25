import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 6+ config. Keeps seed out of deprecated package.json#prisma
 * when upgrading toward Prisma 7.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
