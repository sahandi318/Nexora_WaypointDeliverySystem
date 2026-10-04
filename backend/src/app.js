import express from "express";
import cors from "cors";
import prisma from "./config/database.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import storeManagerRoutes from "./routes/storeManagerRoutes.js";
import loaderRoutes from "./routes/loaderRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";

import {
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles,
} from "./middleware/authMiddleware.js";

import {
  resetState,
  state,
} from "./mockData.js";

import {
  LIVE_MONITORING_EVENT_TYPES,
  recordDriverRouteSnapshot,
  recordDriverWorkflowEvent,
  synchronizeTripForDriver,
} from "./services/liveMonitoringService.js";

const app = express();

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// ============================================================
// DRIVER ACCESS MIDDLEWARE
// ============================================================

/**
 * Driver APIs use the SAME authentication and RBAC pipeline as
 * the rest of the application. The authenticated user is loaded
 * from MySQL on every protected request, so Driver identity is
 * never taken from mock data or a separate Driver login.
 */

const driverAccess = [
  authenticateToken,
  requirePasswordChangeCompleted,
  authorizeRoles("DRIVER"),
  hydrateDriverTrips,
];


// ============================================================
// API ROOT
// ============================================================

app.get(
  "/api",
  (req, res) => {
    res.status(200).json({
      success: true,

      name:
        "Nexora Waypoint API",

      message:
        "API is running.",
    });
  }
);

// ============================================================
// HEALTH ROUTES
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      service:
        "Nexora Waypoint API",

      status:
        "running",

      timestamp:
        new Date().toISOString(),
    });
  }
);

app.get(
  "/api/health/database",
  async (req, res) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;

      res.status(200).json({
        success: true,

        database:
          process.env
            .DATABASE_NAME,

        status:
          "connected",

        timestamp:
          new Date()
            .toISOString(),
      });
    } catch (error) {
      console.error(
        "Database health check failed:",
        error
      );

      res.status(503).json({
        success: false,

        database:
          process.env
            .DATABASE_NAME,

        status:
          "unavailable",
      });
    }
  }
);

// ============================================================
// SHARED AUTHENTICATION ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// PUBLIC STORE NETWORK ROUTES
// ============================================================

app.use(
  "/api/public",
  publicRoutes
);

// ============================================================
// ADMIN ROUTES
// ============================================================

app.use(
  "/api/admin",
  adminRoutes
);

// ============================================================
// STORE MANAGER ROUTES
// ============================================================

app.use(
  "/api/store-manager",
  storeManagerRoutes
);

// ============================================================
// TRANSLATION ROUTES
// ============================================================

app.use(
  "/api/translations",
  translationRoutes
);

// ============================================================
// TRANSLATION ROUTES
// ============================================================

app.use(
  "/api/translations",
  translationRoutes
);

// ============================================================
// LOADER ROUTES
// ============================================================

app.use(
  "/api/loader",
  loaderRoutes
);
// ============================================================
// DRIVER HELPERS
// ============================================================

function allTrips() {
  return [
    ...state.trips,
    ...(state.historyTrips || []),
  ];
}

function findTrip(tripId) {
  return allTrips().find(
    (trip) =>
      trip.tripId === tripId
  );
}

function findStop(stopId) {
  for (const trip of state.trips) {
    const stop =
      trip.stops.find(
        (item) =>
          item.stopId === stopId
      );

    if (stop) {
      return {
        trip,
        stop,
      };
    }
  }

  return null;
}

function stopView(
  trip,
  stop
) {
  return {
    ...stop,

    totalStops:
      trip.stops.length,
  };
}

function sriLankaTimeLabel(value = new Date()) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

async function updateDispatcherMonitoring(task, context) {
  try {
    return await task();
  } catch (error) {
    console.error(`Dispatcher monitoring update failed (${context}):`, error);
    return null;
  }
}

function payloadObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
}

async function hydrateDriverTrips(req, res, next) {
  try {
    const persistedTrips = await prisma.liveTrip.findMany({
      where: { driverUserId: req.user.id },
      include: {
        depot: true,
        stops: { orderBy: { sequence: "asc" } },
        events: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ deliveryDate: "desc" }, { tripCode: "asc" }],
    });
    const planTrips = await prisma.plannedTrip.findMany({
      where: { tripCode: { in: persistedTrips.map((trip) => trip.tripCode) } },
      include: {
        allocations: {
          include: {
            storeOrder: { include: { outlet: true } },
          },
          orderBy: { stopSequence: "asc" },
        },
      },
    });
    const plannedByCode = new Map(planTrips.map((trip) => [trip.tripCode, trip]));
    const runtimeTrips = persistedTrips.map((trip) => {
      const plannedTrip = plannedByCode.get(trip.tripCode);
      const allocationBySequence = new Map(
        (plannedTrip?.allocations || []).map((allocation) => [
          allocation.stopSequence,
          allocation.storeOrder,
        ])
      );
      const podEvents = trip.events.filter((event) => event.type === "POD_SUBMITTED");
      const exceptionEvents = trip.events.filter((event) => event.type === "EXCEPTION_RECORDED");
      const stops = trip.stops.map((stop) => {
        const order = allocationBySequence.get(stop.sequence);
        const podEvent = podEvents.find(
          (event) => payloadObject(event.payload).stopId === stop.stopCode
        );
        const exceptionEvent = exceptionEvents.find(
          (event) => payloadObject(event.payload).stopId === stop.stopCode
        );
        const completed = stop.status === "COMPLETED";
        return {
          stopId: stop.stopCode,
          position: stop.sequence,
          outletId: stop.outletCode,
          outletName: order?.outlet?.brand || stop.outletName || null,
          orderId: order?.orderCode || null,
          district: stop.district || "",
          windowOpen: order?.outlet?.windowOpenTime || null,
          windowClose: order?.outlet?.windowCloseTime || null,
          plannedArrival: stop.plannedEta,
          arrivalTime: stop.actualArrival,
          tempRequirement: order?.orderType === "CHILLED" ? "Chilled" : "Ambient",
          expectedUnits: order?.totalUnits || 0,
          loadedUnits: trip.status === "VEHICLE_READY" ? order?.totalUnits || 0 : 0,
          deliveredQuantity: null,
          unloadingPoint: order?.outlet?.dockType || null,
          vehicleAccess: order?.outlet?.parkingConstraint || null,
          mallWindow: order?.outlet?.mallWindow || null,
          mapsUrl: null,
          destination: { latitude: stop.latitude, longitude: stop.longitude },
          etaMinutes: null,
          distanceKm: null,
          status: completed ? "completed" : stop.status === "ARRIVED" ? "arrived" : stop.status === "NEXT_STOP" ? "next" : "pending",
          completed,
          outcome: stop.outcome,
          pod: podEvent ? payloadObject(podEvent.payload) : null,
          exception: exceptionEvent ? payloadObject(exceptionEvent.payload) : null,
        };
      });
      const firstOrder = plannedTrip?.allocations?.[0]?.storeOrder;
      const publishedEvent = trip.events.find((event) => event.type === "DISPATCHER_PLAN_PUBLISHED");
      const publishedPayload = payloadObject(publishedEvent?.payload);
      const executionStatus = trip.status === "COMPLETED"
        ? "COMPLETED"
        : ["ON_ROUTE", "DELAYED", "OFFLINE"].includes(trip.status)
          ? "IN_PROGRESS"
          : "NOT_STARTED";
      return {
        tripId: trip.tripCode,
        tripNumber: plannedTrip?.tripNumber || 1,
        deliveryDate: trip.deliveryDate.toISOString().slice(0, 10),
        depotId: trip.depotId,
        brand: firstOrder?.outlet?.brand || "",
        district: firstOrder?.outlet?.district || "",
        vehicleId: trip.vehicleCode,
        vehicleType: trip.vehicleType,
        temperature: trip.temperature,
        timeLabel: plannedTrip?.plannedDeparture || "Departure not set",
        dispatcherPlanStatus: "PUBLISHED",
        loaderStatus: trip.status === "VEHICLE_READY"
          ? "VEHICLE_READY"
          : trip.status === "ISSUE"
            ? "BLOCKED"
            : trip.status === "LOADING"
              ? "LOADING"
              : "WAITING",
        driverExecutionStatus: executionStatus,
        completedAt: executionStatus === "COMPLETED"
          ? trip.events.find((event) => event.type === "STOP_COMPLETED")?.createdAt?.toISOString() || null
          : null,
        publishedBy: publishedPayload.dispatcherUserId || null,
        assignedDriverUserId: trip.driverUserId,
        assignedDriverUserCode: req.user.userId,
        stops,
        vehicle: {
          vehicleId: trip.vehicleCode,
          type: trip.vehicleType || "Vehicle",
          temp: trip.temperature || "Ambient",
          depot: trip.depot?.name || "",
        },
      };
    });

    state.trips = runtimeTrips.filter((trip) => trip.driverExecutionStatus !== "COMPLETED");
    state.historyTrips = runtimeTrips.filter((trip) => trip.driverExecutionStatus === "COMPLETED");
    if (runtimeTrips[0]?.vehicle) state.vehicle = runtimeTrips[0].vehicle;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Driver-facing trip status comes from the connected workflow:
 *
 * Dispatcher published plan -> Planned
 * Loader vehicle ready      -> Vehicle Ready
 * Driver started            -> In Progress
 * Driver completed all      -> Completed
 */
function operationalTripStatus(
  trip
) {
  if (
    trip.driverExecutionStatus ===
    "COMPLETED"
  ) {
    return {
      statusKey:
        "COMPLETED",

      statusLabel:
        "Completed",
    };
  }

  if (
    trip.driverExecutionStatus ===
    "IN_PROGRESS"
  ) {
    return {
      statusKey:
        "IN_PROGRESS",

      statusLabel:
        "In Progress",
    };
  }

  if (
    trip.loaderStatus ===
    "VEHICLE_READY"
  ) {
    return {
      statusKey:
        "VEHICLE_READY",

      statusLabel:
        "Vehicle Ready",
    };
  }

  if (
    trip.dispatcherPlanStatus ===
    "PUBLISHED"
  ) {
    return {
      statusKey:
        "PLANNED",

      statusLabel:
        "Planned",
    };
  }

  return {
    statusKey:
      "WAITING",

    statusLabel:
      "Awaiting Plan",
  };
}

function tripView(trip) {
  const delivered =
    trip.stops.filter(
      (stop) =>
        stop.outcome ===
        "DELIVERED_FULL"
    ).length;

  const partial =
    trip.stops.filter(
      (stop) =>
        stop.outcome ===
        "PARTIAL_DELIVERY"
    ).length;

  const unable =
    trip.stops.filter(
      (stop) =>
        stop.outcome ===
        "UNABLE_TO_DELIVER"
    ).length;

  const proofRecords =
    trip.stops.filter(
      (stop) =>
        stop.pod
    ).length;

  const operationalStatus =
    operationalTripStatus(
      trip
    );

  return {
    ...trip,
    ...operationalStatus,

    totalStops:
      trip.stops.length,

    vehicle:
      trip.vehicle || state.vehicle,

    summary: {
      delivered,
      partial,
      unable,
      proofRecords,
    },
  };
}

function updateNextStop(
  trip
) {
  const next =
    trip.stops.find(
      (stop) =>
        !stop.completed
    );

  trip.stops.forEach(
    (stop) => {
      if (stop.completed) {
        stop.status =
          "completed";
      } else if (
        next &&
        stop.stopId ===
          next.stopId
      ) {
        stop.status =
          "next";
      } else {
        stop.status =
          "pending";
      }
    }
  );

  if (!next) {
    trip.driverExecutionStatus =
      "COMPLETED";

    trip.completedAt =
      new Date()
        .toISOString();
  }

  return next;
}

// ============================================================
// DRIVER ROUTES
// ============================================================

app.get(
  "/api/driver/trips",
  driverAccess,
  async (req, res) => {
    const activeTrip =
      state.trips.find(
        (trip) =>
          trip.driverExecutionStatus ===
          "IN_PROGRESS"
      ) ||
      state.trips.find(
        (trip) =>
          trip.loaderStatus ===
          "VEHICLE_READY"
      ) ||
      state.trips[0];

    const latestCompletedTrip =
      state.historyTrips?.[0] ||
      null;

    res.json({
      driver: {
        userId:
          req.user.userId,

        name:
          req.user.fullName,

        email:
          req.user.email,

        profilePhotoData:
          req.user.profilePhotoData ||
          null,

        depot:
          req.user.depot
            ? {
                id:
                  req.user.depot.id,

                code:
                  req.user.depot.code,

                name:
                  req.user.depot.name,
              }
            : null,
      },

      vehicle:
        state.vehicle,

      activeTripId:
        activeTrip?.tripId ||
        null,

      lastCompletedTripId:
        latestCompletedTrip
          ?.tripId ||
        null,

      syncNotification:
        state.sync
          .recoveryNotification,

      trips:
        state.trips.map(
          (trip) => {
            const status =
              operationalTripStatus(
                trip
              );

            return {
              tripId:
                trip.tripId,

              tripNumber:
                trip.tripNumber,

              brand:
                trip.brand,

              district:
                trip.district,

              timeLabel:
                trip.timeLabel,

              totalStops:
                trip.stops.length,

              dispatcherPlanStatus:
                trip
                  .dispatcherPlanStatus,

              loaderStatus:
                trip
                  .loaderStatus,

              driverExecutionStatus:
                trip
                  .driverExecutionStatus,

              ...status,
            };
          }
        ),
    });
  }
);

app.get(
  "/api/driver/trips/:tripId",
  driverAccess,
  async (req, res) => {
    const trip =
      findTrip(
        req.params.tripId
      );

    if (!trip) {
      return res
        .status(404)
        .json({
          message:
            "Trip not found.",
        });
    }

    await updateDispatcherMonitoring(
      () => synchronizeTripForDriver({ trip, driverUser: req.user, emit: false }),
      `trip-detail:${trip.tripId}`
    );

    res.json({
      trip:
        tripView(trip),
    });
  }
);

app.get(
  "/api/driver/trips/:tripId/stops/:stopId",
  driverAccess,
  (req, res) => {
    const trip =
      findTrip(
        req.params.tripId
      );

    const stop =
      trip?.stops.find(
        (item) =>
          item.stopId ===
          req.params.stopId
      );

    if (
      !trip ||
      !stop
    ) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    res.json({
      stop:
        stopView(
          trip,
          stop
        ),
    });
  }
);

app.post(
  "/api/driver/stops/:stopId/arrive",
  driverAccess,
  async (req, res) => {
    const found =
      findStop(
        req.params.stopId
      );

    if (!found) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    found.trip
      .driverExecutionStatus =
      "IN_PROGRESS";

    found.stop.arrivalTime =
      found.stop.arrivalTime ||
      sriLankaTimeLabel();

    found.stop.status =
      "arrived";

    await updateDispatcherMonitoring(
      () => recordDriverWorkflowEvent({
        trip: found.trip,
        stop: found.stop,
        driverUser: req.user,
        type: LIVE_MONITORING_EVENT_TYPES.ARRIVAL_EVENT_TYPE,
        message: `Driver arrived at ${found.stop.outletId}.`,
        payload: { arrivalTime: found.stop.arrivalTime },
      }),
      `arrival:${found.stop.stopId}`
    );

    res.json({
      stop:
        stopView(
          found.trip,
          found.stop
        ),
    });
  }
);

app.post(
  "/api/driver/stops/:stopId/outcome",
  driverAccess,
  async (req, res) => {
    const found =
      findStop(
        req.params.stopId
      );

    if (!found) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    const allowed = [
      "DELIVERED_FULL",
      "PARTIAL_DELIVERY",
      "UNABLE_TO_DELIVER",
    ];

    const {
      outcome,
      deliveredQuantity,
    } = req.body;

    if (
      !allowed.includes(
        outcome
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid delivery outcome.",
        });
    }

    const qty =
      Number(
        deliveredQuantity ??
        0
      );

    if (
      outcome ===
        "DELIVERED_FULL" &&
      qty !==
        found.stop.expectedUnits
    ) {
      return res
        .status(400)
        .json({
          message:
            "Full delivery quantity must equal the expected quantity.",
        });
    }

    if (
      outcome ===
        "PARTIAL_DELIVERY" &&
      (
        qty <= 0 ||
        qty >=
          found.stop.expectedUnits
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Partial delivery quantity must be between 1 and expected quantity - 1.",
        });
    }

    if (
      outcome ===
        "UNABLE_TO_DELIVER" &&
      qty !== 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Unable-to-deliver quantity must be 0.",
        });
    }

    found.stop.outcome =
      outcome;

    found.stop
      .deliveredQuantity =
      qty;

    await updateDispatcherMonitoring(
      () => recordDriverWorkflowEvent({
        trip: found.trip,
        stop: found.stop,
        driverUser: req.user,
        type: LIVE_MONITORING_EVENT_TYPES.OUTCOME_EVENT_TYPE,
        message: `${found.stop.outletId} outcome recorded: ${outcome.replaceAll("_", " ").toLowerCase()}.`,
        payload: { outcome, deliveredQuantity: qty },
      }),
      `outcome:${found.stop.stopId}`
    );

    res.json({
      stop:
        stopView(
          found.trip,
          found.stop
        ),
    });
  }
);

app.post(
  "/api/driver/stops/:stopId/exception",
  driverAccess,
  async (req, res) => {
    const found =
      findStop(
        req.params.stopId
      );

    if (!found) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    const {
      outcome,
      reason,
      notes,
      deliveredQuantity,
      photoName,
      recordedAt,
    } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({
          message:
            "Exception reason is required.",
        });
    }

    found.stop.exception = {
      outcome,

      reason,

      notes:
        notes || "",

      deliveredQuantity:
        Number(
          deliveredQuantity ||
          0
        ),

      photoName:
        photoName ||
        null,

      recordedAt:
        recordedAt ||
        new Date()
          .toISOString(),
    };

    await updateDispatcherMonitoring(
      () => recordDriverWorkflowEvent({
        trip: found.trip,
        stop: found.stop,
        driverUser: req.user,
        type: LIVE_MONITORING_EVENT_TYPES.EXCEPTION_EVENT_TYPE,
        message: `Delivery exception recorded at ${found.stop.outletId}: ${reason}.`,
        payload: found.stop.exception,
      }),
      `exception:${found.stop.stopId}`
    );

    res.json({
      exception:
        found.stop.exception,
    });
  }
);

app.post(
  "/api/driver/stops/:stopId/pod",
  driverAccess,
  async (req, res) => {
    const found =
      findStop(
        req.params.stopId
      );

    if (!found) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    const {
      receiverName,
      deliveryNote,
      photoName,
      recordedAt,
    } = req.body;

    if (
      !receiverName?.trim()
    ) {
      return res
        .status(400)
        .json({
          message:
            "Receiver name is required.",
        });
    }

    if (
      found.stop.outcome ===
      "UNABLE_TO_DELIVER"
    ) {
      return res
        .status(400)
        .json({
          message:
            "POD is not recorded when nothing was delivered.",
        });
    }

    found.stop.pod = {
      receiverName:
        receiverName.trim(),

      deliveryNote:
        deliveryNote || "",

      photoName:
        photoName ||
        "mock-pod-photo.jpg",

      recordedAt:
        recordedAt ||
        new Date()
          .toISOString(),
    };

    await updateDispatcherMonitoring(
      () => recordDriverWorkflowEvent({
        trip: found.trip,
        stop: found.stop,
        driverUser: req.user,
        type: LIVE_MONITORING_EVENT_TYPES.POD_EVENT_TYPE,
        message: `Proof of delivery submitted for ${found.stop.outletId}.`,
        payload: {
          ...found.stop.pod,
          deliveredQuantity: found.stop.deliveredQuantity ?? found.stop.expectedUnits,
        },
      }),
      `pod:${found.stop.stopId}`
    );

    res.json({
      pod:
        found.stop.pod,
    });
  }
);

app.post(
  "/api/driver/stops/:stopId/complete",
  driverAccess,
  async (req, res) => {
    const found =
      findStop(
        req.params.stopId
      );

    if (!found) {
      return res
        .status(404)
        .json({
          message:
            "Stop not found.",
        });
    }

    if (
      !found.stop.outcome
    ) {
      return res
        .status(400)
        .json({
          message:
            "Record a delivery outcome first.",
        });
    }

    if (
      (
        found.stop.outcome ===
          "DELIVERED_FULL" ||
        found.stop.outcome ===
          "PARTIAL_DELIVERY"
      ) &&
      !found.stop.pod
    ) {
      return res
        .status(400)
        .json({
          message:
            "Proof of delivery is required for delivered goods.",
        });
    }

    if (
      found.stop.outcome !==
        "DELIVERED_FULL" &&
      !found.stop.exception
    ) {
      return res
        .status(400)
        .json({
          message:
            "An exception record is required for partial/unable delivery.",
        });
    }

    found.stop.completed =
      true;

    found.stop.status =
      "completed";

    const next =
      updateNextStop(
        found.trip
      );

    await updateDispatcherMonitoring(
      () => recordDriverWorkflowEvent({
        trip: found.trip,
        stop: found.stop,
        driverUser: req.user,
        type: LIVE_MONITORING_EVENT_TYPES.COMPLETION_EVENT_TYPE,
        message: next
          ? `${found.stop.outletId} completed. Driver is continuing to ${next.outletId}.`
          : `Trip ${found.trip.tripId} completed.`,
        payload: {
          completedAt: new Date().toISOString(),
          nextStopId: next?.stopId || null,
        },
      }),
      `complete:${found.stop.stopId}`
    );

    res.json({
      completedStopId:
        found.stop.stopId,

      nextStopId:
        next?.stopId ||
        null,

      tripComplete:
        !next,
    });
  }
);

// ============================================================
// DRIVER LIVE ROUTE SHARING
// ============================================================

app.post(
  "/api/driver/trips/:tripId/stops/:stopId/route-progress",
  driverAccess,
  async (req, res) => {
    const trip = findTrip(req.params.tripId);
    const stop = trip?.stops.find((item) => item.stopId === req.params.stopId);

    if (!trip || !stop) {
      return res.status(404).json({
        success: false,
        message: "Trip or stop not found.",
      });
    }

    const {
      routePoints,
      currentLat,
      currentLng,
      distanceKm,
      durationMinutes,
      etaLabel,
      recordedAt,
    } = req.body || {};

    const result = await updateDispatcherMonitoring(
      () => recordDriverRouteSnapshot({
        trip,
        stop,
        driverUser: req.user,
        routePoints,
        currentLat,
        currentLng,
        distanceKm,
        durationMinutes,
        etaLabel,
        recordedAt,
      }),
      `route:${trip.tripId}:${stop.stopId}`
    );

    return res.json({
      success: true,
      monitoringUpdated: Boolean(result),
      updatedAt: result?.updatedAt || null,
    });
  }
);

// ============================================================
// DRIVER OFFLINE / SYNC ROUTES
// ============================================================

app.get(
  "/api/driver/sync-status",
  driverAccess,
  (req, res) => {
    res.json({
      pendingCount:
        state.sync
          .pendingCount,

      lastSuccessfulSync:
        state.sync
          .lastSuccessfulSync,

      recoveryNotification:
        state.sync
          .recoveryNotification,
    });
  }
);

app.post(
  "/api/driver/sync-recovery",
  driverAccess,
  (req, res) => {
    const syncedCount =
      Number(
        req.body.syncedCount ||
        0
      );

    const syncedAtLabel =
      req.body.syncedAtLabel ||
      new Date()
        .toLocaleTimeString(
          "en-US",
          {
            hour:
              "numeric",

            minute:
              "2-digit",
          }
        );

    state.sync.pendingCount =
      0;

    state.sync
      .lastSuccessfulSync =
      syncedAtLabel;

    state.sync
      .recoveryNotification =
      {
        title:
          "Sync complete",

        message:
          `${syncedCount} saved offline record${
            syncedCount === 1
              ? ""
              : "s"
          } synchronized after the connection returned.`,
      };

    res.json({
      ok: true,

      lastSuccessfulSync:
        state.sync
          .lastSuccessfulSync,

      syncNotification:
        state.sync
          .recoveryNotification,
    });
  }
);

app.post(
  "/api/driver/sync-notification/dismiss",
  driverAccess,
  (req, res) => {
    state.sync
      .recoveryNotification =
      null;

    res.json({
      ok: true,
    });
  }
);

// ============================================================
// DEVELOPMENT HELPERS
// Remove before production submission if not required.
// ============================================================

app.post(
  "/api/dev/simulate-sync-recovery",
  (req, res) => {
    state.sync
      .recoveryNotification =
      {
        title:
          "Sync complete",

        message:
          "Saved offline records were synchronized after the connection returned.",
      };

    res.json({
      syncNotification:
        state.sync
          .recoveryNotification,
    });
  }
);

app.post(
  "/api/dev/reset",
  (req, res) => {
    resetState();

    res.json({
      message:
        "Mock state reset.",
    });
  }
);

// ============================================================
// 404 HANDLER
// IMPORTANT: Must remain AFTER all routes.
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "API endpoint not found.",
    });
  }
);

// ============================================================
// GLOBAL ERROR HANDLER
// IMPORTANT: Must remain last.
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    void req;
    void next;

    console.error(
      "Unhandled API error:",
      error
    );

    res
      .status(
        error.status ||
        500
      )
      .json({
        success: false,

        message:
          process.env
            .NODE_ENV ===
          "production"
            ? "An unexpected server error occurred."
            : (
                error.message ||
                "An unexpected server error occurred."
              ),
      });
  }
);

export default app;