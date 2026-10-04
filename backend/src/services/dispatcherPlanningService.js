import fs from "node:fs/promises";
import path from "node:path";

import prisma from "../config/database.js";
import { state } from "../mockData.js";
import {
  emitMonitoringUpdate,
  synchronizeTripForDriver,
} from "./liveMonitoringService.js";

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
  const start = new Date(`${dateText}T00:00:00.000Z`);
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
    depot: outlet?.depot?.name || "—",
    depotId: outlet?.depot?.id || null,
    deliveryWindow:
      outlet?.windowOpenTime && outlet?.windowCloseTime
        ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
        : "Window not set",
    windowOpen: outlet?.windowOpenTime || null,
    windowClose: outlet?.windowCloseTime || null,
    mallWindow: outlet?.mallWindow || null,
    restriction: orderRestriction(outlet),
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
    previousDeferrals: order.status === "DEFERRED" ? 1 : 0,
    deferredReason: order.deferredReason || null,
    location: outlet?.district || "—",
  };
}

function vehicleView(row, tripsUsed = 0) {
  const maxWeight = Number(row.weight_cap_kg || 0);
  const maxVolume = Number(row.volume_cap_m3 || 0);
  const temperature = String(row.temp || "").toLowerCase() === "reefer"
    ? "Refrigerated"
    : "Ambient";

  return {
    vehicleId: row.vehicle_id,
    type: String(row.type || "vehicle")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    depot: row.depot,
    temperature,
    maxWeightKg: maxWeight,
    maxVolumeM3: maxVolume,
    maxWeight: `${maxWeight.toLocaleString()} kg`,
    maxVolume: `${maxVolume.toFixed(1)} m³`,
    currentLoad: "0 kg / 0 m³",
    tripsLeft: Math.max(0, 2 - tripsUsed),
    availability: tripsUsed >= 2 ? "Unavailable" : "Available",
    capacityGroup: maxWeight >= 5000 ? "HIGH" : maxWeight >= 3500 ? "MEDIUM" : "LOW",
    isSuitable: tripsUsed < 2,
    fuelType: row.fuel_type || null,
    weeklyFuelQuotaL: Number(row.weekly_fuel_quota_l || 0),
  };
}

function deterministicCoordinate(outletCode, depotName) {
  const seed = [...String(outletCode || "OUT")].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );

  const kandy = String(depotName || "").toLowerCase().includes("kandy");
  const base = kandy
    ? { latitude: 7.2906, longitude: 80.6337 }
    : { latitude: 6.9271, longitude: 79.8612 };

  const latOffset = ((seed % 19) - 9) * 0.0032;
  const lngOffset = (((seed * 7) % 19) - 9) * 0.0032;

  return {
    latitude: base.latitude + latOffset,
    longitude: base.longitude + lngOffset,
    source: "DEMO_COORDINATE_DERIVED_FOR_HACKATHON_UI",
  };
}

function compatibleVehicle(order, vehicle) {
  const needsChilled = order.temperature === "Chilled";
  const isReefer = vehicle.temperature === "Refrigerated";
  const vanOnly = String(order.parkingConstraint || "")
    .toLowerCase()
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

export async function getDispatcherPlanningSnapshot({
  date,
  depotName = null,
} = {}) {
  const { start, end, dateText } = dateRange(date);

  const orderWhere = {
    effectiveDispatchDate: {
      gte: start,
      lte: end,
    },
    status: {
      in: ["SUBMITTED", "CONFIRMED", "DEFERRED"],
    },
  };

  if (depotName && depotName !== "ALL") {
    orderWhere.outlet = {
      depot: {
        name: depotName,
      },
    };
  }

  const [ordersDb, vehicleRows, activeTrips, driversDb, depots] =
    await Promise.all([
      prisma.storeOrder.findMany({
        where: orderWhere,
        include: {
          outlet: {
            include: {
              depot: true,
            },
          },
        },
        orderBy: {
          submittedAt: "asc",
        },
      }),
      readCsv("vehicles.csv"),
      prisma.liveTrip.findMany({
        where: {
          deliveryDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          vehicleCode: true,
          status: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: "DRIVER",
          isActive: true,
        },
        include: {
          depot: true,
        },
        orderBy: {
          fullName: "asc",
        },
      }),
      prisma.depot.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const tripCountByVehicle = new Map();
  for (const trip of activeTrips) {
    if (trip.status === "COMPLETED") continue;
    tripCountByVehicle.set(
      trip.vehicleCode,
      (tripCountByVehicle.get(trip.vehicleCode) || 0) + 1
    );
  }

  const orders = ordersDb.map(orderView);

  const fleet = vehicleRows
    .filter((row) => !depotName || depotName === "ALL" || row.depot === depotName)
    .map((row) => vehicleView(row, tripCountByVehicle.get(row.vehicle_id) || 0));

  const drivers = driversDb.map((driver) => ({
    id: driver.id,
    userId: driver.userId,
    name: driver.fullName,
    depot: driver.depot?.name || null,
    depotId: driver.depot?.id || null,
  }));

  const suggestedTrips = makeSuggestedTrips(orders, fleet, drivers);

  const publicationPreview = [
    {
      id: "loader",
      title: "Loader",
      description:
        suggestedTrips.length > 0
          ? `${suggestedTrips.length} trip plan(s) will be available in stop sequence.`
          : "No trip plan is ready to publish.",
    },
    {
      id: "driver",
      title: "Driver",
      description:
        suggestedTrips.length > 0
          ? "Assigned published trips become available to Driver workflow and Live Delivery Monitoring."
          : "No Driver assignment is available yet.",
    },
    {
      id: "store-manager",
      title: "Store Manager",
      description:
        orders.some((order) => order.status === "Deferred")
          ? "Deferred orders retain a clear reason for Store Manager visibility."
          : "Confirmed orders remain scheduled for the planned delivery run.",
    },
  ];

  const summary = {
    confirmedOrders: orders.filter((order) => order.status === "Confirmed").length,
    allocatedOrders: suggestedTrips.reduce(
      (sum, trip) => sum + trip.orderIds.length,
      0
    ),
    unallocatedOrders: Math.max(
      0,
      orders.filter((order) => order.status === "Confirmed").length -
        suggestedTrips.reduce((sum, trip) => sum + trip.orderIds.length, 0)
    ),
    deferredOrders: orders.filter((order) => order.status === "Deferred").length,
    plannedTrips: suggestedTrips.length,
    blockingErrors: suggestedTrips.some((trip) => !trip.driverUserId) ? 1 : 0,
    unassigned: suggestedTrips.filter((trip) => !trip.driverUserId).length,
    warnings: suggestedTrips.filter((trip) => trip.validation !== "Ready").length,
    status: suggestedTrips.length ? "Ready for Review" : "Waiting for Orders",
  };

  return {
    date: dateText,
    depots,
    orders,
    deferredOrders: orders.filter((order) => order.status === "Deferred"),
    fleet,
    drivers,
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
  if (!Number.isInteger(id)) {
    throw new Error("A valid order is required.");
  }

  return prisma.storeOrder.update({
    where: { id },
    data: {
      status: "DEFERRED",
      deferredReason: String(reason || "Deferred by Dispatcher").slice(0, 500),
    },
  });
}

function timeLabelFromOrders(orders) {
  const first = orders[0];
  if (!first) return "Published delivery plan";
  const open = first.outlet?.windowOpenTime;
  const close = orders.at(-1)?.outlet?.windowCloseTime;
  return open && close ? `${open} – ${close}` : "Published delivery plan";
}

function stopFromOrder(order, index, tripCode) {
  const outlet = order.outlet;
  const coords = deterministicCoordinate(outlet?.outletCode, outlet?.depot?.name);

  return {
    stopId: `${tripCode}-STOP${String(index + 1).padStart(2, "0")}`,
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

export async function publishDispatcherPlan({
  trip,
  dispatcherUser,
}) {
  if (!trip?.vehicleId || !Array.isArray(trip.orderIds) || !trip.orderIds.length) {
    throw new Error("The plan needs a vehicle and at least one order.");
  }

  const orders = await prisma.storeOrder.findMany({
    where: {
      id: {
        in: trip.orderIds.map(Number),
      },
    },
    include: {
      outlet: {
        include: {
          depot: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!orders.length) {
    throw new Error("No valid orders were found for this plan.");
  }

  const driver = trip.driverUserId
    ? await prisma.user.findUnique({
        where: { id: Number(trip.driverUserId) },
        include: { depot: true },
      })
    : await prisma.user.findFirst({
        where: {
          role: "DRIVER",
          isActive: true,
          ...(orders[0].outlet?.depotId
            ? { depotId: orders[0].outlet.depotId }
            : {}),
        },
        include: { depot: true },
        orderBy: { id: "asc" },
      });

  if (!driver) {
    throw new Error("Assign an active Driver before publishing the plan.");
  }

  const tripCode = `TRIP${Date.now().toString().slice(-6)}`;
  const stops = orders.map((order, index) => stopFromOrder(order, index, tripCode));

  const driverTrip = {
    tripId: tripCode,
    tripNumber: state.trips.length + 1,
    brand: orders[0].outlet?.brand || "Waypoint",
    district: orders[0].outlet?.district || "",
    vehicleId: trip.vehicleId,
    assignedDriverUserId: driver.id,
    assignedDriverUserCode: driver.userId,
    timeLabel: timeLabelFromOrders(orders),
    dispatcherPlanStatus: "PUBLISHED",
    // The Loader module can later change this to VEHICLE_READY.
    // For the connected Hackathon demo we expose the published plan
    // to the Driver while preserving the operational state label.
    loaderStatus: "VEHICLE_READY",
    driverExecutionStatus: "NOT_STARTED",
    completedAt: null,
    publishedBy: dispatcherUser?.userId || null,
    publishedAt: new Date().toISOString(),
    stops,
  };

  state.trips.push(driverTrip);

  for (const order of orders) {
    await prisma.storeOrder.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });
  }

  await synchronizeTripForDriver({
    trip: driverTrip,
    driverUser: driver,
    emit: false,
  });

  emitMonitoringUpdate({
    reason: "dispatcher-plan-published",
    tripCode,
  });

  return {
    tripCode,
    driverTrip,
  };
}
