import {
  getAuthenticatedUserById,
} from "../services/authService.js";

import {
  verifyAccessToken,
} from "../utils/jwt.js";


// ============================================================
// JWT AUTHENTICATION
// ============================================================

export async function authenticateToken(
  req,
  res,
  next
) {
  try {
    const authorizationHeader =
      req.headers.authorization;


    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Authentication required.",
        });
    }


    const token =
      authorizationHeader
        .slice(7)
        .trim();


    if (!token) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Authentication required.",
        });
    }


    let decodedToken;


    try {
      decodedToken =
        verifyAccessToken(
          token
        );
    } catch {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid or expired authentication token.",
        });
    }


    const numericUserId =
      Number(
        decodedToken.sub
      );


    if (
      !Number.isInteger(
        numericUserId
      ) ||
      numericUserId <= 0
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid authentication token.",
        });
    }


    const user =
      await getAuthenticatedUserById(
        numericUserId
      );


    if (!user) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Authenticated user no longer exists.",
        });
    }


    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "This account is inactive.",
        });
    }


    req.user =
      user;


    return next();
  } catch (error) {
    return next(error);
  }
}


// ============================================================
// PASSWORD-CHANGE REQUIREMENT
// ============================================================

/**
 * Users with temporary passwords remain authenticated,
 * but cannot access protected application functionality
 * until their required password change is completed.
 */
export function requirePasswordChangeCompleted(
  req,
  res,
  next
) {
  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Authentication required.",
      });
  }


  if (
    req.user.mustChangePassword
  ) {
    return res
      .status(403)
      .json({
        success: false,

        code:
          "PASSWORD_CHANGE_REQUIRED",

        message:
          "You must change your temporary password before accessing this resource.",
      });
  }


  return next();
}


// ============================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================

/**
 * Restricts a protected route to one or more user roles.
 *
 * Example:
 *
 * authorizeRoles("ADMIN")
 *
 * authorizeRoles(
 *   "ADMIN",
 *   "DISPATCHER"
 * )
 *
 * This middleware must be used after authenticateToken.
 */
export function authorizeRoles(
  ...allowedRoles
) {
  return (
    req,
    res,
    next
  ) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Authentication required.",
        });
    }


    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "You do not have permission to access this resource.",
        });
    }


    return next();
  };
}