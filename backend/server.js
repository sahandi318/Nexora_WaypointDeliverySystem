import "dotenv/config";

import http from "node:http";
import express from "express";
import cors from "cors";

import app from "./src/app.js";
import dispatcherRoutes from "./src/routes/dispatcherRoutes.js";

import {
  connectDatabase,
  disconnectDatabase,
} from "./src/config/database.js";

import {
  initializeLiveMonitoring,
  startMonitoringSyncLoop,
  stopMonitoringSyncLoop,
} from "./src/services/liveMonitoringService.js";

import {
  initializeLiveMonitoringSocket,
} from "./src/sockets/liveMonitoringSocket.js";

const PORT = Number(process.env.PORT) || 5000;

/*
 * Dispatcher monitoring is mounted before the existing application.
 * This avoids changing the shared app.js while still allowing the
 * existing app-level 404 handler to remain last for all other routes.
 */
const rootApp = express();

rootApp.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173",
    credentials: true,
  })
);

rootApp.use(
  express.json({
    limit: "2mb",
  })
);

rootApp.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

rootApp.use(
  "/api/dispatcher",
  dispatcherRoutes
);

rootApp.use(app);

const server = http.createServer(rootApp);
const io = initializeLiveMonitoringSocket(server);

let isShuttingDown = false;

// ============================================================
// SERVER STARTUP
// ============================================================

async function startServer() {
  try {
    await connectDatabase();
    await initializeLiveMonitoring();
    startMonitoringSyncLoop();

    server.listen(PORT, () => {
      console.log("");
      console.log("==========================================");
      console.log(" Nexora Waypoint Delivery System");
      console.log("==========================================");
      console.log(` Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(` API         : http://localhost:${PORT}/api`);
      console.log(` Health      : http://localhost:${PORT}/api/health`);
      console.log(` Database    : http://localhost:${PORT}/api/health/database`);
      console.log(` Live socket : http://localhost:${PORT}`);
      console.log("==========================================");
      console.log("");
    });
  } catch (error) {
    console.error("✗ Failed to start Nexora Waypoint API.");
    console.error(error);

    stopMonitoringSyncLoop();

    try {
      await disconnectDatabase();
    } catch {
      // No additional action is required if Prisma never connected.
    }

    process.exit(1);
  }
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error("✗ Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);

  forceShutdownTimer.unref();
  stopMonitoringSyncLoop();

  io.close(() => {
    server.close(async () => {
      try {
        await disconnectDatabase();
        console.log("✓ Database connection closed.");
        console.log("✓ API stopped cleanly.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
