import "dotenv/config";

import http from "node:http";

import app from "./src/app.js";

import {
  connectDatabase,
  disconnectDatabase,
} from "./src/config/database.js";

import {
  warmLocalTranslationModel,
} from "./src/services/localTranslationModel.js";

const PORT =
  Number(
    process.env.PORT
  ) ||
  5000;

const server =
  http.createServer(
    app
  );

let isShuttingDown =
  false;

// ============================================================
// TRANSLATION MODEL STARTUP
// ============================================================

const SHOULD_WARM_TRANSLATION_MODEL =
  process.env
    .TRANSLATION_WARM_ON_START !==
  "false";

async function warmTranslationModelInBackground() {
  if (
    !SHOULD_WARM_TRANSLATION_MODEL
  ) {
    console.log(
      " Translation : startup warmup disabled"
    );

    return;
  }

  try {
    console.log(
      " Translation : warming local NLLB model..."
    );

    const status =
      await warmLocalTranslationModel();

    console.log(
      ` Translation : ready (${status.modelId}, ${status.dtype})`
    );
  } catch (error) {
    console.warn(
      "⚠ Translation model warmup failed."
    );

    console.warn(
      "  Dynamic translations will retry automatically when requested."
    );

    console.warn(
      `  Reason: ${
        error.message ||
        "Unknown error"
      }`
    );
  }
}

// ============================================================
// SERVER STARTUP
// ============================================================

/**
 * Start the API only after a working database connection has
 * been confirmed.
 *
 * Translation warmup happens in the background after the API
 * begins listening. This keeps startup responsive while making
 * the NLLB model ready before most dynamic translation requests.
 */
async function startServer() {
  try {
    await connectDatabase();

    server.listen(
      PORT,
      () => {
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
            process.env
              .NODE_ENV ||
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

        // Start the expensive model load only after the API is
        // already available.
        setImmediate(
          () => {
            void warmTranslationModelInBackground();
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "✗ Failed to start Nexora Waypoint API."
    );

    console.error(
      error
    );

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
async function shutdown(
  signal
) {
  if (
    isShuttingDown
  ) {
    return;
  }

  isShuttingDown =
    true;

  console.log(
    `\n${signal} received. Shutting down...`
  );

  const forceShutdownTimer =
    setTimeout(
      () => {
        console.error(
          "✗ Forced shutdown after timeout."
        );

        process.exit(
          1
        );
      },
      10000
    );

  forceShutdownTimer.unref();

  server.close(
    async () => {
      try {
        await disconnectDatabase();

        console.log(
          "✓ Database connection closed."
        );

        console.log(
          "✓ API stopped cleanly."
        );

        process.exit(
          0
        );
      } catch (error) {
        console.error(
          "Error during shutdown:",
          error
        );

        process.exit(
          1
        );
      }
    }
  );
}

process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);

// ============================================================
// START APPLICATION
// ============================================================

startServer();