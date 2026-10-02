import {
  Router,
} from "express";

import {
  getAdminAccessCheck,
  getAdminAccounts,
  getAdminDepots,
  getAdminOutlets,
  getAdminProfile,
  registerAdmin,
  registerDispatcher,
  registerDriver,
  registerLoader,
  registerStoreManager,
  updateAdminProfile,
} from "../controllers/adminController.js";

import {
  authenticateToken,
  authorizeRoles,
  requirePasswordChangeCompleted,
} from "../middleware/authMiddleware.js";


const router =
  Router();


// ============================================================
// PUBLIC ADMIN REGISTRATION
// ============================================================
//
// The administrator role is never selected by the frontend.
// The backend creates ADMIN only after validating the secret
// key supplied by the registrant against ADMIN_REGISTRATION_SECRET.
// ============================================================

router.post(
  "/register",
  registerAdmin
);


// ============================================================
// ADMIN SECURITY CHAIN
// ============================================================

router.use(
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles(
    "ADMIN"
  )
);


// ============================================================
// PROTECTED ADMIN ROUTES
// ============================================================

router.get(
  "/access-check",
  getAdminAccessCheck
);


router.get(
  "/accounts",
  getAdminAccounts
);


router.get(
  "/profile",
  getAdminProfile
);


router.patch(
  "/profile",
  updateAdminProfile
);


// ============================================================
// REGISTRATION ASSIGNMENT OPTIONS
// ============================================================

router.get(
  "/outlets",
  getAdminOutlets
);


router.get(
  "/depots",
  getAdminDepots
);


// ============================================================
// STAFF REGISTRATION
// ============================================================

router.post(
  "/staff/store-managers",
  registerStoreManager
);


router.post(
  "/staff/dispatchers",
  registerDispatcher
);


router.post(
  "/staff/loaders",
  registerLoader
);


router.post(
  "/staff/drivers",
  registerDriver
);


export default router;
