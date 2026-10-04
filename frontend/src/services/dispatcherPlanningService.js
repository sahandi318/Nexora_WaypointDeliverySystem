import api from "./api";

export async function getDispatcherPlanning({
  date,
  depot,
  signal,
} = {}) {
  const params = {};

  if (date) params.date = date;
  if (depot && depot !== "ALL") params.depot = depot;

  const response = await api.get("/dispatcher/planning", {
    params,
    signal,
  });

  return response.data;
}

export async function deferDispatcherOrder({
  orderId,
  reason,
}) {
  const response = await api.post("/dispatcher/planning/defer", {
    orderId,
    reason,
  });

  return response.data;
}

export async function publishDispatcherTrip(trip) {
  const response = await api.post("/dispatcher/planning/publish", {
    trip,
  });

  return response.data;
}
