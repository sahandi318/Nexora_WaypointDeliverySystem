import api from "./api";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

/**
 * Load the complete Dispatcher planning snapshot.
 *
 * Includes:
 * - confirmed/deferred orders
 * - fleet availability
 * - drivers
 * - suggested trips
 * - planning summary
 * - publication preview
 */
export async function getDispatcherPlanning({
  date,
  depot,
  orderId,
  signal,
} = {}) {
  try {
    const params = {};

    if (date) {
      params.date = date;
    }
    if (orderId) {
      params.orderId = orderId;
    }

    // Do not send "ALL".
    // When depot is omitted, the backend returns both depots.
    if (depot && depot !== "ALL") {
      params.depot = depot;
    }

    const response = await api.get(
      "/dispatcher/planning",
      {
        params,
        signal,
      }
    );

    return response.data;
  } catch (error) {
    // Let request cancellation pass through normally.
    if (
      error?.name === "CanceledError" ||
      error?.name === "AbortError" ||
      error?.code === "ERR_CANCELED"
    ) {
      throw error;
    }

    throw new Error(
      getErrorMessage(
        error,
        "Unable to load Dispatcher planning data."
      )
    );
  }
}

export async function saveDispatcherDraft({ date, depot, trips }) {
  if (!date || !depot || depot === "ALL") {
    throw new Error("Select a delivery date and one depot before saving the draft.");
  }
  if (!Array.isArray(trips) || trips.length === 0) {
    throw new Error("Add at least one trip with orders before saving the draft.");
  }

  try {
    const response = await api.post("/dispatcher/planning/draft", {
      date,
      depot,
      trips,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to save the delivery plan draft."));
  }
}

/**
 * Defer an order and save the Dispatcher reason.
 */
export async function deferDispatcherOrder({
  orderId,
  reason,
}) {
  if (!orderId) {
    throw new Error(
      "An order must be selected before it can be deferred."
    );
  }

  const cleanReason = String(reason || "").trim();

  if (!cleanReason) {
    throw new Error(
      "Please enter a reason for deferring the order."
    );
  }

  try {
    const response = await api.post(
      "/dispatcher/planning/defer",
      {
        orderId,
        reason: cleanReason,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Unable to defer the selected order."
      )
    );
  }
}

export async function publishDispatcherPlan({ date, depot }) {
  if (!date || !depot || depot === "ALL") {
    throw new Error("Select a delivery date and one depot before publishing.");
  }

  try {
    const response = await api.post("/dispatcher/planning/publish", { date, depot });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Unable to publish the saved delivery plan."));
  }
}

export async function getDispatcherCapacity({ startDate, endDate, depot, signal }) {
  try {
    const params = { startDate, endDate };
    if (depot && depot !== "ALL") params.depot = depot;
    const response = await api.get("/dispatcher/capacity", { params, signal });
    return response.data.data;
  } catch (error) {
    if (
      error?.name === "CanceledError" ||
      error?.name === "AbortError" ||
      error?.code === "ERR_CANCELED"
    ) {
      throw error;
    }
    throw new Error(getErrorMessage(error, "Unable to load capacity data."));
  }
}