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
  postReceiptDiscrepancyDecision,
} from "../controllers/dispatcherMonitoringController.js";

import {
  decideLoadingException,
  deferPlanningOrder,
  getCapacitySnapshot,
  getLoadingExceptions,
  getLoadingOverview,
  getPlanningSnapshot,
  publishPlanningTrip,
  savePlanningDraft,
} from "../controllers/dispatcherPlanningController.js";
import { getDispatcherDashboard } from "../controllers/dispatcherMonitoringController.js";

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

router.get(
  "/dashboard",
  ...dispatcherAccess,
  getDispatcherDashboard
);

router.get(
  "/planning",
  ...dispatcherAccess,
  getPlanningSnapshot
);

router.post(
  "/planning/draft",
  ...dispatcherAccess,
  savePlanningDraft
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
  "/loading",
  ...dispatcherAccess,
  getLoadingOverview
);

router.get(
  "/loading/exceptions",
  ...dispatcherAccess,
  getLoadingExceptions
);

router.get(
  "/capacity",
  ...dispatcherAccess,
  getCapacitySnapshot
);

router.post(
  "/loading/exceptions/:id/decision",
  ...dispatcherAccess,
  decideLoadingException
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

router.post(
  "/delivery-reports/discrepancies/:tripCode/:stopCode/decision",
  ...dispatcherAccess,
  postReceiptDiscrepancyDecision
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
