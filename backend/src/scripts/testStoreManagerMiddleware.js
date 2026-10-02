import {
  requireStoreManagerOutlet,
} from "../middleware/storeManagerMiddleware.js";


// ============================================================
// MOCK RESPONSE
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
// RUN TEST
// ============================================================

function runMiddlewareTest({
  name,
  req,
  expectedStatus,
  expectedNext,
  verifyContext,
}) {
  const res =
    createMockResponse();


  let nextCalled =
    false;


  requireStoreManagerOutlet(
    req,
    res,
    () => {
      nextCalled =
        true;
    }
  );


  let contextPassed =
    true;


  if (
    expectedNext &&
    typeof verifyContext ===
      "function"
  ) {
    contextPassed =
      verifyContext(
        req.storeManagerContext
      );
  }


  const passed =
    res.statusCode ===
      expectedStatus &&
    nextCalled ===
      expectedNext &&
    contextPassed;


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
      "  Context:",
      req.storeManagerContext
    );

    console.log(
      "  Response:",
      res.responseBody
    );
  }


  return passed;
}


// ============================================================
// VALID STORE MANAGER FIXTURE
// ============================================================

function createValidStoreManagerUser() {
  return {
    id:
      1,

    userId:
      "SM001",

    fullName:
      "Development Store Manager",

    email:
      "anushkauniversity@gmail.com",

    role:
      "STORE_MANAGER",

    outletId:
      1,

    outlet: {
      id:
        1,

      outletCode:
        "OUT001",

      brand:
        "Fresh",

      district:
        "Colombo",

      dockType:
        "street",

      parkingConstraint:
        "van_only",

      mallWindow:
        null,

      windowOpenTime:
        "05:00",

      windowCloseTime:
        "07:30",

      isActive:
        true,

      depot: {
        id:
          1,

        code:
          "PEL",

        name:
          "Peliyagoda",

        district:
          "Colombo",

        isActive:
          true,
      },
    },
  };
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
    " Store Manager Outlet Isolation Tests"
  );

  console.log(
    "=========================================="
  );


  const results = [];


  // ----------------------------------------------------------
  // TEST 1
  // Unauthenticated
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Unauthenticated request is rejected",

      req: {},

      expectedStatus:
        401,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 2
  // Wrong role
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Driver cannot obtain Store Manager context",

      req: {
        user: {
          id:
            2,

          userId:
            "DR001",

          role:
            "DRIVER",
        },
      },

      expectedStatus:
        403,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 3
  // No outlet
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Store Manager without outlet is rejected",

      req: {
        user: {
          id:
            3,

          userId:
            "SM002",

          role:
            "STORE_MANAGER",

          outletId:
            null,

          outlet:
            null,
        },
      },

      expectedStatus:
        403,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 4
  // Inactive outlet
  // ----------------------------------------------------------

  const inactiveOutletUser =
    createValidStoreManagerUser();


  inactiveOutletUser.outlet.isActive =
    false;


  results.push(
    runMiddlewareTest({
      name:
        "Store Manager with inactive outlet is rejected",

      req: {
        user:
          inactiveOutletUser,
      },

      expectedStatus:
        403,

      expectedNext:
        false,
    })
  );


  // ----------------------------------------------------------
  // TEST 5
  // Valid trusted outlet
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Store Manager receives trusted OUT001 context",

      req: {
        user:
          createValidStoreManagerUser(),
      },

      expectedStatus:
        200,

      expectedNext:
        true,

      verifyContext:
        (context) =>
          context?.userId ===
            "SM001" &&
          context?.outletCode ===
            "OUT001" &&
          context?.outletDatabaseId ===
            1 &&
          context?.depot?.name ===
            "Peliyagoda",
    })
  );


  // ----------------------------------------------------------
  // TEST 6
  // Query-string attack
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Query outletId cannot override authenticated outlet",

      req: {
        user:
          createValidStoreManagerUser(),

        query: {
          outletId:
            "OUT050",
        },
      },

      expectedStatus:
        200,

      expectedNext:
        true,

      verifyContext:
        (context) =>
          context?.outletCode ===
            "OUT001",
    })
  );


  // ----------------------------------------------------------
  // TEST 7
  // Body attack
  // ----------------------------------------------------------

  results.push(
    runMiddlewareTest({
      name:
        "Body outletId cannot override authenticated outlet",

      req: {
        user:
          createValidStoreManagerUser(),

        body: {
          outletId:
            "OUT090",
        },
      },

      expectedStatus:
        200,

      expectedNext:
        true,

      verifyContext:
        (context) =>
          context?.outletCode ===
            "OUT001",
    })
  );


  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

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