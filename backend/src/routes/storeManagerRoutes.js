import {
  Router,
} from "express";

import {
  getStoreManagerContext,
} from "../controllers/storeManagerController.js";

import {
  getStoreManagerDelivery,
  getStoreManagerDeliveries,
  getStoreManagerDeliveryTrackingController,
} from "../controllers/storeManagerDeliveryController.js";

import {
  getStoreManagerCatalog,
  getStoreManagerOrder,
  getStoreManagerOrders,
  getStoreManagerOrderSetupController,
  postStoreManagerOrder,
} from "../controllers/storeManagerOrderController.js";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
} from "../middleware/authMiddleware.js";

import {
  requireStoreManager,
} from "../middleware/roleMiddleware.js";

import {
  requireStoreManagerOutlet,
} from "../middleware/storeManagerMiddleware.js";

const router =
  Router();

// ============================================================
// STORE MANAGER SECURITY PIPELINE
// ============================================================

/**
 * Every route declared below these middleware calls requires:
 *
 * 1. A valid JWT access token
 * 2. A currently active database user
 * 3. Completed mandatory password change
 * 4. STORE_MANAGER role
 * 5. A valid active outlet assignment
 *
 * The authenticated database user's outlet is the only trusted
 * Store Manager outlet context.
 */

router.use(
  authenticateToken
);

router.use(
  requirePasswordChangeCompleted
);

router.use(
  requireStoreManager
);

router.use(
  requireStoreManagerOutlet
);

// ============================================================
// STORE MANAGER CONTEXT
// ============================================================

router.get(
  "/context",
  getStoreManagerContext
);

// ============================================================
// CREATE ORDER SETUP / CUTOFF PREVIEW
// ============================================================

router.get(
  "/order-setup",
  getStoreManagerOrderSetupController
);


// ============================================================
// STORE MANAGER PRODUCT CATALOG
// ============================================================

router.get(
  "/catalog",
  getStoreManagerCatalog
);

// ============================================================
// STORE MANAGER DELIVERIES
// ============================================================

router.get(
  "/deliveries",
  getStoreManagerDeliveries
);

router.get(
  "/deliveries/:orderCode",
  getStoreManagerDelivery
);

router.get(
  "/deliveries/:orderCode/tracking",
  getStoreManagerDeliveryTrackingController
);

// ============================================================
// STORE MANAGER ORDERS
// ============================================================

router.get(
  "/orders",
  getStoreManagerOrders
);

router.get(
  "/orders/:orderCode",
  getStoreManagerOrder
);

router.post(
  "/orders",
  postStoreManagerOrder
);

export default router;
