import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  DeliveryIntegrationError,
  allocateConfirmedStoreOrderToStop,
  cancelDeliveryAllocation,
  deriveStoreManagerDeliveryStatus,
  getActiveDeliveryAllocationForOrder,
  publishDeliveryAllocation,
} from "../services/deliveryIntegrationService.js";

const USER_ID =
  process.env.TEST_STORE_MANAGER_USER_ID ||
  "SM001";

const createdOrderIds = [];
let createdTripId = null;

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

async function expectIntegrationError(
  promise,
  expectedCode
) {
  await assert.rejects(
    promise,
    (error) => {
      assert.ok(
        error instanceof DeliveryIntegrationError
      );
      assert.equal(
        error.code,
        expectedCode
      );
      return true;
    }
  );
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
      "A second active outlet is required for outlet-isolation testing."
    );

    const suffix = shortId();
    const deliveryDate = dateOnlyToday();

    const trip = await prisma.liveTrip.create({
      data: {
        tripCode: `T10-${suffix}`,
        deliveryDate,
        depotId: storeManager.outlet.depotId,
        vehicleCode: `TEST-${suffix}`,
        vehicleType: "Stage 10 Test Vehicle",
        temperature: "Ambient",
        driverName: "Stage 10 Test Driver",
        status: "PLANNED",
        progressCompleted: 0,
        progressTotal: 3,
        nextDestination: storeManager.outlet.outletCode,
        eta: "10:30 AM",
      },
    });

    createdTripId = trip.id;

    const matchingStop = await prisma.liveTripStop.create({
      data: {
        stopCode: `S10-A-${suffix}`,
        liveTripId: trip.id,
        sequence: 1,
        outletCode: storeManager.outlet.outletCode,
        outletName: storeManager.outlet.brand,
        district: storeManager.outlet.district,
        plannedEta: "10:30 AM",
        status: "PENDING",
      },
    });

    const secondMatchingStop = await prisma.liveTripStop.create({
      data: {
        stopCode: `S10-B-${suffix}`,
        liveTripId: trip.id,
        sequence: 2,
        outletCode: storeManager.outlet.outletCode,
        outletName: storeManager.outlet.brand,
        district: storeManager.outlet.district,
        plannedEta: "10:45 AM",
        status: "PENDING",
      },
    });

    const wrongOutletStop = await prisma.liveTripStop.create({
      data: {
        stopCode: `S10-X-${suffix}`,
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
        orderCode: `T10-C-${suffix}`,
        outletId: storeManager.outlet.id,
        createdByUserId: storeManager.id,
        status: "CONFIRMED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "ON_TIME",
        submittedAt: new Date(),
        requestedDispatchDate: deliveryDate,
        effectiveDispatchDate: deliveryDate,
        totalUnits: 12,
        estimatedWeightKg: 24.5,
        estimatedVolumeM3: 0.42,
      },
    });

    createdOrderIds.push(confirmedOrder.id);

    const submittedOrder = await prisma.storeOrder.create({
      data: {
        orderCode: `T10-S-${suffix}`,
        outletId: storeManager.outlet.id,
        createdByUserId: storeManager.id,
        status: "SUBMITTED",
        orderType: "AMBIENT_DRY",
        cutoffDecision: "ON_TIME",
        submittedAt: new Date(),
        requestedDispatchDate: deliveryDate,
        effectiveDispatchDate: deliveryDate,
        totalUnits: 4,
        estimatedWeightKg: 4,
        estimatedVolumeM3: 0.1,
      },
    });

    createdOrderIds.push(submittedOrder.id);

    // --------------------------------------------------------
    // Pure status projection
    // --------------------------------------------------------

    assert.equal(
      deriveStoreManagerDeliveryStatus({
        orderStatus: "SUBMITTED",
      }),
      "AWAITING_DISPATCHER"
    );

    assert.equal(
      deriveStoreManagerDeliveryStatus({
        orderStatus: "CONFIRMED",
      }),
      "AWAITING_PLAN"
    );

    assert.equal(
      deriveStoreManagerDeliveryStatus({
        orderStatus: "CONFIRMED",
        allocationStatus: "PUBLISHED",
        tripStatus: "ON_ROUTE",
        stopStatus: "NEXT_STOP",
      }),
      "ARRIVING"
    );

    assert.equal(
      deriveStoreManagerDeliveryStatus({
        orderStatus: "CONFIRMED",
        allocationStatus: "PUBLISHED",
        tripStatus: "ON_ROUTE",
        stopStatus: "COMPLETED",
        stopOutcome: "PARTIAL_DELIVERY",
      }),
      "PARTIAL"
    );

    console.log(
      "✓ Store Manager delivery statuses are derived from shared order/trip/stop state"
    );

    // --------------------------------------------------------
    // Unconfirmed order cannot enter delivery allocation
    // --------------------------------------------------------

    await expectIntegrationError(
      allocateConfirmedStoreOrderToStop({
        orderCode: submittedOrder.orderCode,
        stopCode: matchingStop.stopCode,
      }),
      "DELIVERY_ORDER_NOT_CONFIRMED"
    );

    console.log(
      "✓ unconfirmed Store Manager order cannot be allocated to a trip"
    );

    // --------------------------------------------------------
    // Cross-outlet allocation must be rejected
    // --------------------------------------------------------

    await expectIntegrationError(
      allocateConfirmedStoreOrderToStop({
        orderCode: confirmedOrder.orderCode,
        stopCode: wrongOutletStop.stopCode,
      }),
      "DELIVERY_OUTLET_MISMATCH"
    );

    console.log(
      "✓ order cannot be allocated to another outlet's delivery stop"
    );

    // --------------------------------------------------------
    // Valid allocation uses server-side order totals
    // --------------------------------------------------------

    const allocation = await allocateConfirmedStoreOrderToStop({
      orderCode: confirmedOrder.orderCode,
      stopCode: matchingStop.stopCode,
    });

    assert.equal(allocation.status, "ALLOCATED");
    assert.equal(allocation.allocatedUnits, 12);
    assert.equal(
      allocation.order.outlet.outletCode,
      storeManager.outlet.outletCode
    );
    assert.equal(
      allocation.stop.outletCode,
      storeManager.outlet.outletCode
    );
    assert.equal(
      allocation.trip.tripCode,
      trip.tripCode
    );

    console.log(
      "✓ confirmed order is safely bridged to its matching live trip stop"
    );

    // --------------------------------------------------------
    // Idempotent same-pair allocation
    // --------------------------------------------------------

    const repeated = await allocateConfirmedStoreOrderToStop({
      orderCode: confirmedOrder.orderCode,
      stopCode: matchingStop.stopCode,
    });

    assert.equal(repeated.id, allocation.id);

    await expectIntegrationError(
      allocateConfirmedStoreOrderToStop({
        orderCode: confirmedOrder.orderCode,
        stopCode: secondMatchingStop.stopCode,
      }),
      "DELIVERY_ORDER_ALREADY_ALLOCATED"
    );

    console.log(
      "✓ duplicate planning is idempotent and a second active allocation is blocked"
    );

    // --------------------------------------------------------
    // Publish allocation
    // --------------------------------------------------------

    const published = await publishDeliveryAllocation(
      allocation.id
    );

    assert.equal(published.status, "PUBLISHED");
    assert.ok(published.publishedAt);
    assert.equal(
      published.deliveryStatus,
      "SCHEDULED"
    );

    const active = await getActiveDeliveryAllocationForOrder(
      confirmedOrder.orderCode
    );

    assert.equal(active?.id, allocation.id);

    console.log(
      "✓ allocation can be published and read as the active Store Manager delivery link"
    );

    // --------------------------------------------------------
    // Cancellation releases order for reallocation
    // --------------------------------------------------------

    const cancelled = await cancelDeliveryAllocation(
      allocation.id,
      "Test re-plan to another stop."
    );

    assert.equal(cancelled.status, "CANCELLED");
    assert.ok(cancelled.cancelledAt);

    const reallocated = await allocateConfirmedStoreOrderToStop({
      orderCode: confirmedOrder.orderCode,
      stopCode: secondMatchingStop.stopCode,
    });

    assert.equal(reallocated.status, "ALLOCATED");
    assert.equal(
      reallocated.stop.stopCode,
      secondMatchingStop.stopCode
    );

    console.log(
      "✓ cancelled allocation releases the order for safe dispatcher re-planning"
    );

    console.log("------------------------------------------");
    console.log("Passed Stage 10.1 delivery integration foundation tests");
  } finally {
    if (createdTripId) {
      await prisma.liveTrip.deleteMany({
        where: {
          id: createdTripId,
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

    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error("\nStage 10.1 delivery integration test failed.");
  console.error(error);
  process.exitCode = 1;
});
