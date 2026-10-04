import assert from "node:assert/strict";

import request from "supertest";

import app from "../app.js";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  evaluateStoreOrderCutoff,
} from "../services/storeManagerOrderService.js";

import {
  createAccessToken,
} from "../utils/jwt.js";

const STORE_MANAGER_USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

const API_BASE =
  "/api/store-manager";

const TEST_SKU =
  `TEST-${Date.now()}`;

const createdOrderIds =
  [];

let storeManager =
  null;

let alternativeOutlet =
  null;

let testProduct =
  null;

// ============================================================
// HELPERS
// ============================================================

function bearerToken(
  token
) {
  return `Bearer ${token}`;
}

function assertSuccess(
  response
) {
  assert.equal(
    response.body.success,
    true,
    `Expected success=true. Response: ${JSON.stringify(response.body)}`
  );
}

function assertFailure(
  response
) {
  assert.equal(
    response.body.success,
    false,
    `Expected success=false. Response: ${JSON.stringify(response.body)}`
  );
}

async function loadFixtures() {
  storeManager =
    await prisma.user.findUnique({
      where: {
        userId:
          STORE_MANAGER_USER_ID,
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

  assert.ok(
    storeManager,
    `Store Manager ${STORE_MANAGER_USER_ID} was not found.`
  );

  assert.equal(
    storeManager.role,
    "STORE_MANAGER"
  );

  assert.equal(
    storeManager.isActive,
    true
  );

  assert.equal(
    storeManager.mustChangePassword,
    false,
    `${STORE_MANAGER_USER_ID} must have completed password change before this test.`
  );

  assert.ok(
    storeManager.outlet,
    "Store Manager must have an assigned outlet."
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
    "A second active outlet is required for isolation testing."
  );

  testProduct =
    await prisma.product.create({
      data: {
        sku:
          TEST_SKU,

        name:
          "Store Order Test Product",

        category:
          "Test",

        unitLabel:
          "unit",

        source:
          "TEST_FIXTURE",

        isActive:
          true,

        brandAssignments: {
          create: {
            brand:
              storeManager.outlet.brand,

            isActive:
              true,
          },
        },
      },
    });
}

async function cleanup() {
  if (
    createdOrderIds.length >
    0
  ) {
    await prisma.storeOrder.deleteMany({
      where: {
        id: {
          in:
            createdOrderIds,
        },
      },
    });
  }

  if (
    testProduct
  ) {
    await prisma.product.deleteMany({
      where: {
        id:
          testProduct.id,
      },
    });
  }
}

// ============================================================
// TESTS
// ============================================================

async function testCutoffRule() {
  // 09:00 UTC = 14:30 Asia/Colombo.
  const beforeCutoff =
    evaluateStoreOrderCutoff(
      new Date(
        "2026-10-03T09:00:00.000Z"
      )
    );

  assert.equal(
    beforeCutoff.cutoffDecision,
    "ON_TIME"
  );

  assert.equal(
    beforeCutoff.status,
    "SUBMITTED"
  );

  assert.equal(
    beforeCutoff
      .effectiveDispatchDate
      .toISOString()
      .slice(
        0,
        10
      ),
    "2026-10-04"
  );

  // 10:30 UTC = 16:00 Asia/Colombo.
  const atCutoff =
    evaluateStoreOrderCutoff(
      new Date(
        "2026-10-03T10:30:00.000Z"
      )
    );

  assert.equal(
    atCutoff.cutoffDecision,
    "AFTER_CUTOFF"
  );

  assert.equal(
    atCutoff.status,
    "DEFERRED"
  );

  assert.equal(
    atCutoff
      .effectiveDispatchDate
      .toISOString()
      .slice(
        0,
        10
      ),
    "2026-10-05"
  );
}

async function testAuthenticationRequired() {
  const response =
    await request(app)
      .get(
        `${API_BASE}/orders`
      );

  assert.equal(
    response.status,
    401
  );

  assertFailure(
    response
  );
}

async function testCatalog() {
  // The catalog is now server-side paginated (20 items/page).
  // Search by the exact test SKU so this regression test verifies
  // accessibility of the fixture instead of assuming it appears
  // on the first unfiltered page.
  const token =
    createAccessToken(
      storeManager
    );

  const response =
    await request(app)
      .get(
        `${API_BASE}/catalog`
      )
      .query({
        orderType:
          "AMBIENT_DRY",

        search:
          testProduct.sku,

        page:
          1,

        pageSize:
          20,
      })
      .set(
        "Authorization",
        bearerToken(
          token
        )
      );

  assert.equal(
    response.status,
    200
  );

  assertSuccess(
    response
  );

  assert.ok(
    Array.isArray(
      response.body.data
        .products
    )
  );

  assert.ok(
    response.body.data
      .products
      .some(
        (product) =>
          product.id ===
          testProduct.id
      )
  );
}

async function testCreateOrderIgnoresForgedOutlet() {
  const token =
    createAccessToken(
      storeManager
    );

  const response =
    await request(app)
      .post(
        `${API_BASE}/orders`
      )
      .set(
        "Authorization",
        bearerToken(
          token
        )
      )
      .send({
        // These values must be ignored by the backend.
        outletId:
          alternativeOutlet.id,

        outletCode:
          alternativeOutlet.outletCode,

        role:
          "ADMIN",

        orderType:
          "AMBIENT_DRY",

        items: [
          {
            productId:
              testProduct.id,

            quantity:
              3,
          },
        ],
      });

  assert.equal(
    response.status,
    201
  );

  assertSuccess(
    response
  );

  const createdOrder =
    response.body.data
      .order;

  createdOrderIds.push(
    createdOrder.id
  );

  const databaseOrder =
    await prisma.storeOrder.findUnique({
      where: {
        id:
          createdOrder.id,
      },
    });

  assert.equal(
    databaseOrder.outletId,
    storeManager.outlet.id
  );

  assert.notEqual(
    databaseOrder.outletId,
    alternativeOutlet.id
  );

  assert.equal(
    databaseOrder.createdByUserId,
    storeManager.id
  );

  return createdOrder;
}

async function testListAndDetails(
  createdOrder
) {
  const token =
    createAccessToken(
      storeManager
    );

  const listResponse =
    await request(app)
      .get(
        `${API_BASE}/orders`
      )
      .set(
        "Authorization",
        bearerToken(
          token
        )
      );

  assert.equal(
    listResponse.status,
    200
  );

  assertSuccess(
    listResponse
  );

  assert.ok(
    listResponse.body.data
      .orders
      .some(
        (order) =>
          order.orderCode ===
          createdOrder.orderCode
      )
  );

  const detailResponse =
    await request(app)
      .get(
        `${API_BASE}/orders/${createdOrder.orderCode}`
      )
      .set(
        "Authorization",
        bearerToken(
          token
        )
      );

  assert.equal(
    detailResponse.status,
    200
  );

  assertSuccess(
    detailResponse
  );

  assert.equal(
    detailResponse.body.data
      .order.orderCode,
    createdOrder.orderCode
  );

  assert.equal(
    detailResponse.body.data
      .order.items[0]
      .product.id,
    testProduct.id
  );
}

async function testDifferentOutletOrderIsHidden() {
  const foreignOrder =
    await prisma.storeOrder.create({
      data: {
        orderCode:
          `TEST-FOREIGN-${Date.now()}`,

        outletId:
          alternativeOutlet.id,

        createdByUserId:
          storeManager.id,

        status:
          "SUBMITTED",

        cutoffDecision:
          "ON_TIME",

        submittedAt:
          new Date(),

        requestedDispatchDate:
          new Date(
            "2026-10-04T00:00:00.000Z"
          ),

        effectiveDispatchDate:
          new Date(
            "2026-10-04T00:00:00.000Z"
          ),

        totalUnits:
          1,

        items: {
          create: [
            {
              productId:
                testProduct.id,

              quantity:
                1,
            },
          ],
        },
      },
    });

  createdOrderIds.push(
    foreignOrder.id
  );

  const token =
    createAccessToken(
      storeManager
    );

  const response =
    await request(app)
      .get(
        `${API_BASE}/orders/${foreignOrder.orderCode}`
      )
      .set(
        "Authorization",
        bearerToken(
          token
        )
      );

  assert.equal(
    response.status,
    404
  );

  assertFailure(
    response
  );
}

async function testInvalidQuantityRejected() {
  const token =
    createAccessToken(
      storeManager
    );

  const response =
    await request(app)
      .post(
        `${API_BASE}/orders`
      )
      .set(
        "Authorization",
        bearerToken(
          token
        )
      )
      .send({
        items: [
          {
            productId:
              testProduct.id,

            quantity:
              0,
          },
        ],
      });

  assert.equal(
    response.status,
    400
  );

  assertFailure(
    response
  );

  assert.equal(
    response.body.code,
    "STORE_ORDER_INVALID_QUANTITY"
  );
}

// ============================================================
// RUNNER
// ============================================================

async function run() {
  console.log("");

  console.log(
    "=========================================="
  );

  console.log(
    " Store Manager Order Tests"
  );

  console.log(
    "=========================================="
  );

  let passed =
    0;

  const tests = [
    [
      "Backend 4 PM cutoff is enforced in Asia/Colombo",
      testCutoffRule,
    ],
    [
      "Unauthenticated order request is rejected",
      testAuthenticationRequired,
    ],
    [
      "Authenticated Store Manager can load active catalog",
      testCatalog,
    ],
  ];

  try {
    await connectDatabase();

    await loadFixtures();

    for (
      const [
        name,
        testFunction,
      ]
      of tests
    ) {
      await testFunction();

      passed += 1;

      console.log(
        `✓ ${name}`
      );
    }

    const createdOrder =
      await testCreateOrderIgnoresForgedOutlet();

    passed += 1;

    console.log(
      "✓ Created order uses authenticated outlet and ignores forged outlet data"
    );

    await testListAndDetails(
      createdOrder
    );

    passed += 1;

    console.log(
      "✓ Store Manager can list and read only their order"
    );

    await testDifferentOutletOrderIsHidden();

    passed += 1;

    console.log(
      "✓ Different outlet order is hidden"
    );

    await testInvalidQuantityRejected();

    passed += 1;

    console.log(
      "✓ Invalid item quantity is rejected"
    );

    console.log(
      "------------------------------------------"
    );

    console.log(
      `Passed ${passed}/7 tests`
    );

    console.log(
      "=========================================="
    );
  } finally {
    try {
      await cleanup();
    } finally {
      await disconnectDatabase();
    }
  }
}

run()
  .catch(
    (error) => {
      console.error("");

      console.error(
        "Store Manager order tests failed:"
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );
