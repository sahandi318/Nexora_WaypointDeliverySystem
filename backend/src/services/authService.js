import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

import {
  createAccessToken,
} from "../utils/jwt.js";


const PASSWORD_HASH_ROUNDS =
  12;


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

    profilePhotoData:
      user.profilePhotoData ||
      null,

    role:
      user.role,

    isActive:
      user.isActive,

    mustChangePassword:
      user.mustChangePassword,

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
// FIND USER BY USER ID OR EMAIL
// ============================================================

async function findUserByIdentifier(
  identifier
) {
  const cleanedIdentifier =
    identifier.trim();


  /**
   * Email addresses are normalized to lowercase.
   * User IDs are normalized to uppercase.
   */
  if (
    cleanedIdentifier.includes(
      "@"
    )
  ) {
    return prisma.user.findUnique({
      where: {
        email:
          cleanedIdentifier
            .toLowerCase(),
      },

      include:
        authenticationUserInclude,
    });
  }


  return prisma.user.findUnique({
    where: {
      userId:
        cleanedIdentifier
          .toUpperCase(),
    },

    include:
      authenticationUserInclude,
  });
}


// ============================================================
// PASSWORD POLICY
// ============================================================

export function validatePasswordPolicy(
  password
) {
  if (
    typeof password !== "string" ||
    password.length < 10
  ) {
    return {
      valid: false,

      message:
        "Password must contain at least 10 characters.",
    };
  }


  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,

      message:
        "Password must contain at least one uppercase letter.",
    };
  }


  if (!/[a-z]/.test(password)) {
    return {
      valid: false,

      message:
        "Password must contain at least one lowercase letter.",
    };
  }


  if (!/[0-9]/.test(password)) {
    return {
      valid: false,

      message:
        "Password must contain at least one number.",
    };
  }


  if (
    !/[^A-Za-z0-9]/.test(
      password
    )
  ) {
    return {
      valid: false,

      message:
        "Password must contain at least one special character.",
    };
  }


  return {
    valid: true,
  };
}


// ============================================================
// LOGIN
// ============================================================

export async function authenticateUser({
  identifier,
  password,
}) {
  const user =
    await findUserByIdentifier(
      identifier
    );


  if (!user) {
    return {
      success: false,

      reason:
        "INVALID_CREDENTIALS",
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

      reason:
        "INVALID_CREDENTIALS",
    };
  }


  if (!user.isActive) {
    return {
      success: false,

      reason:
        "ACCOUNT_INACTIVE",
    };
  }


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
// CURRENT AUTHENTICATED USER
// ============================================================

export async function getAuthenticatedUserById(
  userDatabaseId
) {
  return prisma.user.findUnique({
    where: {
      id:
        userDatabaseId,
    },

    include:
      authenticationUserInclude,
  });
}


// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changeAuthenticatedUserPassword({
  userDatabaseId,
  currentPassword,
  newPassword,
}) {
  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userDatabaseId,
      },

      include:
        authenticationUserInclude,
    });


  if (!user) {
    return {
      success: false,

      reason:
        "USER_NOT_FOUND",
    };
  }


  if (!user.isActive) {
    return {
      success: false,

      reason:
        "ACCOUNT_INACTIVE",
    };
  }


  // ----------------------------------------------------------
  // Verify current password
  // ----------------------------------------------------------

  const currentPasswordMatches =
    await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );


  if (!currentPasswordMatches) {
    return {
      success: false,

      reason:
        "CURRENT_PASSWORD_INCORRECT",
    };
  }


  // ----------------------------------------------------------
  // Prevent password reuse
  // ----------------------------------------------------------

  const sameAsCurrentPassword =
    await bcrypt.compare(
      newPassword,
      user.passwordHash
    );


  if (sameAsCurrentPassword) {
    return {
      success: false,

      reason:
        "PASSWORD_REUSE",
    };
  }


  // ----------------------------------------------------------
  // Validate new password
  // ----------------------------------------------------------

  const passwordPolicy =
    validatePasswordPolicy(
      newPassword
    );


  if (!passwordPolicy.valid) {
    return {
      success: false,

      reason:
        "WEAK_PASSWORD",

      message:
        passwordPolicy.message,
    };
  }


  // ----------------------------------------------------------
  // Hash and store new password
  // ----------------------------------------------------------

  const newPasswordHash =
    await bcrypt.hash(
      newPassword,
      PASSWORD_HASH_ROUNDS
    );


  const updatedUser =
    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        passwordHash:
          newPasswordHash,

        mustChangePassword:
          false,
      },

      include:
        authenticationUserInclude,
    });


  return {
    success: true,

    user:
      serializeAuthenticatedUser(
        updatedUser
      ),
  };
}