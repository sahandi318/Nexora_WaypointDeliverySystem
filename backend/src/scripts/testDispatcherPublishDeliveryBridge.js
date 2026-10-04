import assert from "node:assert/strict";

import prisma from "../config/database.js";
import { state } from "../mockData.js";
import { publishDispatcherPlan } from "../services/dispatcherPlanningService.js";
import { getOrganizerVehicleRows } from "../services/organizerOperationalDataService.js";
import { listStoreManagerDeliveries } from "../services/storeManagerDeliveryService.js";

const createdOrderIds = [];
const createdTripCodes = [];

function todayUtcDate() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

async function main() {
  console.log("\n==========================================");
  console.log(" Dispatcher Publish -> Store Manager Bridge");
  console.log("==========================================");

  const dispatcher = await prisma.user.findFirst({
    where: {
      role: "DISPATCHER",
      isActive: true,
      mustChangePassword: false,
      depotId: { not: null },
    },
    include: { depot: true },
    orderBy: { id: "asc" },
  });

  assert.ok(
    dispatcher?.depot,
    "Fixture required: active depot-assigned Dispatcher"
  );

  const [outlet, driver, storeManager] = await Promise.all([
    prisma.outlet.findFirst({
      where: {
        depotId: dispatcher.depotId,
        isActive: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.user.findFirst({
      where: {
        role: "DRIVER",
        isActive: true,
        depotId: dispatcher.depotId,
      },
      include: { depot: true },
      orderBy: { id: "asc" },
    }),
    prisma.user.findFirst({
      where: {
        role: "STORE_MANAGER",
        isActive: true,
      },
      orderBy: { id: "asc" },
    }),
  ]);

  assert.ok(outlet, "Fixture required: active outlet in Dispatcher depot");
  assert.ok(driver, "Fixture required: active Driver in Dispatcher depot");
  assert.ok(storeManager, "Fixture required: active Store Manager");

  const organizerVehicles = await getOrganizerVehicleRows();
  const requiresVan = String(outlet.parkingConstraint || "")
    .toLowerCase()
    .includes("van_only");
  const vehicle = organizerVehicles.find(
    (row) =>
      row.depot === dispatcher.depot.name &&
      (!requiresVan || String(row.type).toLowerCase() === "van")
  );
  assert.ok(vehicle, "Fixture required: compatible organizer vehicle in Dispatcher depot");

  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const order = await prisma.storeOrder.create({
    data: {
      orderCode: `TEST-BRIDGE-${runId}`,
      outletId: outlet.id,
      createdByUserId: storeManager.id,
      status: "CONFIRMED",
      orderType: "AMBIENT_DRY",
      cutoffDecision: "ON_TIME",
      requestedDispatchDate: todayUtcDate(),
      effectiveDispatchDate: todayUtcDate(),
      totalUnits: 4,
      estimatedWeightKg: 4,
      estimatedVolumeM3: 0.004,
      storeManagerNote: "Phase 1 bridge regression fixture",
    },
  });
  createdOrderIds.push(order.id);

  const result = await publishDispatcherPlan({
    trip: {
      vehicleId: vehicle.vehicle_id,
      orderIds: [order.id],
      driverUserId: driver.id,
    },
    dispatcherUser: dispatcher,
  });
  createdTripCodes.push(result.tripCode);

  assert.equal(result.publishedDeliveryCount, 1);

  const persisted = await prisma.storeOrder.findUnique({
    where: { id: order.id },
    include: {
      outlet: true,
      deliveryAllocations: {
        where: {
          status: {
            in: ["ALLOCATED", "PUBLISHED"],
          },
        },
        include: {
          liveTripStop: {
            include: {
              liveTrip: true,
            },
          },
        },
      },
    },
  });

  assert.ok(persisted, "Published StoreOrder must still exist");
  assert.equal(persisted.status, "CONFIRMED");
  assert.equal(persisted.deliveryAllocations.length, 1);

  const allocation = persisted.deliveryAllocations[0];
  assert.equal(allocation.status, "PUBLISHED");
  assert.equal(allocation.allocatedUnits, persisted.totalUnits);
  assert.ok(allocation.publishedAt);
  assert.equal(allocation.liveTripStop.outletCode, outlet.outletCode);
  assert.equal(allocation.liveTripStop.liveTrip.tripCode, result.tripCode);
  assert.equal(allocation.liveTripStop.liveTrip.driverUserId, driver.id);
  assert.equal(allocation.liveTripStop.liveTrip.depotId, dispatcher.depotId);
  assert.equal(allocation.liveTripStop.liveTrip.vehicleCode, vehicle.vehicle_id);
  assert.ok(allocation.liveTripStop.planningContext);

  const storeManagerDeliveries = await listStoreManagerDeliveries({
    outletDatabaseId: outlet.id,
    outletCode: outlet.outletCode,
  });
  const delivery = storeManagerDeliveries.find(
    (item) => item.orderCode === order.orderCode
  );

  assert.ok(
    delivery,
    "Published order must become visible in Store Manager Deliveries"
  );
  assert.equal(delivery.plan?.allocationStatus, "PUBLISHED");
  assert.equal(delivery.plan?.tripCode, result.tripCode);
  assert.equal(delivery.plan?.stopCode, allocation.liveTripStop.stopCode);

  console.log("PASS published plan creates a PUBLISHED DeliveryAllocation");
  console.log("PASS allocation links StoreOrder -> LiveTripStop -> LiveTrip");
  console.log("PASS Store Manager delivery list sees the published delivery");
  console.log("------------------------------------------");
  console.log("Passed Phase 1 Dispatcher publish bridge regression");
}

main()
  .catch((error) => {
    console.error("FAIL Dispatcher publish bridge:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (createdOrderIds.length) {
        await prisma.storeOrder.deleteMany({
          where: { id: { in: createdOrderIds } },
        });
      }

      if (createdTripCodes.length) {
        await prisma.liveTrip.deleteMany({
          where: { tripCode: { in: createdTripCodes } },
        });

        state.trips = state.trips.filter(
          (trip) => !createdTripCodes.includes(trip.tripId)
        );
      }
    } finally {
      await prisma.$disconnect();
    }
  });
