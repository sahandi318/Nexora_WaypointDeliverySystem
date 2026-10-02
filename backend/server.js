import "dotenv/config";

import http from "node:http";

import app from "./src/app.js";

import {
  connectDatabase,
  disconnectDatabase,
} from "./src/config/database.js";

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

let isShuttingDown = false;

// ============================================================
// SERVER STARTUP
// ============================================================

/**
 * Start the API only after a working database connection has
 * been confirmed.
 *
 * This prevents the application from appearing healthy when
 * its required database is unavailable.
 */
async function startServer() {
  try {
    await connectDatabase();

    server.listen(PORT, () => {
      console.log("");
      console.log(
        "=========================================="
      );

      console.log(
        " Nexora Waypoint Delivery System"
      );

      console.log(
        "=========================================="
      );

      console.log(
        ` Environment : ${
          process.env.NODE_ENV ||
          "development"
        }`
      );

      console.log(
        ` API         : http://localhost:${PORT}/api`
      );

      console.log(
        ` Health      : http://localhost:${PORT}/api/health`
      );

      console.log(
        ` Database    : http://localhost:${PORT}/api/health/database`
      );

      console.log(
        "=========================================="
      );

      console.log("");
    });
  } catch (error) {
    console.error(
      "✗ Failed to start Nexora Waypoint API."
    );

    console.error(error);

    try {
      await disconnectDatabase();
    } catch {
      // No additional action is required if Prisma
      // never established a connection.
    }

    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

/**
 * Close the HTTP server and Prisma connection cleanly.
 */
async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `\n${signal} received. Shutting down...`
  );

  const forceShutdownTimer =
    setTimeout(() => {
      console.error(
        "✗ Forced shutdown after timeout."
      );

      process.exit(1);
    }, 10000);

  forceShutdownTimer.unref();

  server.close(async () => {
    try {
      await disconnectDatabase();

      console.log(
        "✓ Database connection closed."
      );

      console.log(
        "✓ API stopped cleanly."
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Error during shutdown:",
        error
      );

      process.exit(1);
    }
  });
}

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

// ============================================================
// START APPLICATION
// ============================================================

startServer();