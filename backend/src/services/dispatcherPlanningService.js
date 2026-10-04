import fs from "node:fs/promises";
import path from "node:path";

import prisma from "../config/database.js";
import { emitMonitoringUpdate } from "./liveMonitoringService.js";

const DATA_DIR = path.resolve(process.cwd(), "../data");

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function readCsv(fileName) {
  const raw = await fs.readFile(path.join(DATA_DIR, fileName), "utf8");
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}

function localDateOnly(dateValue) {
  if (!dateValue) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  return String(dateValue).slice(0, 10);
}

function dateRange(dateValue) {
  const dateText = localDateOnly(dateValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw httpError("A valid delivery date is required.");
  }

  const start = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== dateText) {
    throw httpError("A valid delivery date is required.");
  }

  const end = new Date(`${dateText}T23:59:59.999Z`);
  return { start, end, dateText };
}

function orderTemperature(order) {
  return order.orderType === "CHILLED" ? "Chilled" : "Ambient";
}

function orderRestriction(outlet) {
  const parts = [
    outlet?.parkingConstraint,
    outlet?.dockType,
    outlet?.mallWindow ? `Mall: ${outlet.mallWindow}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Standard access";
}

function orderView(order) {
  const outlet = order.outlet;

  return {
    id: order.id,
    orderId: order.orderCode,
    outletId: outlet?.outletCode || `OUT-${order.outletId}`,
    outletName: outlet?.outletCode || `Outlet ${order.outletId}`,
    brand: outlet?.brand || "Waypoint",
    district: outlet?.district || "—",
    depot: outlet?.depot?.name?.trim() || "—",
    depotId: outlet?.depot?.id || null,
    deliveryWindow:
      outlet?.windowOpenTime && outlet?.windowCloseTime
        ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
        : "Window not set",
    windowOpen: outlet?.windowOpenTime || null,
    windowClose: outlet?.windowCloseTime || null,
    mallWindow: outlet?.mallWindow || null,
    restriction: orderRestriction(outlet),
    outletAccess: orderRestriction(outlet),
    parkingConstraint: outlet?.parkingConstraint || null,
    dockType: outlet?.dockType || null,
    temperature: orderTemperature(order),
    orderType: order.orderType,
    totalUnits: order.totalUnits,
    load: `${order.totalUnits} units`,
    weightKg: Number(order.estimatedWeightKg || 0),
    volumeM3: Number(order.estimatedVolumeM3 || 0),
    weight: `${Number(order.estimatedWeightKg || 0).toFixed(1)} kg`,
    volume: `${Number(order.estimatedVolumeM3 || 0).toFixed(2)} m³`,
    status: order.status === "DEFERRED" ? "Deferred" : "Confirmed",
    previouslyDeferred: order.status === "DEFERRED",
    previousDeferrals: null,
    deferredReason: order.deferredReason || null,
    previousDeferralReason: order.deferredReason || null,
    location: outlet?.district || "—",
  };
}

function vehicleView(vehicle, csvRow, tripsUsed = 0) {
  const maxWeight = Number(vehicle.capacityWeightKg || 0);
  const maxVolume = Number(vehicle.capacityVolumeM3 || 0);
  const temperature = vehicle.refrigerated
    ? "Refrigerated"
    : "Ambient";

  return {
    id: vehicle.id,
    vehicleId: vehicle.vehicleCode,
    type: String(vehicle.vehicleType || "vehicle")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    depot: vehicle.depot?.name?.trim() || "—",
    depotId: vehicle.depotId,
    temperature,
    maxWeightKg: maxWeight,
    maxVolumeM3: maxVolume,
    maxWeight: `${maxWeight.toLocaleString()} kg`,
    maxVolume: `${maxVolume.toFixed(1)} m³`,
    currentLoad: "Not reported",
    tripsLeft: Math.max(0, 2 - tripsUsed),
    availability: tripsUsed >= 2 ? "Unavailable" : "Available",
    capacityGroup: maxWeight >= 5000 ? "HIGH" : maxWeight >= 3500 ? "MEDIUM" : "LOW",
    isSuitable: tripsUsed < 2,
    fuelType: csvRow?.fuel_type || null,
    kmPerL: Number(csvRow?.km_per_l || 0),
    weeklyFuelQuotaL: Number(csvRow?.weekly_fuel_quota_l || 0),
    weeklyFuelQuota: `${Number(csvRow?.weekly_fuel_quota_l || 0)} L`,
    supportedConstraints: [
      ...(vehicle.refrigerated ? ["Refrigerated / chilled loads"] : []),
      ...(String(vehicle.vehicleType || "").toLowerCase().includes("van")
        ? ["Van-only outlets"]
        : []),
    ],
  };
}

function compatibleVehicle(order, vehicle) {
  const needsChilled = order.temperature === "Chilled";
  const isReefer = vehicle.temperature === "Refrigerated";
  const vanOnly = String(order.parkingConstraint || order.dockType || "")
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_")
    .includes("van_only");
  const isVan = String(vehicle.type || "").toLowerCase().includes("van");

  return (!needsChilled || isReefer) && (!vanOnly || isVan);
}

function makeSuggestedTrips(orders, fleet, drivers) {
  const availableOrders = orders.filter((order) => order.status !== "Deferred");
  const remaining = [...availableOrders];
  const trips = [];
  let tripNumber = 1;

  while (remaining.length) {
    const first = remaining[0];
    const sameDepot = remaining.filter((order) => order.depot === first.depot);
    const candidateVehicle =
      fleet.find(
        (vehicle) =>
          vehicle.depot === first.depot &&
          vehicle.availability === "Available" &&
          compatibleVehicle(first, vehicle)
      ) ||
      fleet.find(
        (vehicle) =>
          vehicle.depot === first.depot &&
          vehicle.availability === "Available"
      );

    if (!candidateVehicle) break;

    const capacityOrders = [];
    let weight = 0;
    let volume = 0;

    for (const order of sameDepot) {
      if (capacityOrders.length >= 4) break;
      if (!compatibleVehicle(order, candidateVehicle)) continue;

      const nextWeight = weight + order.weightKg;
      const nextVolume = volume + order.volumeM3;

      if (
        nextWeight <= candidateVehicle.maxWeightKg &&
        nextVolume <= candidateVehicle.maxVolumeM3
      ) {
        capacityOrders.push(order);
        weight = nextWeight;
        volume = nextVolume;
      }
    }

    if (!capacityOrders.length) {
      capacityOrders.push(first);
    }

    const driver =
      drivers.find((item) => item.depot === first.depot) ||
      drivers[0] ||
      null;

    const tripId = `PLAN-${first.depot.replace(/\s+/g, "").toUpperCase()}-${String(
      tripNumber
    ).padStart(2, "0")}`;

    trips.push({
      tripId,
      tripCode: tripId,
      vehicleId: candidateVehicle.vehicleId,
      vehicleType: candidateVehicle.type,
      depot: first.depot,
      driverUserId: driver?.id || null,
      driverName: driver?.name || "Unassigned Driver",
      stops: capacityOrders.length,
      orders: capacityOrders.length,
      departure: first.windowOpen || "After plan publication",
      validation:
        capacityOrders.every((order) => compatibleVehicle(order, candidateVehicle))
          ? "Ready"
          : "Warning",
      capacityUsage: `${weight.toFixed(0)} / ${candidateVehicle.maxWeightKg.toFixed(
        0
      )} kg`,
      stopsList: capacityOrders.map((order, index) => ({
        sequence: index + 1,
        orderId: order.orderId,
        outletId: order.outletId,
        outletName: order.outletName,
        district: order.district,
        deliveryWindow: order.deliveryWindow,
        plannedArrival: order.windowOpen || null,
      })),
      orderIds: capacityOrders.map((order) => order.id),
    });

    const used = new Set(capacityOrders.map((order) => order.id));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (used.has(remaining[index].id)) remaining.splice(index, 1);
    }

    tripNumber += 1;
  }

  return trips;
}

function planInclude() {
  return {
    depot: true,
    trips: {
      include: {
        vehicle: { include: { depot: true } },
        allocations: {
          include: {
            storeOrder: {
              include: {
                outlet: { include: { depot: true } },
              },
            },
          },
          orderBy: { stopSequence: "asc" },
        },
      },
      orderBy: [{ vehicleId: "asc" }, { tripNumber: "asc" }],
    },
  };
}

function plannedTripView(trip, driver = null) {
  const orders = trip.allocations.map(({ storeOrder }) => storeOrder);
  const totalWeightKg = Number(trip.totalWeightKg || 0);
  const totalVolumeM3 = Number(trip.totalVolumeM3 || 0);
  const vehicleWeightKg = Number(trip.vehicle.capacityWeightKg || 0);
  const vehicleVolumeM3 = Number(trip.vehicle.capacityVolumeM3 || 0);

  return {
    id: trip.id,
    tripId: trip.tripCode,
    tripCode: trip.tripCode,
    tripNumber: trip.tripNumber,
    vehicleId: trip.vehicle.vehicleCode,
    vehicleDbId: trip.vehicle.id,
    vehicleType: trip.vehicle.vehicleType,
    depot: trip.vehicle.depot.name,
    depotId: trip.vehicle.depotId,
    driverUserId: driver?.id || null,
    driverName: driver?.fullName || null,
    departure: trip.plannedDeparture || "Not set",
    plannedDeparture: trip.plannedDeparture,
    status: trip.status,
    orders: orders.length,
    stops: orders.length,
    stopsCount: orders.length,
    orderIds: orders.map((order) => order.id),
    stopsList: trip.allocations.map(({ storeOrder, stopSequence }) => ({
      sequence: stopSequence,
      orderId: storeOrder.orderCode,
      storeOrderId: storeOrder.id,
      outletId: storeOrder.outlet.outletCode,
      outletName: storeOrder.outlet.brand,
      district: storeOrder.outlet.district,
      deliveryWindow:
        storeOrder.outlet.windowOpenTime && storeOrder.outlet.windowCloseTime
          ? `${storeOrder.outlet.windowOpenTime} – ${storeOrder.outlet.windowCloseTime}`
          : "Window not set",
      plannedArrival: storeOrder.outlet.windowOpenTime,
    })),
    totalWeightKg,
    totalVolumeM3,
    totalWeight: `${totalWeightKg.toFixed(1)} kg`,
    totalVolume: `${totalVolumeM3.toFixed(2)} m³`,
    capacityUsage: `${totalWeightKg.toFixed(1)} / ${vehicleWeightKg.toFixed(1)} kg · ${totalVolumeM3.toFixed(2)} / ${vehicleVolumeM3.toFixed(2)} m³`,
    validation:
      totalWeightKg <= vehicleWeightKg && totalVolumeM3 <= vehicleVolumeM3
        ? "Ready"
        : "Blocking",
    validationMessages: [],
  };
}

export async function getDispatcherPlanningSnapshot({
  date,
  depotName = null,
  orderId = null,
} = {}) {
  const { start, end, dateText } = dateRange(date);
  const requestedDepot = String(depotName || "").trim();
  const selectedDepot = requestedDepot && requestedDepot !== "ALL"
    ? requestedDepot
    : null;
  const depotRows = selectedDepot
    ? await prisma.depot.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })
    : [];
  const selectedDepotRow = depotRows.find(
    (depot) => depot.name.trim().toLowerCase() === selectedDepot.toLowerCase()
  ) || null;
  if (selectedDepot && !selectedDepotRow) {
    throw httpError("Select an active depot.", 404);
  }
  const orderWhere = {
    effectiveDispatchDate: { gte: start, lte: end },
    status: { in: ["SUBMITTED", "CONFIRMED", "DEFERRED"] },
    ...(selectedDepotRow ? { outlet: { depotId: selectedDepotRow.id } } : {}),
  };

  const [ordersDb, vehicleRows, vehiclesDb, dailyPlans, dailyLiveTrips, driversDb, depots] =
    await Promise.all([
      prisma.storeOrder.findMany({
        where: orderWhere,
        include: { outlet: { include: { depot: true } } },
        orderBy: { submittedAt: "asc" },
      }),
      readCsv("vehicles.csv"),
      prisma.vehicle.findMany({
        where: {
          isActive: true,
          ...(selectedDepotRow ? { depotId: selectedDepotRow.id } : {}),
        },
        include: { depot: true },
        orderBy: { vehicleCode: "asc" },
      }),
      prisma.deliveryPlan.findMany({
        where: {
          deliveryDate: { gte: start, lte: end },
          ...(selectedDepotRow ? { depotId: selectedDepotRow.id } : {}),
        },
        include: planInclude(),
      }),
      prisma.liveTrip.findMany({
        where: {
          deliveryDate: { gte: start, lte: end },
          ...(selectedDepotRow ? { depotId: selectedDepotRow.id } : {}),
        },
        select: {
          tripCode: true,
          vehicleCode: true,
          driverUserId: true,
          driverName: true,
        },
      }),
      prisma.user.findMany({
        where: { role: "DRIVER", isActive: true },
        include: { depot: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.depot.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const csvByVehicle = new Map(vehicleRows.map((row) => [row.vehicle_id, row]));
  const liveTripByCode = new Map(dailyLiveTrips.map((trip) => [trip.tripCode, trip]));
  const plannedTrips = dailyPlans.flatMap((plan) =>
    plan.trips.map((trip) => ({
      ...trip,
      planStatus: plan.status,
      driver:
        driversDb.find(
          (item) => item.id === liveTripByCode.get(trip.tripCode)?.driverUserId
        ) || null,
    }))
  );
  const plannedTripCodes = new Set(plannedTrips.map((trip) => trip.tripCode));
  const tripCountByVehicle = new Map();

  for (const trip of plannedTrips) {
    tripCountByVehicle.set(
      trip.vehicle.vehicleCode,
      (tripCountByVehicle.get(trip.vehicle.vehicleCode) || 0) + 1
    );
  }
  for (const trip of dailyLiveTrips) {
    if (plannedTripCodes.has(trip.tripCode)) continue;
    tripCountByVehicle.set(
      trip.vehicleCode,
      (tripCountByVehicle.get(trip.vehicleCode) || 0) + 1
    );
  }

  let orders = ordersDb.map(orderView);
  let fleet = vehiclesDb.map((vehicle) =>
    vehicleView(
      vehicle,
      csvByVehicle.get(vehicle.vehicleCode),
      tripCountByVehicle.get(vehicle.vehicleCode) || 0
    )
  );
  if (orderId) {
    const requestedOrderId = numericId(orderId, "Order");
    const eligibleOrder = ordersDb.find((order) => order.id === requestedOrderId);
    if (!eligibleOrder || !["SUBMITTED", "CONFIRMED"].includes(eligibleOrder.status)) {
      throw httpError("The selected order is not available for this date and depot.", 404);
    }
    const requirements = {
      temperature: orderTemperature(eligibleOrder),
      vanOnly: isVanOnly(eligibleOrder.outlet),
      weightKg: Number(eligibleOrder.estimatedWeightKg || 0),
      volumeM3: Number(eligibleOrder.estimatedVolumeM3 || 0),
    };
    fleet = fleet.map((vehicle) => {
      const reasons = [];
      if (vehicle.tripsLeft < 1) reasons.push("Vehicle has already used its two trips for this date.");
      if (requirements.temperature === "Chilled" && vehicle.temperature !== "Refrigerated") {
        reasons.push("Order requires a refrigerated vehicle.");
      }
      if (requirements.vanOnly && !vehicle.type.toLowerCase().includes("van")) {
        reasons.push("Outlet requires a van-only vehicle.");
      }
      if (requirements.weightKg > vehicle.maxWeightKg) reasons.push("Order exceeds vehicle weight capacity.");
      if (requirements.volumeM3 > vehicle.maxVolumeM3) reasons.push("Order exceeds vehicle volume capacity.");
      return {
        ...vehicle,
        isSuitable: vehicle.availability === "Available" && reasons.length === 0,
        eligibilityReasons: reasons,
      };
    });
  }
  const drivers = driversDb.map((driver) => ({
    id: driver.id,
    userId: driver.userId,
    name: driver.fullName,
    depot: driver.depot?.name || null,
    depotId: driver.depot?.id || null,
  }));
  const savedTrips = plannedTrips.map((trip) => plannedTripView(trip, trip.driver));
  const deliveryPlan = selectedDepotRow
    ? dailyPlans.find((plan) => plan.depotId === selectedDepotRow.id) || null
    : null;
  const allocatedOrderIds = new Set(
    savedTrips.flatMap((trip) => trip.orderIds)
  );
  orders = orders.map((order) => ({
    ...order,
    allocationStatus: order.status === "Deferred"
      ? "Deferred"
      : allocatedOrderIds.has(order.id)
        ? "Allocated"
        : "Unallocated",
  }));
  const confirmedOrders = orders.filter((order) => order.status === "Confirmed");
  const suggestedTrips = makeSuggestedTrips(orders, fleet, drivers);
  const publicationPreview = [
    {
      id: "loader",
      title: "Loader",
      description: savedTrips.length
        ? `${savedTrips.length} saved trip(s) will be available for loading.`
        : "Save a delivery plan before it can be loaded.",
    },
    {
      id: "driver",
      title: "Driver",
      description: savedTrips.length
        ? "Published trips and their stop sequences are stored for the assigned Drivers."
        : "Publish a saved delivery plan to assign it to a Driver.",
    },
    {
      id: "store-manager",
      title: "Store Manager",
      description: orders.some((order) => order.status === "Deferred")
        ? "Deferred orders retain their recorded reason."
        : "Orders remain scheduled for the selected delivery date.",
    },
  ];

  const summary = {
    confirmedOrders: confirmedOrders.length,
    allocatedOrders: savedTrips.reduce((sum, trip) => sum + trip.orderIds.length, 0),
    unallocatedOrders: confirmedOrders.filter((order) => !allocatedOrderIds.has(order.id)).length,
    deferredOrders: orders.filter((order) => order.status === "Deferred").length,
    plannedTrips: savedTrips.length,
    blockingErrors: savedTrips.filter((trip) => trip.validation === "Blocking").length,
    unassigned: confirmedOrders.filter((order) => !allocatedOrderIds.has(order.id)).length,
    unassignedDrivers: savedTrips.filter((trip) => !trip.driverUserId).length,
    warnings: 0,
    status: deliveryPlan?.status === "PUBLISHED"
      ? "Published"
      : deliveryPlan
        ? "Draft saved"
        : "Draft needed",
  };

  return {
    date: dateText,
    depots,
    orders,
    deferredOrders: orders.filter((order) => order.status === "Deferred"),
    fleet: fleet.map((vehicle) => ({
      ...vehicle,
      isSuitable: vehicle.isSuitable ?? vehicle.availability === "Available",
    })),
    drivers,
    deliveryPlan: deliveryPlan
      ? {
          id: deliveryPlan.id,
          date: dateText,
          depotId: deliveryPlan.depotId,
          depot: deliveryPlan.depot.name.trim(),
          status: deliveryPlan.status,
          publishedAt: deliveryPlan.publishedAt,
          trips: deliveryPlan.trips.map((trip) =>
            plannedTripView(
              trip,
              driversDb.find(
                (item) => item.id === liveTripByCode.get(trip.tripCode)?.driverUserId
              ) || null
            )
          ),
        }
      : null,
    plannedTrips: selectedDepot
      ? (deliveryPlan?.trips || []).map((trip) =>
          plannedTripView(
            trip,
            driversDb.find(
              (item) => item.id === liveTripByCode.get(trip.tripCode)?.driverUserId
            ) || null
          )
        )
      : savedTrips,
    suggestedTrips,
    publicationPreview,
    summary,
  };
}

export async function deferStoreOrder({
  orderId,
  reason,
}) {
  const id = Number(orderId);
  const cleanReason = String(reason || "").trim();
  if (!Number.isInteger(id) || id < 1) {
    throw Object.assign(new Error("A valid order is required."), { status: 400 });
  }
  if (!cleanReason) {
    throw Object.assign(new Error("A deferral reason is required."), { status: 400 });
  }

  const allocation = await prisma.tripOrderAllocation.findFirst({
    where: { storeOrderId: id },
    include: { plannedTrip: { include: { plan: true } } },
  });
  if (allocation) {
    throw Object.assign(new Error("Remove this order from its saved plan before deferring it."), { status: 409 });
  }

  const order = await prisma.storeOrder.findUnique({ where: { id } });
  if (!order || !["SUBMITTED", "CONFIRMED"].includes(order.status)) {
    throw Object.assign(new Error("Only a submitted or confirmed order can be deferred."), { status: 409 });
  }
  return prisma.storeOrder.update({
    where: { id },
    data: { status: "DEFERRED", deferredReason: cleanReason.slice(0, 500) },
  });
}

function httpError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function numericId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw httpError(`${label} must be a valid database ID.`);
  }
  return id;
}

 
function isVanOnly(outlet) {
  return [outlet?.parkingConstraint, outlet?.dockType]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().replaceAll("-", "_").replaceAll(" ", "_").includes("van_only")
    );
}

function dateForDatabase(dateValue) {
  const { start } = dateRange(dateValue);
  return start;
}

async function findDepotByName(database, depotName) {
  const cleanName = String(depotName || "").trim();
  const exactMatch = await database.depot.findFirst({
    where: { name: cleanName },
  });
  if (exactMatch) return exactMatch;

  const depots = await database.depot.findMany();
  return depots.find(
    (depot) => depot.name.trim().toLowerCase() === cleanName.toLowerCase()
  ) || null;
}

export async function saveDispatcherDraft({
  date,
  depot: depotName,
  depotId: submittedDepotId,
  trips,
  dispatcherUser,
}) {
  const { start, end, dateText } = dateRange(date);
  const depotId = submittedDepotId
    ? numericId(submittedDepotId, "Depot")
    : null;
  const cleanDepotName = String(depotName || "").trim();
  if (!depotId && !cleanDepotName) {
    throw httpError("Select one depot before saving the delivery draft.");
  }
  if (!Array.isArray(trips) || trips.length === 0) {
    throw httpError("Add at least one trip with orders before saving the draft.");
  }

  const cleanTrips = trips.map((trip) => ({
    vehicleCode: String(trip?.vehicleId || "").trim(),
    tripNumber: Number(trip?.tripNumber),
    plannedDeparture: String(trip?.plannedDeparture || trip?.departure || "").trim() || null,
    orderIds: Array.isArray(trip?.orderIds)
      ? trip.orderIds.map((id) => numericId(id, "Order"))
      : [],
  }));
  const allOrderIds = cleanTrips.flatMap((trip) => trip.orderIds);
  if (!allOrderIds.length) {
    throw httpError("Add at least one confirmed order to the delivery draft.");
  }
  if (new Set(allOrderIds).size !== allOrderIds.length) {
    throw httpError("An order can only be allocated to one trip in this plan.");
  }

  const seenVehicleTrips = new Set();
  for (const trip of cleanTrips) {
    if (!trip.vehicleCode) throw httpError("Select a vehicle for each trip.");
    if (![1, 2].includes(trip.tripNumber)) {
      throw httpError("Trip number must be 1 or 2.");
    }
    const key = `${trip.vehicleCode}:${trip.tripNumber}`;
    if (seenVehicleTrips.has(key)) {
      throw httpError(`Vehicle ${trip.vehicleCode} has duplicate Trip ${trip.tripNumber} entries.`);
    }
    seenVehicleTrips.add(key);
    if (trip.plannedDeparture && !/^\d{1,2}:\d{2}$/.test(trip.plannedDeparture)) {
      throw httpError(`Enter a valid planned departure time for ${trip.vehicleCode}.`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const depot = depotId
      ? await tx.depot.findUnique({ where: { id: depotId } })
      : await findDepotByName(tx, cleanDepotName);
    if (!depot?.isActive) throw httpError("Select an active depot.", 404);

    const currentPlan = await tx.deliveryPlan.findUnique({
      where: { deliveryDate_depotId: { deliveryDate: start, depotId: depot.id } },
    });
    if (currentPlan?.status === "PUBLISHED") {
      throw httpError("This delivery plan has already been published.", 409);
    }
    const plan = currentPlan || await tx.deliveryPlan.create({
      data: {
        deliveryDate: start,
        depotId: depot.id,
        status: "DRAFT",
        createdByUserId: dispatcherUser?.id || null,
      },
    });

    const vehicles = await tx.vehicle.findMany({
      where: { vehicleCode: { in: [...new Set(cleanTrips.map((trip) => trip.vehicleCode))] } },
      include: { depot: true },
    });
    const vehicleByCode = new Map(vehicles.map((vehicle) => [vehicle.vehicleCode, vehicle]));
    for (const trip of cleanTrips) {
      const vehicle = vehicleByCode.get(trip.vehicleCode);
      if (!vehicle?.isActive) throw httpError(`Vehicle ${trip.vehicleCode} is unavailable.`, 404);
      if (vehicle.depotId !== depot.id) {
        throw httpError(`Vehicle ${trip.vehicleCode} does not belong to ${depot.name}.`);
      }
    }

    const orders = await tx.storeOrder.findMany({
      where: { id: { in: [...new Set(allOrderIds)] } },
      include: { outlet: { include: { depot: true } } },
    });
    const orderById = new Map(orders.map((order) => [order.id, order]));
    if (orders.length !== new Set(allOrderIds).size) {
      throw httpError("One or more selected orders no longer exist.", 404);
    }
    for (const orderId of allOrderIds) {
      const order = orderById.get(orderId);
      if (!order || !["SUBMITTED", "CONFIRMED"].includes(order.status)) {
        throw httpError(`Order ${order?.orderCode || orderId} is deferred or not available for planning.`);
      }
      if (
        order.effectiveDispatchDate.toISOString().slice(0, 10) !== dateText ||
        order.outlet?.depotId !== depot.id
      ) {
        throw httpError(`Order ${order.orderCode} does not belong to ${depot.name} on ${dateText}.`);
      }
    }

    const existingAllocations = await tx.tripOrderAllocation.findMany({
      where: { storeOrderId: { in: allOrderIds } },
      include: { plannedTrip: { select: { planId: true } } },
    });
    if (existingAllocations.some((allocation) => allocation.plannedTrip.planId !== plan.id)) {
      throw httpError("One or more selected orders are already allocated to another plan.", 409);
    }

    const orderIdsByTrip = cleanTrips.map((trip) => trip.orderIds);
    const authoritativeTotals = cleanTrips.map((trip, index) => {
      const vehicle = vehicleByCode.get(trip.vehicleCode);
      const tripOrders = orderIdsByTrip[index].map((id) => orderById.get(id));
      const weightKg = tripOrders.reduce((sum, order) => sum + Number(order.estimatedWeightKg || 0), 0);
      const volumeM3 = tripOrders.reduce((sum, order) => sum + Number(order.estimatedVolumeM3 || 0), 0);
      if (weightKg > Number(vehicle.capacityWeightKg)) {
        throw httpError(
          `Trip ${trip.tripNumber} exceeds ${trip.vehicleCode}'s weight capacity (${weightKg.toFixed(1)} / ${vehicle.capacityWeightKg} kg).`
        );
      }
      if (volumeM3 > Number(vehicle.capacityVolumeM3)) {
        throw httpError(
          `Trip ${trip.tripNumber} exceeds ${trip.vehicleCode}'s volume capacity (${volumeM3.toFixed(2)} / ${vehicle.capacityVolumeM3} m³).`
        );
      }
      for (const order of tripOrders) {
        if (order.orderType === "CHILLED" && !vehicle.refrigerated) {
          throw httpError(`Order ${order.orderCode} requires a refrigerated vehicle.`);
        }
        if (isVanOnly(order.outlet) && !vehicle.vehicleType.toLowerCase().includes("van")) {
          throw httpError(`Order ${order.orderCode} can only be assigned to a van.`);
        }
      }
      return { weightKg, volumeM3 };
    });

    const plannedToday = await tx.plannedTrip.findMany({
      where: {
        plan: { deliveryDate: { gte: start, lte: end } },
        vehicleId: { in: vehicles.map((vehicle) => vehicle.id) },
      },
      include: { plan: { select: { id: true } } },
    });
    const plannedOutsideCurrent = plannedToday.filter((trip) => trip.plan.id !== plan.id);
    const alreadyPlannedCodes = new Set(plannedOutsideCurrent.map((trip) => trip.tripCode));
    const liveToday = await tx.liveTrip.findMany({
      where: {
        deliveryDate: { gte: start, lte: end },
        vehicleCode: { in: vehicles.map((vehicle) => vehicle.vehicleCode) },
      },
      select: { tripCode: true, vehicleCode: true },
    });
    const countToday = new Map();
    for (const trip of plannedOutsideCurrent) {
      countToday.set(trip.vehicleId, (countToday.get(trip.vehicleId) || 0) + 1);
    }
    for (const trip of liveToday) {
      if (alreadyPlannedCodes.has(trip.tripCode)) continue;
      const vehicleId = vehicleByCode.get(trip.vehicleCode)?.id;
      if (vehicleId) countToday.set(vehicleId, (countToday.get(vehicleId) || 0) + 1);
    }
    const requestedTripsPerVehicle = new Map();
    for (const trip of cleanTrips) {
      const vehicleId = vehicleByCode.get(trip.vehicleCode).id;
      requestedTripsPerVehicle.set(vehicleId, (requestedTripsPerVehicle.get(vehicleId) || 0) + 1);
    }
    for (const [vehicleId, requestedCount] of requestedTripsPerVehicle) {
      if ((countToday.get(vehicleId) || 0) + requestedCount > 2) {
        const vehicle = vehicles.find((item) => item.id === vehicleId);
        throw httpError(`${vehicle.vehicleCode} cannot be assigned more than two trips on ${dateText}.`);
      }
    }

    await tx.plannedTrip.deleteMany({ where: { planId: plan.id } });
    for (let index = 0; index < cleanTrips.length; index += 1) {
      const trip = cleanTrips[index];
      const vehicle = vehicleByCode.get(trip.vehicleCode);
      const totals = authoritativeTotals[index];
      await tx.plannedTrip.create({
        data: {
          tripCode: `P${plan.id}V${vehicle.id}T${trip.tripNumber}`,
          planId: plan.id,
          vehicleId: vehicle.id,
          tripNumber: trip.tripNumber,
          plannedDeparture: trip.plannedDeparture,
          status: "PLANNED",
          totalWeightKg: totals.weightKg,
          totalVolumeM3: totals.volumeM3,
          allocations: {
            create: trip.orderIds.map((storeOrderId, sequence) => ({
              storeOrderId,
              stopSequence: sequence + 1,
            })),
          },
        },
      });
    }

    await tx.deliveryPlan.update({
      where: { id: plan.id },
      data: { status: "DRAFT" },
    });

    return tx.deliveryPlan.findUnique({
      where: { id: plan.id },
      include: planInclude(),
    });
  }, { isolationLevel: "Serializable" });

  return {
    stopId: `${tripCode}-STOP${String(index + 1).padStart(2, "0")}`,
    storeOrderId: order.id,
    position: index + 1,
    outletId: outlet?.outletCode || `OUT-${order.outletId}`,
    orderId: order.orderCode,
    district: outlet?.district || "",
    windowOpen: outlet?.windowOpenTime || null,
    windowClose: outlet?.windowCloseTime || null,
    plannedArrival: outlet?.windowOpenTime || null,
    arrivalTime: null,
    tempRequirement: orderTemperature(order),
    expectedUnits: order.totalUnits,
    loadedUnits: order.totalUnits,
    deliveredQuantity: null,
    unloadingPoint: outlet?.dockType || "Standard unloading",
    vehicleAccess: outlet?.parkingConstraint || "Normal access",
    mallWindow: outlet?.mallWindow || null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.latitude}%2C${coords.longitude}`,
    destination: coords,
    etaMinutes: null,
    distanceKm: null,
    status: index === 0 ? "next" : "pending",
    completed: false,
    outcome: null,
    pod: null,
    exception: null,
  };

}

async function publishStoreManagerAllocationsForTrip({
  orders,
  driverTrip,
  liveTrip,
}) {
  const persistedStops = await prisma.liveTripStop.findMany({
    where: {
      liveTripId: liveTrip.id,
    },
    select: {
      stopCode: true,
      outletCode: true,
    },
  });

  const persistedStopByCode = new Map(
    persistedStops.map((stop) => [stop.stopCode, stop])
  );
  const driverStopByOrderCode = new Map(
    driverTrip.stops.map((stop) => [stop.orderId, stop])
  );

  const publishedAllocations = [];

  for (const order of orders) {
    const driverStop = driverStopByOrderCode.get(order.orderCode);
    const persistedStop = driverStop
      ? persistedStopByCode.get(driverStop.stopId)
      : null;

    if (!driverStop || !persistedStop) {
      throw new Error(
        `Published stop mapping is unavailable for order ${order.orderCode}.`
      );
    }

    const allocation = await allocateConfirmedStoreOrderToStop({
      orderCode: order.orderCode,
      stopCode: persistedStop.stopCode,
    });

    const published = await publishDeliveryAllocation(allocation.id);
    publishedAllocations.push(published);
  }

  return publishedAllocations;
}

export async function publishDispatcherPlan({
  date,
  depot: depotName,
  dispatcherUser,
}) {
  const { start, end, dateText } = dateRange(date);
  const cleanDepotName = String(depotName || "").trim();
  if (!cleanDepotName || cleanDepotName === "ALL") {
    throw httpError("Select one depot before publishing the delivery plan.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const depot = await findDepotByName(tx, cleanDepotName);
    if (!depot?.isActive) throw httpError("Select an active depot.", 404);
    const plan = await tx.deliveryPlan.findUnique({
      where: { deliveryDate_depotId: { deliveryDate: start, depotId: depot.id } },
      include: planInclude(),
    });
    if (!plan) throw httpError("Save a delivery draft before publishing.");
    if (plan.status === "PUBLISHED") throw httpError("This delivery plan is already published.", 409);
    if (!plan.trips.length) throw httpError("Add and save at least one trip before publishing.");

    const allocatedOrderIds = new Set(
      plan.trips.flatMap((trip) => trip.allocations.map((allocation) => allocation.storeOrderId))
    );
    const unallocatedOrders = await tx.storeOrder.findMany({
      where: {
        effectiveDispatchDate: start,
        status: { in: ["SUBMITTED", "CONFIRMED"] },
        outlet: { depotId: depot.id },
      },
      select: { id: true, orderCode: true },
    });
    const missingOrders = unallocatedOrders.filter((order) => !allocatedOrderIds.has(order.id));
    if (missingOrders.length) {
      throw httpError(
        `Allocate or defer all confirmed orders before publishing. Unallocated: ${missingOrders
          .slice(0, 5)
          .map((order) => order.orderCode)
          .join(", ")}${missingOrders.length > 5 ? ", …" : ""}`,
        409
      );
    }

    const drivers = await tx.user.findMany({
      where: { role: "DRIVER", isActive: true, depotId: depot.id },
      orderBy: { id: "asc" },
    });
    if (!drivers.length) throw httpError(`No active Driver is assigned to ${depot.name}.`);

    for (const [tripIndex, trip] of plan.trips.entries()) {
      if (!trip.allocations.length) throw httpError(`${trip.tripCode} has no allocated orders.`);
      if (trip.vehicle.depotId !== depot.id || !trip.vehicle.isActive) {
        throw httpError(`${trip.vehicle.vehicleCode} is no longer available at ${depot.name}.`);
      }
      const driver = drivers[tripIndex % drivers.length];
      const totalWeightKg = trip.allocations.reduce(
        (sum, allocation) => sum + Number(allocation.storeOrder.estimatedWeightKg || 0),
        0
      );
      const totalVolumeM3 = trip.allocations.reduce(
        (sum, allocation) => sum + Number(allocation.storeOrder.estimatedVolumeM3 || 0),
        0
      );
      if (
        totalWeightKg > Number(trip.vehicle.capacityWeightKg) ||
        totalVolumeM3 > Number(trip.vehicle.capacityVolumeM3)
      ) {
        throw httpError(`${trip.tripCode} exceeds its vehicle capacity.`);
      }
      for (const { storeOrder } of trip.allocations) {
        if (
          !["SUBMITTED", "CONFIRMED"].includes(storeOrder.status) ||
          storeOrder.outlet.depotId !== depot.id ||
          storeOrder.effectiveDispatchDate.toISOString().slice(0, 10) !== dateText
        ) {
          throw httpError(`Order ${storeOrder.orderCode} is no longer eligible for publication.`);
        }
        if (storeOrder.orderType === "CHILLED" && !trip.vehicle.refrigerated) {
          throw httpError(`Order ${storeOrder.orderCode} requires a refrigerated vehicle.`);
        }
        if (isVanOnly(storeOrder.outlet) && !trip.vehicle.vehicleType.toLowerCase().includes("van")) {
          throw httpError(`Order ${storeOrder.orderCode} can only be assigned to a van.`);
        }
      }

      const liveTrip = await tx.liveTrip.create({
        data: {
          tripCode: trip.tripCode,
          deliveryDate: start,
          depotId: depot.id,
          vehicleCode: trip.vehicle.vehicleCode,
          vehicleType: trip.vehicle.vehicleType,
          temperature: trip.vehicle.refrigerated ? "Refrigerated" : "Ambient",
          driverUserId: driver.id,
          driverName: driver.fullName,
          status: "PLANNED",
          progressCompleted: 0,
          progressTotal: trip.allocations.length,
          nextDestination: trip.allocations[0].storeOrder.outlet.outletCode,
          eta: null,
          isDriverOnline: false,
          latestDriverUpdate: "Delivery plan published. Awaiting loading and Driver activity.",
          latestDriverUpdateAt: new Date(),
          stops: {
            create: trip.allocations.map(({ storeOrder, stopSequence }) => ({
              stopCode: `${trip.tripCode}-S${stopSequence}`,
              sequence: stopSequence,
              outletCode: storeOrder.outlet.outletCode,
              outletName: storeOrder.outlet.brand,
              district: storeOrder.outlet.district,
              latitude: null,
              longitude: null,
              plannedEta: storeOrder.outlet.windowOpenTime,
              status: stopSequence === 1 ? "NEXT_STOP" : "PENDING",
            })),
          },
        },
      });

      await tx.liveTripEvent.create({
        data: {
          liveTripId: liveTrip.id,
          type: "DISPATCHER_PLAN_PUBLISHED",
          message: `Delivery plan ${plan.id} published for ${dateText}.`,
          payload: {
            planId: plan.id,
            plannedTripId: trip.id,
            tripNumber: trip.tripNumber,
            plannedDeparture: trip.plannedDeparture,
            totalWeightKg,
            totalVolumeM3,
            dispatcherUserId: dispatcherUser?.id || null,
          },
        },
      });

      await tx.storeOrder.updateMany({
        where: {
          id: { in: trip.allocations.map((allocation) => allocation.storeOrderId) },
          status: { in: ["SUBMITTED", "CONFIRMED"] },
        },
        data: { status: "CONFIRMED" },
      });

      await tx.plannedTrip.update({
        where: { id: trip.id },
        data: { status: "PUBLISHED" },
      });
    }

    const publishedPlan = await tx.deliveryPlan.update({
      where: { id: plan.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      include: planInclude(),
    });
    return { plan: publishedPlan, tripCodes: plan.trips.map((trip) => trip.tripCode) };
  }, { isolationLevel: "Serializable" });

  for (const tripCode of result.tripCodes) {
    emitMonitoringUpdate({ reason: "dispatcher-plan-published", tripCode });
  }

  return {
    deliveryPlan: {
      id: result.plan.id,
      date: dateText,
      depot: result.plan.depot.name,
      status: result.plan.status,
      publishedAt: result.plan.publishedAt,
      trips: result.plan.trips.map((trip) => plannedTripView(trip)),
    },
    tripCodes: result.tripCodes,
  };
}

export async function getDispatcherLoadingSnapshot({ date, depotName = null } = {}) {
  const { start, end, dateText } = dateRange(date);
  const trips = await prisma.liveTrip.findMany({
    where: {
      deliveryDate: { gte: start, lte: end },
      ...(depotName && depotName !== "ALL" ? { depot: { name: depotName } } : {}),
    },
    include: {
      depot: true,
      stops: { orderBy: { sequence: "asc" } },
      loadingExceptions: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ depot: { name: "asc" } }, { vehicleCode: "asc" }, { tripCode: "asc" }],
  });
  const plannedTrips = await prisma.plannedTrip.findMany({
    where: { tripCode: { in: trips.map((trip) => trip.tripCode) } },
    include: {
      allocations: {
        include: {
          storeOrder: { include: { outlet: true } },
        },
        orderBy: { stopSequence: "asc" },
      },
    },
  });
  const plannedByCode = new Map(plannedTrips.map((trip) => [trip.tripCode, trip]));
  const tripRows = trips.map((trip) => ({
    tripId: trip.tripCode,
    tripCode: trip.tripCode,
    tripNo: trip.tripCode,
    tripNumber: trip.tripCode.match(/T(\d+)$/)?.[1] || "—",
    vehicle: trip.vehicleCode,
    vehicleId: trip.vehicleCode,
    vehicleType: trip.vehicleType || "—",
    depot: trip.depot?.name || "—",
    depotId: trip.depotId,
    status: trip.status,
    loaderStatus: trip.status === "VEHICLE_READY" ? "VEHICLE_READY" : trip.status,
    driver: trip.driverName,
    stopCount: trip.stops.length,
    plannedDeparture: plannedByCode.get(trip.tripCode)?.plannedDeparture || null,
    temperature: trip.temperature || "—",
    orders: (plannedByCode.get(trip.tripCode)?.allocations || []).map(({ storeOrder }) => ({
      orderId: storeOrder.orderCode,
      outlet: storeOrder.outlet.brand,
      customer: storeOrder.outlet.brand,
      outletCode: storeOrder.outlet.outletCode,
      district: storeOrder.outlet.district,
      units: storeOrder.totalUnits,
      quantity: storeOrder.totalUnits,
      temperature: storeOrder.orderType === "CHILLED" ? "Chilled" : "Ambient",
      status: storeOrder.status,
    })),
    assignedOrders: (plannedByCode.get(trip.tripCode)?.allocations || []).map(
      ({ storeOrder, stopSequence }) => ({
        orderId: storeOrder.orderCode,
        outlet: storeOrder.outlet.brand,
        outletCode: storeOrder.outlet.outletCode,
        district: storeOrder.outlet.district,
        sequence: stopSequence,
        units: storeOrder.totalUnits,
        status: storeOrder.status,
      })
    ),
    stops: trip.stops.map((stop) => ({
      id: stop.id,
      name: stop.outletName || stop.outletCode,
      outlet: stop.outletName || stop.outletCode,
      outletCode: stop.outletCode,
      district: stop.district,
      sequence: stop.sequence,
      time: stop.plannedEta || "Not set",
      status: stop.status,
    })),
    exceptions: trip.loadingExceptions.length,
    progress: trip.progressTotal
      ? Math.round((trip.progressCompleted / trip.progressTotal) * 100)
      : 0,
    orderCount: plannedByCode.get(trip.tripCode)?.allocations.length || 0,
    latestUpdate: trip.latestDriverUpdate || "No loading updates recorded.",
    loadingSteps: [
      { key: "published", label: "Plan published", completed: true },
      { key: "loading", label: "Loading in progress", completed: ["LOADING", "VEHICLE_READY"].includes(trip.status) },
      { key: "handover", label: "Ready for departure", completed: trip.status === "VEHICLE_READY" },
    ],
  }));
  const summary = {
    trips: tripRows.length,
    planned: tripRows.filter((trip) => trip.status === "PLANNED").length,
    inProgress: tripRows.filter((trip) => trip.status === "LOADING").length,
    needsAction: tripRows.filter((trip) => trip.status === "ISSUE").length,
    ready: tripRows.filter((trip) => trip.status === "VEHICLE_READY").length,
    awaitingLoading: tripRows.filter((trip) => trip.status === "PLANNED").length,
    currentlyLoading: tripRows.filter((trip) => trip.status === "LOADING").length,
    readyAwaitingRelease: tripRows.filter((trip) => trip.status === "VEHICLE_READY").length,
    exceptionsReported: tripRows.reduce((sum, trip) => sum + trip.exceptions, 0),
    exceptions: trips.reduce((sum, trip) => sum + trip.loadingExceptions.length, 0),
  };
  return { date: dateText, summary, trips: tripRows };
}

export async function getDispatcherLoadingExceptions({ date, depotName = null } = {}) {
  const { start, end } = dateRange(date);
  const exceptions = await prisma.loadingException.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      ...(depotName && depotName !== "ALL" ? { liveTrip: { depot: { name: depotName } } } : {}),
    },
    include: {
      liveTrip: { include: { depot: true } },
      storeOrder: { include: { outlet: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return {
    summary: {
      total: exceptions.length,
      open: exceptions.filter((item) => item.status === "OPEN").length,
      resolved: exceptions.filter((item) => item.status === "RESOLVED").length,
    },
    exceptions: exceptions.map((item) => ({
      id: item.id,
      exceptionId: item.exceptionCode,
      tripId: item.liveTrip?.tripCode || "—",
      vehicle: item.liveTrip?.vehicleCode || "—",
      depot: item.liveTrip?.depot?.name || "—",
      orderId: item.storeOrder?.orderCode || "—",
      outlet: item.storeOrder?.outlet?.brand || "—",
      issueType: item.exceptionType,
      type: item.exceptionType,
      itemName: item.itemName || "—",
      expectedQuantity: item.expectedQuantity,
      availableQuantity: item.availableQuantity,
      expectedQty: item.expectedQuantity,
      availableQty: item.availableQuantity,
      loaderName: item.loaderName || "—",
      reason: item.loaderNote || "",
      status: item.status,
      resolutionAction: item.resolutionAction,
      resolutionNote: item.resolutionNote,
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt,
    })),
  };
}

export async function getDispatcherCapacitySnapshot({
  startDate,
  endDate,
  depotName = null,
} = {}) {
  const rangeStart = dateRange(startDate);
  const rangeEnd = dateRange(endDate);
  if (rangeEnd.start < rangeStart.start) {
    throw httpError("The capacity report end date must be on or after its start date.");
  }

  const cleanDepotName = String(depotName || "").trim();
  const depot = cleanDepotName && cleanDepotName !== "ALL"
    ? await prisma.depot.findFirst({
        where: { name: cleanDepotName, isActive: true },
        select: { id: true, name: true },
      })
    : null;
  if (cleanDepotName && cleanDepotName !== "ALL" && !depot) {
    throw httpError("Select an active depot.", 404);
  }

  const [orders, vehicles, drivers, plans] = await Promise.all([
    prisma.storeOrder.findMany({
      where: {
        effectiveDispatchDate: {
          gte: rangeStart.start,
          lte: rangeEnd.end,
        },
        status: { in: ["SUBMITTED", "CONFIRMED", "DEFERRED"] },
        ...(depot ? { outlet: { depotId: depot.id } } : {}),
      },
      select: {
        orderCode: true,
        status: true,
        orderType: true,
        totalUnits: true,
        estimatedWeightKg: true,
        estimatedVolumeM3: true,
        effectiveDispatchDate: true,
        outlet: { select: { brand: true } },
      },
      orderBy: { effectiveDispatchDate: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true, ...(depot ? { depotId: depot.id } : {}) },
      select: {
        id: true,
        vehicleCode: true,
        vehicleType: true,
        refrigerated: true,
        capacityWeightKg: true,
        capacityVolumeM3: true,
        depot: { select: { name: true } },
      },
    }),
    prisma.user.count({
      where: {
        role: "DRIVER",
        isActive: true,
        ...(depot ? { depotId: depot.id } : {}),
      },
    }),
    prisma.deliveryPlan.findMany({
      where: {
        deliveryDate: {
          gte: rangeStart.start,
          lte: rangeEnd.end,
        },
        ...(depot ? { depotId: depot.id } : {}),
      },
      select: {
        status: true,
        trips: { select: { id: true, status: true } },
      },
    }),
  ]);

  const demand = {
    totalOrders: 0,
    chilledOrders: 0,
    deferredOrders: 0,
    totalUnits: 0,
    weightKg: 0,
    volumeM3: 0,
    chilledWeightKg: 0,
    chilledVolumeM3: 0,
  };
  const byDate = new Map();
  const byBrand = new Map();

  for (const order of orders) {
    if (order.status === "DEFERRED") {
      demand.deferredOrders += 1;
      continue;
    }
    const weightKg = Number(order.estimatedWeightKg || 0);
    const volumeM3 = Number(order.estimatedVolumeM3 || 0);
    const date = order.effectiveDispatchDate.toISOString().slice(0, 10);
    demand.totalOrders += 1;
    demand.totalUnits += order.totalUnits;
    demand.weightKg += weightKg;
    demand.volumeM3 += volumeM3;
    if (order.orderType === "CHILLED") {
      demand.chilledOrders += 1;
      demand.chilledWeightKg += weightKg;
      demand.chilledVolumeM3 += volumeM3;
    }

    const dateSummary = byDate.get(date) || {
      date,
      orders: 0,
      chilledOrders: 0,
      ambientOrders: 0,
      weightKg: 0,
      chilledWeightKg: 0,
      volumeM3: 0,
    };
    dateSummary.orders += 1;
    dateSummary.weightKg += weightKg;
    dateSummary.volumeM3 += volumeM3;
    if (order.orderType === "CHILLED") {
      dateSummary.chilledOrders += 1;
      dateSummary.chilledWeightKg += weightKg;
    } else {
      dateSummary.ambientOrders += 1;
    }
    byDate.set(date, dateSummary);

    const brand = order.outlet?.brand || "Unknown outlet brand";
    const brandSummary = byBrand.get(brand) || {
      brand,
      orders: 0,
      chilledOrders: 0,
      weightKg: 0,
      chilledWeightKg: 0,
    };
    brandSummary.orders += 1;
    brandSummary.weightKg += weightKg;
    if (order.orderType === "CHILLED") {
      brandSummary.chilledOrders += 1;
      brandSummary.chilledWeightKg += weightKg;
    }
    byBrand.set(brand, brandSummary);
  }

  const refrigeratedVehicles = vehicles.filter((vehicle) => vehicle.refrigerated);
  const totalWeightCapacityKg = vehicles.reduce(
    (sum, vehicle) => sum + Number(vehicle.capacityWeightKg || 0),
    0
  );
  const refrigeratedCapacityWeightKg = refrigeratedVehicles.reduce(
    (sum, vehicle) => sum + Number(vehicle.capacityWeightKg || 0),
    0
  );
  const trips = plans.flatMap((plan) => plan.trips);

  return {
    startDate: rangeStart.dateText,
    endDate: rangeEnd.dateText,
    depot: depot?.name || "ALL",
    demand,
    fleet: {
      activeVehicles: vehicles.length,
      refrigeratedVehicles: refrigeratedVehicles.length,
      drivers,
      totalWeightCapacityKg,
      refrigeratedCapacityWeightKg,
      totalVolumeCapacityM3: vehicles.reduce(
        (sum, vehicle) => sum + Number(vehicle.capacityVolumeM3 || 0),
        0
      ),
      plannedTrips: trips.length,
      publishedTrips: trips.filter((trip) => trip.status === "PUBLISHED").length,
    },
    byDate: Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    byBrand: Array.from(byBrand.values()).sort((left, right) => right.orders - left.orders),
  };
}

export async function resolveDispatcherLoadingException({ id, action, note }) {
  const exceptionId = numericId(id, "Exception");
  const resolutionAction = String(action || "").trim();
  const resolutionNote = String(note || "").trim();
  if (!resolutionAction || !resolutionNote) {
    throw httpError("A resolution action and note are required.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.loadingException.findUnique({
      where: { id: exceptionId },
      include: { liveTrip: { select: { tripCode: true } } },
    });
    if (!existing) throw httpError("Loading exception not found.", 404);
    if (existing.status === "RESOLVED") return existing;

    const resolvedAt = new Date();
    const updated = await tx.loadingException.update({
      where: { id: exceptionId },
      data: {
        status: "RESOLVED",
        resolutionAction: resolutionAction.slice(0, 100),
        resolutionNote: resolutionNote.slice(0, 5000),
        resolvedAt,
      },
    });

    if (existing.liveTripId) {
      const remainingOpenExceptions = await tx.loadingException.count({
        where: { liveTripId: existing.liveTripId, status: "OPEN" },
      });
      if (remainingOpenExceptions === 0) {
        await tx.liveTrip.updateMany({
          where: { id: existing.liveTripId, status: "ISSUE" },
          data: {
            status: "LOADING",
            latestDriverUpdate: "Dispatcher resolved the loading exception.",
            latestDriverUpdateAt: resolvedAt,
          },
        });
      }
      await tx.liveTripEvent.create({
        data: {
          liveTripId: existing.liveTripId,
          type: "LOADING_EXCEPTION_RESOLVED",
          message: "Dispatcher resolved a loading exception.",
          payload: {
            exceptionId,
            action: resolutionAction.slice(0, 100),
            dispatcherNote: resolutionNote.slice(0, 5000),
          },
        },
      });
    }

    return {
      ...updated,
      tripCode: existing.liveTrip?.tripCode || null,
    };
  });
  const tripCode = result.tripCode || result.liveTrip?.tripCode;
  if (tripCode) {
    emitMonitoringUpdate({ reason: "loading-exception-resolved", tripCode });
  }
  return { id: result.id, status: "RESOLVED" };
}
