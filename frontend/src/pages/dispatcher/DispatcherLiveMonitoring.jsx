import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPinned,
  MessageSquareText,
  PackageCheck,
  RadioTower,
  Search,
  Truck,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import useAuth from "../../hooks/useAuth";
import waypointLogo from "../../assets/waypoint-logo.png";
import {
  createDispatcherMonitoringSocket,
  getDispatcherMonitoring,
} from "../../services/dispatcherMonitoringService";
import "./DispatcherLiveMonitoring.css";

function initials(name = "Dispatcher") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatSyncAge(value, nowMs = Date.now()) {
  if (!value) return "No sync recorded";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "No sync recorded";

  const seconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  if (seconds < 15) return "Just now";
  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 hr ago" : `${hours} hr ago`;
}

function formatSriLankaClock(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

function formatSriLankaDate(value = Date.now()) {
  const date = new Date(value);
  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}

function statusLabel(status) {
  const map = {
    ON_ROUTE: "On Route",
    DELAYED: "Delayed",
    OFFLINE: "Offline",
    VEHICLE_READY: "Vehicle Ready",
    PLANNED: "Planned",
    COMPLETED: "Completed",
    WAITING: "Waiting",
  };
  return map[status] || status?.replaceAll("_", " ") || "Unknown";
}

function stopLabel(status) {
  const map = {
    COMPLETED: "Delivered",
    ARRIVED: "Arrived",
    NEXT_STOP: "Next Stop",
    PENDING: "Pending",
  };
  return map[status] || status?.replaceAll("_", " ") || "Pending";
}

function FitRouteBounds({ trip }) {
  const map = useMap();

  useEffect(() => {
    const routePoints = (trip?.routePoints || [])
      .filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));

    const stopPoints = (trip?.stops || [])
      .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
      .map((stop) => [stop.latitude, stop.longitude]);

    const points = routePoints.length ? [...routePoints] : [...stopPoints];

    if (Number.isFinite(trip?.currentLat) && Number.isFinite(trip?.currentLng)) {
      points.push([trip.currentLat, trip.currentLng]);
    }

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [28, 28] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, trip]);

  return null;
}

function RouteMap({ trip }) {
  const stopPoints = (trip?.stops || [])
    .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
    .map((stop) => [stop.latitude, stop.longitude]);

  const liveRoutePoints = (trip?.routePoints || [])
    .filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));

  // When the Driver navigation page has published an OSRM route,
  // render that exact geometry. Fall back to the planned stop line
  // only until the Driver opens navigation.
  const routeGeometry = liveRoutePoints.length > 1 ? liveRoutePoints : stopPoints;
  const center = routeGeometry[0] || stopPoints[0] || [6.9271, 79.8612];

  return (
    <div className="dispatcher-panel dispatcher-map-card">
      <div className="dispatcher-panel-heading">
        Route Map - {trip?.tripCode || "No trip selected"}
      </div>

      {trip ? (
        <>
          <MapContainer
            className="dispatcher-map"
            center={center}
            zoom={12}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitRouteBounds trip={trip} />

            {routeGeometry.length > 1 && (
              <Polyline
                positions={routeGeometry}
                pathOptions={{
                  color: "#008a6b",
                  weight: 5,
                  opacity: 0.9,
                }}
              />
            )}

            {(trip.stops || []).map((stop) => {
              if (!Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
                return null;
              }

              const color = stop.status === "COMPLETED"
                ? "#16a34a"
                : stop.status === "NEXT_STOP"
                  ? "#2563eb"
                  : stop.status === "ARRIVED"
                    ? "#0ea5e9"
                    : "#94a3b8";

              return (
                <CircleMarker
                  key={stop.stopCode}
                  center={[stop.latitude, stop.longitude]}
                  radius={10}
                  pathOptions={{ color: "#ffffff", weight: 3, fillColor: color, fillOpacity: 1 }}
                >
                  <Popup>
                    <strong>{stop.outletName || stop.outletCode}</strong>
                    <br />
                    {stopLabel(stop.status)}
                    {stop.plannedEta ? ` · ETA ${stop.plannedEta}` : ""}
                  </Popup>
                </CircleMarker>
              );
            })}

            {Number.isFinite(trip.currentLat) && Number.isFinite(trip.currentLng) && (
              <CircleMarker
                center={[trip.currentLat, trip.currentLng]}
                radius={9}
                pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#334155", fillOpacity: 1 }}
              >
                <Popup>
                  <strong>Current vehicle position</strong>
                  <br />
                  {trip.vehicleCode}
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>

          <div className="dispatcher-map-legend">
            <span><i className="dispatcher-dot completed" /> Completed</span>
            <span><i className="dispatcher-dot vehicle" /> Current Vehicle</span>
            <span><i className="dispatcher-dot next" /> Next Stop</span>
            <span><i className="dispatcher-dot pending" /> Pending</span>
            {liveRoutePoints.length > 1 && <span>Driver road route</span>}
          </div>
        </>
      ) : (
        <div className="dispatcher-empty">Select an active trip to view its route.</div>
      )}
    </div>
  );
}

export default function DispatcherLiveMonitoring() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ activeTrips: 0, onSchedule: 0, delayed: 0, offlineDevices: 0 });
  const [depots, setDepots] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTripCode, setSelectedTripCode] = useState(null);
  const [depotId, setDepotId] = useState(user?.depot?.id ? String(user.depot.id) : "");
  const [status, setStatus] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());

  async function loadMonitoring({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    try {
      setError("");
      const data = await getDispatcherMonitoring({
        depotId: depotId || undefined,
        status,
      });

      setSummary(data.summary || {});
      setDepots(data.depots || []);
      setTrips(data.trips || []);

      setSelectedTripCode((current) => {
        if (current && (data.trips || []).some((trip) => trip.tripCode === current)) {
          return current;
        }
        return data.trips?.[0]?.tripCode || null;
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to load live delivery monitoring."
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depotId, status]);

  useEffect(() => {
    const socket = createDispatcherMonitoringSocket();

    const refresh = () => {
      loadMonitoring({ quiet: true });
    };

    socket.on("monitoring:update", refresh);

    const poll = window.setInterval(refresh, 30000);

    return () => {
      window.clearInterval(poll);
      socket.off("monitoring:update", refresh);
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depotId, status]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.tripCode === selectedTripCode) || null,
    [trips, selectedTripCode]
  );

  const visibleTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((trip) => [
      trip.tripCode,
      trip.vehicleCode,
      trip.driverName,
      trip.nextDestination,
    ].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [trips, search]);

  const offline = Boolean(selectedTrip && (!selectedTrip.isDriverOnline || selectedTrip.status === "OFFLINE"));
  const progressPercent = selectedTrip?.progressTotal
    ? Math.round((selectedTrip.progressCompleted / selectedTrip.progressTotal) * 100)
    : 0;

  return (
    <main className="dispatcher-live-page">
      <div className="dispatcher-live-layout">
        <aside className="dispatcher-sidebar">
          <div className="dispatcher-sidebar-brand">
            <img src={waypointLogo} alt="Waypoint Group" />
            <strong>Waypoint Group</strong>
          </div>

          <nav className="dispatcher-nav" aria-label="Dispatcher navigation">
            <button type="button" className="dispatcher-nav-item"><Activity size={16} /> Operations Dashboard</button>
            <button type="button" className="dispatcher-nav-item"><ClipboardList size={16} /> Delivery Planning</button>
            <button type="button" className="dispatcher-nav-item"><PackageCheck size={16} /> Loading Coordination</button>
            <button type="button" className="dispatcher-nav-item active"><MapPinned size={16} /> Live Delivery Monitoring</button>
            <button type="button" className="dispatcher-nav-item" onClick={() => navigate("/dispatcher/reports")}><Clock3 size={16} /> Reports & Capacity</button>
          </nav>

          <div className="dispatcher-sidebar-user">
            <div className="dispatcher-avatar">{initials(user?.fullName || user?.userId)}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{user?.fullName || user?.userId || "Dispatcher"}</div>
              <div style={{ fontSize: 9, opacity: .7 }}>Dispatcher</div>
            </div>
          </div>
        </aside>

        <section className="dispatcher-main">
          <header className="dispatcher-header">
            <div className="dispatcher-title">
              <h1>Live Delivery Monitoring</h1>
              <p>Track active trips, monitor route progress and respond to delivery issues.</p>
            </div>

            <div className="dispatcher-filters">
              <div className="dispatcher-filter" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <CalendarDays size={15} />
                <span>{formatSriLankaDate(nowMs)}</span>
              </div>

              <select
                className="dispatcher-filter"
                value={depotId}
                onChange={(event) => setDepotId(event.target.value)}
                aria-label="Depot"
              >
                <option value="">All depots</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>{depot.name}</option>
                ))}
              </select>

              <select
                className="dispatcher-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Trip status filter"
              >
                <option value="ACTIVE">Active Trips</option>
                <option value="ALL">All Trips</option>
                <option value="DELAYED">Delayed</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </header>

          <section className="dispatcher-kpis" aria-label="Live delivery summary">
            <div className="dispatcher-kpi">
              <div className="dispatcher-kpi-icon"><Truck size={19} /></div>
              <div><div className="dispatcher-kpi-label">Active Trips</div><div className="dispatcher-kpi-value">{summary.activeTrips ?? 0}</div></div>
            </div>
            <div className="dispatcher-kpi">
              <div className="dispatcher-kpi-icon"><CheckCircle2 size={19} /></div>
              <div><div className="dispatcher-kpi-label">On Schedule</div><div className="dispatcher-kpi-value">{summary.onSchedule ?? 0}</div></div>
            </div>
            <div className="dispatcher-kpi warning">
              <div className="dispatcher-kpi-icon"><Clock3 size={19} /></div>
              <div><div className="dispatcher-kpi-label">Delayed</div><div className="dispatcher-kpi-value">{summary.delayed ?? 0}</div></div>
            </div>
            <div className="dispatcher-kpi offline">
              <div className="dispatcher-kpi-icon"><WifiOff size={19} /></div>
              <div><div className="dispatcher-kpi-label">Offline Devices</div><div className="dispatcher-kpi-value">{summary.offlineDevices ?? 0}</div></div>
            </div>
          </section>

          {offline && (
            <div className="dispatcher-offline-alert" role="status">
              <span><strong>Live tracking temporarily unavailable.</strong> Driver appears to be offline. Showing last synchronized progress.</span>
              <strong>Last sync {formatSyncAge(selectedTrip.lastSynchronized, nowMs)}</strong>
            </div>
          )}

          {error && (
            <div className="dispatcher-offline-alert" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => loadMonitoring()} style={{ fontWeight: 800 }}>Retry</button>
            </div>
          )}

          <section className="dispatcher-board">
            <div className="dispatcher-panel">
              <div className="dispatcher-panel-heading">Active Trips ({trips.length})</div>
              <div className="dispatcher-trip-list-controls">
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 12, color: "var(--color-text-muted)" }} />
                  <input
                    className="dispatcher-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search trip, driver, vehicle..."
                    style={{ paddingLeft: 30 }}
                  />
                </div>
              </div>

              <div className="dispatcher-trip-list">
                {loading ? (
                  <div className="dispatcher-empty">Loading active trips...</div>
                ) : visibleTrips.length ? (
                  visibleTrips.map((trip) => {
                    const percent = trip.progressTotal
                      ? Math.round((trip.progressCompleted / trip.progressTotal) * 100)
                      : 0;

                    return (
                      <button
                        type="button"
                        key={trip.tripCode}
                        className={`dispatcher-trip-card ${trip.tripCode === selectedTripCode ? "selected" : ""}`}
                        onClick={() => setSelectedTripCode(trip.tripCode)}
                      >
                        <div className="dispatcher-trip-card-top">
                          <div>
                            <div className="dispatcher-trip-code">{trip.tripCode}</div>
                            <div className="dispatcher-vehicle-code">{trip.vehicleCode}</div>
                          </div>
                          <span className={`dispatcher-status-pill ${trip.status}`}>{statusLabel(trip.status)}</span>
                        </div>
                        <div className="dispatcher-trip-card-mid" style={{ marginTop: 6 }}>
                          <span className="dispatcher-driver-name">{trip.driverName}</span>
                          <strong style={{ fontSize: 10 }}>{trip.progressCompleted} / {trip.progressTotal}</strong>
                        </div>
                        <div className="dispatcher-progress"><span style={{ width: `${percent}%` }} /></div>
                      </button>
                    );
                  })
                ) : (
                  <div className="dispatcher-empty">No trips match this filter.</div>
                )}
              </div>
            </div>

            <RouteMap trip={selectedTrip} />

            <div className="dispatcher-detail-column">
              <div className="dispatcher-panel">
                <div className="dispatcher-panel-heading" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{selectedTrip ? `${selectedTrip.tripCode} - ${selectedTrip.vehicleCode}` : "Trip Details"}</span>
                  {selectedTrip && <span className={`dispatcher-status-pill ${selectedTrip.status}`}>{statusLabel(selectedTrip.status)}</span>}
                </div>

                {selectedTrip ? (
                  <div className="dispatcher-detail-grid">
                    <div className="dispatcher-detail-row"><span>Driver</span><strong>{selectedTrip.driverName}</strong></div>
                    <div className="dispatcher-detail-row"><span>Depot</span><strong>{selectedTrip.depot?.name || "-"}</strong></div>
                    <div className="dispatcher-detail-row"><span>Vehicle Type</span><strong>{selectedTrip.vehicleType || "-"}</strong></div>
                    <div className="dispatcher-detail-row"><span>Temperature</span><strong>{selectedTrip.temperature || "-"}</strong></div>
                    <div className="dispatcher-detail-row"><span>Stops Completed</span><strong>{selectedTrip.progressCompleted} / {selectedTrip.progressTotal}</strong></div>
                    <div className="dispatcher-detail-row"><span>Next Destination</span><strong>{selectedTrip.nextDestination || "Trip complete"}</strong></div>
                    <div className="dispatcher-detail-row"><span>ETA</span><strong>{selectedTrip.eta || "-"}</strong></div>
                    <div className="dispatcher-detail-row"><span>Last Synchronized</span><strong>{formatSyncAge(selectedTrip.lastSynchronized, nowMs)} · {formatSriLankaClock(selectedTrip.lastSynchronized)}</strong></div>
                    <div className="dispatcher-detail-row"><span>Route Updated</span><strong>{selectedTrip.routeUpdatedAt ? `${formatSyncAge(selectedTrip.routeUpdatedAt, nowMs)} · ${formatSriLankaClock(selectedTrip.routeUpdatedAt)}` : "Waiting for Driver navigation"}</strong></div>
                  </div>
                ) : (
                  <div className="dispatcher-empty">Select a trip.</div>
                )}
              </div>

              <div className="dispatcher-panel" style={{ marginTop: 12 }}>
                <div className="dispatcher-panel-heading">Stop Progress</div>
                <div className="dispatcher-stop-list">
                  {(selectedTrip?.stops || []).map((stop) => (
                    <div className="dispatcher-stop-row" key={stop.stopCode}>
                      <span className={`dispatcher-stop-number ${stop.status}`}>{stop.sequence}</span>
                      <div>
                        <div style={{ fontWeight: 800 }}>{stop.outletName || stop.outletCode}</div>
                        <div style={{ color: "var(--color-text-muted)", marginTop: 2 }}>{stopLabel(stop.status)}</div>
                      </div>
                      <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                        {stop.actualArrival || stop.plannedEta || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTrip && (
                <div className="dispatcher-update-card">
                  <div className="dispatcher-update-title">
                    <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}><MessageSquareText size={16} /> Latest Driver Update</span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: 9 }}>{formatSyncAge(selectedTrip.latestDriverUpdateAt, nowMs)} · {formatSriLankaClock(selectedTrip.latestDriverUpdateAt)}</span>
                  </div>
                  <p>{selectedTrip.latestDriverUpdate || "Waiting for a driver update."}</p>
                </div>
              )}
            </div>
          </section>

          {selectedTrip && (
            <div style={{ marginTop: 12, color: "var(--color-text-muted)", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <RadioTower size={13} />
              Live progress {offline ? "paused - last synchronized state is shown" : `active - ${progressPercent}% complete`}.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
