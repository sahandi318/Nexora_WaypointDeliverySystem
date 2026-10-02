import express from "express";
import cors from "cors";

import prisma from "./config/database.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import storeManagerRoutes from "./routes/storeManagerRoutes.js";


const app =
  express();


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


app.use(
  express.json({
    limit: "1mb",
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);


// ============================================================
// API ROOT
// ============================================================

app.get(
  "/api",
  (req, res) => {
    res.status(200).json({
      success: true,

      name:
        "Nexora Waypoint API",

      message:
        "API is running.",
    });
  }
);


// ============================================================
// HEALTH ROUTES
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      service:
        "Nexora Waypoint API",

      status:
        "running",

      timestamp:
        new Date().toISOString(),
    });
  }
);


app.get(
  "/api/health/database",
  async (req, res) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;


      res.status(200).json({
        success: true,

        database:
          process.env
            .DATABASE_NAME,

        status:
          "connected",

        timestamp:
          new Date()
            .toISOString(),
      });
    } catch (error) {
      console.error(
        "Database health check failed:",
        error
      );


      res.status(503).json({
        success: false,

        database:
          process.env
            .DATABASE_NAME,

        status:
          "unavailable",
      });
    }
  }
);


// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);


// ============================================================
// ADMIN ROUTES
// ============================================================

app.use(
  "/api/admin",
  adminRoutes
);


// ============================================================
// STORE MANAGER ROUTES
// ============================================================

app.use(
  "/api/store-manager",
  storeManagerRoutes
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "API endpoint not found.",
    });
  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    /**
     * Express recognizes error middleware from the
     * four-parameter function signature.
     */
    void req;
    void next;


    console.error(
      "Unhandled API error:",
      error
    );


    res
      .status(
        error.status ||
        500
      )
      .json({
        success: false,

        message:
          process.env.NODE_ENV ===
          "production"
            ? "An unexpected server error occurred."
            : (
              error.message ||
              "An unexpected server error occurred."
            ),
      });
  }
);


export default app;