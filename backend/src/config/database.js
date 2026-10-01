import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

/**
 * Prisma database configuration.
 *
 * Development architecture:
 *
 * Express / Node.js
 *        ↓
 * Prisma Client
 *        ↓
 * Prisma MariaDB/MySQL adapter
 *        ↓
 * 127.0.0.1:3307
 *        ↓
 * Docker MySQL
 *        ↓
 * nexora_waypoint
 */

const requiredEnvironmentVariables = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
];

/**
 * Fail immediately with a useful message when a required
 * database environment variable is missing.
 */
for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(
      `Missing required environment variable: ${variableName}`
    );
  }
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // Small connection pool suitable for local development
  // and the hackathon demonstration environment.
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Open the Prisma database connection and verify that MySQL
 * actually responds before starting the API server.
 */
export async function connectDatabase() {
  await prisma.$connect();

  await prisma.$queryRaw`SELECT 1`;

  console.log(
    `✓ Database connected: ${process.env.DATABASE_NAME}`
  );
}

/**
 * Close Prisma cleanly when the API shuts down.
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;