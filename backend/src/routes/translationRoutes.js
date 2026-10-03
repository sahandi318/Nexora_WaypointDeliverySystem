import {
  Router,
} from "express";

import {
  getTranslationLanguages,
  getTranslationStatus,
  translateTexts,
} from "../controllers/translationController.js";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
} from "../middleware/authMiddleware.js";

const router =
  Router();

// ============================================================
// PUBLIC TRANSLATION RATE LIMIT
// ============================================================
//
// Translation must work before login because the multilingual
// system is used across the entire application, including:
//
// - Landing page
// - Staff login
// - Admin login/register
// - Password recovery
//
// This lightweight limiter protects the local NLLB model from
// excessive anonymous requests.
//
// For production at larger scale, this can later be replaced
// with Redis / reverse-proxy rate limiting.
// ============================================================

const RATE_LIMIT_WINDOW_MS =
  60 * 1000;

const RATE_LIMIT_MAX_REQUESTS =
  30;

const translationRequests =
  new Map();

function translationRateLimit(
  req,
  res,
  next
) {
  const now =
    Date.now();

  const clientKey =
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  const current =
    translationRequests.get(
      clientKey
    );

  if (
    !current ||
    now >= current.resetAt
  ) {
    translationRequests.set(
      clientKey,
      {
        count: 1,
        resetAt:
          now +
          RATE_LIMIT_WINDOW_MS,
      }
    );

    return next();
  }

  if (
    current.count >=
    RATE_LIMIT_MAX_REQUESTS
  ) {
    const retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            current.resetAt -
            now
          ) /
            1000
        )
      );

    res.set(
      "Retry-After",
      String(
        retryAfterSeconds
      )
    );

    return res
      .status(429)
      .json({
        success: false,

        message:
          "Too many translation requests. Please try again shortly.",
      });
  }

  current.count += 1;

  translationRequests.set(
    clientKey,
    current
  );

  return next();
}

// ============================================================
// PUBLIC ROUTES
// ============================================================
//
// These endpoints must work before authentication so the
// public application can also use English, Sinhala and Tamil.
// ============================================================

router.get(
  "/languages",
  getTranslationLanguages
);

router.post(
  "/",
  translationRateLimit,
  translateTexts
);

// ============================================================
// PROTECTED DIAGNOSTIC ROUTES
// ============================================================
//
// Model/cache status contains internal implementation details,
// therefore it remains available only to authenticated users.
// ============================================================

router.get(
  "/status",
  authenticateToken,
  requirePasswordChangeCompleted,
  getTranslationStatus
);

export default router;