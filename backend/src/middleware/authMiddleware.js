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
 * Add this middleware to operational routes.
 *
 * Users with temporary passwords remain authenticated,
 * but cannot access normal application functionality until
 * their required password change is completed.
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