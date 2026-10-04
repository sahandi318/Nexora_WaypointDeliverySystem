import prisma from "../config/database.js";

// ============================================================
// HELPERS
// ============================================================
function depotKeyToName(
  depotKey
) {
  if (
    depotKey === "kandy"
  ) {
    return "Kandy Hub";
  }

  return "Peliyagoda DC";
}

/*function getAllTrips() {
  return Object.values(
    loaderState.depots
  ).flatMap(
    (depot) =>
      depot.trips
  );
}

export function findTripById(
  tripId
) {
  return getAllTrips().find(
    (trip) =>
      trip.id === tripId
  );
}

function findDepotForTrip(
  tripId
) {
  return Object.values(
    loaderState.depots
  ).find(
    (depot) =>
      depot.trips.some(
        (trip) =>
          trip.id === tripId
      )
  );
}

function findItem(
  trip,
  itemId
) {
  for (
    const stop
    of trip.stops
  ) {
    const item =
      stop.items.find(
        (candidate) =>
          candidate.id ===
          itemId
      );

    if (item) {
      return {
        stop,
        item,
      };
    }
  }

  return null;
}*/

function mapTripSummary(
  trip
) {
  const items =
    trip.loaderState
      ?.loadingItems ||
    [];

  const loadedCount =
    items.filter(
      (item) =>
        item.status ===
        "LOADED"
    ).length;

  const progress =
    items.length
      ? Math.round(
          (
            loadedCount /
            items.length
          ) *
            100
        )
      : 0;

  const loaderStatus =
    trip.loaderState
      ?.status ||
    "NOT_STARTED";

  let status =
    "WAITING";

  if (
    loaderStatus ===
    "LOADING"
  ) {
    status =
      "LOADING";
  }

  if (
    loaderStatus ===
    "ISSUE"
  ) {
    status =
      "ISSUE";
  }

  if (
    loaderStatus ===
    "VEHICLE_READY"
  ) {
    status =
      "READY";
  }

  return {
    id:
      trip.tripCode,

    vehicle:
      trip.vehicleCode,

    type:
      trip.vehicleType ||
      "Vehicle",

    trip:
      trip.id,

    route:
      trip.nextDestination ||
      "Published route",

    stops:
      trip.progressTotal ||
      trip.stops.length,

    status,

    priority:
      false,

    depart:
      trip.eta ||
      "—",

    progress,

    loaded:
      `${loadedCount} items`,

    capacity:
      `${items.length} items`,

    loaderStatus,

    dispatcherPlanStatus:
      "PUBLISHED",
  };
}

async function ensureLoaderTripState(
  liveTrip,
  loaderUserId
) {
  return prisma.loaderTripState.upsert({
    where: {
      liveTripId:
        liveTrip.id,
    },

    update: {
      loaderUserId:
        loaderUserId ||
        undefined,
    },

    create: {
      liveTripId:
        liveTrip.id,

      loaderUserId:
        loaderUserId ||
        null,

      status:
        "NOT_STARTED",
    },

    include: {
      loadingItems:
        true,

      verification:
        true,

      handover:
        true,
    },
  });
}

async function ensureLoadingItems(
  loaderTrip,
  liveTrip
) {
  for (
    const stop
    of liveTrip.stops
  ) {
    if (
      !stop.storeOrder
    ) {
      continue;
    }

    for (
      const orderItem
      of stop.storeOrder
        .items
    ) {
      const product =
        orderItem.product;

      const itemCode =
        `${stop.stopCode}-${orderItem.id}`;

      await prisma.loadingItem.upsert({
        where: {
          loaderTripId_itemCode: {
            loaderTripId:
              loaderTrip.id,

            itemCode,
          },
        },

        update: {},

        create: {
          loaderTripId:
            loaderTrip.id,

          storeOrderItemId:
            orderItem.id,

          stopCode:
            stop.stopCode,

          itemCode,

          itemName:
            product.name,

          expectedQty:
            orderItem.quantity,

          loadedQty:
            0,

          unit:
            product.unitLabel ||
            "units",

          status:
            "PENDING",
        },
      });
    }
  }
}
// ============================================================
// PROGRESS
// ============================================================

/*function calculateProgress(
  trip
) {
  const items =
    trip.stops.flatMap(
      (stop) =>
        stop.items
    );

  if (
    items.length === 0
  ) {
    return trip.status ===
      "READY"
      ? 100
      : 0;
  }

  const loaded =
    items.filter(
      (item) =>
        item.loaded
    ).length;

  return Math.round(
    (
      loaded /
      items.length
    ) *
      100
  );
}*/

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardData(
  depotKey
) {
  const depotName =
    depotKeyToName(
      depotKey
    );

  const depot =
    await prisma.depot.findFirst({
      where: {
        name:
          depotName,

        isActive:
          true,
      },
    });

  if (!depot) {
    return null;
  }

  const trips =
    await prisma.liveTrip.findMany({
      where: {
        depotId:
          depot.id,

        status: {
          not:
            "COMPLETED",
        },
      },

      include: {
        loaderState: {
          include: {
            loadingItems:
              true,
          },
        },

        stops:
          true,

        driver:
          true,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });

  return {
    depot: {
      key:
        depotKey,

      label:
        depot.name,

      dock:
        "Dock 05",

      notice:
        "Follow the published loading sequence.",
    },

    summary: {
      total:
        trips.length,

      inProgress:
        trips.filter(
          (trip) =>
            trip.loaderState
              ?.status ===
            "LOADING"
        ).length,

      needsAction:
        trips.filter(
          (trip) =>
            trip.loaderState
              ?.status ===
            "ISSUE"
        ).length,

      ready:
        trips.filter(
          (trip) =>
            trip.loaderState
              ?.status ===
            "VEHICLE_READY"
        ).length,
    },

    trips:
      trips.map(
        mapTripSummary
      ),
  };
}

/*function mapTripSummary(
  trip
) {
  return {
    id:
      trip.id,

    vehicle:
      trip.vehicle,

    type:
      trip.vehicleType,

    trip:
      trip.tripNumber,

    route:
      trip.route,

    stops:
      trip.stops.length,

    status:
      trip.status,

    priority:
      trip.priority,

    depart:
      trip.depart,

    progress:
      calculateProgress(
        trip
      ),

    loaded:
      trip.loadedWeight,

    capacity:
      trip.capacityWeight,

    loaderStatus:
      trip.loaderStatus,

    dispatcherPlanStatus:
      trip.dispatcherPlanStatus,
  };
}
*/
// ============================================================
// TRIPS
// ============================================================

export async function getTrips(
  depotKey
) {
  if (depotKey) {
    const dashboard =
      await getDashboardData(
        depotKey
      );

    return dashboard
      ? dashboard.trips
      : null;
  }

  const trips =
    await prisma.liveTrip.findMany({
      where: {
        status: {
          not: "COMPLETED",
        },
      },

      include: {
        loaderState: {
          include: {
            loadingItems: true,
          },
        },

        stops: true,
        driver: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  return trips.map(
    mapTripSummary
  );
}

export async function getTrip(
  tripCode,
  loaderUserId
) {
  const liveTrip =
    await prisma.liveTrip.findUnique({
      where: {
        tripCode,
      },

      include: {
        depot:
          true,

        driver:
          true,

        stops: {
          include: {
            storeOrder: {
              include: {
                outlet: true,
                items: {
                  include: {
                    product:
                      true,
                  },
                },
              },
            },
          },

          orderBy: {
            sequence:
              "asc",
          },
        },

        loaderState: {
          include: {
            loadingItems:
              true,

            verification:
              true,

            handover:
              true,
          },
        },
      },
    });

  if (!liveTrip) {
    return null;
  }

  let loaderState =
    liveTrip.loaderState;

  if (!loaderState) {
    loaderState =
      await ensureLoaderTripState(
        liveTrip,
        loaderUserId
      );
  }

  await ensureLoadingItems(
    loaderState,
    liveTrip
  );

  loaderState =
    await prisma.loaderTripState.findUnique({
      where: {
        liveTripId:
          liveTrip.id,
      },

      include: {
        loadingItems:
          true,

        verification:
          true,

        handover:
          true,
      },
    });

  const loadingByCode =
    new Map(
      loaderState.loadingItems.map(
        (item) => [
          item.itemCode,
          item,
        ]
      )
    );

  const stops =
    liveTrip.stops.map(
      (stop) => ({
        id:
          stop.stopCode,

        number:
          stop.sequence,

        name:
          stop.outletName ||
          stop.outletCode,

        window:
          stop.storeOrder
            ?.outlet
            ?.windowOpenTime &&
          stop.storeOrder
            ?.outlet
            ?.windowCloseTime
            ? `${stop.storeOrder.outlet.windowOpenTime}–${stop.storeOrder.outlet.windowCloseTime}`
            : "No delivery window",

        zone:
          stop.storeOrder
            ?.outlet
            ?.dockType ||
          "Standard unloading",

        planning: stop.planningContext || null,

        items:
          (
            stop.storeOrder
              ?.items ||
            []
          ).map(
            (orderItem) => {
              const itemCode =
                `${stop.stopCode}-${orderItem.id}`;

              const loading =
                loadingByCode.get(
                  itemCode
                );

              return {
                id:
                  itemCode,

                name:
                  orderItem
                    .product
                    .name,

                meta:
                  `${
                    orderItem
                      .product
                      .handlingType
                  } · ${
                    orderItem
                      .product
                      .sku
                  }`,

                quantity:
                  orderItem
                    .quantity,

                unit:
                  orderItem
                    .product
                    .unitLabel,

                loaded:
                  loading
                    ?.status ===
                  "LOADED",
              };
            }
          ),
      })
    );

  return {
    id:
      liveTrip.tripCode,

    vehicle:
      liveTrip.vehicleCode,

    vehicleType:
      liveTrip.vehicleType ||
      "Vehicle",

    tripNumber:
      liveTrip.id,

    route:
      liveTrip.nextDestination ||
      "Published route",

    depart:
      liveTrip.eta ||
      "—",

    loadedWeight:
      0,

    capacityWeight:
      0,

    driver:
      liveTrip.driver
        ? {
            id:
              liveTrip.driver
                .userId,

            name:
              liveTrip.driver
                .fullName,
          }
        : null,

    verification: {
      count:
        loaderState
          .verification
          ?.countVerified ||
        false,

      secure:
        loaderState
          .verification
          ?.secureVerified ||
        false,

      temperature:
        loaderState
          .verification
          ?.temperatureVerified ||
        false,

      docs:
        loaderState
          .verification
          ?.docsVerified ||
        false,
    },

    handoverCompleted:
      Boolean(
        loaderState.handover
      ),

    stops,

    depot: {
      key:
        liveTrip.depot
          ?.code?.toLowerCase() ||
        "",

      label:
        liveTrip.depot
          ?.name ||
        "",

      dock:
        loaderState.dock ||
        "",
    },
  };
}

// ============================================================
// LOADING ITEMS
// ============================================================

export async function updateLoadingItem(
  tripCode,
  itemCode,
  loaded,
  loaderUserId
) {
  const liveTrip =
    await prisma.liveTrip.findUnique({
      where: {
        tripCode,
      },

      include: {
        loaderState:
          true,
      },
    });

  if (!liveTrip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const loaderTrip =
    liveTrip.loaderState ||
    await ensureLoaderTripState(
      liveTrip,
      loaderUserId
    );

  const item =
    await prisma.loadingItem.findFirst({
      where: {
        loaderTripId:
          loaderTrip.id,

        itemCode,
      },
    });

  if (!item) {
    return {
      error:
        "ITEM_NOT_FOUND",
    };
  }

  const updated =
    await prisma.loadingItem.update({
      where: {
        id:
          item.id,
      },

      data: {
        loadedQty:
          loaded
            ? item.expectedQty
            : 0,

        status:
          loaded
            ? "LOADED"
            : "PENDING",

        loadedAt:
          loaded
            ? new Date()
            : null,
      },
    });

  const allItems =
    await prisma.loadingItem.findMany({
      where: {
        loaderTripId:
          loaderTrip.id,
      },
    });

  const loadedCount =
    allItems.filter(
      (item) =>
        item.status ===
        "LOADED"
    ).length;

  await prisma.loaderTripState.update({
    where: {
      id:
        loaderTrip.id,
    },

    data: {
      loaderUserId,

      status:
        loadedCount ===
          allItems.length &&
        allItems.length > 0
          ? "LOADED"
          : "LOADING",

      startedAt:
        loaderTrip.startedAt ||
        new Date(),
    },
  });

  return {
    item:
      updated,

    progress:
      allItems.length
        ? Math.round(
            loadedCount /
              allItems.length *
              100
          )
        : 0,
  };
}

// ============================================================
// ISSUES
// ============================================================

export async function createIssue({
  tripId,
  itemId,
  issueType,
  expectedQty,
  usableQty,
  reason,
  note,
  loaderUserId,
}) {
  const liveTrip =
    await prisma.liveTrip.findUnique({
      where: {
        tripCode:
          tripId,
      },

      include: {
        loaderState:
          true,
      },
    });

  if (!liveTrip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const loaderTrip =
    liveTrip.loaderState ||
    await ensureLoaderTripState(
      liveTrip,
      loaderUserId
    );

  const loadingItem =
    await prisma.loadingItem.findFirst({
      where: {
        loaderTripId:
          loaderTrip.id,

        itemCode:
          itemId,
      },
    });

  if (!loadingItem) {
    return {
      error:
        "ITEM_NOT_FOUND",
    };
  }

  const issue =
    await prisma.loadingIssue.create({
      data: {
        loadingItemId:
          loadingItem.id,

        loaderUserId,

        issueType,

        expectedQty,

        usableQty,

        reason,

        note:
          note || null,

        status:
          "PENDING",
      },
    });

  await prisma.loadingItem.update({
    where: {
      id:
        loadingItem.id,
    },

    data: {
      status:
        "ISSUE",

      loadedQty:
        usableQty,
    },
  });

  await prisma.loaderTripState.update({
    where: {
      id:
        loaderTrip.id,
    },

    data: {
      status:
        "ISSUE",
    },
  });

  return {
    id:
      issue.id,

    tripId,

    itemId,

    itemName:
      loadingItem.itemName,

    stopName:
      loadingItem.stopCode,

    expectedQty,

    usableQty,

    note:
      issue.note,

    status:
      issue.status,

    createdAt:
      issue.createdAt,
  };
}

export async function getIssues({
  tripId,
  status,
} = {}) {
  const rows =
    await prisma.loadingIssue.findMany({
      where: {
        ...(status
          ? {
              status,
            }
          : {}),

        ...(tripId
          ? {
              loadingItem: {
                loaderTrip: {
                  liveTrip: {
                    tripCode:
                      tripId,
                  },
                },
              },
            }
          : {}),
      },

      include: {
        loadingItem: {
          include: {
            loaderTrip: {
              include: {
                liveTrip:
                  true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });

  return rows.map(
    (issue) => ({
      id:
        issue.id,

      tripId:
        issue.loadingItem
          .loaderTrip
          .liveTrip
          .tripCode,

      itemId:
        issue.loadingItem
          .itemCode,

      itemName:
        issue.loadingItem
          .itemName,

      stopName:
        issue.loadingItem
          .stopCode,

      expectedQty:
        issue.expectedQty,

      usableQty:
        issue.usableQty,

      note:
        issue.note,

      reason:
        issue.reason,

      status:
        issue.status,

      resolution:
        issue.resolution,

      createdAt:
        issue.createdAt,

      resolvedAt:
        issue.resolvedAt,
    })
  );
}

export async function resolveIssue(
  issueId,
  resolution,
  resolverUserId = null
) {
  const id =
    Number(issueId);

  if (
    !Number.isInteger(id)
  ) {
    return null;
  }

  const existing =
    await prisma.loadingIssue.findUnique({
      where: {
        id,
      },

      include: {
        loadingItem: {
          include: {
            loaderTrip: true,
          },
        },
      },
    });

  if (!existing) {
    return null;
  }

  const issue =
    await prisma.loadingIssue.update({
      where: {
        id,
      },

      data: {
        status:
          "RESOLVED",

        resolution,

        resolvedByUserId:
          resolverUserId ||
          null,

        resolvedAt:
          new Date(),
      },
    });

  const loaderTripId =
    existing.loadingItem
      .loaderTripId;

  const remainingIssues =
    await prisma.loadingIssue.count({
      where: {
        status:
          "PENDING",

        loadingItem: {
          loaderTripId,
        },
      },
    });

  if (
    remainingIssues === 0
  ) {
    await prisma.loaderTripState.update({
      where: {
        id:
          loaderTripId,
      },

      data: {
        status:
          "LOADING",
      },
    });
  }

  return issue;
}

// ============================================================
// VERIFICATION
// ============================================================

export async function updateVerification(
  tripCode,
  verification,
  loaderUserId
) {
  const liveTrip =
    await prisma.liveTrip.findUnique({
      where: {
        tripCode,
      },

      include: {
        loaderState:
          true,
      },
    });

  if (!liveTrip) {
    return null;
  }

  const loaderTrip =
    liveTrip.loaderState ||
    await ensureLoaderTripState(
      liveTrip,
      loaderUserId
    );

  const complete =
    verification.count &&
    verification.secure &&
    verification.temperature &&
    verification.docs;

  const result =
    await prisma.loadingVerification.upsert({
      where: {
        loaderTripId:
          loaderTrip.id,
      },

      update: {
        countVerified:
          verification.count,

        secureVerified:
          verification.secure,

        temperatureVerified:
          verification.temperature,

        docsVerified:
          verification.docs,

        completedAt:
          complete
            ? new Date()
            : null,
      },

      create: {
        loaderTripId:
          loaderTrip.id,

        countVerified:
          verification.count,

        secureVerified:
          verification.secure,

        temperatureVerified:
          verification.temperature,

        docsVerified:
          verification.docs,

        completedAt:
          complete
            ? new Date()
            : null,
      },
    });

  return {
    verification: {
      count:
        result.countVerified,

      secure:
        result.secureVerified,

      temperature:
        result.temperatureVerified,

      docs:
        result.docsVerified,
    },

    complete,
  };
}

// ============================================================
// HANDOVER
// ============================================================

export async function completeHandover(
  tripCode,
  {
    loaderUserId,
    sealNumber,
    handoverCode,
  }
) {
  const liveTrip =
    await prisma.liveTrip.findUnique({
      where: {
        tripCode,
      },

      include: {
        loaderState: {
          include: {
            verification:
              true,

            loadingItems: {
              include: {
                issues:
                  true,
              },
            },
          },
        },

        driver:
          true,
      },
    });

  if (!liveTrip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const loaderTrip =
    liveTrip.loaderState;

  if (!loaderTrip) {
    return {
      error:
        "VERIFICATION_INCOMPLETE",
    };
  }

  const verification =
    loaderTrip.verification;

  const complete =
    verification &&
    verification.countVerified &&
    verification.secureVerified &&
    verification.temperatureVerified &&
    verification.docsVerified;

  if (!complete) {
    return {
      error:
        "VERIFICATION_INCOMPLETE",
    };
  }

  const openIssue =
    loaderTrip.loadingItems.some(
      (item) =>
        item.issues.some(
          (issue) =>
            issue.status ===
            "PENDING"
        )
    );

  if (openIssue) {
    return {
      error:
        "OPEN_ISSUE",
    };
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const handover =
          await tx.driverHandover.upsert({
            where: {
              loaderTripId:
                loaderTrip.id,
            },

            update: {
              loaderUserId,

              driverUserId:
                liveTrip.driverUserId,

              sealNumber,

              handoverCode,

              handedOverAt:
                new Date(),
            },

            create: {
              loaderTripId:
                loaderTrip.id,

              loaderUserId,

              driverUserId:
                liveTrip.driverUserId,

              sealNumber,

              handoverCode,
            },
          });

        await tx.loaderTripState.update({
          where: {
            id:
              loaderTrip.id,
          },

          data: {
            status:
              "VEHICLE_READY",

            completedAt:
              new Date(),
          },
        });

        await tx.liveTrip.update({
          where: {
            id:
              liveTrip.id,
          },

          data: {
            status:
              "VEHICLE_READY",
          },
        });

        return handover;
      }
    );

  return {
    id:
      result.id,

    loaderUserId,

    driver:
      liveTrip.driver
        ? {
            id:
              liveTrip.driver
                .userId,

            name:
              liveTrip.driver
                .fullName,
          }
        : null,

    sealNumber:
      result.sealNumber,

    handoverCode:
      result.handoverCode,

    handedOverAt:
      result.handedOverAt,
  };
}