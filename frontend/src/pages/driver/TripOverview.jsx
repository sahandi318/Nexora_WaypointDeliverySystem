import React, { useEffect, useState } from 'react';
import { ChevronRight, Cloud, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import { getDriverTrip } from '../../services/offlineService';
import { colomboMapEmbed } from '../../config';

function getStopState(stop, nextStopId) {
  if (stop.completed || stop.status === 'completed') return 'completed';
  if (stop.stopId === nextStopId || stop.status === 'next') return 'next';
  return 'pending';
}

export default function TripOverview() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [tab, setTab] = useState('list');
  const [error, setError] = useState('');

  useEffect(() => {
    getDriverTrip(tripId)
      .then(({ trip: value }) => setTrip(value))
      .catch((err) => setError(err.message || 'Unable to load trip.'));
  }, [tripId]);

  useEffect(() => {
    const refresh = () => {
      getDriverTrip(tripId).then(({ trip: value }) => setTrip(value)).catch(() => {});
    };
    window.addEventListener('nexora:offline-queue-changed', refresh);
    window.addEventListener('nexora:sync-complete', refresh);
    return () => {
      window.removeEventListener('nexora:offline-queue-changed', refresh);
      window.removeEventListener('nexora:sync-complete', refresh);
    };
  }, [tripId]);

  if (!trip) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  const nextStop = trip.stops.find((s) => !s.completed);
  const nextStopId = nextStop?.stopId ?? null;

  return (
    <MobileShell>
      <DriverTopBar title={`Trip ${trip.tripNumber}`} />

      <div className="screen-body">
        <section className="card trip-summary-card">
          <div>
            <h3>
              {trip.vehicle.vehicleId}{' '}
              <span>{trip.brand} · {trip.district}</span>
            </h3>
            <p><MapPin size={13} /> {trip.totalStops} stops &nbsp; ▣ {trip.timeLabel}</p>
          </div>
          <span className="pill pill-green">{trip.statusLabel}</span>
        </section>

        <div className="tabs">
          <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>List</button>
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>Map</button>
        </div>

        {tab === 'list' ? (
          <div className="stop-list">
            {trip.stops.map((stop) => {
              const state = getStopState(stop, nextStopId);
              const isNext = state === 'next';

              return (
                <div
                  className={`stop-row ${isNext ? 'stop-row--next' : ''}`}
                  key={stop.stopId}
                >
                  <span className="stop-index">{stop.position}</span>

                  <span className="stop-main">
                    <strong>{stop.outletId}</strong>
                    <small>Waypoint Style</small>
                    <em>Delivery window: {stop.windowOpen} – {stop.windowClose}</em>
                  </span>

                  {state === 'completed' && (
                    <span className="status-text done" aria-label={`Stop ${stop.position} completed`}>
                      Completed
                    </span>
                  )}

                  {state === 'pending' && (
                    <span className="status-text" aria-label={`Stop ${stop.position} pending`}>
                      Pending
                    </span>
                  )}

                  {isNext && (
                    <button
                      type="button"
                      className="next-stop-button"
                      onClick={() => navigate(`/driver/trips/${tripId}/stops/${stop.stopId}`)}
                      aria-label={`Open next stop ${stop.position}`}
                    >
                      <span>Next</span>
                      <ChevronRight size={17} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="map-card live-map">
            <iframe
              title={`Trip ${trip.tripNumber} live map`}
              src={colomboMapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-caption">
              <span className="live-dot" /> Trip {trip.tripNumber} · {trip.totalStops} stops · {trip.district}
            </div>
          </div>
        )}
      </div>

      <div className="sticky-actions">
        {nextStop && (
          <button
            className="btn btn-primary full"
            onClick={() => navigate(`/driver/trips/${tripId}/stops/${nextStop.stopId}`)}
          >
            View Stop {nextStop.position}
          </button>
        )}
        <button
          className="btn btn-outline full"
          onClick={() => navigate(`/driver/sync?returnTo=${encodeURIComponent(`/driver/trips/${tripId}`)}`)}
        >
          <Cloud size={16} /> Offline &amp; Sync
        </button>
      </div>
    </MobileShell>
  );
}
