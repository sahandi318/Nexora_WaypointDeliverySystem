import express from "express";

import {
  getLoaderDashboard,
  getLoaderIssues,
  getLoaderTrip,
  getLoaderTrips,
  patchIssueResolution,
  patchLoadingItem,
  patchVerification,
  postHandover,
  postLoadingIssue,
} from "../controllers/loaderController.js";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
} from "../middleware/authMiddleware.js";

import {
  requireLoader,
  requireDispatcher,
} from "../middleware/roleMiddleware.js";

const router =
  express.Router();

// ============================================================
// LOADER AUTHENTICATION
// ============================================================

router.use(
  authenticateToken
);

router.use(
  requirePasswordChangeCompleted
);

// ============================================================
// LOADER READ ROUTES
// ============================================================

router.get(
  "/dashboard",
  requireLoader,
  getLoaderDashboard
);

router.get(
  "/trips",
  requireLoader,
  getLoaderTrips
);

router.get(
  "/trips/:tripId",
  requireLoader,
  getLoaderTrip
);

// ============================================================
// LOADING WORKFLOW
// ============================================================

router.patch(
  "/trips/:tripId/items/:itemId",
  requireLoader,
  patchLoadingItem
);

router.post(
  "/trips/:tripId/issues",
  requireLoader,
  postLoadingIssue
);

router.get(
  "/issues",
  requireLoader,
  getLoaderIssues
);

// ============================================================
// VERIFICATION
// ============================================================

router.patch(
  "/trips/:tripId/verification",
  requireLoader,
  patchVerification
);

// ============================================================
// HANDOVER
// ============================================================

router.post(
  "/trips/:tripId/handover",
  requireLoader,
  postHandover
);

router.patch(
  "/testing/issues/:issueId/resolve",
  requireLoader,
  patchIssueResolution
);

export default router;