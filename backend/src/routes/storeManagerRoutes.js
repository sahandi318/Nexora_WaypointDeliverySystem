import {
  Router,
} from "express";

import {
  getStoreManagerContext,
} from "../controllers/storeManagerController.js";

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
 * Future Store Manager routes should be added below this
 * security pipeline.
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


export default router;