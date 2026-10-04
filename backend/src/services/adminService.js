import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import bcrypt from "bcryptjs";

import prisma from "../config/database.js";

import {
  validatePasswordPolicy,
} from "./authService.js";


const PASSWORD_HASH_ROUNDS =
  12;

const STAFF_ROLE_VALUES = Object.freeze([
  "STORE_MANAGER",
  "DISPATCHER",
  "LOADER",
  "DRIVER",
]);

const STAFF_ROLES = new Set(
  STAFF_ROLE_VALUES
);

const STATUS_FILTERS = new Set([
  "ALL",
  "ACTIVE",
  "INACTIVE",
]);

const ASSIGNMENT_FILTERS = new Set([
  "ALL",
  "OUTLET",
  "DEPOT",
  "UNASSIGNED",
]);

const PASSWORD_FILTERS = new Set([
  "ALL",
  "CHANGE_REQUIRED",
  "READY",
]);


const USER_ID_PREFIX_BY_ROLE =
  Object.freeze({
    ADMIN:
      "ADMIN",

    STORE_MANAGER:
      "SM",

    DISPATCHER:
      "DSP",

    LOADER:
      "LD",

    DRIVER:
      "DR",
  });


// ============================================================
// SHARED HELPERS
// ============================================================

function normalizeUserId(
  value
) {
  return value
    .trim()
    .toUpperCase();
}


function userIdMatchesRole(
  userId,
  role
) {
  const prefix =
    USER_ID_PREFIX_BY_ROLE[
      role
    ];


  if (!prefix) {
    return false;
  }


  return new RegExp(
    `^${prefix}\\d+$`
  ).test(
    userId
  );
}


function normalizeEmail(
  value
) {
  return value
    .trim()
    .toLowerCase();
}


function createSecretDigest(
  value
) {
  return createHash(
    "sha256"
  )
    .update(
      String(value)
    )
    .digest();
}


function adminRegistrationSecretMatches(
  suppliedSecret
) {
  const configuredSecret =
    process.env
      .ADMIN_REGISTRATION_SECRET;


  if (!configuredSecret) {
    throw new Error(
      "ADMIN_REGISTRATION_SECRET is missing."
    );
  }


  const suppliedDigest =
    createSecretDigest(
      suppliedSecret
    );

  const configuredDigest =
    createSecretDigest(
      configuredSecret
    );


  return timingSafeEqual(
    suppliedDigest,
    configuredDigest
  );
}


function serializeAccount(
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

    createdAt:
      user.createdAt,

    lastLoginAt:
      user.lastLoginAt,

    outlet:
      user.outlet
        ? {
            id:
              user.outlet.id,

            outletCode:
              user.outlet.outletCode,

            brand:
              user.outlet.brand,
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
          }
        : null,
  };
}


// ============================================================
// ADMIN REGISTRATION
// ============================================================

export async function registerAdministrator({
  userId,
  fullName,
  email,
  phone,
  password,
  adminSecretKey,
}) {
  if (
    !adminRegistrationSecretMatches(
      adminSecretKey
    )
  ) {
    return {
      success: false,

      reason:
        "INVALID_ADMIN_SECRET",
    };
  }


  const normalizedUserId =
    normalizeUserId(
      userId
    );


  if (
    !userIdMatchesRole(
      normalizedUserId,
      "ADMIN"
    )
  ) {
    return {
      success: false,

      reason:
        "INVALID_USER_ID_FORMAT",
    };
  }


  const normalizedEmail =
    normalizeEmail(
      email
    );

  const passwordPolicy =
    validatePasswordPolicy(
      password
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


  const [
    existingUserId,
    existingEmail,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        userId:
          normalizedUserId,
      },
    }),

    prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },
    }),
  ]);


  if (existingUserId) {
    return {
      success: false,

      reason:
        "USER_ID_EXISTS",
    };
  }


  if (existingEmail) {
    return {
      success: false,

      reason:
        "EMAIL_EXISTS",
    };
  }


  const passwordHash =
    await bcrypt.hash(
      password,
      PASSWORD_HASH_ROUNDS
    );


  const admin =
    await prisma.user.create({
      data: {
        userId:
          normalizedUserId,

        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        phone:
          phone?.trim() ||
          null,

        passwordHash,

        role:
          "ADMIN",

        outletId:
          null,

        depotId:
          null,

        isActive:
          true,

        mustChangePassword:
          false,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  return {
    success: true,

    admin:
      serializeAccount(
        admin
      ),
  };
}


// ============================================================
// ADMIN PROFILE
// ============================================================

export async function getAdministratorProfile(
  userDatabaseId
) {
  const admin =
    await prisma.user.findUnique({
      where: {
        id:
          userDatabaseId,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  if (!admin) {
    return null;
  }


  return serializeAccount(
    admin
  );
}


// ============================================================
// UPDATE ADMIN PROFILE
// ============================================================

export async function updateAdministratorProfile({
  userDatabaseId,
  fullName,
  email,
  phone,
}) {
  const normalizedEmail =
    normalizeEmail(
      email
    );


  const existingAdmin =
    await prisma.user.findUnique({
      where: {
        id:
          userDatabaseId,
      },
    });


  if (!existingAdmin) {
    return {
      success: false,

      reason:
        "USER_NOT_FOUND",
    };
  }


  const emailOwner =
    await prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },
    });


  if (
    emailOwner &&
    emailOwner.id !==
      userDatabaseId
  ) {
    return {
      success: false,

      reason:
        "EMAIL_EXISTS",
    };
  }


  const updatedAdmin =
    await prisma.user.update({
      where: {
        id:
          userDatabaseId,
      },

      data: {
        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        phone:
          phone?.trim() ||
          null,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  return {
    success: true,

    profile:
      serializeAccount(
        updatedAdmin
      ),
  };
}


// ============================================================
// UPDATE ADMIN PROFILE PHOTO
// ============================================================

export async function updateAdministratorProfilePhoto({
  userDatabaseId,
  profilePhotoData,
}) {
  const existingAdmin =
    await prisma.user.findUnique({
      where: {
        id:
          userDatabaseId,
      },
    });


  if (!existingAdmin) {
    return {
      success: false,

      reason:
        "USER_NOT_FOUND",
    };
  }


  const updatedAdmin =
    await prisma.user.update({
      where: {
        id:
          userDatabaseId,
      },

      data: {
        profilePhotoData:
          profilePhotoData ||
          null,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  return {
    success: true,

    profile:
      serializeAccount(
        updatedAdmin
      ),
  };
}


// ============================================================
// ACCOUNT DIRECTORY
// ============================================================

export async function getAccountDirectory({
  search = "",
  role = "ALL",
  status = "ALL",
  assignment = "ALL",
  passwordStatus = "ALL",
  page = 1,
  limit = 8,
}) {
  const normalizedRole =
    String(role)
      .trim()
      .toUpperCase();

  const normalizedStatus =
    String(status)
      .trim()
      .toUpperCase();

  const normalizedAssignment =
    String(assignment)
      .trim()
      .toUpperCase();

  const normalizedPasswordStatus =
    String(passwordStatus)
      .trim()
      .toUpperCase();

  const safeRole =
    normalizedRole ===
      "ALL" ||
    STAFF_ROLES.has(
      normalizedRole
    )
      ? normalizedRole
      : "ALL";

  const safeStatus =
    STATUS_FILTERS.has(
      normalizedStatus
    )
      ? normalizedStatus
      : "ALL";

  const safeAssignment =
    ASSIGNMENT_FILTERS.has(
      normalizedAssignment
    )
      ? normalizedAssignment
      : "ALL";

  const safePasswordStatus =
    PASSWORD_FILTERS.has(
      normalizedPasswordStatus
    )
      ? normalizedPasswordStatus
      : "ALL";

  const safePage =
    Number.isInteger(
      Number(page)
    ) &&
    Number(page) > 0
      ? Number(page)
      : 1;

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) ||
        8,
        1
      ),
      50
    );

  const cleanedSearch =
    String(search)
      .trim();

  const andConditions = [
    {
      role: {
        in: STAFF_ROLE_VALUES,
      },
    },
  ];


  if (cleanedSearch) {
    andConditions.push({
      OR: [
        {
          userId: {
            contains:
              cleanedSearch,
          },
        },
        {
          fullName: {
            contains:
              cleanedSearch,
          },
        },
        {
          email: {
            contains:
              cleanedSearch,
          },
        },
        {
          phone: {
            contains:
              cleanedSearch,
          },
        },
      ],
    });
  }


  if (safeRole !== "ALL") {
    andConditions.push({
      role:
        safeRole,
    });
  }


  if (safeStatus === "ACTIVE") {
    andConditions.push({
      isActive:
        true,
    });
  }


  if (safeStatus === "INACTIVE") {
    andConditions.push({
      isActive:
        false,
    });
  }


  if (safeAssignment === "OUTLET") {
    andConditions.push({
      outletId: {
        not:
          null,
      },
    });
  }


  if (safeAssignment === "DEPOT") {
    andConditions.push({
      depotId: {
        not:
          null,
      },
    });
  }


  if (safeAssignment === "UNASSIGNED") {
    andConditions.push({
      outletId:
        null,

      depotId:
        null,
    });
  }


  if (
    safePasswordStatus ===
    "CHANGE_REQUIRED"
  ) {
    andConditions.push({
      mustChangePassword:
        true,
    });
  }


  if (
    safePasswordStatus ===
    "READY"
  ) {
    andConditions.push({
      mustChangePassword:
        false,
    });
  }


  const where =
    andConditions.length > 0
      ? {
          AND:
            andConditions,
        }
      : {};


  const [
    users,
    filteredCount,
    totalCount,
    activeCount,
    inactiveCount,
    adminCount,
  ] = await Promise.all([
    prisma.user.findMany({
      where,

      orderBy: [
        {
          role:
            "asc",
        },
        {
          fullName:
            "asc",
        },
      ],

      skip:
        (safePage - 1) *
        safeLimit,

      take:
        safeLimit,

      include: {
        outlet:
          true,

        depot:
          true,
      },
    }),

    prisma.user.count({
      where,
    }),

    prisma.user.count({
      where: {
        role: {
          in: STAFF_ROLE_VALUES,
        },
      },
    }),

    prisma.user.count({
      where: {
        role: {
          in: STAFF_ROLE_VALUES,
        },
        isActive:
          true,
      },
    }),

    prisma.user.count({
      where: {
        role: {
          in: STAFF_ROLE_VALUES,
        },
        isActive:
          false,
      },
    }),

    prisma.user.count({
      where: {
        role:
          "ADMIN",
      },
    }),
  ]);


  const totalPages =
    Math.max(
      Math.ceil(
        filteredCount /
        safeLimit
      ),
      1
    );


  return {
    accounts:
      users.map(
        serializeAccount
      ),

    pagination: {
      page:
        safePage,

      limit:
        safeLimit,

      total:
        filteredCount,

      totalPages,
    },

    summary: {
      total:
        totalCount,

      active:
        activeCount,

      inactive:
        inactiveCount,

      admins:
        adminCount,
    },
  };
}


// ============================================================
// REMOVE STAFF ACCOUNT
// ============================================================

export async function deleteStaffAccount({
  userDatabaseId,
}) {
  const existingUser =
    await prisma.user.findUnique({
      where: {
        id:
          userDatabaseId,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  if (!existingUser) {
    return {
      success: false,

      reason:
        "USER_NOT_FOUND",
    };
  }


  if (existingUser.role === "ADMIN") {
    return {
      success: false,

      reason:
        "ADMIN_PROTECTED",
    };
  }


  await prisma.user.delete({
    where: {
      id:
        userDatabaseId,
    },
  });


  return {
    success: true,

    deletedAccount:
      serializeAccount(
        existingUser
      ),
  };
}


// ============================================================
// STAFF REGISTRATION
// ============================================================

export async function registerStaffMember({
  role,
  userId,
  fullName,
  email,
  phone,
  password,
  outletId = null,
  depotId = null,
}) {
  if (
    !STAFF_ROLES.has(
      role
    )
  ) {
    return {
      success: false,

      reason:
        "INVALID_ROLE",
    };
  }


  const normalizedUserId =
    normalizeUserId(
      userId
    );


  if (
    !userIdMatchesRole(
      normalizedUserId,
      role
    )
  ) {
    return {
      success: false,

      reason:
        "INVALID_USER_ID_FORMAT",
    };
  }


  const normalizedEmail =
    normalizeEmail(
      email
    );

  const passwordPolicy =
    validatePasswordPolicy(
      password
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


  const [
    existingUserId,
    existingEmail,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        userId:
          normalizedUserId,
      },
    }),

    prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },
    }),
  ]);


  if (existingUserId) {
    return {
      success: false,

      reason:
        "USER_ID_EXISTS",
    };
  }


  if (existingEmail) {
    return {
      success: false,

      reason:
        "EMAIL_EXISTS",
    };
  }


  let safeOutletId =
    null;

  let safeDepotId =
    null;


  if (
    role ===
    "STORE_MANAGER"
  ) {
    const outlet =
      await prisma.outlet.findUnique({
        where: {
          id:
            Number(outletId),
        },
      });


    if (!outlet) {
      return {
        success: false,

        reason:
          "OUTLET_NOT_FOUND",
      };
    }


    if (!outlet.isActive) {
      return {
        success: false,

        reason:
          "OUTLET_INACTIVE",
      };
    }


    safeOutletId =
      outlet.id;
  } else {
    const depot =
      await prisma.depot.findUnique({
        where: {
          id:
            Number(depotId),
        },
      });


    if (!depot) {
      return {
        success: false,

        reason:
          "DEPOT_NOT_FOUND",
      };
    }


    if (!depot.isActive) {
      return {
        success: false,

        reason:
          "DEPOT_INACTIVE",
      };
    }


    safeDepotId =
      depot.id;
  }


  const passwordHash =
    await bcrypt.hash(
      password,
      PASSWORD_HASH_ROUNDS
    );


  const staffMember =
    await prisma.user.create({
      data: {
        userId:
          normalizedUserId,

        fullName:
          fullName.trim(),

        email:
          normalizedEmail,

        phone:
          phone?.trim() ||
          null,

        passwordHash,

        role,

        outletId:
          safeOutletId,

        depotId:
          safeDepotId,

        isActive:
          true,

        mustChangePassword:
          true,
      },

      include: {
        outlet:
          true,

        depot:
          true,
      },
    });


  return {
    success: true,

    staff:
      serializeAccount(
        staffMember
      ),
  };
}


// ============================================================
// ACTIVE ASSIGNMENT OPTIONS
// ============================================================

export async function getActiveOutlets() {
  return prisma.outlet.findMany({
    where: {
      isActive:
        true,
    },

    orderBy: {
      outletCode:
        "asc",
    },

    select: {
      id:
        true,

      outletCode:
        true,

      brand:
        true,

      district:
        true,

      depot: {
        select: {
          id:
            true,

          code:
            true,

          name:
            true,
        },
      },
    },
  });
}


export async function getActiveDepots() {
  return prisma.depot.findMany({
    where: {
      isActive:
        true,
    },

    orderBy: {
      code:
        "asc",
    },

    select: {
      id:
        true,

      code:
        true,

      name:
        true,

      district:
        true,
    },
  });
}
