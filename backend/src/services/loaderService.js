import {
  loaderState,
} from "../loaderMockData.js";

// ============================================================
// HELPERS
// ============================================================

function getAllTrips() {
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
}

// ============================================================
// PROGRESS
// ============================================================

function calculateProgress(
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
}

// ============================================================
// DASHBOARD
// ============================================================

export function getDashboardData(
  depotKey
) {
  const depot =
    loaderState.depots[
      depotKey
    ];

  if (!depot) {
    return null;
  }

  const trips =
    depot.trips;

  return {
    depot: {
      key:
        depot.key,

      label:
        depot.label,

      dock:
        depot.dock,

      notice:
        depot.notice,
    },

    summary: {
      total:
        trips.length,

      inProgress:
        trips.filter(
          (trip) =>
            trip.status ===
            "LOADING"
        ).length,

      needsAction:
        trips.filter(
          (trip) =>
            trip.status ===
            "ISSUE"
        ).length,

      ready:
        trips.filter(
          (trip) =>
            trip.status ===
            "READY"
        ).length,
    },

    trips:
      trips.map(
        mapTripSummary
      ),
  };
}

function mapTripSummary(
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

// ============================================================
// TRIPS
// ============================================================

export function getTrips(
  depotKey
) {
  if (depotKey) {
    const depot =
      loaderState.depots[
        depotKey
      ];

    if (!depot) {
      return null;
    }

    return depot.trips.map(
      mapTripSummary
    );
  }

  return getAllTrips().map(
    mapTripSummary
  );
}

export function getTrip(
  tripId
) {
  const trip =
    findTripById(
      tripId
    );

  if (!trip) {
    return null;
  }

  const depot =
    findDepotForTrip(
      tripId
    );

  return {
    ...trip,

    progress:
      calculateProgress(
        trip
      ),

    depot: {
      key:
        depot.key,

      label:
        depot.label,

      dock:
        depot.dock,
    },
  };
}

// ============================================================
// LOADING ITEMS
// ============================================================

export function updateLoadingItem(
  tripId,
  itemId,
  loaded
) {
  const trip =
    findTripById(
      tripId
    );

  if (!trip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const found =
    findItem(
      trip,
      itemId
    );

  if (!found) {
    return {
      error:
        "ITEM_NOT_FOUND",
    };
  }

  found.item.loaded =
    Boolean(
      loaded
    );

  const progress =
    calculateProgress(
      trip
    );

  if (
    progress === 100 &&
    trip.status !==
      "ISSUE"
  ) {
    trip.status =
      "READY";
  } else if (
    progress > 0 &&
    trip.status !==
      "ISSUE"
  ) {
    trip.status =
      "LOADING";
  }

  return {
    item:
      found.item,

    progress,

    tripStatus:
      trip.status,
  };
}

// ============================================================
// ISSUES
// ============================================================

export function createIssue({
  tripId,
  itemId,
  issueType,
  expectedQty,
  usableQty,
  reason,
  note,
  loaderUserId,
}) {
  const trip =
    findTripById(
      tripId
    );

  if (!trip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const found =
    findItem(
      trip,
      itemId
    );

  if (!found) {
    return {
      error:
        "ITEM_NOT_FOUND",
    };
  }

  const issue = {
    id:
      `LISS-${String(
        loaderState.nextIssueId++
      ).padStart(
        4,
        "0"
      )}`,

    tripId,

    itemId,

    stopId:
      found.stop.id,

    stopName:
      found.stop.name,

    itemName:
      found.item.name,

    unit:
      found.item.unit,

    issueType,

    expectedQty,

    usableQty,

    reason,

    note:
      note || null,

    loaderUserId,

    status:
      "PENDING",

    resolution:
      null,

    createdAt:
      new Date()
        .toISOString(),

    resolvedAt:
      null,
  };

  loaderState.issues.push(
    issue
  );

  found.item.loaded =
    false;

  trip.status =
    "ISSUE";

  trip.loaderStatus =
    "BLOCKED";

  return issue;
}

export function getIssues({
  tripId,
  status,
} = {}) {
  let issues =
    loaderState.issues;

  if (tripId) {
    issues =
      issues.filter(
        (issue) =>
          issue.tripId ===
          tripId
      );
  }

  if (status) {
    issues =
      issues.filter(
        (issue) =>
          issue.status ===
          status
      );
  }

  return issues;
}

export function resolveIssue(
  issueId,
  resolution
) {
  const issue =
    loaderState.issues.find(
      (item) =>
        item.id ===
        issueId
    );

  if (!issue) {
    return null;
  }

  issue.status =
    "RESOLVED";

  issue.resolution =
    resolution;

  issue.resolvedAt =
    new Date()
      .toISOString();

  const trip =
    findTripById(
      issue.tripId
    );

  if (trip) {
    const stillOpen =
      loaderState.issues.some(
        (item) =>
          item.tripId ===
            trip.id &&
          item.status ===
            "PENDING"
      );

    if (!stillOpen) {
      trip.loaderStatus =
        "LOADING";

      trip.status =
        "LOADING";
    }
  }

  return issue;
}

// ============================================================
// VERIFICATION
// ============================================================

export function updateVerification(
  tripId,
  verification
) {
  const trip =
    findTripById(
      tripId
    );

  if (!trip) {
    return null;
  }

  trip.verification = {
    ...trip.verification,
    ...verification,
  };

  const complete =
    Object.values(
      trip.verification
    ).every(Boolean);

  return {
    verification:
      trip.verification,

    complete,
  };
}

// ============================================================
// HANDOVER
// ============================================================

export function completeHandover(
  tripId,
  {
    loaderUserId,
    sealNumber,
    handoverCode,
  }
) {
  const trip =
    findTripById(
      tripId
    );

  if (!trip) {
    return {
      error:
        "TRIP_NOT_FOUND",
    };
  }

  const verificationComplete =
    Object.values(
      trip.verification
    ).every(Boolean);

  if (
    !verificationComplete
  ) {
    return {
      error:
        "VERIFICATION_INCOMPLETE",
    };
  }

  const openIssue =
    loaderState.issues.some(
      (issue) =>
        issue.tripId ===
          tripId &&
        issue.status ===
          "PENDING"
    );

  if (openIssue) {
    return {
      error:
        "OPEN_ISSUE",
    };
  }

  trip.handoverCompleted =
    true;

  trip.loaderStatus =
    "VEHICLE_READY";

  trip.status =
    "READY";

  trip.handover = {
    loaderUserId,

    driver:
      trip.driver,

    sealNumber:
      sealNumber ||
      null,

    handoverCode:
      handoverCode ||
      null,

    handedOverAt:
      new Date()
        .toISOString(),
  };

  return trip.handover;
}