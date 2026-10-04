import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import dispatcherRoutes from "../routes/dispatcherRoutes.js";

import {
  createAccessToken,
} from "../utils/jwt.js";

const STORE_MANAGER_USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

const RUN_ID = Date.now();

const createdOrderIds = [];
let createdDispatcherId = null;
let createdLiveTripId = null;

let storeManager = null;
let dispatcher = null;
let ownOutlet = null;
let foreignOutlet = null;

const testApp = express();
testApp.use(express.json());
testApp.use("/api/dispatcher", dispatcherRoutes);

function bearerToken(token) {
  return `Bearer ${token}`;
}

function assertSuccess(response) {
  assert.equal(
    response.body.success,
    true,
    `Expected success=true. Response: ${JSON.stringify(response.body)}`
  );
}

function assertFailure(response) {
  assert.equal(
    response.body.success,
    false,
    `Expected success=false. Response: ${JSON.stringify(response.body)}`
  );
}

function plusDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function loadFixtures() {
  storeManager = await prisma.user.findUnique({
    where: {
      userId: STORE_MANAGER_USER_ID,
    },
    include: {
      outlet: {
        include: {
          depot: true,
        },
      },
    },
  });

  assert.ok(
    storeManager,
    `Store Manager ${STORE_MANAGER_USER_ID} was not found.`
  );

  assert.equal(storeManager.role, "STORE_MANAGER");
  assert.equal(storeManager.isActive, true);
  assert.equal(storeManager.mustChangePassword, false);
  assert.ok(storeManager.outlet?.depot);

  ownOutlet = storeManager.outlet;

  foreignOutlet = await prisma.outlet.findFirst({
    where: {
      isActive: true,
      depotId: {
        not: ownOutlet.depotId,
      },
    },
    include: {
      depot: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  assert.ok(
    foreignOutlet?.depot,
    "A second depot/outlet is required for Dispatcher depot isolation testing."
  );

  dispatcher = await prisma.user.create({
    data: {
      userId: `DSPT${RUN_ID}`,
      fullName: "Stage 10.2 Test Dispatcher",
      email: `dispatcher-${RUN_ID}@example.test`,
      passwordHash: "test-only-not-used-for-login",
      role: "DISPATCHER",
      depotId: ownOutlet.depotId,
      isActive: true,
      mustChangePassword: false,
    },
    include: {
      depot: true,
    },
  });

  createdDispatcherId = dispatcher.id;
}

async function createOrder({
  outletId = ownOutlet.id,
  status = "SUBMITTED",
  suffix,
  effectiveDate = plusDays(new Date(), 1),
}) {
  const order = await prisma.storeOrder.create({
    data: {
      orderCode: `T102-${RUN_ID}-${suffix}`,
      outletId,
      createdByUserId: storeManager.id,
      status,
      orderType: "AMBIENT_DRY",
      cutoffDecision: "ON_TIME",
      submittedAt: new Date(),
      requestedDispatchDate: plusDays(new Date(), 1),
      effectiveDispatchDate: effectiveDate,
      deferredReason:
        status === "DEFERRED"
          ? "Existing test deferral"
          : null,
      totalUnits: 10,
      estimatedWeightKg: "15.000",
      estimatedVolumeM3: "0.250000",
    },
  });

  createdOrderIds.push(order.id);
  return order;
}

async function cleanup() {
  if (createdOrderIds.length > 0) {
    await prisma.storeOrder.deleteMany({
      where: {
        id: {
          in: createdOrderIds,
        },
      },
    });
  }

  if (createdLiveTripId) {
    await prisma.liveTrip.deleteMany({
      where: {
        id: createdLiveTripId,
      },
    });
  }

  if (createdDispatcherId) {
    await prisma.user.deleteMany({
      where: {
        id: createdDispatcherId,
      },
    });
  }
}

async function testStoreManagerCannotUseDispatcherOrderApi() {
  const response = await request(testApp)
    .get("/api/dispatcher/orders")
    .set(
      "Authorization",
      bearerToken(createAccessToken(storeManager))
    );

  assert.equal(response.status, 403);
  assertFailure(response);
}

async function testDispatcherDepotIsolation() {
  const ownOrder = await createOrder({
    suffix: "OWN-LIST",
  });

  const foreignOrder = await createOrder({
    outletId: foreignOutlet.id,
    suffix: "FOREIGN-LIST",
  });

  const token = createAccessToken(dispatcher);

  const listResponse = await request(testApp)
    .get("/api/dispatcher/orders")
    .query({
      status: "ALL",
      search: `T102-${RUN_ID}`,
    })
    .set("Authorization", bearerToken(token));

  assert.equal(listResponse.status, 200);
  assertSuccess(listResponse);

  const codes = listResponse.body.data.orders.map(
    (order) => order.orderCode
  );

  assert.ok(codes.includes(ownOrder.orderCode));
  assert.ok(!codes.includes(foreignOrder.orderCode));

  const forgedDepotResponse = await request(testApp)
    .get("/api/dispatcher/orders")
    .query({
      depotCode: foreignOutlet.depot.code,
    })
    .set("Authorization", bearerToken(token));

  assert.equal(forgedDepotResponse.status, 403);
  assertFailure(forgedDepotResponse);

  const foreignDetailResponse = await request(testApp)
    .get(`/api/dispatcher/orders/${foreignOrder.orderCode}`)
    .set("Authorization", bearerToken(token));

  assert.equal(foreignDetailResponse.status, 404);
  assertFailure(foreignDetailResponse);
}

async function testDispatcherCanConfirmSubmittedOrder() {
  const order = await createOrder({
    suffix: "CONFIRM",
  });

  const token = createAccessToken(dispatcher);

  const response = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/confirm`)
    .set("Authorization", bearerToken(token));

  assert.equal(response.status, 200);
  assertSuccess(response);
  assert.equal(response.body.data.order.status, "CONFIRMED");
  assert.equal(response.body.data.transition.idempotent, false);

  const persisted = await prisma.storeOrder.findUnique({
    where: {
      id: order.id,
    },
    include: {
      dispatcherDecisions: true,
    },
  });

  assert.equal(persisted.status, "CONFIRMED");
  assert.equal(persisted.dispatcherDecisions.length, 1);
  assert.equal(
    persisted.dispatcherDecisions[0].decision,
    "CONFIRMED"
  );

  const retry = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/confirm`)
    .set("Authorization", bearerToken(token));

  assert.equal(retry.status, 200);
  assertSuccess(retry);
  assert.equal(retry.body.data.transition.idempotent, true);

  const decisionCount = await prisma.storeOrderDecision.count({
    where: {
      storeOrderId: order.id,
    },
  });

  assert.equal(
    decisionCount,
    1,
    "Idempotent confirm retry must not create a duplicate audit decision."
  );
}

async function testDispatcherCanDeferWithReasonAndNextDate() {
  const order = await createOrder({
    suffix: "DEFER",
  });

  const nextDeliveryDate = plusDays(
    order.effectiveDispatchDate,
    1
  );

  const token = createAccessToken(dispatcher);

  const response = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/defer`)
    .send({
      reason: "Vehicle capacity is unavailable for the current delivery run.",
      nextDeliveryDate: dateOnly(nextDeliveryDate),
    })
    .set("Authorization", bearerToken(token));

  assert.equal(response.status, 200);
  assertSuccess(response);
  assert.equal(response.body.data.order.status, "DEFERRED");
  assert.match(
    response.body.data.order.deferredReason,
    /vehicle capacity/i
  );
  assert.equal(
    response.body.data.order.effectiveDispatchDate,
    dateOnly(nextDeliveryDate)
  );

  const persisted = await prisma.storeOrder.findUnique({
    where: {
      id: order.id,
    },
    include: {
      dispatcherDecisions: {
        orderBy: {
          decidedAt: "asc",
        },
      },
    },
  });

  assert.equal(persisted.status, "DEFERRED");
  assert.equal(persisted.dispatcherDecisions.length, 1);
  assert.equal(
    persisted.dispatcherDecisions[0].decision,
    "DEFERRED"
  );

  const reconfirmResponse = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/confirm`)
    .set("Authorization", bearerToken(token));

  assert.equal(reconfirmResponse.status, 200);
  assertSuccess(reconfirmResponse);
  assert.equal(
    reconfirmResponse.body.data.order.status,
    "CONFIRMED"
  );
  assert.equal(
    reconfirmResponse.body.data.order.deferredReason,
    null
  );
  assert.equal(
    reconfirmResponse.body.data.order.effectiveDispatchDate,
    dateOnly(nextDeliveryDate)
  );

  const decisions = await prisma.storeOrderDecision.findMany({
    where: {
      storeOrderId: order.id,
    },
    orderBy: {
      decidedAt: "asc",
    },
  });

  assert.equal(decisions.length, 2);
  assert.equal(decisions[0].decision, "DEFERRED");
  assert.equal(decisions[1].decision, "CONFIRMED");
}

async function testDeferralValidation() {
  const order = await createOrder({
    suffix: "DEFER-VALIDATION",
  });

  const token = createAccessToken(dispatcher);

  const missingReason = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/defer`)
    .send({
      nextDeliveryDate: dateOnly(
        plusDays(order.effectiveDispatchDate, 1)
      ),
    })
    .set("Authorization", bearerToken(token));

  assert.equal(missingReason.status, 400);
  assertFailure(missingReason);

  const sameDate = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/defer`)
    .send({
      reason: "Test reason",
      nextDeliveryDate: dateOnly(order.effectiveDispatchDate),
    })
    .set("Authorization", bearerToken(token));

  assert.equal(sameDate.status, 400);
  assertFailure(sameDate);
}

async function testConfirmedAllocatedOrderCannotBeDeferred() {
  const order = await createOrder({
    status: "CONFIRMED",
    suffix: "ALLOCATED",
  });

  const trip = await prisma.liveTrip.create({
    data: {
      tripCode: `T102-TRIP-${RUN_ID}`,
      deliveryDate: order.effectiveDispatchDate,
      depotId: ownOutlet.depotId,
      vehicleCode: `T102-VEH-${RUN_ID}`,
      driverName: "Stage 10.2 Test Driver",
      status: "PLANNED",
      progressTotal: 1,
      stops: {
        create: {
          stopCode: `T102-STOP-${RUN_ID}`,
          sequence: 1,
          outletCode: ownOutlet.outletCode,
          outletName: ownOutlet.brand,
          district: ownOutlet.district,
          status: "PENDING",
        },
      },
    },
    include: {
      stops: true,
    },
  });

  createdLiveTripId = trip.id;

  await prisma.deliveryAllocation.create({
    data: {
      storeOrderId: order.id,
      liveTripStopId: trip.stops[0].id,
      status: "ALLOCATED",
      allocatedUnits: order.totalUnits,
    },
  });

  const response = await request(testApp)
    .post(`/api/dispatcher/orders/${order.orderCode}/defer`)
    .send({
      reason: "Attempt to defer an already allocated order.",
      nextDeliveryDate: dateOnly(
        plusDays(order.effectiveDispatchDate, 1)
      ),
    })
    .set(
      "Authorization",
      bearerToken(createAccessToken(dispatcher))
    );

  assert.equal(response.status, 409);
  assertFailure(response);
  assert.equal(
    response.body.code,
    "DISPATCHER_ORDER_HAS_ACTIVE_ALLOCATION"
  );
}

async function run() {
  console.log("");
  console.log("==========================================");
  console.log(" Dispatcher Order Handoff Tests");
  console.log("==========================================");

  let passed = 0;

  try {
    await connectDatabase();
    console.log("✓ Database connected: nexora_waypoint");

    await loadFixtures();

    const tests = [
      [
        "Store Manager cannot use Dispatcher order APIs",
        testStoreManagerCannotUseDispatcherOrderApi,
      ],
      [
        "Dispatcher can see only Store Manager orders from the authenticated depot",
        testDispatcherDepotIsolation,
      ],
      [
        "Dispatcher can confirm a submitted order with idempotent retry protection",
        testDispatcherCanConfirmSubmittedOrder,
      ],
      [
        "Dispatcher can defer an order with reason/date and later confirm it",
        testDispatcherCanDeferWithReasonAndNextDate,
      ],
      [
        "Dispatcher deferral requires a reason and a later delivery date",
        testDeferralValidation,
      ],
      [
        "Confirmed order with an active delivery allocation cannot be deferred",
        testConfirmedAllocatedOrderCannotBeDeferred,
      ],
    ];

    for (const [name, testFunction] of tests) {
      await testFunction();
      passed += 1;
      console.log(`✓ ${name}`);
    }

    console.log("------------------------------------------");
    console.log(`Passed ${passed}/${tests.length} tests`);
    console.log("==========================================");
  } finally {
    try {
      await cleanup();
    } finally {
      await disconnectDatabase();
    }
  }
}

run().catch((error) => {
  console.error("");
  console.error("Dispatcher order handoff tests failed:");
  console.error(error);
  process.exitCode = 1;
});
