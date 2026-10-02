import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { resetState, state } from './mockData.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-nexora-secret';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function allTrips() {
  return [...state.trips, ...(state.historyTrips || [])];
}

function findTrip(tripId) {
  return allTrips().find((trip) => trip.tripId === tripId);
}

function findStop(stopId) {
  for (const trip of state.trips) {
    const stop = trip.stops.find((item) => item.stopId === stopId);
    if (stop) return { trip, stop };
  }
  return null;
}

function stopView(trip, stop) {
  return { ...stop, totalStops: trip.stops.length };
}

/**
 * Driver-facing trip status is derived from the connected workflow.
 * It is not a decorative hard-coded label in the frontend.
 *
 * Dispatcher published plan -> Planned
 * Loader vehicle ready      -> Vehicle Ready
 * Driver has started        -> In Progress
 * Driver completed all      -> Completed
 */
function operationalTripStatus(trip) {
  if (trip.driverExecutionStatus === 'COMPLETED') {
    return { statusKey: 'COMPLETED', statusLabel: 'Completed' };
  }
  if (trip.driverExecutionStatus === 'IN_PROGRESS') {
    return { statusKey: 'IN_PROGRESS', statusLabel: 'In Progress' };
  }
  if (trip.loaderStatus === 'VEHICLE_READY') {
    return { statusKey: 'VEHICLE_READY', statusLabel: 'Vehicle Ready' };
  }
  if (trip.dispatcherPlanStatus === 'PUBLISHED') {
    return { statusKey: 'PLANNED', statusLabel: 'Planned' };
  }
  return { statusKey: 'WAITING', statusLabel: 'Awaiting Plan' };
}

function tripView(trip) {
  const delivered = trip.stops.filter((stop) => stop.outcome === 'DELIVERED_FULL').length;
  const partial = trip.stops.filter((stop) => stop.outcome === 'PARTIAL_DELIVERY').length;
  const unable = trip.stops.filter((stop) => stop.outcome === 'UNABLE_TO_DELIVER').length;
  const proofRecords = trip.stops.filter((stop) => stop.pod).length;
  const operationalStatus = operationalTripStatus(trip);

  return {
    ...trip,
    ...operationalStatus,
    totalStops: trip.stops.length,
    vehicle: state.vehicle,
    summary: { delivered, partial, unable, proofRecords },
  };
}

function updateNextStop(trip) {
  const next = trip.stops.find((stop) => !stop.completed);

  trip.stops.forEach((stop) => {
    if (stop.completed) stop.status = 'completed';
    else if (next && stop.stopId === next.stopId) stop.status = 'next';
    else stop.status = 'pending';
  });

  if (!next) {
    trip.driverExecutionStatus = 'COMPLETED';
    trip.completedAt = '28 Sep 2026, 12:09 PM';
  }

  return next;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'nexora-driver-api' });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  const user = state.user;
  const validId = identifier === user.email || identifier === user.username;

  if (!validId || password !== user.password) {
    return res.status(401).json({ message: 'Invalid email/username or password.' });
  }

  const token = jwt.sign(
    { userId: user.userId, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' },
  );

  res.json({
    token,
    user: {
      userId: user.userId,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.name,
    },
  });
});

app.get('/api/driver/trips', auth, (_req, res) => {
  const activeTrip = state.trips.find((trip) => trip.driverExecutionStatus === 'IN_PROGRESS')
    || state.trips.find((trip) => trip.loaderStatus === 'VEHICLE_READY')
    || state.trips[0];

  const latestCompletedTrip = state.historyTrips?.[0] || null;

  res.json({
    driver: { userId: state.user.userId, name: state.user.name },
    vehicle: state.vehicle,
    activeTripId: activeTrip?.tripId || null,
    lastCompletedTripId: latestCompletedTrip?.tripId || null,
    syncNotification: state.sync.recoveryNotification,
    trips: state.trips.map((trip) => {
      const operationalStatus = operationalTripStatus(trip);
      return {
        tripId: trip.tripId,
        tripNumber: trip.tripNumber,
        brand: trip.brand,
        district: trip.district,
        timeLabel: trip.timeLabel,
        totalStops: trip.stops.length,
        dispatcherPlanStatus: trip.dispatcherPlanStatus,
        loaderStatus: trip.loaderStatus,
        driverExecutionStatus: trip.driverExecutionStatus,
        ...operationalStatus,
      };
    }),
  });
});

app.get('/api/driver/trips/:tripId', auth, (req, res) => {
  const trip = findTrip(req.params.tripId);
  if (!trip) return res.status(404).json({ message: 'Trip not found.' });
  res.json({ trip: tripView(trip) });
});

app.get('/api/driver/trips/:tripId/stops/:stopId', auth, (req, res) => {
  const trip = findTrip(req.params.tripId);
  const stop = trip?.stops.find((item) => item.stopId === req.params.stopId);

  if (!trip || !stop) {
    return res.status(404).json({ message: 'Stop not found.' });
  }

  res.json({ stop: stopView(trip, stop) });
});

app.post('/api/driver/stops/:stopId/arrive', auth, (req, res) => {
  const found = findStop(req.params.stopId);
  if (!found) return res.status(404).json({ message: 'Stop not found.' });

  found.trip.driverExecutionStatus = 'IN_PROGRESS';
  found.stop.arrivalTime = found.stop.arrivalTime || (found.stop.position === 3 ? '11:00 AM' : '11:40 AM');
  found.stop.status = 'arrived';

  res.json({ stop: stopView(found.trip, found.stop) });
});

app.post('/api/driver/stops/:stopId/outcome', auth, (req, res) => {
  const found = findStop(req.params.stopId);
  if (!found) return res.status(404).json({ message: 'Stop not found.' });

  const allowed = ['DELIVERED_FULL', 'PARTIAL_DELIVERY', 'UNABLE_TO_DELIVER'];
  const { outcome, deliveredQuantity } = req.body;

  if (!allowed.includes(outcome)) {
    return res.status(400).json({ message: 'Invalid delivery outcome.' });
  }

  const qty = Number(deliveredQuantity ?? 0);

  if (outcome === 'DELIVERED_FULL' && qty !== found.stop.expectedUnits) {
    return res.status(400).json({ message: 'Full delivery quantity must equal the expected quantity.' });
  }
  if (outcome === 'PARTIAL_DELIVERY' && (qty <= 0 || qty >= found.stop.expectedUnits)) {
    return res.status(400).json({ message: 'Partial delivery quantity must be between 1 and expected quantity - 1.' });
  }
  if (outcome === 'UNABLE_TO_DELIVER' && qty !== 0) {
    return res.status(400).json({ message: 'Unable-to-deliver quantity must be 0.' });
  }

  found.stop.outcome = outcome;
  found.stop.deliveredQuantity = qty;
  res.json({ stop: stopView(found.trip, found.stop) });
});

app.post('/api/driver/stops/:stopId/exception', auth, (req, res) => {
  const found = findStop(req.params.stopId);
  if (!found) return res.status(404).json({ message: 'Stop not found.' });

  const { outcome, reason, notes, deliveredQuantity, photoName, recordedAt } = req.body;
  if (!reason) return res.status(400).json({ message: 'Exception reason is required.' });

  found.stop.exception = {
    outcome,
    reason,
    notes: notes || '',
    deliveredQuantity: Number(deliveredQuantity || 0),
    photoName: photoName || null,
    recordedAt: recordedAt || new Date().toISOString(),
  };

  res.json({ exception: found.stop.exception });
});

app.post('/api/driver/stops/:stopId/pod', auth, (req, res) => {
  const found = findStop(req.params.stopId);
  if (!found) return res.status(404).json({ message: 'Stop not found.' });

  const { receiverName, deliveryNote, photoName, recordedAt } = req.body;
  if (!receiverName?.trim()) {
    return res.status(400).json({ message: 'Receiver name is required.' });
  }
  if (found.stop.outcome === 'UNABLE_TO_DELIVER') {
    return res.status(400).json({ message: 'POD is not recorded when nothing was delivered.' });
  }

  found.stop.pod = {
    receiverName: receiverName.trim(),
    deliveryNote: deliveryNote || '',
    photoName: photoName || 'mock-pod-photo.jpg',
    recordedAt: recordedAt || new Date().toISOString(),
  };

  res.json({ pod: found.stop.pod });
});

app.post('/api/driver/stops/:stopId/complete', auth, (req, res) => {
  const found = findStop(req.params.stopId);
  if (!found) return res.status(404).json({ message: 'Stop not found.' });

  if (!found.stop.outcome) {
    return res.status(400).json({ message: 'Record a delivery outcome first.' });
  }
  if (
    (found.stop.outcome === 'DELIVERED_FULL' || found.stop.outcome === 'PARTIAL_DELIVERY')
    && !found.stop.pod
  ) {
    return res.status(400).json({ message: 'Proof of delivery is required for delivered goods.' });
  }
  if (found.stop.outcome !== 'DELIVERED_FULL' && !found.stop.exception) {
    return res.status(400).json({ message: 'An exception record is required for partial/unable delivery.' });
  }

  found.stop.completed = true;
  found.stop.status = 'completed';

  const next = updateNextStop(found.trip);
  res.json({
    completedStopId: found.stop.stopId,
    nextStopId: next?.stopId || null,
    tripComplete: !next,
  });
});

app.get('/api/driver/sync-status', auth, (_req, res) => {
  res.json({
    pendingCount: state.sync.pendingCount,
    lastSuccessfulSync: state.sync.lastSuccessfulSync,
    recoveryNotification: state.sync.recoveryNotification,
  });
});

// Called after the browser has replayed locally queued Driver records.
// The business records themselves are synchronized through the normal Driver APIs;
// this endpoint only records the recovery event for the temporary dashboard notice.
app.post('/api/driver/sync-recovery', auth, (req, res) => {
  const syncedCount = Number(req.body.syncedCount || 0);
  const syncedAtLabel = req.body.syncedAtLabel
    || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  state.sync.pendingCount = 0;
  state.sync.lastSuccessfulSync = syncedAtLabel;
  state.sync.recoveryNotification = {
    title: 'Sync complete',
    message: `${syncedCount} saved offline record${syncedCount === 1 ? '' : 's'} synchronized after the connection returned.`,
  };

  res.json({
    ok: true,
    lastSuccessfulSync: state.sync.lastSuccessfulSync,
    syncNotification: state.sync.recoveryNotification,
  });
});

// The dashboard never shows a permanent "all synchronized" card.
// A recovery message is only exposed after the future offline flow completes a sync.
app.post('/api/driver/sync-notification/dismiss', auth, (_req, res) => {
  state.sync.recoveryNotification = null;
  res.json({ ok: true });
});

// Development helper only: lets the team verify the temporary recovery notification
// before the full degradation/offline flow is integrated.
app.post('/api/dev/simulate-sync-recovery', (_req, res) => {
  state.sync.recoveryNotification = {
    title: 'Sync complete',
    message: 'Saved offline records were synchronized after the connection returned.',
  };
  res.json({ syncNotification: state.sync.recoveryNotification });
});

app.post('/api/dev/reset', (_req, res) => {
  resetState();
  res.json({ message: 'Mock state reset.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

export default app;
