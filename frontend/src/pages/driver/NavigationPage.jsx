import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Info,
  LocateFixed,
  MapPin,
  Navigation2,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import CachedRouteMap from '../../components/map/CachedRouteMap';
import LiveDriverMap from '../../components/map/LiveDriverMap';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import OfflineBanner from '../../components/OfflineBanner';
import SecondaryActions from '../../components/SecondaryActions';
import { getRouteCache, saveRouteCache } from '../../db/offlineDb';
import useConnectivity from '../../hooks/useConnectivity';
import { getDriverStop, recordArrival } from '../../services/offlineService';
import { fetchDrivingRoute, haversineMeters } from '../../services/routingService';

const demoDriverLocation = {
  lat: Number(import.meta.env.VITE_DEMO_DRIVER_LAT || 6.9088),
  lng: Number(import.meta.env.VITE_DEMO_DRIVER_LNG || 79.8646),
};

function formatDistanceKm(value) {
  if (!Number.isFinite(value)) return '—';
  return value < 10 ? value.toFixed(1) : Math.round(value).toString();
}

function formatDuration(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.max(1, Math.round(value))} min`;
}

function calculateEta(durationMinutes) {
  if (!Number.isFinite(durationMinutes)) return '—';
  const eta = new Date(Date.now() + durationMinutes * 60_000);
  return eta.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function NavigationPage() {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const online = useConnectivity();
  const [stop, setStop] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [locationMode, setLocationMode] = useState('locating');
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeState, setRouteState] = useState('idle');
  const [routeError, setRouteError] = useState('');
  const lastRoutedLocation = useRef(null);

  useEffect(() => {
    getDriverStop(tripId, stopId)
      .then(({ stop: value }) => setStop(value))
      .catch((err) => setError(err.message || 'Unable to load stop.'));
  }, [tripId, stopId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setDriverLocation(demoDriverLocation);
      setLocationMode('demo');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationAccuracy(position.coords.accuracy || null);
        setLocationMode('live');
      },
      () => {
        setDriverLocation(demoDriverLocation);
        setLocationMode('demo');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const destination = useMemo(() => {
    if (!stop?.destination?.latitude || !stop?.destination?.longitude) return null;
    return {
      lat: Number(stop.destination.latitude),
      lng: Number(stop.destination.longitude),
    };
  }, [stop]);

  useEffect(() => {
    if (!stopId) return;
    if (!online) {
      getRouteCache(stopId).then((cached) => {
        if (cached) {
          setRoute(cached);
          setRouteState('ready');
          setRouteError('');
        }
      });
    }
  }, [online, stopId]);

  useEffect(() => {
    if (!online || !driverLocation || !destination) return undefined;

    if (
      lastRoutedLocation.current
      && haversineMeters(lastRoutedLocation.current, driverLocation) < 50
    ) {
      return undefined;
    }

    const controller = new AbortController();
    setRouteState('loading');
    setRouteError('');

    fetchDrivingRoute(driverLocation, destination, controller.signal)
      .then(async (result) => {
        lastRoutedLocation.current = driverLocation;
        setRoute(result);
        setRouteState('ready');
        await saveRouteCache(stopId, result);
      })
      .catch(async (routeFetchError) => {
        if (routeFetchError.name === 'AbortError') return;
        const cached = await getRouteCache(stopId);
        if (cached) {
          setRoute(cached);
          setRouteState('ready');
          setRouteError('Live road routing is temporarily unavailable. Using the saved route.');
        } else {
          setRouteState('error');
          setRouteError('Live road routing is temporarily unavailable. Showing planning values instead.');
        }
      });

    return () => controller.abort();
  }, [online, driverLocation, destination, stopId]);

  if (!stop) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  const liveDistanceKm = route?.distanceKm ?? stop.distanceKm;
  const liveDurationMinutes = route?.durationMinutes ?? stop.etaMinutes;
  const etaLabel = route && online ? calculateEta(route.durationMinutes) : stop.plannedArrival;

  async function markArrived() {
    setBusy(true);
    try {
      await recordArrival({ tripId, stopId });
      navigate(`/driver/trips/${tripId}/stops/${stopId}/outcome`);
    } finally {
      setBusy(false);
    }
  }

  function openGoogleMaps() {
    if (!destination) {
      window.open(stop.mapsUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <MobileShell>
      <DriverTopBar title="En Route" />

      <div className="route-map live-map live-navigation-map">
        {online ? (
          <LiveDriverMap
            driverLocation={driverLocation}
            destination={destination}
            routePoints={route?.points || []}
            outletId={stop.outletId}
          />
        ) : (
          <CachedRouteMap
            routePoints={route?.points || []}
            outletId={stop.outletId}
          />
        )}

        <div className="live-map__badge">
          <span className={online && locationMode === 'live' ? 'live-dot' : 'offline-dot'} />
          {online
            ? `${locationMode === 'live' ? 'Live GPS' : locationMode === 'demo' ? 'Demo GPS' : 'Locating'} · ${stop.outletId}`
            : `Offline route · ${stop.outletId}`}
        </div>

        {online && routeState === 'loading' && <div className="routing-state">Calculating road route…</div>}
      </div>

      <div className="screen-body route-body">
        {!online && (
          <OfflineBanner
            title="No Internet Connection"
            message="Your route is still available. Updates will be saved on this device."
          />
        )}

        {online && locationMode === 'demo' && (
          <div className="route-notice route-notice--warning">
            <LocateFixed size={18} />
            <div>
              <strong>Live GPS is unavailable</strong>
              <span>Using a demo driver position. On a phone, allow location access over HTTPS for live routing.</span>
            </div>
          </div>
        )}

        {routeError && online && (
          <div className="route-notice route-notice--info">
            <Info size={18} />
            <div><strong>Routing fallback</strong><span>{routeError}</span></div>
          </div>
        )}

        <section className="card navigation-card">
          <div className="nav-heading">
            <div><h3>{stop.outletId}</h3><strong>Waypoint {stop.brand || 'Style'}</strong></div>
            <div><h3>{formatDuration(liveDurationMinutes)}</h3><span>{formatDistanceKm(liveDistanceKm)} km</span></div>
          </div>

          <div className="two-col info-grid">
            <div><span>{online ? 'Live ETA' : 'Planned ETA'}</span><strong>{etaLabel}</strong></div>
            <div><span>Delivery window</span><strong>{stop.windowOpen} – {stop.windowClose}</strong><small>Planned arrival {stop.plannedArrival}</small></div>
          </div>

          {route?.nextInstruction && (
            <div className="next-direction">
              <Navigation2 size={19} />
              <div>
                <span>{online ? 'Next direction' : 'Saved direction'}</span>
                <strong>{route.nextInstruction}</strong>
                {route.nextInstructionDistanceM != null && (
                  <small>{Math.round(route.nextInstructionDistanceM)} m</small>
                )}
              </div>
            </div>
          )}

          {stop.mallWindow && (
            <div className="mall-alert"><Truck size={18}/><div><span>Mall Access Window</span><strong>{stop.mallWindow}</strong></div><Info size={18}/></div>
          )}

          {stop.planningReference && (
            <div className="planning-reference">
              <span>Dispatcher planning reference</span>
              <strong>{stop.planningReference.depotToDistrictKm} km · {stop.planningReference.depotToDistrictFreeflowMin} min free-flow to {stop.district}</strong>
            </div>
          )}

          <p className="stop-counter"><MapPin size={13}/> Stop {stop.position} of {stop.totalStops}</p>
          {online && locationMode === 'live' && locationAccuracy && (
            <p className="gps-accuracy">GPS accuracy approximately {Math.round(locationAccuracy)} m</p>
          )}
        </section>

        <button className="btn btn-primary full" onClick={openGoogleMaps}><ExternalLink size={16}/> Open in Google Maps</button>
        <div className="safety-note"><ShieldAlert size={17}/> Use delivery controls only when safely stopped.</div>
      </div>

      <div className="sticky-actions">
        <button className="btn btn-primary full" onClick={markArrived} disabled={busy}><MapPin size={16}/> {busy ? 'Saving...' : 'Mark Arrived'}</button>
        <SecondaryActions />
      </div>
    </MobileShell>
  );
}
