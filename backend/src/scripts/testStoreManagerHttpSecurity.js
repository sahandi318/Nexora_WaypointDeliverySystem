import assert from "node:assert/strict";

import request from "supertest";

import app from "../app.js";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  createAccessToken,
} from "../utils/jwt.js";


// ============================================================
// CONFIGURATION
// ============================================================

const STORE_MANAGER_USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

const CONTEXT_URL =
  "/api/store-manager/context";


// ============================================================
// TEST STATE
// ============================================================

const tests = [];

let storeManager = null;

let alternativeOutlet = null;

let originalStoreManagerState =
  null;


// ============================================================
// TEST REGISTRATION
// ============================================================

function test(
  name,
  run
) {
  tests.push({
    name,
    run,
  });
}


// ============================================================
// ASSERTION HELPERS
// ============================================================

function assertStatus(
  response,
  expectedStatus
) {
  assert.equal(
    response.status,
    expectedStatus,
    [
      `Expected HTTP ${expectedStatus}`,
      `but received HTTP ${response.status}.`,
      "",
      `Response: ${JSON.stringify(
        response.body
      )}`,
    ].join("\n")
  );
}


function assertSuccess(
  response
) {
  assert.equal(
    response.body.success,
    true,
    "Expected success=true."
  );
}


function assertFailure(
  response
) {
  assert.equal(
    response.body.success,
    false,
    "Expected success=false."
  );
}


function bearerToken(
  token
) {
  return `Bearer ${token}`;
}


// ============================================================
// DATABASE FIXTURES
// ============================================================

async function loadStoreManager() {
  return prisma.user.findUnique({
    where: {
      userId:
        STORE_MANAGER_USER_ID,
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
}


async function loadFixtures() {
  storeManager =
    await loadStoreManager();


  assert.ok(
    storeManager,
    `Store Manager ${STORE_MANAGER_USER_ID} was not found.`
  );


  assert.equal(
    storeManager.role,
    "STORE_MANAGER",
    `${STORE_MANAGER_USER_ID} must have the STORE_MANAGER role.`
  );


  assert.equal(
    storeManager.isActive,
    true,
    `${STORE_MANAGER_USER_ID} must be active before running the tests.`
  );


  assert.equal(
    storeManager.mustChangePassword,
    false,
    `${STORE_MANAGER_USER_ID} must have completed the required password change.`
  );


  assert.ok(
    storeManager.outlet,
    `${STORE_MANAGER_USER_ID} must have an outlet assignment.`
  );


  assert.equal(
    storeManager.outlet.isActive,
    true,
    `${STORE_MANAGER_USER_ID}'s outlet must be active.`
  );


  assert.ok(
    storeManager.outlet.depot,
    `${STORE_MANAGER_USER_ID}'s outlet must belong to a depot.`
  );


  alternativeOutlet =
    await prisma.outlet.findFirst({
      where: {
        id: {
          not:
            storeManager.outlet.id,
        },

        isActive:
          true,
      },

      orderBy: {
        id:
          "asc",
      },
    });


  assert.ok(
    alternativeOutlet,
    "A second active outlet is required for outlet-isolation testing."
  );


  originalStoreManagerState = {
    id:
      storeManager.id,

    role:
      storeManager.role,

    isActive:
      storeManager.isActive,

    mustChangePassword:
      storeManager.mustChangePassword,

    outletId:
      storeManager.outletId,
  };
}


// ============================================================
// DATABASE STATE SAFETY
// ============================================================

async function restoreStoreManagerState() {
  if (
    !originalStoreManagerState
  ) {
    return;
  }


  await prisma.user.update({
    where: {
      id:
        originalStoreManagerState.id,
    },

    data: {
      role:
        originalStoreManagerState.role,

      isActive:
        originalStoreManagerState
          .isActive,

      mustChangePassword:
        originalStoreManagerState
          .mustChangePassword,

      outletId:
        originalStoreManagerState
          .outletId,
    },
  });
}


async function withTemporaryStoreManagerState(
  data,
  callback
) {
  await prisma.user.update({
    where: {
      id:
        storeManager.id,
    },

    data,
  });


  try {
    return await callback();
  } finally {
    await restoreStoreManagerState();
  }
}


// ============================================================
// TESTS
// ============================================================

function registerTests() {
  // ----------------------------------------------------------
  // 1. NO TOKEN
  // ----------------------------------------------------------

  test(
    "Unauthenticated request is rejected",
    async () => {
      const response =
        await request(app)
          .get(
            CONTEXT_URL
          );


      assertStatus(
        response,
        401
      );

      assertFailure(
        response
      );


      assert.match(
        response.body.message,
        /authentication required/i
      );
    }
  );


  // ----------------------------------------------------------
  // 2. INVALID TOKEN
  // ----------------------------------------------------------

  test(
    "Invalid JWT is rejected",
    async () => {
      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .set(
            "Authorization",
            bearerToken(
              "invalid-jwt-token"
            )
          );


      assertStatus(
        response,
        401
      );

      assertFailure(
        response
      );
    }
  );


  // ----------------------------------------------------------
  // 3. VALID STORE MANAGER
  // ----------------------------------------------------------

  test(
    "Valid Store Manager can access trusted context",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .set(
            "Authorization",
            bearerToken(
              token
            )
          );


      assertStatus(
        response,
        200
      );

      assertSuccess(
        response
      );


      assert.equal(
        response.body.data
          .user.userId,
        storeManager.userId
      );


      assert.equal(
        response.body.data
          .user.role,
        "STORE_MANAGER"
      );
    }
  );


  // ----------------------------------------------------------
  // 4. FORGED TOKEN CLAIMS
  // ----------------------------------------------------------

  test(
    "Forged token role and User ID claims cannot escalate privileges",
    async () => {
      /**
       * The JWT subject still points to SM001,
       * but we deliberately forge the role and User ID.
       *
       * authenticateToken must reload SM001 from MySQL.
       */
      const forgedToken =
        createAccessToken({
          ...storeManager,

          userId:
            "ADMIN999",

          role:
            "ADMIN",
        });


      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .set(
            "Authorization",
            bearerToken(
              forgedToken
            )
          );


      assertStatus(
        response,
        200
      );

      assertSuccess(
        response
      );


      assert.equal(
        response.body.data
          .user.userId,
        storeManager.userId
      );


      assert.equal(
        response.body.data
          .user.role,
        "STORE_MANAGER"
      );


      assert.notEqual(
        response.body.data
          .user.userId,
        "ADMIN999"
      );
    }
  );


  // ----------------------------------------------------------
  // 5. QUERY OUTLET OVERRIDE
  // ----------------------------------------------------------

  test(
    "Query parameters cannot override authenticated outlet or role",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .query({
            outletId:
              alternativeOutlet
                .outletCode,

            role:
              "ADMIN",

            userId:
              "ADMIN999",
          })
          .set(
            "Authorization",
            bearerToken(
              token
            )
          );


      assertStatus(
        response,
        200
      );

      assertSuccess(
        response
      );


      assert.equal(
        response.body.data
          .outlet.outletCode,
        storeManager.outlet
          .outletCode
      );


      assert.notEqual(
        response.body.data
          .outlet.outletCode,
        alternativeOutlet
          .outletCode
      );


      assert.equal(
        response.body.data
          .user.role,
        "STORE_MANAGER"
      );
    }
  );


  // ----------------------------------------------------------
  // 6. REQUEST BODY OVERRIDE
  // ----------------------------------------------------------

  test(
    "Request body cannot override authenticated outlet or role",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .set(
            "Authorization",
            bearerToken(
              token
            )
          )
          .send({
            outletId:
              alternativeOutlet
                .outletCode,

            role:
              "ADMIN",

            userId:
              "ADMIN999",
          });


      assertStatus(
        response,
        200
      );

      assertSuccess(
        response
      );


      assert.equal(
        response.body.data
          .outlet.outletCode,
        storeManager.outlet
          .outletCode
      );


      assert.equal(
        response.body.data
          .user.role,
        "STORE_MANAGER"
      );
    }
  );


  // ----------------------------------------------------------
  // 7. STALE TOKEN ROLE VS CURRENT DATABASE ROLE
  // ----------------------------------------------------------

  test(
    "Current database role overrides stale Store Manager token",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      await withTemporaryStoreManagerState(
        {
          role:
            "DRIVER",
        },

        async () => {
          const response =
            await request(app)
              .get(
                CONTEXT_URL
              )
              .set(
                "Authorization",
                bearerToken(
                  token
                )
              );


          assertStatus(
            response,
            403
          );

          assertFailure(
            response
          );
        }
      );
    }
  );


  // ----------------------------------------------------------
  // 8. INACTIVE USER
  // ----------------------------------------------------------

  test(
    "Inactive Store Manager is rejected using current database state",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      await withTemporaryStoreManagerState(
        {
          isActive:
            false,
        },

        async () => {
          const response =
            await request(app)
              .get(
                CONTEXT_URL
              )
              .set(
                "Authorization",
                bearerToken(
                  token
                )
              );


          assertStatus(
            response,
            403
          );

          assertFailure(
            response
          );


          assert.match(
            response.body.message,
            /inactive/i
          );
        }
      );
    }
  );


  // ----------------------------------------------------------
  // 9. REQUIRED PASSWORD CHANGE
  // ----------------------------------------------------------

  test(
    "Store Manager requiring password change cannot access protected context",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      await withTemporaryStoreManagerState(
        {
          mustChangePassword:
            true,
        },

        async () => {
          const response =
            await request(app)
              .get(
                CONTEXT_URL
              )
              .set(
                "Authorization",
                bearerToken(
                  token
                )
              );


          assertStatus(
            response,
            403
          );

          assertFailure(
            response
          );


          assert.equal(
            response.body.code,
            "PASSWORD_CHANGE_REQUIRED"
          );
        }
      );
    }
  );


  // ----------------------------------------------------------
  // 10. STORE MANAGER WITHOUT OUTLET
  // ----------------------------------------------------------

  test(
    "Store Manager without outlet assignment is rejected",
    async () => {
      const token =
        createAccessToken(
          storeManager
        );


      await withTemporaryStoreManagerState(
        {
          outletId:
            null,
        },

        async () => {
          const response =
            await request(app)
              .get(
                CONTEXT_URL
              )
              .set(
                "Authorization",
                bearerToken(
                  token
                )
              );


          assertStatus(
            response,
            403
          );

          assertFailure(
            response
          );
        }
      );
    }
  );


  // ----------------------------------------------------------
  // 11. DATABASE CONTEXT MATCH
  // ----------------------------------------------------------

  test(
    "Returned context matches current MySQL outlet and depot assignment",
    async () => {
      await restoreStoreManagerState();


      const currentStoreManager =
        await loadStoreManager();


      const token =
        createAccessToken(
          currentStoreManager
        );


      const response =
        await request(app)
          .get(
            CONTEXT_URL
          )
          .set(
            "Authorization",
            bearerToken(
              token
            )
          );


      assertStatus(
        response,
        200
      );

      assertSuccess(
        response
      );


      const returnedUser =
        response.body.data.user;

      const returnedOutlet =
        response.body.data.outlet;

      const returnedDepot =
        response.body.data.depot;


      // USER

      assert.equal(
        returnedUser.id,
        currentStoreManager.id
      );


      assert.equal(
        returnedUser.userId,
        currentStoreManager.userId
      );


      assert.equal(
        returnedUser.role,
        currentStoreManager.role
      );


      // OUTLET

      assert.equal(
        returnedOutlet.id,
        currentStoreManager
          .outlet.id
      );


      assert.equal(
        returnedOutlet
          .outletCode,
        currentStoreManager
          .outlet.outletCode
      );


      assert.equal(
        returnedOutlet.brand,
        currentStoreManager
          .outlet.brand
      );


      assert.equal(
        returnedOutlet.district,
        currentStoreManager
          .outlet.district
      );


      assert.equal(
        returnedOutlet.dockType,
        currentStoreManager
          .outlet.dockType
      );


      assert.equal(
        returnedOutlet
          .parkingConstraint,
        currentStoreManager
          .outlet
          .parkingConstraint
      );


      assert.equal(
        returnedOutlet
          .windowOpenTime,
        currentStoreManager
          .outlet
          .windowOpenTime
      );


      assert.equal(
        returnedOutlet
          .windowCloseTime,
        currentStoreManager
          .outlet
          .windowCloseTime
      );


      // DEPOT

      assert.ok(
        returnedDepot,
        "Expected depot context."
      );


      assert.equal(
        returnedDepot.id,
        currentStoreManager
          .outlet.depot.id
      );


      assert.equal(
        returnedDepot.code,
        currentStoreManager
          .outlet.depot.code
      );


      assert.equal(
        returnedDepot.name,
        currentStoreManager
          .outlet.depot.name
      );
    }
  );
}


// ============================================================
// TEST RUNNER
// ============================================================

async function runTests() {
  console.log("");
  console.log(
    "=========================================="
  );

  console.log(
    " Store Manager HTTP Security Tests"
  );

  console.log(
    "=========================================="
  );


  let passed =
    0;


  try {
    await connectDatabase();


    await loadFixtures();


    registerTests();


    for (
      const currentTest
      of tests
    ) {
      try {
        await currentTest.run();


        passed += 1;


        console.log(
          `✓ ${currentTest.name}`
        );
      } catch (error) {
        console.error(
          `✗ ${currentTest.name}`
        );


        console.error(
          error
        );


        console.log(
          "------------------------------------------"
        );


        console.log(
          `Passed ${passed}/${tests.length} tests`
        );


        console.log(
          "=========================================="
        );


        process.exitCode =
          1;


        return;
      }
    }


    console.log(
      "------------------------------------------"
    );


    console.log(
      `Passed ${passed}/${tests.length} tests`
    );


    console.log(
      "=========================================="
    );
  } finally {
    /**
     * Very important:
     *
     * Restore SM001 even when a test throws.
     */
    try {
      await restoreStoreManagerState();
    } catch (restoreError) {
      console.error(
        "Failed to restore Store Manager test state:"
      );

      console.error(
        restoreError
      );


      process.exitCode =
        1;
    }


    await disconnectDatabase();
  }
}


// ============================================================
// START
// ============================================================

runTests()
  .catch((error) => {
    console.error("");
    console.error(
      "HTTP security test suite failed:"
    );

    console.error(
      error
    );


    process.exitCode =
      1;
  });