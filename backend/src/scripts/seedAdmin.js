import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  validatePasswordPolicy,
} from "../services/authService.js";


const PASSWORD_HASH_ROUNDS =
  12;


// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

function getRequiredEnvironmentValue(
  key
) {
  const value =
    process.env[key]
      ?.trim();


  if (!value) {
    throw new Error(
      `${key} is required.`
    );
  }


  return value;
}


function getAdminSeedUserId() {
  return getRequiredEnvironmentValue(
    "ADMIN_SEED_USER_ID"
  ).toUpperCase();
}


function getAdminSeedFullName() {
  return getRequiredEnvironmentValue(
    "ADMIN_SEED_FULL_NAME"
  );
}


function getAdminSeedEmail() {
  const email =
    getRequiredEnvironmentValue(
      "ADMIN_SEED_EMAIL"
    ).toLowerCase();


  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (
    !emailPattern.test(
      email
    )
  ) {
    throw new Error(
      "ADMIN_SEED_EMAIL is not a valid email address."
    );
  }


  return email;
}


function getAdminSeedPhone() {
  const phone =
    process.env
      .ADMIN_SEED_PHONE
      ?.trim();


  return phone || null;
}


function getAdminSeedPassword() {
  const password =
    process.env
      .ADMIN_SEED_PASSWORD;


  if (!password) {
    throw new Error(
      "ADMIN_SEED_PASSWORD is required when creating the administrator for the first time."
    );
  }


  const passwordPolicy =
    validatePasswordPolicy(
      password
    );


  if (!passwordPolicy.valid) {
    throw new Error(
      `ADMIN_SEED_PASSWORD is invalid: ${passwordPolicy.message}`
    );
  }


  return password;
}


// ============================================================
// ADMIN BOOTSTRAP
// ============================================================

async function seedAdmin() {
  const userId =
    getAdminSeedUserId();

  const fullName =
    getAdminSeedFullName();

  const email =
    getAdminSeedEmail();

  const phone =
    getAdminSeedPhone();


  // ----------------------------------------------------------
  // Check for an account using the configured User ID
  // ----------------------------------------------------------

  const existingByUserId =
    await prisma.user.findUnique({
      where: {
        userId,
      },
    });


  if (
    existingByUserId &&
    existingByUserId.role !==
      "ADMIN"
  ) {
    throw new Error(
      `User ID ${userId} already belongs to a non-admin account. Choose a different ADMIN_SEED_USER_ID.`
    );
  }


  // ----------------------------------------------------------
  // Check for an account using the configured email
  // ----------------------------------------------------------

  const existingByEmail =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });


  if (
    existingByEmail &&
    existingByUserId &&
    existingByEmail.id !==
      existingByUserId.id
  ) {
    throw new Error(
      `Email ${email} is already used by another account. Choose a different ADMIN_SEED_EMAIL.`
    );
  }


  if (
    existingByEmail &&
    !existingByUserId
  ) {
    throw new Error(
      `Email ${email} is already used by another account. Choose a different ADMIN_SEED_EMAIL.`
    );
  }


  let admin;
  let passwordStatus;


  if (existingByUserId) {
    // ========================================================
    // EXISTING ADMIN
    // ========================================================
    //
    // Security-sensitive values are intentionally preserved:
    // - passwordHash
    // - mustChangePassword
    // - isActive
    // - lastLoginAt
    //
    // Running the bootstrap command again must not silently
    // reset a password or reactivate a disabled administrator.
    // ========================================================

    admin =
      await prisma.user.update({
        where: {
          id:
            existingByUserId.id,
        },

        data: {
          fullName,

          email,

          phone,

          role:
            "ADMIN",

          outletId:
            null,

          depotId:
            null,
        },
      });


    passwordStatus =
      "existing password and security state preserved";
  } else {
    // ========================================================
    // NEW ADMIN
    // ========================================================

    const temporaryPassword =
      getAdminSeedPassword();


    const passwordHash =
      await bcrypt.hash(
        temporaryPassword,
        PASSWORD_HASH_ROUNDS
      );


    admin =
      await prisma.user.create({
        data: {
          userId,

          fullName,

          email,

          phone,

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
            true,
        },
      });


    const passwordVerified =
      await bcrypt.compare(
        temporaryPassword,
        admin.passwordHash
      );


    if (!passwordVerified) {
      throw new Error(
        "Administrator password hash verification failed."
      );
    }


    passwordStatus =
      "temporary password created and bcrypt verified";
  }


  // ==========================================================
  // OUTPUT
  // ==========================================================

  console.log("");

  console.log(
    "=========================================="
  );

  console.log(
    " Nexora Administrator Bootstrap"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `User ID       : ${admin.userId}`
  );

  console.log(
    `Email         : ${admin.email}`
  );

  console.log(
    `Name          : ${admin.fullName}`
  );

  console.log(
    `Role          : ${admin.role}`
  );

  console.log(
    `Outlet        : ${admin.outletId ?? "Not assigned"}`
  );

  console.log(
    `Depot         : ${admin.depotId ?? "Not assigned"}`
  );

  console.log(
    `Active        : ${admin.isActive}`
  );

  console.log(
    `Change passwd : ${admin.mustChangePassword}`
  );

  console.log(
    `Password      : ${passwordStatus}`
  );

  console.log(
    "=========================================="
  );

  console.log("");
}


// ============================================================
// ENTRY POINT
// ============================================================

async function main() {
  try {
    await connectDatabase();

    await seedAdmin();
  } catch (error) {
    console.error(
      "Administrator bootstrap failed."
    );

    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}


main();
