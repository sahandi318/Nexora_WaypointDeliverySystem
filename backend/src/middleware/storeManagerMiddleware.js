// ============================================================
// Nexora Waypoint Delivery System
// Store Manager Outlet Isolation Middleware
// ============================================================


// ============================================================
// CONSTANTS
// ============================================================

const STORE_MANAGER_ROLE =
  "STORE_MANAGER";


// ============================================================
// STORE MANAGER CONTEXT
// ============================================================

/**
 * Builds a trusted Store Manager context from req.user.
 *
 * IMPORTANT:
 *
 * req.user must already have been loaded from the database by:
 *
 *   authenticateToken
 *
 * and role authorization should normally happen through:
 *
 *   requireStoreManager
 *
 *
 * The outlet is NEVER taken from:
 *
 * - req.query
 * - req.body
 * - req.params
 * - localStorage
 * - sessionStorage
 *
 * Only the authenticated database user's outlet assignment
 * is trusted.
 */
export function requireStoreManagerOutlet(
  req,
  res,
  next
) {
  // ----------------------------------------------------------
  // AUTHENTICATION CHECK
  // ----------------------------------------------------------

  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,

        code:
          "AUTHENTICATION_REQUIRED",

        message:
          "Authentication required.",
      });
  }


  // ----------------------------------------------------------
  // ROLE CHECK
  // ----------------------------------------------------------

  if (
    req.user.role !==
    STORE_MANAGER_ROLE
  ) {
    return res
      .status(403)
      .json({
        success: false,

        code:
          "ACCESS_DENIED",

        message:
          "Store Manager access is required.",
      });
  }


  // ----------------------------------------------------------
  // OUTLET ASSIGNMENT CHECK
  // ----------------------------------------------------------

  if (
    !req.user.outletId ||
    !req.user.outlet
  ) {
    return res
      .status(403)
      .json({
        success: false,

        code:
          "STORE_MANAGER_OUTLET_REQUIRED",

        message:
          "No outlet is assigned to this Store Manager account.",
      });
  }


  // ----------------------------------------------------------
  // OUTLET STATUS CHECK
  // ----------------------------------------------------------

  if (
    !req.user.outlet.isActive
  ) {
    return res
      .status(403)
      .json({
        success: false,

        code:
          "OUTLET_INACTIVE",

        message:
          "The assigned outlet is inactive.",
      });
  }


  // ----------------------------------------------------------
  // TRUSTED CONTEXT
  // ----------------------------------------------------------

  const outlet =
    req.user.outlet;

  const depot =
    outlet.depot ?? null;


  req.storeManagerContext = {
    // Authenticated user identity
    userDatabaseId:
      req.user.id,

    userId:
      req.user.userId,

    fullName:
      req.user.fullName,

    email:
      req.user.email,

    role:
      req.user.role,


    // Trusted outlet identity
    outletDatabaseId:
      outlet.id,

    outletCode:
      outlet.outletCode,

    brand:
      outlet.brand,

    district:
      outlet.district,

    dockType:
      outlet.dockType,

    parkingConstraint:
      outlet.parkingConstraint,

    mallWindow:
      outlet.mallWindow,

    windowOpenTime:
      outlet.windowOpenTime,

    windowCloseTime:
      outlet.windowCloseTime,

    outletIsActive:
      outlet.isActive,


    // Trusted depot identity
    depot:
      depot
        ? {
            id:
              depot.id,

            code:
              depot.code,

            name:
              depot.name,

            district:
              depot.district,

            isActive:
              depot.isActive,
          }
        : null,
  };


  return next();
}