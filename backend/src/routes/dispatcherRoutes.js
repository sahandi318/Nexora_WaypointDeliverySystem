import { Router } from "express";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  getDeliveryReports,
  getLiveMonitoring,
  getLiveMonitoringTrip,
} from "../controllers/dispatcherMonitoringController.js";

import {
  deferPlanningOrder,
  getPlanningSnapshot,
  publishPlanningTrip,
} from "../controllers/dispatcherPlanningController.js";

const router = Router();

const dispatcherAccess = [
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles("DISPATCHER", "ADMIN"),
];


router.get(
  "/planning",
  ...dispatcherAccess,
  getPlanningSnapshot
);

router.post(
  "/planning/defer",
  ...dispatcherAccess,
  deferPlanningOrder
);

router.post(
  "/planning/publish",
  ...dispatcherAccess,
  publishPlanningTrip
);

router.get(
  "/live-monitoring",
  ...dispatcherAccess,
  getLiveMonitoring
);

router.get(
  "/delivery-reports",
  ...dispatcherAccess,
  getDeliveryReports
);

router.get(
  "/live-monitoring/:tripCode",
  ...dispatcherAccess,
  getLiveMonitoringTrip
);

export default router;
