import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

import {
  createAccessToken,
} from "../utils/jwt.js";


// ============================================================
// USER QUERY
// ============================================================

const authenticationUserInclude = {
  outlet: {
    include: {
      depot: true,
    },
  },

  depot: true,
};


// ============================================================
// SAFE USER RESPONSE
// ============================================================

/**
 * Convert a Prisma User object into data that is safe to send
 * to the frontend.
 *
 * passwordHash is intentionally never returned.
 */
export function serializeAuthenticatedUser(
  user
) {
  return {
    id:
      user.id,

    userId:
      user.userId,

    fullName:
      user.fullName,

    email:
      user.email,

    phone:
      user.phone,

    role:
      user.role,

    isActive:
      user.isActive,

    outlet:
      user.outlet
        ? {
            id:
              user.outlet.id,

            outletCode:
              user.outlet.outletCode,

            brand:
              user.outlet.brand,

            district:
              user.outlet.district,

            dockType:
              user.outlet.dockType,

            parkingConstraint:
              user.outlet
                .parkingConstraint,

            mallWindow:
              user.outlet.mallWindow,

            windowOpenTime:
              user.outlet
                .windowOpenTime,

            windowCloseTime:
              user.outlet
                .windowCloseTime,

            depot:
              user.outlet.depot
                ? {
                    id:
                      user.outlet
                        .depot.id,

                    code:
                      user.outlet
                        .depot.code,

                    name:
                      user.outlet
                        .depot.name,
                  }
                : null,
          }
        : null,

    depot:
      user.depot
        ? {
            id:
              user.depot.id,

            code:
              user.depot.code,

            name:
              user.depot.name,

            district:
              user.depot.district,
          }
        : null,
  };
}


// ============================================================
// LOGIN
// ============================================================

export async function authenticateUser({
  userId,
  password,
}) {
  const normalizedUserId =
    userId
      .trim()
      .toUpperCase();


  const user =
    await prisma.user.findUnique({
      where: {
        userId:
          normalizedUserId,
      },

      include:
        authenticationUserInclude,
    });


  /**
   * Do not reveal whether the User ID exists.
   *
   * The same authentication failure is returned for:
   *
   * - unknown User ID
   * - incorrect password
   */
  if (!user) {
    return {
      success: false,
      reason: "INVALID_CREDENTIALS",
    };
  }


  const passwordMatches =
    await bcrypt.compare(
      password,
      user.passwordHash
    );


  if (!passwordMatches) {
    return {
      success: false,
      reason: "INVALID_CREDENTIALS",
    };
  }


  if (!user.isActive) {
    return {
      success: false,
      reason: "ACCOUNT_INACTIVE",
    };
  }


  // ----------------------------------------------------------
  // Successful login
  // ----------------------------------------------------------

  const updatedUser =
    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        lastLoginAt:
          new Date(),
      },

      include:
        authenticationUserInclude,
    });


  const token =
    createAccessToken(
      updatedUser
    );


  return {
    success: true,

    token,

    user:
      serializeAuthenticatedUser(
        updatedUser
      ),
  };
}


// ============================================================
// CURRENT USER
// ============================================================

export async function getAuthenticatedUserById(
  userId
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },

      include:
        authenticationUserInclude,
    });


  return user;
}