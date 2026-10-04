import {
  completeLoaderHandoverInDatabase,
  createLoaderIssueInDatabase,
  getLoaderDashboardFromDatabase,
  getLoaderIssuesFromDatabase,
  getLoaderTripFromDatabase,
  getLoaderTripsFromDatabase,
  resolveLoaderIssueInDatabase,
  updateLoaderItemInDatabase,
  updateLoaderVerificationInDatabase,
} from "../services/loaderDatabaseService.js";

function respondWithServiceError(res, error) {
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error("Loader database request failed:", error);
  return res.status(status).json({
    success: false,
    message: status < 500 ? error.message : "The Loader request could not be completed.",
  });
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getLoaderDashboard(req, res) {
  try {
    const data = await getLoaderDashboardFromDatabase(req.user?.depotId);
    if (!data) {
      return res.status(404).json({ success: false, message: "No active depot is assigned to this Loader." });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

// ============================================================
// TRIPS
// ============================================================

export async function getLoaderTrips(req, res) {
  try {
    const trips = await getLoaderTripsFromDatabase(req.user?.depotId);
    if (!trips) {
      return res.status(404).json({ success: false, message: "No active depot is assigned to this Loader." });
    }
    return res.json({ success: true, data: trips });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

export async function getLoaderTrip(req, res) {
  try {
    const trip = await getLoaderTripFromDatabase(req.params.tripId, req.user?.depotId);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found." });
    return res.json({ success: true, data: trip });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

// ============================================================
// LOADING ITEMS
// ============================================================

export async function patchLoadingItem(req, res) {
  const {
    loaded,
  } = req.body;

  if (typeof loaded !== "boolean") {
    return res.status(400).json({ success: false, message: "loaded must be true or false." });
  }
  try {
    const result = await updateLoaderItemInDatabase({
      tripCode: req.params.tripId,
      depotId: req.user?.depotId,
      itemId: req.params.itemId,
      loaded,
      loaderUser: req.user,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

// ============================================================
// ISSUES
// ============================================================

export async function postLoadingIssue(req, res) {
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

  try {
    const result = await createLoaderIssueInDatabase({
      tripCode: req.params.tripId,
      depotId: req.user?.depotId,
      itemId,

      issueType,

      expectedQty:
        expected,

      usableQty:
        usable,

      reason,

      note,

      loaderUser: req.user,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

export async function getLoaderIssues(req, res) {
  try {
    const data = await getLoaderIssuesFromDatabase({
      depotId: req.user?.depotId,
      tripCode: req.query.tripId,
      status: req.query.status,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

export async function patchIssueResolution(req, res) {
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

  try {
    const issue = await resolveLoaderIssueInDatabase({
      issueId: req.params.issueId,
      resolution,
      depotId: req.user?.depotId,
    });
    return res.json({ success: true, data: issue });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

// ============================================================
// VERIFICATION
// ============================================================

export async function patchVerification(req, res) {
  const allowed = ["count", "secure", "temperature", "docs"];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) {
      if (typeof req.body[key] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${key} must be true or false.`,
        });
      }
      updates[key] = req.body[key];
    }
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one verification check.",
    });
  }

  try {
    const result = await updateLoaderVerificationInDatabase({
      tripCode: req.params.tripId,
      depotId: req.user?.depotId,
      verification: updates,
    });
    if (!result) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    return respondWithServiceError(res, error);
  }
}

// ============================================================
// HANDOVER
// ============================================================

export async function postHandover(req, res) {
  let result;
  try {
    result = await completeLoaderHandoverInDatabase({
      tripCode: req.params.tripId,
      depotId: req.user?.depotId,
      loaderUser: req.user,
      sealNumber: req.body.sealNumber,
    });
  } catch (error) {
    return respondWithServiceError(res, error);
  }

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

  if (result.error === "ITEMS_NOT_LOADED") {
    return res.status(400).json({
      success: false,
      message: "Mark all assigned order items as loaded before handover.",
    });
  }
  if (result.error === "DRIVER_NOT_ASSIGNED") {
    return res.status(409).json({
      success: false,
      message: "Assign an active Driver before completing handover.",
    });
  }
  if (result.error === "SEAL_NUMBER_REQUIRED") {
    return res.status(400).json({
      success: false,
      message: "Enter the physical seal number before completing handover.",
    });
  }

  return res
    .status(201)
    .json({
      success: true,

      data: result,
    });
}