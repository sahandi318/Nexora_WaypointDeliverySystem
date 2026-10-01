import {
  getAuthenticatedUserById,
} from "../services/authService.js";

import {
  verifyAccessToken,
} from "../utils/jwt.js";


// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

/**
 * Expected request header:
 *
 * Authorization: Bearer <JWT>
 */
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
      return res.status(401).json({
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
      return res.status(401).json({
        success: false,

        message:
          "Authentication required.",
      });
    }


    // --------------------------------------------------------
    // Verify JWT
    // --------------------------------------------------------

    let decodedToken;


    try {
      decodedToken =
        verifyAccessToken(
          token
        );
    } catch {
      return res.status(401).json({
        success: false,

        message:
          "Invalid or expired authentication token.",
      });
    }


    const numericUserId =
      Number(decodedToken.sub);


    if (
      !Number.isInteger(
        numericUserId
      ) ||
      numericUserId <= 0
    ) {
      return res.status(401).json({
        success: false,

        message:
          "Invalid authentication token.",
      });
    }


    // --------------------------------------------------------
    // Load current user from database
    // --------------------------------------------------------

    const user =
      await getAuthenticatedUserById(
        numericUserId
      );


    if (!user) {
      return res.status(401).json({
        success: false,

        message:
          "Authenticated user no longer exists.",
      });
    }


    if (!user.isActive) {
      return res.status(403).json({
        success: false,

        message:
          "This account is inactive.",
      });
    }


    /**
     * Attach the current database user to the request.
     *
     * Future authorization middleware will use:
     *
     * req.user.role
     * req.user.outletId
     * req.user.depotId
     */
    req.user =
      user;


    return next();
  } catch (error) {
    return next(error);
  }
}