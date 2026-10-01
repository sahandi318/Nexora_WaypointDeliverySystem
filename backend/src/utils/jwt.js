import jwt from "jsonwebtoken";


// ============================================================
// JWT CONFIGURATION
// ============================================================

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from the backend environment."
    );
  }

  return secret;
}


function getJwtExpiration() {
  return (
    process.env.JWT_EXPIRES_IN ||
    "8h"
  );
}


// ============================================================
// TOKEN CREATION
// ============================================================

/**
 * Create an authentication token.
 *
 * The token contains only identity/role information.
 *
 * Outlet and depot assignments are loaded from the database
 * again on protected requests so authorization always uses
 * current database values rather than stale token data.
 */
export function createAccessToken(
  user
) {
  return jwt.sign(
    {
      userId:
        user.userId,

      role:
        user.role,
    },

    getJwtSecret(),

    {
      subject:
        String(user.id),

      expiresIn:
        getJwtExpiration(),
    }
  );
}


// ============================================================
// TOKEN VERIFICATION
// ============================================================

export function verifyAccessToken(
  token
) {
  return jwt.verify(
    token,
    getJwtSecret()
  );
}