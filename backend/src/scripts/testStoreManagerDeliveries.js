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
  getStoreManagerDeliveryByOrderCode,
  getStoreManagerDeliveryTracking,
  listStoreManagerDeliveries,
} from "../services/storeManagerDeliveryService.js";

const USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

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

async function expectDeliveryError(
  promise,
  expectedCode
) {
  await assert.rejects(
    promise,
    (error) => {
      assert.ok(
        error instanceof StoreManagerDeliveryError
      );
      assert.equal(error.code, expectedCode);
      return true;
    }
  );
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
      storeManager?.outlet,
      `${USER_ID} with an assigned outlet is required.`
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

    assert.ok(
      otherOutlet,
      "A second active outlet is required for isolation testing."
    );

    const context = buildContext(storeManager);
    const suffix = shortId();
    const deliveryDate = dateOnlyToday();

    const trip = await prisma.liveTrip.create({
      data: {
        tripCode: `T103-${suffix}`,
        deliveryDate,
        depotId: storeManager.outlet.depotId,
        vehicleCode: `VEH-${suffix}`,
        vehicleType: "Stage 10.3 Test Truck",
        temperature: "Ambient",
        driverName: "Stage 10.3 Driver",
        status: "ON_ROUTE",
        progressCompleted: 1,
        progressTotal: 3,
        nextDestination: storeManager.outlet.outletCode,
        eta: "10:30 AM",
        isDriverOnline: true,
        currentLat: 6.9271,
        currentLng: 79.8612,
        lastSynchronized: new Date(),
        latestDriverUpdate: "Driver is approaching the outlet.",
        latestDriverUpdateAt: new Date(),
      },
    });

    createdTripIds.push(trip.id);

    await prisma.liveTripStop.create({
      data: {
        stopCode: `T103-BEFORE-${suffix}`,
        liveTripId: trip.id,
        sequence: 1,
        outletCode: otherOutlet.outletCode,
        outletName: otherOutlet.brand,
        district: otherOutlet.district,
        plannedEta: "10:00 AM",
        status: "COMPLETED",
        outcome: "DELIVERED_FULL",
      },
    });

    const ownStop = await prisma.liveTripStop.create({
      data: {
        stopCode: `T103-OWN-${suffix}`,
        liveTripId: trip.id,
        sequence: 2,
        outletCode: storeManager.outlet.outletCode,
        outletName: storeManager.outlet.brand,
        district: storeManager.outlet.district,
        latitude: 6.9300,
        longitude: 79.8600,
        plannedEta: "10:30 AM",
        status: "NEXT_STOP",
      },
    });

    await prisma.liveTripStop.create({
      data: {
        stopCode: `T103-AFTER-${suffix}`,
        liveTripId: trip.id,
        sequence: 3,
        outletCode: otherOutlet.outletCode,
        outletName: otherOutlet.brand,
        district: otherOutlet.district,
        plannedEta: "11:00 AM",
        status: "PENDING",
      },
    });

    const confirmedOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `T103-C-${suffix}`,
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
    createdOrderIds.push(confirmedOrder.id);

    const awaitingPlanOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `T103-W-${suffix}`,
        outletId: storeManager.outlet.id,
        createdByUserId: storeManager.id,
        status: "CONFIRMED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "ON_TIME",
        submittedAt: new Date(),
        requestedDispatchDate: deliveryDate,
        effectiveDispatchDate: deliveryDate,
        totalUnits: 4,
        estimatedWeightKg: 5,
        estimatedVolumeM3: 0.08,
      },
    });
    createdOrderIds.push(awaitingPlanOrder.id);

    const deferredOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `T103-D-${suffix}`,
        outletId: storeManager.outlet.id,
        createdByUserId: storeManager.id,
        status: "DEFERRED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "AFTER_CUTOFF",
        submittedAt: new Date(),
        requestedDispatchDate: deliveryDate,
        effectiveDispatchDate: deliveryDate,
        deferredReason: "Stage 10.3 test deferral",
        totalUnits: 3,
        estimatedWeightKg: 4,
        estimatedVolumeM3: 0.05,
      },
    });
    createdOrderIds.push(deferredOrder.id);

    const foreignOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `T103-X-${suffix}`,
        outletId: otherOutlet.id,
        createdByUserId: storeManager.id,
        status: "CONFIRMED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "ON_TIME",
        submittedAt: new Date(),
        requestedDispatchDate: deliveryDate,
        effectiveDispatchDate: deliveryDate,
        totalUnits: 7,
        estimatedWeightKg: 8,
        estimatedVolumeM3: 0.12,
      },
    });
    createdOrderIds.push(foreignOrder.id);

    const allocation = await allocateConfirmedStoreOrderToStop({
      orderCode: confirmedOrder.orderCode,
      stopCode: ownStop.stopCode,
    });

    await publishDeliveryAllocation(allocation.id);

    const deliveries = await listStoreManagerDeliveries(
      context
    );

    const orderCodes = new Set(
      deliveries.map((delivery) => delivery.orderCode)
    );

    assert.ok(orderCodes.has(confirmedOrder.orderCode));
    assert.ok(orderCodes.has(awaitingPlanOrder.orderCode));
    assert.ok(orderCodes.has(deferredOrder.orderCode));
    assert.ok(!orderCodes.has(foreignOrder.orderCode));

    const trackedSummary = deliveries.find(
      (delivery) =>
        delivery.orderCode === confirmedOrder.orderCode
    );
    assert.equal(trackedSummary.deliveryStatus, "ARRIVING");
    assert.equal(trackedSummary.plan.tripCode, trip.tripCode);

    console.log(
      "✓ delivery list is restricted to the authenticated Store Manager outlet"
    );

    const awaitingSummary = deliveries.find(
      (delivery) =>
        delivery.orderCode === awaitingPlanOrder.orderCode
    );
    assert.equal(
      awaitingSummary.deliveryStatus,
      "AWAITING_PLAN"
    );
    assert.equal(awaitingSummary.plan, null);

    const deferredSummary = deliveries.find(
      (delivery) =>
        delivery.orderCode === deferredOrder.orderCode
    );
    assert.equal(deferredSummary.deliveryStatus, "DEFERRED");
    assert.equal(
      deferredSummary.deferredReason,
      "Stage 10.3 test deferral"
    );

    console.log(
      "✓ confirmed-awaiting-plan and deferred orders are projected without duplicate delivery records"
    );

    const details = await getStoreManagerDeliveryByOrderCode(
      context,
      confirmedOrder.orderCode
    );

    assert.equal(details.orderCode, confirmedOrder.orderCode);
    assert.equal(details.plan.tripCode, trip.tripCode);
    assert.equal(details.outlet.outletCode, context.outletCode);

    await expectDeliveryError(
      getStoreManagerDeliveryByOrderCode(
        context,
        foreignOrder.orderCode
      ),
      "STORE_MANAGER_DELIVERY_NOT_FOUND"
    );

    console.log(
      "✓ delivery detail lookup hides another outlet's order"
    );

    await expectDeliveryError(
      getStoreManagerDeliveryTracking(
        context,
        awaitingPlanOrder.orderCode
      ),
      "STORE_MANAGER_DELIVERY_NOT_PLANNED"
    );

    const tracking = await getStoreManagerDeliveryTracking(
      context,
      confirmedOrder.orderCode
    );

    assert.equal(tracking.deliveryStatus, "ARRIVING");
    assert.equal(tracking.trip.tripCode, trip.tripCode);
    assert.equal(tracking.myStop.stopCode, ownStop.stopCode);
    assert.equal(tracking.myStop.stopsRemainingBeforeOutlet, 0);
    assert.equal(tracking.trip.currentLocation.latitude, 6.9271);

    const serializedTracking = JSON.stringify(tracking);
    assert.ok(
      !serializedTracking.includes(
        `T103-AFTER-${suffix}`
      )
    );
    assert.ok(
      !serializedTracking.includes(
        otherOutlet.outletCode
      )
    );

    console.log(
      "✓ tracking exposes own-stop progress without leaking other outlet route details"
    );

    console.log("------------------------------------------");
    console.log(
      "Passed Stage 10.3 Store Manager delivery API tests"
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
