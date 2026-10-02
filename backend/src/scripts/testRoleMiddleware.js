import {
  requireRoles,
  requireStoreManager,
  USER_ROLES,
} from "../middleware/roleMiddleware.js";


// ============================================================
// SIMPLE MOCK RESPONSE
// ============================================================

function createMockResponse() {
  return {
    statusCode:
      200,

    responseBody:
      null,

    status(code) {
      this.statusCode =
        code;

      return this;
    },

    json(body) {
      this.responseBody =
        body;

      return this;
    },
  };
}


// ============================================================
// RUN ONE TEST
// ============================================================

function runMiddlewareTest({
  name,
  middleware,
  user,
  expectedStatus,
  expectedNext,
}) {
  const req = {
    user,
  };


  const res =
    createMockResponse();


  let nextCalled =
    false;


  middleware(
    req,
    res,
    () => {
      nextCalled =
        true;
    }
  );


  const passed =
    res.statusCode ===
      expectedStatus &&
    nextCalled ===
      expectedNext;


  console.log(
    passed
      ? `✓ ${name}`
      : `✗ ${name}`
  );


  if (!passed) {
    console.log(
      "  Expected status:",
      expectedStatus
    );

    console.log(
      "  Actual status:",
      res.statusCode
    );

    console.log(
      "  Expected next:",
      expectedNext
    );

    console.log(
      "  Actual next:",
      nextCalled
    );

    console.log(
      "  Response:",
      res.responseBody
    );
  }


  return passed;
}


// ============================================================
// TEST SUITE
// ============================================================

function main() {
  console.log("");

  console.log(
    "=========================================="
  );

  console.log(
    " Nexora RBAC Middleware Tests"
  );

  console.log(
    "=========================================="
  );


  const results = [];


  // ----------------------------------------------------------
  // TEST 1
  // No authenticated user
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Unauthenticated request is rejected",

      middleware:
        requireStoreManager,

      user:
        undefined,

      expectedStatus:
        401,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 2
  // Correct Store Manager role
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Store Manager can access Store Manager route",

      middleware:
        requireStoreManager,

      user: {
        id:
          1,

        userId:
          "SM001",

        role:
          USER_ROLES
            .STORE_MANAGER,
      },

      expectedStatus:
        200,

      expectedNext:
        true,
    })
  );


  // ----------------------------------------------------------
  // TEST 3
  // Wrong role
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Driver cannot access Store Manager route",

      middleware:
        requireStoreManager,

      user: {
        id:
          2,

        userId:
          "DR001",

        role:
          USER_ROLES.DRIVER,
      },

      expectedStatus:
        403,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 4
  // Multiple authorized roles
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Admin can access a multi-role route",

      middleware:
        requireRoles(
          USER_ROLES.ADMIN,
          USER_ROLES.DISPATCHER
        ),

      user: {
        id:
          3,

        userId:
          "AD001",

        role:
          USER_ROLES.ADMIN,
      },

      expectedStatus:
        200,

      expectedNext:
        true,
    })
  );


  // ----------------------------------------------------------
  // TEST 5
  // Invalid authenticated role
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Unknown role is rejected",

      middleware:
        requireStoreManager,

      user: {
        id:
          4,

        userId:
          "TEST001",

        role:
          "SUPER_USER",
      },

      expectedStatus:
        403,

      expectedNext:
        false,
    })
  );


  const passedCount =
    results.filter(
      Boolean
    ).length;


  console.log(
    "------------------------------------------"
  );

  console.log(
    `Passed ${passedCount}/${results.length} tests`
  );

  console.log(
    "=========================================="
  );

  console.log("");


  if (
    passedCount !==
    results.length
  ) {
    process.exitCode =
      1;
  }
}


main();