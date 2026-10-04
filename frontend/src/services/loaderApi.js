import api from "./api";

export function fetchLoaderDashboard(
  depot
) {
  return api.get(
    "/loader/dashboard",
    {
      params: {
        depot,
      },
    }
  );
}

export function fetchLoaderTrips(
  depot
) {
  return api.get(
    "/loader/trips",
    {
      params: {
        depot,
      },
    }
  );
}

export function fetchLoaderTrip(
  tripId
) {
  return api.get(
    `/loader/trips/${tripId}`
  );
}

export function setLoadingItem(
  tripId,
  itemId,
  loaded
) {
  return api.patch(
    `/loader/trips/${tripId}/items/${itemId}`,
    {
      loaded,
    }
  );
}

export function reportLoadingIssue(
  tripId,
  data
) {
  return api.post(
    `/loader/trips/${tripId}/issues`,
    data
  );
}

export function fetchLoaderIssues() {
  return api.get(
    "/loader/issues"
  );
}

export function saveVerification(
  tripId,
  verification
) {
  return api.patch(
    `/loader/trips/${tripId}/verification`,
    verification
  );
}

export function completeLoaderHandover(
  tripId,
  data
) {
  return api.post(
    `/loader/trips/${tripId}/handover`,
    data
  );
}