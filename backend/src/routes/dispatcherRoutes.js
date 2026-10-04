import { Router } from "express";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  getDashboard,
  getDeliveryReports,
  getLiveMonitoring,
  getLiveMonitoringTrip,
} from "../controllers/dispatcherMonitoringController.js";

import {
  deferPlanningOrder,
  getPlanningSnapshot,
  publishPlanningTrip,
} from "../controllers/dispatcherPlanningController.js";

import {
  getDispatcherStoreOrder,
  getDispatcherStoreOrders,
  postDispatcherConfirmOrder,
  postDispatcherDeferOrder,
} from "../controllers/dispatcherOrderController.js";

const router = Router();

const dispatcherAccess = [
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles("DISPATCHER", "ADMIN"),
];

router.get("/dashboard", ...dispatcherAccess, getDashboard);

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


// ============================================================
// STORE MANAGER ORDER HANDOFF / DISPATCHER DECISIONS
// ============================================================

router.get(
  "/orders",
  ...dispatcherAccess,
  getDispatcherStoreOrders
);

router.get(
  "/orders/:orderCode",
  ...dispatcherAccess,
  getDispatcherStoreOrder
);

router.post(
  "/orders/:orderCode/confirm",
  ...dispatcherAccess,
  postDispatcherConfirmOrder
);

router.post(
  "/orders/:orderCode/defer",
  ...dispatcherAccess,
  postDispatcherDeferOrder
);

export default router;
