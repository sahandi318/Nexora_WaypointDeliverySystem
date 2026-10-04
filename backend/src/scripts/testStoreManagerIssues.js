import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  StoreManagerIssueError,
  createStoreManagerIssue,
  listStoreManagerIssues,
  resolveStoreManagerIssue,
} from "../services/storeManagerIssueService.js";

const USER_ID = process.env.TEST_STORE_MANAGER_USER_ID || "SM001";
const createdOrderIds = [];

function shortId() {
  return randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

function dateOnlyToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function buildContext(storeManager) {
  return {
    userDatabaseId: storeManager.id,
    userId: storeManager.userId,
    fullName: storeManager.fullName,
    role: storeManager.role,
    outletDatabaseId: storeManager.outlet.id,
    outletCode: storeManager.outlet.outletCode,
    outletIsActive: storeManager.outlet.isActive,
    depot: storeManager.outlet.depot
      ? {
          id: storeManager.outlet.depot.id,
          code: storeManager.outlet.depot.code,
          name: storeManager.outlet.depot.name,
        }
      : null,
  };
}

async function createOrder({ outletId, createdByUserId, orderCode }) {
  const date = dateOnlyToday();
  const order = await prisma.storeOrder.create({
    data: {
      orderCode,
      outletId,
      createdByUserId,
      status: "CONFIRMED",
      orderType: "AMBIENT_DRY",
      cutoffDecision: "ON_TIME",
      submittedAt: new Date(),
      requestedDispatchDate: date,
      effectiveDispatchDate: date,
      totalUnits: 5,
      estimatedWeightKg: 5,
      estimatedVolumeM3: 0.1,
    },
  });
  createdOrderIds.push(order.id);
  return order;
}

async function expectIssueError(promise, expectedCode) {
  await assert.rejects(
    promise,
    (error) => {
      assert.ok(error instanceof StoreManagerIssueError);
      assert.equal(error.code, expectedCode);
      return true;
    }
  );
}

async function cleanup() {
  if (createdOrderIds.length > 0) {
    await prisma.storeOrder.deleteMany({
      where: { id: { in: createdOrderIds } },
    });
  }
}

async function main() {
  console.log("\n==========================================");
  console.log(" Store Manager Real Issue Lifecycle Tests");
  console.log("==========================================");

  try {
    await connectDatabase();

    const storeManager = await prisma.user.findUnique({
      where: { userId: USER_ID },
      include: {
        outlet: { include: { depot: true } },
      },
    });

    assert.ok(storeManager?.outlet, `${USER_ID} with an outlet is required.`);

    const otherOutlet = await prisma.outlet.findFirst({
      where: {
        id: { not: storeManager.outlet.id },
        isActive: true,
      },
      orderBy: { id: "asc" },
    });
    assert.ok(otherOutlet, "A second active outlet is required.");

    const context = buildContext(storeManager);
    const suffix = shortId();

    const ownOrder = await createOrder({
      outletId: storeManager.outlet.id,
      createdByUserId: storeManager.id,
      orderCode: `ISS-OWN-${suffix}`,
    });

    const foreignOrder = await createOrder({
      outletId: otherOutlet.id,
      createdByUserId: storeManager.id,
      orderCode: `ISS-FOREIGN-${suffix}`,
    });

    const created = await createStoreManagerIssue(context, {
      orderCode: ownOrder.orderCode,
      category: "DELIVERY_SHORTFALL",
      description: "Two cartons were not delivered with the shipment.",
    });

    assert.equal(created.status, "OPEN");
    assert.equal(created.order.orderCode, ownOrder.orderCode);
    console.log("PASS Store Manager can create a real OPEN issue for own outlet order");

    const openList = await listStoreManagerIssues(context, { status: "OPEN" });
    assert.ok(openList.issues.some((item) => item.issueCode === created.issueCode));
    assert.ok(openList.summary.open >= 1);
    console.log("PASS issue list and OPEN summary use persisted issue records");

    await expectIssueError(
      createStoreManagerIssue(context, {
        orderCode: foreignOrder.orderCode,
        category: "OTHER",
        description: "This must not be visible across outlet boundaries.",
      }),
      "STORE_MANAGER_ISSUE_ORDER_NOT_FOUND"
    );
    console.log("PASS issue creation preserves Store Manager own-outlet isolation");

    const resolved = await resolveStoreManagerIssue(context, created.issueCode, {
      resolutionNote: "Shortfall was reconciled with the delivery team.",
    });
    assert.equal(resolved.issue.status, "RESOLVED");
    assert.equal(resolved.alreadyResolved, false);
    assert.ok(resolved.issue.resolvedAt);
    console.log("PASS OPEN issue can be persisted as RESOLVED with audit details");

    const repeated = await resolveStoreManagerIssue(context, created.issueCode, {
      resolutionNote: "Should not overwrite existing resolution.",
    });
    assert.equal(repeated.alreadyResolved, true);
    assert.equal(repeated.issue.status, "RESOLVED");
    console.log("PASS repeated resolution is idempotent");

    const finalList = await listStoreManagerIssues(context);
    const persisted = finalList.issues.find((item) => item.issueCode === created.issueCode);
    assert.equal(persisted.status, "RESOLVED");
    assert.ok(finalList.summary.resolved >= 1);
    console.log("PASS resolved lifecycle is returned by real issue API data");

    console.log("------------------------------------------");
    console.log("Passed Store Manager real issue lifecycle regression tests");
  } finally {
    await cleanup();
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
