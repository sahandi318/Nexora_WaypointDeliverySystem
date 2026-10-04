import api from "./api";

export async function publishDriverRoute({
  tripId,
  stopId,
  routePoints,
  currentLocation,
  distanceKm,
  durationMinutes,
  etaLabel,
}) {
  if (!tripId || !stopId || !currentLocation) return null;

  const response = await api.post(
    `/driver/trips/${tripId}/stops/${stopId}/route-progress`,
    {
      routePoints: Array.isArray(routePoints) ? routePoints : [],
      currentLat: currentLocation.lat,
      currentLng: currentLocation.lng,
      distanceKm,
      durationMinutes,
      etaLabel,
      recordedAt: new Date().toISOString(),
    }
  );

  return response.data;
}
