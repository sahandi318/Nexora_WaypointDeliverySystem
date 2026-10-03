import api from './api';
import {
  cacheStop,
  cacheTrip,
  getCachedStop,
  getCachedTrip,
  offlineDb,
  updateCachedStop,
  updateCachedTrip,
  saveOfflineEvidence,
} from '../db/offlineDb';

let activeSyncPromise = null;

function nowIso() {
  return new Date().toISOString();
}

function currentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function isNetworkFailure(error) {
  return !error?.response || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
}

function actionDisplay(actionType, stop, payload = {}) {
  const outlet = stop?.outletId || payload.outletId || 'Outlet';
  const time = currentTimeLabel();
  switch (actionType) {
    case 'ARRIVAL':
      return { title: `${outlet} — Arrived`, detail: `Saved locally · ${time}`, icon: 'arrival' };
    case 'DELIVERY_OUTCOME': {
      const outcome = payload.outcome === 'DELIVERED_FULL'
        ? 'Delivered'
        : payload.outcome === 'PARTIAL_DELIVERY'
          ? 'Partial delivery'
          : 'Unable to deliver';
      return { title: `${outlet} — ${outcome}`, detail: `Saved locally · ${time}`, icon: 'outcome' };
    }
    case 'EXCEPTION':
      return { title: `${outlet} — Exception`, detail: `Reason saved locally · ${time}`, icon: 'exception' };
    case 'POD':
      return { title: `${outlet} — POD`, detail: `Photo + receiver details saved locally · ${time}`, icon: 'pod' };
    default:
      return { title: `${outlet} — Update`, detail: `Saved locally · ${time}`, icon: 'update' };
  }
}

async function queueAction({ actionType, tripId, stopId, endpoint, payload = {}, visible = true, stop }) {
  const display = actionDisplay(actionType, stop, payload);
  const record = {
    clientActionId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    status: 'pending',
    actionType,
    tripId,
    stopId,
    endpoint,
    method: 'post',
    payload,
    visible,
    createdAt: nowIso(),
    display,
  };
  await offlineDb.pendingActions.add(record);
  window.dispatchEvent(new CustomEvent('nexora:offline-queue-changed'));
  return record;
}

export async function getDriverTrip(tripId) {
  if (navigator.onLine) {
    try {
      const response = await api.get(`/driver/trips/${tripId}`);
      await cacheTrip(response.data.trip);
      return { trip: response.data.trip, source: 'server' };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  const cached = await getCachedTrip(tripId);
  if (!cached) throw new Error('This trip is not available offline yet. Open the trip once while connected.');
  return { trip: cached, source: 'cache' };
}

export async function getDriverStop(tripId, stopId) {
  if (navigator.onLine) {
    try {
      const response = await api.get(`/driver/trips/${tripId}/stops/${stopId}`);
      await cacheStop(tripId, response.data.stop);
      return { stop: response.data.stop, source: 'server' };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  const cached = await getCachedStop(stopId);
  if (!cached) throw new Error('This stop is not available offline yet. Open the trip once while connected.');
  return { stop: cached, source: 'cache' };
}

export async function recordArrival({ tripId, stopId }) {
  const recordedAt = nowIso();

  if (navigator.onLine) {
    try {
      const response = await api.post(`/driver/stops/${stopId}/arrive`, { recordedAt });
      await cacheStop(tripId, response.data.stop);
      return { stop: response.data.stop, offline: false };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  const stop = await updateCachedStop(tripId, stopId, (draft) => {
    draft.arrivalTime = draft.arrivalTime || currentTimeLabel();
    draft.status = 'arrived';
  });

  await queueAction({
    actionType: 'ARRIVAL',
    tripId,
    stopId,
    endpoint: `/driver/stops/${stopId}/arrive`,
    payload: { recordedAt },
    stop,
  });

  return { stop, offline: true };
}

export async function recordOutcome({ tripId, stopId, outcome, deliveredQuantity }) {
  const payload = { outcome, deliveredQuantity, recordedAt: nowIso() };

  if (navigator.onLine) {
    try {
      const response = await api.post(`/driver/stops/${stopId}/outcome`, payload);
      await cacheStop(tripId, response.data.stop);
      return { stop: response.data.stop, offline: false };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  const stop = await updateCachedStop(tripId, stopId, (draft) => {
    draft.outcome = outcome;
    draft.deliveredQuantity = Number(deliveredQuantity || 0);
  });

  await queueAction({
    actionType: 'DELIVERY_OUTCOME',
    tripId,
    stopId,
    endpoint: `/driver/stops/${stopId}/outcome`,
    payload,
    stop,
  });

  return { stop, offline: true };
}

export async function recordException({ tripId, stopId, outcome, reason, notes, deliveredQuantity, photo }) {
  const payload = {
    outcome,
    reason,
    notes,
    deliveredQuantity: Number(deliveredQuantity || 0),
    photoName: photo?.name || null,
    recordedAt: nowIso(),
  };

  if (navigator.onLine) {
    try {
      const response = await api.post(`/driver/stops/${stopId}/exception`, payload);
      await updateCachedStop(tripId, stopId, (draft) => {
        draft.exception = response.data.exception;
      });
      return { exception: response.data.exception, offline: false };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  if (photo) {
    await saveOfflineEvidence({ stopId, kind: 'exception', blob: photo, name: photo.name });
  }

  const stop = await updateCachedStop(tripId, stopId, (draft) => {
    draft.exception = { ...payload };
  });

  await queueAction({
    actionType: 'EXCEPTION',
    tripId,
    stopId,
    endpoint: `/driver/stops/${stopId}/exception`,
    payload,
    stop,
  });

  return { exception: stop?.exception, offline: true };
}

export async function recordPod({ tripId, stopId, receiverName, deliveryNote, photo }) {
  const payload = {
    receiverName,
    deliveryNote,
    photoName: photo?.name || 'mock-pod-photo.jpg',
    recordedAt: nowIso(),
  };

  if (navigator.onLine) {
    try {
      const response = await api.post(`/driver/stops/${stopId}/pod`, payload);
      await updateCachedStop(tripId, stopId, (draft) => {
        draft.pod = response.data.pod;
      });
      return { pod: response.data.pod, offline: false };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  if (photo) {
    await saveOfflineEvidence({ stopId, kind: 'pod', blob: photo, name: photo.name });
  }

  const stop = await updateCachedStop(tripId, stopId, (draft) => {
    draft.pod = { ...payload };
  });

  await queueAction({
    actionType: 'POD',
    tripId,
    stopId,
    endpoint: `/driver/stops/${stopId}/pod`,
    payload,
    stop,
  });

  return { pod: stop?.pod, offline: true };
}

export async function completeStop({ tripId, stopId }) {
  if (navigator.onLine) {
    try {
      const response = await api.post(`/driver/stops/${stopId}/complete`);
      try {
        const tripResponse = await api.get(`/driver/trips/${tripId}`);
        await cacheTrip(tripResponse.data.trip);
      } catch {
        // Completion already succeeded; cache refresh is best-effort.
      }
      return { ...response.data, offline: false };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
    }
  }

  let nextStopId = null;
  let tripComplete = false;

  await updateCachedTrip(tripId, (trip) => {
    const current = trip.stops.find((item) => item.stopId === stopId);
    if (current) {
      current.completed = true;
      current.status = 'completed';
      current.completedAt = nowIso();
    }

    const next = trip.stops.find((item) => !item.completed);
    trip.stops.forEach((item) => {
      if (item.completed) item.status = 'completed';
      else if (next && item.stopId === next.stopId) item.status = 'next';
      else item.status = 'pending';
    });

    nextStopId = next?.stopId || null;
    tripComplete = !next;
    if (tripComplete) {
      trip.driverExecutionStatus = 'COMPLETED';
      trip.statusKey = 'COMPLETED';
      trip.statusLabel = 'Completed';
      trip.completedAt = nowIso();
    }
  });

  const stop = await getCachedStop(stopId);
  await queueAction({
    actionType: 'COMPLETE_STOP',
    tripId,
    stopId,
    endpoint: `/driver/stops/${stopId}/complete`,
    payload: { recordedAt: nowIso() },
    visible: false,
    stop,
  });

  return { completedStopId: stopId, nextStopId, tripComplete, offline: true };
}

export async function getPendingActions({ visibleOnly = false } = {}) {
  let actions = await offlineDb.pendingActions.where('status').equals('pending').sortBy('id');
  if (visibleOnly) actions = actions.filter((item) => item.visible !== false);
  return actions;
}

export async function getLatestSyncSession() {
  const rows = await offlineDb.syncSessions.orderBy('id').reverse().limit(1).toArray();
  return rows[0] || null;
}

export async function syncPendingActions() {
  if (activeSyncPromise) return activeSyncPromise;
  if (!navigator.onLine) {
    return { syncedCount: 0, visibleSyncedCount: 0, offline: true, actions: [] };
  }

  activeSyncPromise = (async () => {
    const pending = await getPendingActions();
    if (!pending.length) {
      return { syncedCount: 0, visibleSyncedCount: 0, actions: [] };
    }

    const synced = [];
    for (const action of pending) {
      try {
        await api.request({
          url: action.endpoint,
          method: action.method || 'post',
          data: action.payload || {},
        });
        await offlineDb.pendingActions.update(action.id, {
          status: 'synced',
          syncedAt: nowIso(),
        });
        synced.push(action);
      } catch (error) {
        if (isNetworkFailure(error)) break;
        await offlineDb.pendingActions.update(action.id, {
          lastError: error.response?.data?.message || error.message || 'Sync failed',
        });
        break;
      }
    }

    const visibleActions = synced.filter((item) => item.visible !== false);
    if (synced.length) {
      const completedAt = nowIso();
      const session = {
        completedAt,
        completedAtLabel: currentTimeLabel(),
        syncedCount: synced.length,
        visibleSyncedCount: visibleActions.length,
        actions: visibleActions.map((item) => ({
          actionType: item.actionType,
          stopId: item.stopId,
          tripId: item.tripId,
          display: item.display,
          createdAt: item.createdAt,
        })),
      };
      const id = await offlineDb.syncSessions.add(session);
      session.id = id;

      try {
        await api.post('/driver/sync-recovery', {
          syncedCount: visibleActions.length,
          syncedAt: completedAt,
          syncedAtLabel: session.completedAtLabel,
        });
      } catch {
        // All business records are already synchronized; this notification update is best-effort.
      }

      window.dispatchEvent(new CustomEvent('nexora:sync-complete', { detail: session }));
      window.dispatchEvent(new CustomEvent('nexora:offline-queue-changed'));
      return session;
    }

    return { syncedCount: 0, visibleSyncedCount: 0, actions: [] };
  })();

  try {
    return await activeSyncPromise;
  } finally {
    activeSyncPromise = null;
  }
}

export async function pendingSummary() {
  const all = await getPendingActions();
  const visible = all.filter((item) => item.visible !== false);
  return { allCount: all.length, visibleCount: visible.length, actions: visible };
}

export async function clearSyncedLocalActions() {
  await offlineDb.pendingActions.where('status').equals('synced').delete();
}
