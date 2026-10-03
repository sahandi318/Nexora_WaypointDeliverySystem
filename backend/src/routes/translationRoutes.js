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
// AUTHENTICATION
// ============================================================

/**
 * Translation is available to authenticated application users.
 * This protects the local model from anonymous heavy requests.
 */
router.use(
  authenticateToken
);


router.use(
  requirePasswordChangeCompleted
);


// ============================================================
// ROUTES
// ============================================================

router.get(
  "/languages",
  getTranslationLanguages
);


router.get(
  "/status",
  getTranslationStatus
);


router.post(
  "/",
  translateTexts
);


export default router;
