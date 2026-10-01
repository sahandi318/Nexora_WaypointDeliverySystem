import {
  Router,
} from "express";

import {
  getCurrentUser,
  login,
} from "../controllers/authController.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";


const router =
  Router();


// ============================================================
// PUBLIC AUTHENTICATION ROUTES
// ============================================================

router.post(
  "/login",
  login
);


// ============================================================
// PROTECTED AUTHENTICATION ROUTES
// ============================================================

router.get(
  "/me",
  authenticateToken,
  getCurrentUser
);


export default router;