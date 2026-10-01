import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";


const STORE_MANAGER_USER_ID =
  "SM001";

const STORE_MANAGER_FULL_NAME =
  "Development Store Manager";

const STORE_MANAGER_OUTLET_CODE =
  "OUT001";

const PASSWORD_HASH_ROUNDS =
  12;


// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

function getStoreManagerEmail() {
  const email =
    process.env
      .STORE_MANAGER_SEED_EMAIL
      ?.trim()
      .toLowerCase();


  if (!email) {
    throw new Error(
      "STORE_MANAGER_SEED_EMAIL is missing."
    );
  }


  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (
    !emailPattern.test(
      email
    )
  ) {
    throw new Error(
      "STORE_MANAGER_SEED_EMAIL is not a valid email address."
    );
  }


  return email;
}


function getStoreManagerPassword() {
  const password =
    process.env
      .STORE_MANAGER_SEED_PASSWORD;


  if (!password) {
    throw new Error(
      "STORE_MANAGER_SEED_PASSWORD is required only when creating SM001 for the first time."
    );
  }


  return password;
}


// ============================================================
// SEED STORE MANAGER
// ============================================================

async function seedStoreManager() {
  const email =
    getStoreManagerEmail();


  // ----------------------------------------------------------
  // Find organizer outlet
  // ----------------------------------------------------------

  const outlet =
    await prisma.outlet.findUnique({
      where: {
        outletCode:
          STORE_MANAGER_OUTLET_CODE,
      },

      include: {
        depot:
          true,
      },
    });


  if (!outlet) {
    throw new Error(
      `Organizer outlet ${STORE_MANAGER_OUTLET_CODE} was not found.`
    );
  }


  // ----------------------------------------------------------
  // Check whether SM001 already exists
  // ----------------------------------------------------------

  const existingUser =
    await prisma.user.findUnique({
      where: {
        userId:
          STORE_MANAGER_USER_ID,
      },
    });


  let storeManager;
  let passwordStatus;


  if (existingUser) {
    // ========================================================
    // EXISTING USER
    // ========================================================
    //
    // Important:
    // - preserve password
    // - preserve mustChangePassword
    // - preserve lastLoginAt
    //
    // Only update account/profile assignment information.
    // ========================================================

    storeManager =
      await prisma.user.update({
        where: {
          id:
            existingUser.id,
        },

        data: {
          fullName:
            STORE_MANAGER_FULL_NAME,

          email,

          role:
            "STORE_MANAGER",

          outletId:
            outlet.id,

          depotId:
            null,

          isActive:
            true,
        },

        include: {
          outlet: {
            include: {
              depot:
                true,
            },
          },

          depot:
            true,
        },
      });


    passwordStatus =
      "existing password preserved";
  } else {
    // ========================================================
    // NEW USER
    // ========================================================

    const temporaryPassword =
      getStoreManagerPassword();


    const passwordHash =
      await bcrypt.hash(
        temporaryPassword,
        PASSWORD_HASH_ROUNDS
      );


    storeManager =
      await prisma.user.create({
        data: {
          userId:
            STORE_MANAGER_USER_ID,

          fullName:
            STORE_MANAGER_FULL_NAME,

          email,

          phone:
            null,

          passwordHash,

          role:
            "STORE_MANAGER",

          outletId:
            outlet.id,

          depotId:
            null,

          isActive:
            true,

          mustChangePassword:
            true,
        },

        include: {
          outlet: {
            include: {
              depot:
                true,
            },
          },

          depot:
            true,
        },
      });


    const passwordVerified =
      await bcrypt.compare(
        temporaryPassword,
        storeManager.passwordHash
      );


    if (!passwordVerified) {
      throw new Error(
        "Store Manager password hash verification failed."
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
    " Nexora Store Manager Seed"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `User ID       : ${storeManager.userId}`
  );

  console.log(
    `Email         : ${storeManager.email}`
  );

  console.log(
    `Name          : ${storeManager.fullName}`
  );

  console.log(
    `Role          : ${storeManager.role}`
  );

  console.log(
    `Outlet        : ${storeManager.outlet?.outletCode ?? "Not assigned"}`
  );

  console.log(
    `Brand         : ${storeManager.outlet?.brand ?? "Not available"}`
  );

  console.log(
    `District      : ${storeManager.outlet?.district ?? "Not available"}`
  );

  console.log(
    `Depot         : ${storeManager.outlet?.depot?.name ?? "Not assigned"}`
  );

  console.log(
    `Active        : ${storeManager.isActive}`
  );

  console.log(
    `Change passwd : ${storeManager.mustChangePassword}`
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

    await seedStoreManager();
  } catch (error) {
    console.error(
      "✗ Store Manager seed failed."
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