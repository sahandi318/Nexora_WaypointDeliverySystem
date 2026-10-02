// ============================================================
// Nexora Waypoint Delivery System
// Role-Based Access Control Middleware
// ============================================================


// ============================================================
// SUPPORTED APPLICATION ROLES
// ============================================================

export const USER_ROLES = Object.freeze({
  ADMIN:
    "ADMIN",

  STORE_MANAGER:
    "STORE_MANAGER",

  DISPATCHER:
    "DISPATCHER",

  LOADER:
    "LOADER",

  DRIVER:
    "DRIVER",
});


const VALID_ROLES =
  new Set(
    Object.values(
      USER_ROLES
    )
  );


// ============================================================
// ROLE VALIDATION
// ============================================================

function validateRequiredRoles(
  requiredRoles
) {
  if (
    !Array.isArray(
      requiredRoles
    ) ||
    requiredRoles.length === 0
  ) {
    throw new Error(
      "At least one authorized role must be supplied."
    );
  }


  for (
    const role
    of requiredRoles
  ) {
    if (
      !VALID_ROLES.has(
        role
      )
    ) {
      throw new Error(
        `Unsupported role supplied to RBAC middleware: ${role}`
      );
    }
  }
}


// ============================================================
// REQUIRE ROLE
// ============================================================

/**
 * Restricts a route to one or more authorized roles.
 *
 * IMPORTANT:
 *
 * req.user must already have been populated by
 * authenticateToken.
 *
 * Correct route order:
 *
 * router.get(
 *   "/example",
 *   authenticateToken,
 *   requireRoles("STORE_MANAGER"),
 *   controller
 * );
 *
 * Never trust a role provided by:
 *
 * - req.body
 * - req.query
 * - req.params
 * - frontend localStorage/sessionStorage
 *
 * The role used here comes only from the authenticated
 * database user attached to req.user.
 */
export function requireRoles(
  ...requiredRoles
) {
  validateRequiredRoles(
    requiredRoles
  );


  return function roleMiddleware(
    req,
    res,
    next
  ) {
    // --------------------------------------------------------
    // Authentication middleware must run first
    // --------------------------------------------------------

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


    const authenticatedRole =
      req.user.role;


    if (
      !authenticatedRole ||
      !VALID_ROLES.has(
        authenticatedRole
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,

          code:
            "ACCESS_DENIED",

          message:
            "You do not have permission to access this resource.",
        });
    }


    // --------------------------------------------------------
    // Role authorization
    // --------------------------------------------------------

    if (
      !requiredRoles.includes(
        authenticatedRole
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,

          code:
            "ACCESS_DENIED",

          message:
            "You do not have permission to access this resource.",
        });
    }


    return next();
  };
}


// ============================================================
// COMMON ROLE MIDDLEWARE
// ============================================================

export const requireAdmin =
  requireRoles(
    USER_ROLES.ADMIN
  );


export const requireStoreManager =
  requireRoles(
    USER_ROLES.STORE_MANAGER
  );


export const requireDispatcher =
  requireRoles(
    USER_ROLES.DISPATCHER
  );


export const requireLoader =
  requireRoles(
    USER_ROLES.LOADER
  );


export const requireDriver =
  requireRoles(
    USER_ROLES.DRIVER
  );