import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  allocateConfirmedStoreOrderToStop,
  publishDeliveryAllocation,
} from "../services/deliveryIntegrationService.js";

import {
  StoreManagerDeliveryError,
  confirmStoreManagerDeliveryReceived,
  getStoreManagerDeliveryByOrderCode,
} from "../services/storeManagerDeliveryService.js";

const USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID || "SM001";

const createdOrderIds = [];
const createdTripIds = [];

function shortId() {
  return randomUUID()
    .replaceAll("-", "")
    .slice(0, 10)
    .toUpperCase();
}

function dateOnlyToday() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function buildContext(storeManager) {
  return {
    userDatabaseId: storeManager.id,
    userId: storeManager.userId,
    fullName: storeManager.fullName,
    email: storeManager.email,
    role: storeManager.role,
    outletDatabaseId: storeManager.outlet.id,
    outletCode: storeManager.outlet.outletCode,
    brand: storeManager.outlet.brand,
    district: storeManager.outlet.district,
    dockType: storeManager.outlet.dockType,
    parkingConstraint: storeManager.outlet.parkingConstraint,
    mallWindow: storeManager.outlet.mallWindow,
    windowOpenTime: storeManager.outlet.windowOpenTime,
    windowCloseTime: storeManager.outlet.windowCloseTime,
    outletIsActive: storeManager.outlet.isActive,
    depot: storeManager.outlet.depot
      ? {
          id: storeManager.outlet.depot.id,
          code: storeManager.outlet.depot.code,
          name: storeManager.outlet.depot.name,
          district: storeManager.outlet.depot.district,
          isActive: storeManager.outlet.depot.isActive,
        }
      : null,
  };
}

async function expectDeliveryError(promise, expectedCode) {
  await assert.rejects(
    promise,
    (error) => {
      assert.ok(error instanceof StoreManagerDeliveryError);
      assert.equal(error.code, expectedCode);
      return true;
    }
  );
}

async function createPublishedDelivery({
  storeManager,
  orderCode,
  stopCode,
  tripCode,
  outcome,
  status = "COMPLETED",
}) {
  const deliveryDate = dateOnlyToday();

  const trip = await prisma.liveTrip.create({
    data: {
      tripCode,
      deliveryDate,
      depotId: storeManager.outlet.depotId,
      vehicleCode: `VEH-${tripCode.slice(-8)}`,
      vehicleType: "Receipt Test Truck",
      temperature: "Ambient",
      driverName: "Receipt Test Driver",
      status: "COMPLETED",
      progressCompleted: 1,
      progressTotal: 1,
      nextDestination: storeManager.outlet.outletCode,
      isDriverOnline: false,
      lastSynchronized: new Date(),
    },
  });
  createdTripIds.push(trip.id);

  const stop = await prisma.liveTripStop.create({
    data: {
      stopCode,
      liveTripId: trip.id,
      sequence: 1,
      outletCode: storeManager.outlet.outletCode,
      outletName: storeManager.outlet.brand,
      district: storeManager.outlet.district,
      plannedEta: "10:30 AM",
      actualArrival: "10:28 AM",
      status,
      outcome,
    },
  });

  const order = await prisma.storeOrder.create({
    data: {
      orderCode,
      outletId: storeManager.outlet.id,
      createdByUserId: storeManager.id,
      status: "CONFIRMED",
      orderType: "AMBIENT_DRY",
      cutoffDecision: "ON_TIME",
      submittedAt: new Date(),
      requestedDispatchDate: deliveryDate,
      effectiveDispatchDate: deliveryDate,
      totalUnits: 12,
      estimatedWeightKg: 22.5,
      estimatedVolumeM3: 0.35,
    },
  });
  createdOrderIds.push(order.id);

  const allocation = await allocateConfirmedStoreOrderToStop({
    orderCode: order.orderCode,
    stopCode: stop.stopCode,
  });

  await publishDeliveryAllocation(allocation.id);

  return { trip, stop, order, allocation };
}

async function cleanup() {
  if (createdTripIds.length > 0) {
    await prisma.liveTrip.deleteMany({
      where: {
        id: {
          in: createdTripIds,
        },
      },
    });
  }

  if (createdOrderIds.length > 0) {
    await prisma.storeOrder.deleteMany({
      where: {
        id: {
          in: createdOrderIds,
        },
      },
    });
  }
}

async function main() {
  console.log("\n==========================================");
  console.log(" Store Manager Receive / Confirm Tests");
  console.log("==========================================");

  try {
    await connectDatabase();

    const storeManager = await prisma.user.findUnique({
      where: {
        userId: USER_ID,
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
      storeManager?.outlet?.depot,
      `${USER_ID} with an assigned outlet/depot is required.`
    );

    const otherOutlet = await prisma.outlet.findFirst({
      where: {
        id: {
          not: storeManager.outlet.id,
        },
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    assert.ok(otherOutlet, "A second active outlet is required.");

    const context = buildContext(storeManager);
    const suffix = shortId();

    const full = await createPublishedDelivery({
      storeManager,
      orderCode: `RCV-F-${suffix}`,
      stopCode: `RCV-FS-${suffix}`,
      tripCode: `RCV-FT-${suffix}`,
      outcome: "DELIVERED_FULL",
    });

    const fullConfirmation = await confirmStoreManagerDeliveryReceived(
      context,
      full.order.orderCode,
      {
        note: "Received in good condition.",
      }
    );

    assert.equal(fullConfirmation.deliveryStatus, "DELIVERED");
    assert.equal(fullConfirmation.receipt.confirmed, true);
    assert.equal(
      fullConfirmation.receipt.confirmedBy.userId,
      storeManager.userId
    );
    assert.equal(
      fullConfirmation.receipt.note,
      "Received in good condition."
    );

    const fullDetails = await getStoreManagerDeliveryByOrderCode(
      context,
      full.order.orderCode
    );
    assert.equal(fullDetails.receipt.confirmed, true);
    assert.ok(fullDetails.receipt.confirmedAt);
    assert.equal(fullDetails.receipt.canConfirm, false);

    console.log(
      "PASS delivered delivery can be confirmed and receipt persists"
    );

    const repeated = await confirmStoreManagerDeliveryReceived(
      context,
      full.order.orderCode,
      {
        note: "This note must not replace the original confirmation.",
      }
    );

    assert.equal(repeated.alreadyConfirmed, true);
    assert.equal(
      repeated.receipt.note,
      "Received in good condition."
    );

    console.log(
      "PASS repeated confirmation is idempotent and does not duplicate/overwrite receipt"
    );

    const partial = await createPublishedDelivery({
      storeManager,
      orderCode: `RCV-P-${suffix}`,
      stopCode: `RCV-PS-${suffix}`,
      tripCode: `RCV-PT-${suffix}`,
      outcome: "PARTIAL_DELIVERY",
    });

    await expectDeliveryError(
      confirmStoreManagerDeliveryReceived(
        context,
        partial.order.orderCode
      ),
      "STORE_MANAGER_PARTIAL_ACKNOWLEDGEMENT_REQUIRED"
    );

    const partialConfirmation =
      await confirmStoreManagerDeliveryReceived(
        context,
        partial.order.orderCode,
        {
          acknowledgePartial: true,
          note: "Shortage checked before receipt confirmation.",
        }
      );

    assert.equal(partialConfirmation.deliveryStatus, "PARTIAL");
    assert.equal(partialConfirmation.receipt.confirmed, true);

    console.log(
      "PASS partial delivery requires explicit acknowledgement before confirmation"
    );

    const pending = await createPublishedDelivery({
      storeManager,
      orderCode: `RCV-W-${suffix}`,
      stopCode: `RCV-WS-${suffix}`,
      tripCode: `RCV-WT-${suffix}`,
      outcome: null,
      status: "PENDING",
    });

    await prisma.liveTrip.update({
      where: {
        id: pending.trip.id,
      },
      data: {
        status: "PLANNED",
      },
    });

    await expectDeliveryError(
      confirmStoreManagerDeliveryReceived(
        context,
        pending.order.orderCode
      ),
      "STORE_MANAGER_DELIVERY_NOT_RECEIVABLE"
    );

    console.log(
      "PASS scheduled/incomplete delivery cannot be confirmed as received"
    );

    const foreignOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `RCV-X-${suffix}`,
        outletId: otherOutlet.id,
        createdByUserId: storeManager.id,
        status: "CONFIRMED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "ON_TIME",
        submittedAt: new Date(),
        requestedDispatchDate: dateOnlyToday(),
        effectiveDispatchDate: dateOnlyToday(),
        totalUnits: 2,
        estimatedWeightKg: 2,
        estimatedVolumeM3: 0.02,
      },
    });
    createdOrderIds.push(foreignOrder.id);

    await expectDeliveryError(
      confirmStoreManagerDeliveryReceived(
        context,
        foreignOrder.orderCode,
        {
          acknowledgePartial: true,
        }
      ),
      "STORE_MANAGER_DELIVERY_NOT_FOUND"
    );

    console.log(
      "PASS receipt endpoint preserves Store Manager own-outlet isolation"
    );

    console.log("------------------------------------------");
    console.log(
      "Passed Store Manager Receive / Confirm Delivery regression tests"
    );
  } finally {
    await cleanup();
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
