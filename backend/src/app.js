import express from "express";
import cors from "cors";

import prisma from "./config/database.js";

const app = express();


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ============================================================
// API ROOT
// ============================================================

/**
 * Simple API root endpoint.
 *
 * Useful for confirming that requests are reaching Express.
 */
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Nexora Waypoint API",
    message: "API is running.",
  });
});


// ============================================================
// APPLICATION HEALTH
// ============================================================

/**
 * Confirms that the Express application itself is running.
 *
 * This endpoint does not query the database.
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Nexora Waypoint API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});


// ============================================================
// DATABASE HEALTH
// ============================================================

/**
 * Confirms that Express can communicate with MySQL through
 * Prisma.
 */
app.get(
  "/api/health/database",
  async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        success: true,
        database: process.env.DATABASE_NAME,
        status: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Database health check failed:",
        error
      );

      res.status(503).json({
        success: false,
        database: process.env.DATABASE_NAME,
        status: "unavailable",
      });
    }
  }
);


// ============================================================
// 404 HANDLER
// ============================================================

/**
 * Handles requests that do not match an existing API route.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

/**
 * Central Express error handler.
 *
 * The fourth parameter is intentionally included because
 * Express identifies error middleware by its four arguments.
 */
app.use((error, req, res, next) => {
  void next;

  console.error(
    "Unhandled API error:",
    error
  );

  res.status(error.status || 500).json({
    success: false,
    message:
      error.message ||
      "An unexpected server error occurred.",
  });
});


export default app;