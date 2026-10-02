import Dexie from 'dexie';

export const offlineDb = new Dexie('nexoraDriverOffline');

offlineDb.version(1).stores({
  cachedTrips: 'tripId, cachedAt',
  cachedStops: 'stopId, tripId, cachedAt',
  cachedRoutes: 'stopId, cachedAt',
  pendingActions: '++id, &clientActionId, status, actionType, stopId, tripId, createdAt, visible',
  syncSessions: '++id, completedAt',
  offlineEvidence: '++id, stopId, createdAt',
});

export async function cacheTrip(trip) {
  if (!trip?.tripId) return;
  const cachedAt = new Date().toISOString();
  await offlineDb.cachedTrips.put({ tripId: trip.tripId, data: trip, cachedAt });
  if (Array.isArray(trip.stops)) {
    await offlineDb.cachedStops.bulkPut(
      trip.stops.map((stop) => ({ stopId: stop.stopId, tripId: trip.tripId, data: stop, cachedAt })),
    );
  }
}

export async function cacheStop(tripId, stop) {
  if (!stop?.stopId) return;
  const cachedAt = new Date().toISOString();
  await offlineDb.cachedStops.put({ stopId: stop.stopId, tripId, data: stop, cachedAt });

  const tripRecord = await offlineDb.cachedTrips.get(tripId);
  if (tripRecord?.data?.stops) {
    const nextTrip = structuredClone(tripRecord.data);
    nextTrip.stops = nextTrip.stops.map((item) => (item.stopId === stop.stopId ? stop : item));
    await offlineDb.cachedTrips.put({ tripId, data: nextTrip, cachedAt });
  }
}

export async function getCachedTrip(tripId) {
  const record = await offlineDb.cachedTrips.get(tripId);
  return record?.data || null;
}

export async function getCachedStop(stopId) {
  const record = await offlineDb.cachedStops.get(stopId);
  return record?.data || null;
}

export async function updateCachedTrip(tripId, updater) {
  const record = await offlineDb.cachedTrips.get(tripId);
  if (!record?.data) return null;
  const next = structuredClone(record.data);
  updater(next);
  await cacheTrip(next);
  return next;
}

export async function updateCachedStop(tripId, stopId, updater) {
  const stop = await getCachedStop(stopId);
  if (!stop) return null;
  const next = structuredClone(stop);
  updater(next);
  await cacheStop(tripId, next);
  return next;
}

export async function saveRouteCache(stopId, route) {
  if (!stopId || !route) return;
  await offlineDb.cachedRoutes.put({
    stopId,
    route,
    cachedAt: new Date().toISOString(),
  });
}

export async function getRouteCache(stopId) {
  const record = await offlineDb.cachedRoutes.get(stopId);
  return record?.route || null;
}

export async function saveOfflineEvidence({ stopId, kind, blob, name }) {
  if (!blob) return null;
  return offlineDb.offlineEvidence.add({
    stopId,
    kind,
    blob,
    name: name || 'evidence.jpg',
    createdAt: new Date().toISOString(),
  });
}
