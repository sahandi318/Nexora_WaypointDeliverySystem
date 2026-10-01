import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI configuration for Nexora Waypoint.
 *
 * DATABASE_URL:
 *   Main development database.
 *
 * SHADOW_DATABASE_URL:
 *   Separate disposable database used by Prisma Migrate
 *   when evaluating development migrations.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});