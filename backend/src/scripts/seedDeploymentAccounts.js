import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  validatePasswordPolicy,
} from "../services/authService.js";


const PASSWORD_HASH_ROUNDS = 12;


// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

function getEnvironmentValue(
  key,
  {
    defaultValue = null,
    required = false,
  } = {}
) {
  const rawValue = process.env[key];

  if (
    rawValue === undefined ||
    rawValue === null ||
    String(rawValue).trim() === ""
  ) {
    if (required && defaultValue === null) {
      throw new Error(`${key} is required.`);
    }

    return defaultValue;
  }

  return String(rawValue).trim();
}


function getBooleanEnvironmentValue(
  key,
  defaultValue = false
) {
  const value = process.env[key];

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return defaultValue;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(
    `${key} must be true/false, 1/0, yes/no, or on/off.`
  );
}


function normalizeEmail(value, key) {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new Error(`${key} is not a valid email address.`);
  }

  return email;
}


function validateSeedPassword(password, key) {
  const policy = validatePasswordPolicy(password);

  if (!policy.valid) {
    throw new Error(`${key} is invalid: ${policy.message}`);
  }

  return password;
}


function normalizeUserId(value, key) {
  const userId = String(value || "")
    .trim()
    .toUpperCase();

  if (!userId) {
    throw new Error(`${key} is required.`);
  }

  return userId;
}


function normalizeCode(value, key) {
  const code = String(value || "")
    .trim()
    .toUpperCase();

  if (!code) {
    throw new Error(`${key} is required.`);
  }

  return code;
}


function getOptionalPhone(key) {
  const phone = process.env[key]?.trim();
  return phone || null;
}


// ============================================================
// SEED CONFIGURATION
// ============================================================

function getSeedConfiguration() {
  return [
    {
      key: "ADMIN",
      role: "ADMIN",
      userId: normalizeUserId(
        getEnvironmentValue("ADMIN_SEED_USER_ID", {
          defaultValue: "ADMIN001",
        }),
        "ADMIN_SEED_USER_ID"
      ),
      fullName: getEnvironmentValue("ADMIN_SEED_FULL_NAME", {
        defaultValue: "Nexora Administrator",
      }),
      email: normalizeEmail(
        getEnvironmentValue("ADMIN_SEED_EMAIL", {
          required: true,
        }),
        "ADMIN_SEED_EMAIL"
      ),
      phone: getOptionalPhone("ADMIN_SEED_PHONE"),
      passwordKey: "ADMIN_SEED_PASSWORD",
      assignment: {
        type: "NONE",
      },
    },
    {
      key: "STORE_MANAGER",
      role: "STORE_MANAGER",
      userId: normalizeUserId(
        getEnvironmentValue("STORE_MANAGER_SEED_USER_ID", {
          defaultValue: "SM001",
        }),
        "STORE_MANAGER_SEED_USER_ID"
      ),
      fullName: getEnvironmentValue("STORE_MANAGER_SEED_FULL_NAME", {
        defaultValue: "Nexora Store Manager",
      }),
      email: normalizeEmail(
        getEnvironmentValue("STORE_MANAGER_SEED_EMAIL", {
          required: true,
        }),
        "STORE_MANAGER_SEED_EMAIL"
      ),
      phone: getOptionalPhone("STORE_MANAGER_SEED_PHONE"),
      passwordKey: "STORE_MANAGER_SEED_PASSWORD",
      assignment: {
        type: "OUTLET",
        outletCode: normalizeCode(
          getEnvironmentValue("STORE_MANAGER_SEED_OUTLET_CODE", {
            defaultValue: "OUT001",
          }),
          "STORE_MANAGER_SEED_OUTLET_CODE"
        ),
      },
    },
    {
      key: "DISPATCHER",
      role: "DISPATCHER",
      userId: normalizeUserId(
        getEnvironmentValue("DISPATCHER_SEED_USER_ID", {
          defaultValue: "DSP001",
        }),
        "DISPATCHER_SEED_USER_ID"
      ),
      fullName: getEnvironmentValue("DISPATCHER_SEED_FULL_NAME", {
        defaultValue: "Nexora Dispatcher",
      }),
      email: normalizeEmail(
        getEnvironmentValue("DISPATCHER_SEED_EMAIL", {
          required: true,
        }),
        "DISPATCHER_SEED_EMAIL"
      ),
      phone: getOptionalPhone("DISPATCHER_SEED_PHONE"),
      passwordKey: "DISPATCHER_SEED_PASSWORD",
      assignment: {
        type: "DEPOT",
        depotCode: normalizeCode(
          getEnvironmentValue("DISPATCHER_SEED_DEPOT_CODE", {
            defaultValue: "PELIYAGODA",
          }),
          "DISPATCHER_SEED_DEPOT_CODE"
        ),
      },
    },
    {
      key: "LOADER",
      role: "LOADER",
      userId: normalizeUserId(
        getEnvironmentValue("LOADER_SEED_USER_ID", {
          defaultValue: "LDR001",
        }),
        "LOADER_SEED_USER_ID"
      ),
      fullName: getEnvironmentValue("LOADER_SEED_FULL_NAME", {
        defaultValue: "Nexora Loader",
      }),
      email: normalizeEmail(
        getEnvironmentValue("LOADER_SEED_EMAIL", {
          required: true,
        }),
        "LOADER_SEED_EMAIL"
      ),
      phone: getOptionalPhone("LOADER_SEED_PHONE"),
      passwordKey: "LOADER_SEED_PASSWORD",
      assignment: {
        type: "DEPOT",
        depotCode: normalizeCode(
          getEnvironmentValue("LOADER_SEED_DEPOT_CODE", {
            defaultValue: "PELIYAGODA",
          }),
          "LOADER_SEED_DEPOT_CODE"
        ),
      },
    },
    {
      key: "DRIVER",
      role: "DRIVER",
      userId: normalizeUserId(
        getEnvironmentValue("DRIVER_SEED_USER_ID", {
          defaultValue: "DRV001",
        }),
        "DRIVER_SEED_USER_ID"
      ),
      fullName: getEnvironmentValue("DRIVER_SEED_FULL_NAME", {
        defaultValue: "Nexora Driver",
      }),
      email: normalizeEmail(
        getEnvironmentValue("DRIVER_SEED_EMAIL", {
          required: true,
        }),
        "DRIVER_SEED_EMAIL"
      ),
      phone: getOptionalPhone("DRIVER_SEED_PHONE"),
      passwordKey: "DRIVER_SEED_PASSWORD",
      assignment: {
        type: "DEPOT",
        depotCode: normalizeCode(
          getEnvironmentValue("DRIVER_SEED_DEPOT_CODE", {
            defaultValue: "PELIYAGODA",
          }),
          "DRIVER_SEED_DEPOT_CODE"
        ),
      },
    },
  ];
}


// ============================================================
// ASSIGNMENT RESOLUTION
// ============================================================

async function resolveAssignment(account) {
  if (account.assignment.type === "NONE") {
    return {
      outletId: null,
      depotId: null,
      assignmentLabel: "Global administrator",
    };
  }

  if (account.assignment.type === "OUTLET") {
    const outlet = await prisma.outlet.findUnique({
      where: {
        outletCode: account.assignment.outletCode,
      },
      include: {
        depot: true,
      },
    });

    if (!outlet) {
      throw new Error(
        `Outlet ${account.assignment.outletCode} was not found. ` +
          "Import the organizer outlet/depot data before seeding deployment accounts."
      );
    }

    if (!outlet.isActive) {
      throw new Error(
        `Outlet ${outlet.outletCode} is inactive and cannot be assigned to ${account.userId}.`
      );
    }

    return {
      outletId: outlet.id,
      // Store Manager authorization is outlet-derived in this project.
      depotId: null,
      assignmentLabel:
        `${outlet.outletCode} / ${outlet.brand} / ` +
        `${outlet.depot?.name || "No depot"}`,
    };
  }

  if (account.assignment.type === "DEPOT") {
    const depot = await prisma.depot.findUnique({
      where: {
        code: account.assignment.depotCode,
      },
    });

    if (!depot) {
      throw new Error(
        `Depot ${account.assignment.depotCode} was not found. ` +
          "Import the organizer outlet/depot data before seeding deployment accounts."
      );
    }

    if (!depot.isActive) {
      throw new Error(
        `Depot ${depot.code} is inactive and cannot be assigned to ${account.userId}.`
      );
    }

    return {
      outletId: null,
      depotId: depot.id,
      assignmentLabel: `${depot.name} (${depot.code})`,
    };
  }

  throw new Error(
    `Unsupported assignment type: ${account.assignment.type}`
  );
}


// ============================================================
// ACCOUNT UPSERT
// ============================================================

async function seedAccount(
  account,
  {
    resetExistingPasswords,
    mustChangePasswordForNewPasswords,
  }
) {
  const assignment = await resolveAssignment(account);

  const existingByUserId = await prisma.user.findUnique({
    where: {
      userId: account.userId,
    },
  });

  const existingByEmail = await prisma.user.findUnique({
    where: {
      email: account.email,
    },
  });

  if (
    existingByEmail &&
    (!existingByUserId || existingByEmail.id !== existingByUserId.id)
  ) {
    throw new Error(
      `${account.email} is already used by ${existingByEmail.userId}. ` +
        "Each seed account must use a unique email address."
    );
  }

  const needsPassword =
    !existingByUserId || resetExistingPasswords;

  let passwordHash = null;

  if (needsPassword) {
    const password = validateSeedPassword(
      getEnvironmentValue(account.passwordKey, {
        required: true,
      }),
      account.passwordKey
    );

    passwordHash = await bcrypt.hash(
      password,
      PASSWORD_HASH_ROUNDS
    );

    const verified = await bcrypt.compare(
      password,
      passwordHash
    );

    if (!verified) {
      throw new Error(
        `Password hash verification failed for ${account.userId}.`
      );
    }
  }

  const commonData = {
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    role: account.role,
    outletId: assignment.outletId,
    depotId: assignment.depotId,
    isActive: true,
  };

  let user;
  let action;
  let passwordAction;

  if (existingByUserId) {
    user = await prisma.user.update({
      where: {
        id: existingByUserId.id,
      },
      data: {
        ...commonData,
        ...(resetExistingPasswords
          ? {
              passwordHash,
              mustChangePassword:
                mustChangePasswordForNewPasswords,
            }
          : {}),
      },
      include: {
        outlet: {
          include: {
            depot: true,
          },
        },
        depot: true,
      },
    });

    action = "UPDATED";
    passwordAction = resetExistingPasswords
      ? "reset from environment"
      : "preserved";
  } else {
    user = await prisma.user.create({
      data: {
        userId: account.userId,
        ...commonData,
        passwordHash,
        mustChangePassword:
          mustChangePasswordForNewPasswords,
      },
      include: {
        outlet: {
          include: {
            depot: true,
          },
        },
        depot: true,
      },
    });

    action = "CREATED";
    passwordAction = "created from environment";
  }

  return {
    user,
    action,
    passwordAction,
    assignmentLabel: assignment.assignmentLabel,
  };
}


// ============================================================
// VALIDATION
// ============================================================

function validateNoDuplicateSeedIdentities(accounts) {
  const userIds = new Set();
  const emails = new Set();

  for (const account of accounts) {
    if (userIds.has(account.userId)) {
      throw new Error(
        `Duplicate deployment seed user ID: ${account.userId}`
      );
    }

    if (emails.has(account.email)) {
      throw new Error(
        `Duplicate deployment seed email: ${account.email}`
      );
    }

    userIds.add(account.userId);
    emails.add(account.email);
  }
}


// ============================================================
// MAIN
// ============================================================

async function main() {
  const accounts = getSeedConfiguration();

  validateNoDuplicateSeedIdentities(accounts);

  const resetExistingPasswords =
    getBooleanEnvironmentValue(
      "SEED_RESET_EXISTING_PASSWORDS",
      false
    );

  const mustChangePasswordForNewPasswords =
    getBooleanEnvironmentValue(
      "SEED_MUST_CHANGE_PASSWORD",
      false
    );

  await connectDatabase();

  console.log("");
  console.log("==========================================");
  console.log(" Nexora Deployment Account Seed");
  console.log("==========================================");
  console.log(
    `Existing password reset : ${resetExistingPasswords}`
  );
  console.log(
    `Require password change : ${mustChangePasswordForNewPasswords}`
  );
  console.log("");

  const results = [];

  for (const account of accounts) {
    const result = await seedAccount(account, {
      resetExistingPasswords,
      mustChangePasswordForNewPasswords,
    });

    results.push(result);
  }

  for (const result of results) {
    console.log(
      `${result.action.padEnd(7)} | ` +
        `${result.user.userId.padEnd(8)} | ` +
        `${result.user.role.padEnd(13)} | ` +
        `${result.assignmentLabel}`
    );
    console.log(
      `         email=${result.user.email} | password=${result.passwordAction}`
    );
  }

  console.log("");
  console.log(
    `Seeded/verified ${results.length} deployment accounts successfully.`
  );
  console.log(
    "Passwords are intentionally never printed to the console."
  );
}


main()
  .catch((error) => {
    console.error("");
    console.error("Deployment account seed failed:");
    console.error(error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
