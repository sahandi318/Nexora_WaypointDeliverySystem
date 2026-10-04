import { Router } from "express";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  getLiveMonitoring,
  getLiveMonitoringTrip,
} from "../controllers/dispatcherMonitoringController.js";

const router = Router();

const dispatcherAccess = [
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles("DISPATCHER", "ADMIN"),
];

router.get(
  "/live-monitoring",
  ...dispatcherAccess,
  getLiveMonitoring
);

router.get(
  "/live-monitoring/:tripCode",
  ...dispatcherAccess,
  getLiveMonitoringTrip
);

export default router;
