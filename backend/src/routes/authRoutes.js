import {
  Router,
} from "express";

import {
  changePassword,
  getCurrentUser,
  login,
} from "../controllers/authController.js";

import {
  forgotPassword,
} from "../controllers/passwordResetController.js";

import {
  authenticateToken,
} from "../middleware/authMiddleware.js";


const router =
  Router();


// ============================================================
// PUBLIC AUTH ROUTES
// ============================================================

router.post(
  "/login",
  login
);


router.post(
  "/forgot-password",
  forgotPassword
);


// ============================================================
// AUTHENTICATED AUTH ROUTES
// ============================================================

router.get(
  "/me",
  authenticateToken,
  getCurrentUser
);


router.post(
  "/change-password",
  authenticateToken,
  changePassword
);


export default router;