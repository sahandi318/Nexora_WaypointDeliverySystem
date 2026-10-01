import "dotenv/config";

import bcrypt from "bcryptjs";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";


// ============================================================
// DEVELOPMENT STORE MANAGER CONFIGURATION
// ============================================================

const STORE_MANAGER_USER_ID =
  "SM001";

const STORE_MANAGER_FULL_NAME =
  "Development Store Manager";

const STORE_MANAGER_OUTLET_CODE =
  "OUT001";

const PASSWORD_HASH_ROUNDS =
  12;


// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

/**
 * Read the development Store Manager password from the
 * environment.
 *
 * The password is never hardcoded into the database script
 * and is never printed to the terminal.
 */
function getStoreManagerPassword() {
  const password =
    process.env
      .STORE_MANAGER_SEED_PASSWORD;

  if (!password) {
    throw new Error(
      "STORE_MANAGER_SEED_PASSWORD is missing."
    );
  }

  if (password.length < 8) {
    throw new Error(
      "STORE_MANAGER_SEED_PASSWORD must contain at least 8 characters."
    );
  }

  return password;
}


// ============================================================
// STORE MANAGER SEED
// ============================================================

async function seedStoreManager() {
  const password =
    getStoreManagerPassword();


  // ----------------------------------------------------------
  // Find the official organizer outlet
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
      `Organizer outlet ${STORE_MANAGER_OUTLET_CODE} was not found. Run the organizer outlet importer first.`
    );
  }


  // ----------------------------------------------------------
  // Hash development password
  // ----------------------------------------------------------

  const passwordHash =
    await bcrypt.hash(
      password,
      PASSWORD_HASH_ROUNDS
    );


  // ----------------------------------------------------------
  // Create or update SM001
  // ----------------------------------------------------------
  //
  // Upsert makes this script safe to run repeatedly.
  //
  // If SM001 already exists:
  //   - account information is updated
  //   - password hash is refreshed
  //   - outlet assignment is corrected
  //
  // No duplicate user is created.
  // ----------------------------------------------------------

  const storeManager =
    await prisma.user.upsert({
      where: {
        userId:
          STORE_MANAGER_USER_ID,
      },

      update: {
        fullName:
          STORE_MANAGER_FULL_NAME,

        passwordHash,

        role:
          "STORE_MANAGER",

        outletId:
          outlet.id,

        /**
         * The Store Manager belongs directly to an outlet.
         *
         * The outlet itself already points to its depot,
         * therefore a duplicate direct depot assignment is
         * unnecessary for this role.
         */
        depotId:
          null,

        isActive:
          true,
      },

      create: {
        userId:
          STORE_MANAGER_USER_ID,

        fullName:
          STORE_MANAGER_FULL_NAME,

        email:
          null,

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
      },

      include: {
        outlet: {
          include: {
            depot:
              true,
          },
        },
      },
    });


  // ==========================================================
  // VERIFY PASSWORD HASH
  // ==========================================================

  const passwordIsValid =
    await bcrypt.compare(
      password,
      storeManager.passwordHash
    );


  if (!passwordIsValid) {
    throw new Error(
      "The stored password hash could not be verified."
    );
  }


  // ==========================================================
  // RESULT
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
    `User ID  : ${storeManager.userId}`
  );

  console.log(
    `Name     : ${storeManager.fullName}`
  );

  console.log(
    `Role     : ${storeManager.role}`
  );

  console.log(
    `Outlet   : ${storeManager.outlet.outletCode}`
  );

  console.log(
    `Brand    : ${storeManager.outlet.brand}`
  );

  console.log(
    `District : ${storeManager.outlet.district}`
  );

  console.log(
    `Depot    : ${
      storeManager.outlet.depot?.name ??
      "Not assigned"
    }`
  );

  console.log(
    `Active   : ${storeManager.isActive}`
  );

  console.log(
    `Password : bcrypt hash verified successfully`
  );

  console.log(
    "=========================================="
  );

  console.log("");
}


// ============================================================
// SCRIPT ENTRY POINT
// ============================================================

async function main() {
  try {
    await connectDatabase();

    await seedStoreManager();
  } catch (error) {
    console.error("");

    console.error(
      "✗ Store Manager seed failed."
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}


main();