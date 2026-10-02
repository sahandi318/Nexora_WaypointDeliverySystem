import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, MapPin, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import BottomNav from '../../components/BottomNav';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import api from '../../services/api';

function statusPillClass(statusKey) {
  switch (statusKey) {
    case 'IN_PROGRESS':
    case 'VEHICLE_READY':
      return 'pill-green';
    case 'PLANNED':
      return 'pill-blue';
    case 'COMPLETED':
      return 'pill-muted';
    default:
      return 'pill-muted';
  }
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [syncNotice, setSyncNotice] = useState(null);

  useEffect(() => {
    api.get('/driver/trips')
      .then((res) => {
        setData(res.data);
        setSyncNotice(res.data.syncNotification || null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load trips.'));
  }, []);

  useEffect(() => {
    if (!syncNotice) return undefined;
    const timer = window.setTimeout(() => {
      setSyncNotice(null);
      api.post('/driver/sync-notification/dismiss').catch(() => {});
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [syncNotice]);

  const trips = useMemo(() => data?.trips || [], [data]);

  if (!data) {
    return (
      <MobileShell>
        {error ? <div className="error-page">{error}</div> : <LoadingState text="Loading driver trips..." />}
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="status-bar dashboard-status"><span>9:41</span><span>5G ▰</span></div>

      <section className="dashboard-hero">
        <div className="hero-brand-row hero-brand-row--logo-only">
          <BrandLogo inverse />
        </div>

        <div className="driver-greeting">
          <div className="avatar">RF</div>
          <div>
            <span>Good morning,</span>
            <strong>{data.driver.name}</strong>
            <small>Mon, 28 Sep 2026</small>
          </div>
        </div>
      </section>

      <div className="screen-body with-bottom-nav">
        {syncNotice && (
          <section className="sync-recovery-notice" role="status" aria-live="polite">
            <CheckCircle2 size={20} />
            <div>
              <strong>{syncNotice.title}</strong>
              <span>{syncNotice.message}</span>
            </div>
          </section>
        )}

        <section className="card vehicle-card">
          <div>
            <small>Assigned Vehicle</small>
            <h3>{data.vehicle.vehicleId}</h3>
            <strong>{data.vehicle.type} · {data.vehicle.temp}</strong>
            <p><MapPin size={13}/> {data.vehicle.depot} Depot</p>
          </div>
          <div className="vehicle-illustration" aria-label="Assigned delivery vehicle"><Truck size={38}/></div>
        </section>

        <h3 className="section-title">Today's Trips</h3>

        {trips.map((trip, index) => (
          <section className="card trip-card" key={trip.tripId}>
            <div className="trip-head">
              <div className={`trip-number ${index === 1 ? 'trip-number--alt' : ''}`}>{trip.tripNumber}</div>
              <div className="trip-heading">
                <strong>Trip {trip.tripNumber}</strong>
                <span>{trip.brand} · {trip.district}</span>
              </div>
              <span className={`pill ${statusPillClass(trip.statusKey)}`}>{trip.statusLabel}</span>
            </div>

            <div className="trip-meta">
              <span>▱ {trip.totalStops} stops</span>
              <span>{trip.timeLabel}</span>
            </div>

            <button
              className={`btn full ${index === 0 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => navigate(`/driver/trips/${trip.tripId}`)}
              type="button"
            >
              <ChevronRight size={17}/> View Trip {trip.tripNumber}
            </button>
          </section>
        ))}
      </div>

      <BottomNav
        activeTripId={data.activeTripId}
        lastCompletedTripId={data.lastCompletedTripId}
      />
    </MobileShell>
  );
}
