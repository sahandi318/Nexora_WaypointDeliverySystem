import {
  completeHandover,
  createIssue,
  getDashboardData,
  getIssues,
  getTrip,
  getTrips,
  resolveIssue,
  updateLoadingItem,
  updateVerification,
} from "../services/loaderService.js";

// ============================================================
// DASHBOARD
// ============================================================

export async function getLoaderDashboard(
  req,
  res
) {
  const depotKey =
    req.query.depot ||
    "peliyagoda";

  const data =
    await getDashboardData(
      depotKey
    );

  if (!data) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Depot not found.",
      });
  }

  return res.json({
    success: true,
    data,
  });
}

// ============================================================
// TRIPS
// ============================================================

export async function getLoaderTrips(
  req,
  res
) {
  try {
    const trips =
      await getTrips(
        req.query.depot
      );

    if (!trips) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Depot not found.",
        });
    }

    return res.json({
      success: true,
      data: trips,
    });
  } catch (error) {
    console.error(
      "Loader trips error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Failed to load trips.",
      });
  }
}

export async function getLoaderTrip(
  req,
  res
) {
  try {
  const trip =
    await getTrip(
      req.params.tripId,
      req.user.id
    );

  if (!trip) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Trip not found.",
      });
  }

  return res.json({
    success: true,
    data: trip,
  });
} catch (error) {
    console.error(
      "Loader trip error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Failed to load trip.",
      });
  }
}


// ============================================================
// LOADING ITEMS
// ============================================================

export async function patchLoadingItem(
  req,
  res
) {
  const {
    loaded,
  } = req.body;

  if (
    typeof loaded !==
    "boolean"
  ) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "loaded must be true or false.",
      });
  }

  const result =
    await updateLoadingItem(
      req.params.tripId,
      req.params.itemId,
      loaded,
      req.user.id
    );

  if (
    result.error ===
    "TRIP_NOT_FOUND"
  ) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Trip not found.",
      });
  }

  if (
    result.error ===
    "ITEM_NOT_FOUND"
  ) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Loading item not found.",
      });
  }

  return res.json({
    success: true,
    data: result,
  });
}

// ============================================================
// ISSUES
// ============================================================

export async function postLoadingIssue(
  req,
  res
) {
  const {
    itemId,
    issueType,
    expectedQty,
    usableQty,
    reason,
    note,
  } = req.body;

  if (
    !itemId ||
    !issueType ||
    expectedQty ===
      undefined ||
    usableQty ===
      undefined ||
    !reason
  ) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "itemId, issueType, expectedQty, usableQty and reason are required.",
      });
  }

  const expected =
    Number(
      expectedQty
    );

  const usable =
    Number(
      usableQty
    );

  if (
    !Number.isFinite(
      expected
    ) ||
    !Number.isFinite(
      usable
    ) ||
    expected < 0 ||
    usable < 0 ||
    usable > expected
  ) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "Invalid expected or usable quantity.",
      });
  }

  const result =
  await createIssue({
    tripId:
      req.params.tripId,

    itemId,

    issueType,

    expectedQty:
      expected,

    usableQty:
      usable,

    reason,

    note,

    loaderUserId:
      req.user.id,
  });

  if (result.error) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          result.error ===
          "TRIP_NOT_FOUND"
            ? "Trip not found."
            : "Loading item not found.",
      });
  }

  return res
    .status(201)
    .json({
      success: true,
      data: result,
    });
}

export async function getLoaderIssues(
  req,
  res
) {
  const data =
    await getIssues({
      tripId:
        req.query.tripId,

      status:
        req.query.status,
    });

  res.json({
    success: true,
    data,
  });
}

export async function patchIssueResolution(
  req,
  res
) {
  const {
    resolution,
  } = req.body;

  if (!resolution) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "resolution is required.",
      });
  }

  const issue =
  await resolveIssue(
    req.params.issueId,
    resolution,
    req.user?.id
  );

  if (!issue) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Issue not found.",
      });
  }

  return res.json({
    success: true,
    data: issue,
  });
}

// ============================================================
// VERIFICATION
// ============================================================

export async function patchVerification(
  req,
  res
) {
  const allowed =
    [
      "count",
      "secure",
      "temperature",
      "docs",
    ];

  const updates = {};

  for (
    const key
    of allowed
  ) {
    if (
      key in req.body
    ) {
      updates[key] =
        Boolean(
          req.body[key]
        );
    }
  }

  const result =
  await updateVerification(
    req.params.tripId,
    updates,
    req.user.id
  );

  if (!result) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Trip not found.",
      });
  }

  return res.json({
    success: true,
    data: result,
  });
}

// ============================================================
// HANDOVER
// ============================================================

export async function postHandover(
  req,
  res
) {
  const result =
    await completeHandover(
      req.params.tripId,
      {
        loaderUserId:
          req.user.id,

        sealNumber:
          req.body
            .sealNumber,

        handoverCode:
          req.body
            .handoverCode,
      }
    );

  if (
    result.error ===
    "TRIP_NOT_FOUND"
  ) {
    return res
      .status(404)
      .json({
        success: false,

        message:
          "Trip not found.",
      });
  }

  if (
    result.error ===
    "VERIFICATION_INCOMPLETE"
  ) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          "Complete all verification checks before handover.",
      });
  }

  if (
    result.error ===
    "OPEN_ISSUE"
  ) {
    return res
      .status(409)
      .json({
        success: false,

        message:
          "Resolve all loading issues before handover.",
      });
  }

  return res
    .status(201)
    .json({
      success: true,

      data: result,
    });
}