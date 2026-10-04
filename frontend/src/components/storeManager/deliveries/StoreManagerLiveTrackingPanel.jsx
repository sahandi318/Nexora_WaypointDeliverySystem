import {
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Store,
  TriangleAlert,
  Truck,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

import StoreManagerLiveConnectionBadge from "./StoreManagerLiveConnectionBadge";
import {
  DeliveryStatusBadge,
  formatDeliveryDate,
  getDeliveryStatusLabel,
} from "./StoreManagerDeliveryUI";

const PENDING_CODES = new Set([
  "STORE_MANAGER_DELIVERY_NOT_PLANNED",
  "STORE_MANAGER_DELIVERY_NOT_PUBLISHED",
]);

const TERMINAL_TRACKING_STATUSES = new Set([
  "DELIVERED",
  "PARTIAL",
  "EXCEPTION",
  "RECEIVED",
  "COMPLETED",
]);

function StoreManagerLiveTrackingPanel({
  tracking,
  isLoading,
  isRefreshing,
  errorMessage,
  availabilityCode,
  lastRefreshedAt,
  liveStatus,
  onRefresh,
  language,
  t,
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-primary)]/15 bg-[var(--color-primary-soft)]/55 text-[var(--color-primary-strong)]">
              <Navigation size={16} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13px] font-bold text-[var(--color-text)]">
                {t("storeManager.liveTrackingTitle")}
              </h2>
              <p className="mt-0.5 text-[10px] leading-5 text-[var(--color-text-secondary)]">
                {t("storeManager.liveTrackingDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StoreManagerLiveConnectionBadge
            status={liveStatus}
            t={t}
            compact
          />

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="nexora-focus inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[9.5px] font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={12.5}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <TrackingLoading t={t} />
      ) : PENDING_CODES.has(availabilityCode) ? (
        <TrackingPending availabilityCode={availabilityCode} t={t} />
      ) : errorMessage ? (
        <TrackingError message={errorMessage} onRefresh={onRefresh} t={t} />
      ) : tracking ? (
        <TrackingWorkspace
          tracking={tracking}
          lastRefreshedAt={lastRefreshedAt}
          language={language}
          t={t}
        />
      ) : (
        <TrackingPending availabilityCode={availabilityCode} t={t} />
      )}
    </section>
  );
}

function TrackingWorkspace({
  tracking,
  lastRefreshedAt,
  language,
  t,
}) {
  const trip = tracking.trip || {};
  const stop = tracking.myStop || {};
  const outlet = tracking.outlet || {};

  const receivingWindow = formatWindow(
    outlet.windowOpenTime,
    outlet.windowCloseTime,
    t("storeManager.notSpecified")
  );

  const etaValue = formatEta(
    tracking.eta,
    tracking.trip?.deliveryDate,
    language,
    t("storeManager.deliveriesEtaPending")
  );

  const mapPoints = getMapPoints(tracking);

  const lastOperationalUpdate =
    trip.latestDriverUpdateAt || null;

  const displayStatus =
    getTrackingDisplayStatus(tracking);
  const isTerminal =
    TERMINAL_TRACKING_STATUSES.has(displayStatus);

  return (
    <div className="p-4 sm:p-5">
      {isTerminal ? (
        <TrackingFinalStateBanner
          tracking={tracking}
          language={language}
          t={t}
        />
      ) : null}

      <div className={`${isTerminal ? "mt-4 " : ""}grid gap-3 sm:grid-cols-2 xl:grid-cols-5`}>
        <TrackingMetric
          icon={Clock3}
          label={t("storeManager.liveTrackingEta")}
          value={
            isTerminal
              ? t("storeManager.liveTrackingCompletedValue")
              : etaValue
          }
          detail={
            isTerminal
              ? t("storeManager.liveTrackingFinalEtaHint")
              : tracking.etaSource === "LIVE"
                ? t("storeManager.liveTrackingEtaLive")
                : tracking.etaSource === "PLANNED"
                  ? t("storeManager.liveTrackingEtaPlanned")
                  : t("storeManager.deliveriesEtaPending")
          }
          tone={
            isTerminal
              ? "success"
              : tracking.etaSource === "LIVE"
                ? "success"
                : tracking.etaSource === "PLANNED"
                  ? "warning"
                  : "neutral"
          }
        />
        <TrackingMetric
          icon={Route}
          label={t("storeManager.liveTrackingStopsRemaining")}
          value={String(isTerminal ? 0 : (stop.stopsRemainingBeforeOutlet ?? 0))}
          detail={
            isTerminal
              ? t("storeManager.liveTrackingFinalStopsHint")
              : t("storeManager.liveTrackingStopsRemainingHint")
          }
          tone="info"
        />
        <TrackingMetric
          icon={Truck}
          label={t("storeManager.deliveriesVehicle")}
          value={trip.vehicleCode || t("storeManager.deliveriesNotAssigned")}
          detail={trip.vehicleType || t("storeManager.notSpecified")}
          tone="info"
        />
        <TrackingMetric
          icon={UserRound}
          label={t("storeManager.deliveryDetailsDriver")}
          value={trip.driverName || t("storeManager.deliveriesNotAssigned")}
          detail={
            trip.isDriverOnline
              ? t("storeManager.liveTrackingDriverOnline")
              : t("storeManager.liveTrackingDriverOffline")
          }
          tone={trip.isDriverOnline ? "success" : "muted"}
        />
        <TrackingMetric
          icon={Store}
          label={t("common.deliveryWindow")}
          value={receivingWindow}
          detail={outlet.mallWindow || t("storeManager.liveTrackingOwnOutlet")}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(240,250,244,0.92),rgba(255,255,255,0.98))] shadow-[0_10px_28px_rgba(15,23,42,0.04)] dark:bg-[var(--color-surface)]">
          <div className="flex flex-col gap-2 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold text-[var(--color-text)]">
                {t("storeManager.liveTrackingMapTitle")}
              </p>
              <p className="mt-0.5 text-[9.5px] text-[var(--color-text-secondary)]">
                {t("storeManager.liveTrackingMapPrivacy")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[9px] font-semibold text-[var(--color-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[var(--color-info)]" />
                {t("storeManager.liveTrackingVehicleMarker")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                {t("storeManager.liveTrackingOutletMarker")}
              </span>
            </div>
          </div>

          {mapPoints.length > 0 ? (
            <TrackingMap
              tracking={tracking}
              points={mapPoints}
              t={t}
            />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center sm:min-h-[380px]">
              <MapPin size={22} className="text-[var(--color-text-muted)]" />
              <p className="mt-3 text-[11px] font-bold text-[var(--color-text)]">
                {t("storeManager.liveTrackingMapUnavailable")}
              </p>
              <p className="mt-1.5 max-w-sm text-[10px] leading-5 text-[var(--color-text-secondary)]">
                {t("storeManager.liveTrackingMapUnavailableHint")}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <TrackingStatusCard tracking={tracking} language={language} t={t} />

          <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {t("storeManager.liveTrackingSyncTitle")}
            </p>

            <div className="mt-3 space-y-3">
              <InfoRow
                label={t("storeManager.liveTrackingLastDriverUpdate")}
                value={formatTimestamp(lastOperationalUpdate, language, t("storeManager.notSpecified"))}
              />
              <InfoRow
                label={t("storeManager.liveTrackingLastSynchronized")}
                value={formatTimestamp(trip.lastSynchronized, language, t("storeManager.notSpecified"))}
              />
              <InfoRow
                label={t("storeManager.liveTrackingLastRefreshed")}
                value={formatTimestamp(lastRefreshedAt, language, t("storeManager.notSpecified"))}
              />
              <InfoRow
                label={t("storeManager.liveTrackingStop")}
                value={stop.stopCode || t("storeManager.notSpecified")}
              />
              <InfoRow
                label={t("storeManager.liveTrackingStopSequence")}
                value={
                  Number.isFinite(Number(stop.sequence))
                    ? String(stop.sequence)
                    : t("storeManager.notSpecified")
                }
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrackingFinalStateBanner({ tracking, language, t }) {
  const displayStatus = getTrackingDisplayStatus(tracking);
  const receipt = tracking.receipt || {};
  const needsAttention = ["PARTIAL", "EXCEPTION"].includes(displayStatus);
  const Icon = needsAttention ? TriangleAlert : CheckCircle2;

  const messageKey =
    displayStatus === "RECEIVED"
      ? "storeManager.liveTrackingFinalReceivedHint"
      : displayStatus === "PARTIAL"
        ? "storeManager.liveTrackingFinalPartialHint"
        : displayStatus === "EXCEPTION"
          ? "storeManager.liveTrackingFinalExceptionHint"
          : "storeManager.liveTrackingFinalDeliveredHint";

  return (
    <div
      className={`rounded-[18px] border px-4 py-4 ${
        needsAttention
          ? "border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)]/65"
          : "border-[var(--color-success)]/28 bg-[var(--color-success-soft)]/65"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            needsAttention
              ? "border-[var(--color-warning)]/25 bg-[var(--color-surface)] text-[var(--color-warning)]"
              : "border-[var(--color-success)]/25 bg-[var(--color-surface)] text-[var(--color-success)]"
          }`}
        >
          <Icon size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-extrabold text-[var(--color-text)]">
              {t("storeManager.liveTrackingFinalTitle")}
            </p>
            <DeliveryStatusBadge status={displayStatus} t={t} compact />
          </div>
          <p className="mt-1.5 text-[10px] leading-5 text-[var(--color-text-secondary)]">
            {t(messageKey)}
          </p>

          {receipt.confirmed ? (
            <p className="mt-2 text-[9.5px] font-semibold text-[var(--color-text-secondary)]">
              {t("storeManager.liveTrackingReceiptConfirmedAt")}: {formatTimestamp(
                receipt.confirmedAt,
                language,
                t("storeManager.notSpecified")
              )}
              {receipt.confirmedBy?.fullName
                ? ` · ${receipt.confirmedBy.fullName}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TrackingMap({ tracking, points, t }) {
  const trip = tracking.trip || {};
  const stop = tracking.myStop || {};
  const vehiclePoint = isCoordinatePair(trip.currentLocation)
    ? [
        coordinateNumber(trip.currentLocation.latitude, trip.currentLocation.lat),
        coordinateNumber(trip.currentLocation.longitude, trip.currentLocation.lng, trip.currentLocation.lon),
      ]
    : null;
  const stopPoint = hasStopCoordinates(stop)
    ? [
        coordinateNumber(stop.latitude, stop.lat),
        coordinateNumber(stop.longitude, stop.lng, stop.lon),
      ]
    : null;

  return (
    <MapContainer
      center={points[0]}
      zoom={13}
      scrollWheelZoom
      preferCanvas
      className="h-[320px] w-full bg-[#DCEEF5] sm:h-[380px] xl:h-[430px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitTrackingMap points={points} />

      {vehiclePoint && stopPoint ? (
        <Polyline
          positions={[vehiclePoint, stopPoint]}
          pathOptions={{
            color: "#0f9d74",
            weight: 4,
            opacity: 0.82,
            dashArray: "10 8",
          }}
        />
      ) : null}

      {stopPoint ? (
        <CircleMarker
          center={stopPoint}
          radius={12}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#16a34a",
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <strong>{t("storeManager.liveTrackingOutletMarker")}</strong>
            <br />
            {tracking.outlet?.outletCode || stop.stopCode}
          </Popup>
        </CircleMarker>
      ) : null}

      {vehiclePoint ? (
        <CircleMarker
          center={vehiclePoint}
          radius={10}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#0284c7",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>{t("storeManager.liveTrackingVehicleMarker")}</strong>
            <br />
            {trip.vehicleCode || t("storeManager.deliveriesNotAssigned")}
          </Popup>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}

function FitTrackingMap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const refreshMapSize = () => map.invalidateSize(false);

    refreshMapSize();
    const timerOne = window.setTimeout(refreshMapSize, 80);
    const timerTwo = window.setTimeout(refreshMapSize, 260);

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: false });
    } else {
      map.fitBounds(points, {
        padding: [44, 44],
        maxZoom: 15,
        animate: false,
      });
    }

    return () => {
      window.clearTimeout(timerOne);
      window.clearTimeout(timerTwo);
    };
  }, [map, points]);

  return null;
}

function TrackingStatusCard({ tracking, language, t }) {
  const trip = tracking.trip || {};
  const stop = tracking.myStop || {};
  const displayStatus = getTrackingDisplayStatus(tracking);

  return (
    <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {t("storeManager.liveTrackingCurrentState")}
          </p>
          <p className="mt-1.5 text-[14px] font-bold text-[var(--color-text)]">
            {getDeliveryStatusLabel(t, displayStatus)}
          </p>
        </div>
        <DeliveryStatusBadge status={displayStatus} t={t} compact />
      </div>

      <div className="mt-4 grid gap-3">
        <InfoRow
          label={t("storeManager.deliveriesTrip")}
          value={trip.tripCode || t("storeManager.deliveriesNotAssigned")}
        />
        <InfoRow
          label={t("storeManager.deliveryDetailsScheduledDate")}
          value={formatDeliveryDate(trip.deliveryDate, language)}
        />
        <InfoRow
          label={t("storeManager.liveTrackingTripStatus")}
          value={formatStatusValue(trip.status, t("storeManager.notSpecified"))}
        />
        <InfoRow
          label={t("storeManager.liveTrackingStopStatus")}
          value={formatStatusValue(stop.status, t("storeManager.notSpecified"))}
        />
      </div>

      <div
        className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3 py-3 ${
          trip.isDriverOnline
            ? "border-[var(--color-success)]/25 bg-[var(--color-success-soft)] text-[var(--color-text)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]"
        }`}
      >
        {trip.isDriverOnline ? (
          <Wifi size={14} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
        ) : (
          <WifiOff size={14} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
        )}
        <div>
          <p className="text-[10px] font-bold">
            {trip.isDriverOnline
              ? t("storeManager.liveTrackingDriverOnline")
              : t("storeManager.liveTrackingDriverOffline")}
          </p>
          <p className="mt-1 text-[9.5px] leading-4 opacity-80">
            {trip.isDriverOnline
              ? t("storeManager.liveTrackingDriverOnlineHint")
              : t("storeManager.liveTrackingDriverOfflineHint")}
          </p>
        </div>
      </div>
    </div>
  );
}

function TrackingMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}) {
  const toneClass = {
    success:
      "border-[var(--color-success)]/20 bg-[var(--color-success-soft)]/55 text-[var(--color-success)]",
    warning:
      "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)]/75 text-[var(--color-warning)]",
    info:
      "border-[var(--color-info)]/18 bg-[var(--color-info-soft)]/80 text-[var(--color-info)]",
    muted:
      "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]",
    neutral:
      "border-[var(--color-border)] bg-[var(--color-surface-soft)]/70 text-[var(--color-primary)]",
  }[tone] || "border-[var(--color-border)] bg-[var(--color-surface-soft)]/70 text-[var(--color-primary)]";

  return (
    <article className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.025)]">
      <div className="flex items-start gap-2.5">
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${toneClass}`}>
          <Icon size={14.5} />
        </span>
        <div className="min-w-0">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-1 truncate text-[12.8px] font-extrabold tracking-[0.01em] text-[var(--color-text)]">
            {value}
          </p>
          {detail ? (
            <p className="mt-0.5 truncate text-[9.2px] text-[var(--color-text-secondary)]">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TrackingLoading({ t }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
      <RefreshCw size={20} className="animate-spin text-[var(--color-primary)]" />
      <p className="mt-3 text-[11px] font-bold text-[var(--color-text)]">
        {t("storeManager.liveTrackingLoading")}
      </p>
      <p className="mt-1.5 text-[10px] text-[var(--color-text-secondary)]">
        {t("storeManager.liveTrackingLoadingHint")}
      </p>
    </div>
  );
}

function TrackingPending({ availabilityCode, t }) {
  const waitingForPublish =
    availabilityCode === "STORE_MANAGER_DELIVERY_NOT_PUBLISHED";

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-info)]/20 bg-[var(--color-info-soft)] text-[var(--color-info)]">
        <Route size={18} />
      </span>
      <p className="mt-3 text-[12px] font-bold text-[var(--color-text)]">
        {waitingForPublish
          ? t("storeManager.liveTrackingAwaitingPublish")
          : t("storeManager.liveTrackingAwaitingPlan")}
      </p>
      <p className="mt-1.5 max-w-lg text-[10px] leading-5 text-[var(--color-text-secondary)]">
        {waitingForPublish
          ? t("storeManager.liveTrackingAwaitingPublishHint")
          : t("storeManager.liveTrackingAwaitingPlanHint")}
      </p>
    </div>
  );
}

function TrackingError({ message, onRefresh, t }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
        <TriangleAlert size={18} />
      </span>
      <p className="mt-3 text-[12px] font-bold text-[var(--color-text)]">
        {t("storeManager.liveTrackingLoadFailed")}
      </p>
      <p className="mt-1.5 max-w-lg text-[10px] leading-5 text-[var(--color-text-secondary)]">
        {message}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="nexora-focus mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[10px] font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
      >
        <RefreshCw size={13} />
        {t("storeManager.tryAgain")}
      </button>
    </div>
  );
}

function getTrackingDisplayStatus(tracking) {
  if (tracking?.receipt?.confirmed) {
    return "RECEIVED";
  }

  return tracking?.deliveryStatus || "SCHEDULED";
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)]/70 pb-2.5 last:border-b-0 last:pb-0">
      <span className="text-[9.5px] text-[var(--color-text-secondary)]">
        {label}
      </span>
      <span className="max-w-[58%] text-right text-[9.5px] font-bold text-[var(--color-text)]">
        {value}
      </span>
    </div>
  );
}

function getMapPoints(tracking) {
  const points = [];
  const location = tracking?.trip?.currentLocation;
  const stop = tracking?.myStop;

  if (isCoordinatePair(location)) {
    points.push([
      coordinateNumber(location.latitude, location.lat),
      coordinateNumber(location.longitude, location.lng, location.lon),
    ]);
  }

  if (hasStopCoordinates(stop)) {
    const outletPoint = [
      coordinateNumber(stop.latitude, stop.lat),
      coordinateNumber(stop.longitude, stop.lng, stop.lon),
    ];

    if (
      !points.some(
        ([lat, lng]) =>
          lat === outletPoint[0] && lng === outletPoint[1]
      )
    ) {
      points.push(outletPoint);
    }
  }

  return points;
}

function isCoordinatePair(location) {
  return (
    hasCoordinateValue(location?.latitude ?? location?.lat) &&
    hasCoordinateValue(location?.longitude ?? location?.lng ?? location?.lon)
  );
}

function hasStopCoordinates(stop) {
  return (
    hasCoordinateValue(stop?.latitude ?? stop?.lat) &&
    hasCoordinateValue(stop?.longitude ?? stop?.lng ?? stop?.lon)
  );
}

function coordinateNumber(...values) {
  for (const value of values) {
    if (hasCoordinateValue(value)) {
      return Number(value);
    }
  }

  return null;
}

function hasCoordinateValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "" &&
    Number.isFinite(Number(value))
  );
}

function formatEta(value, deliveryDate, language, fallback) {
  if (!value) return fallback;

  const raw = String(value).trim();
  if (!raw) return fallback;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /[T-]/.test(raw)) {
    return new Intl.DateTimeFormat(localeFor(language), {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  }

  if (deliveryDate && /^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
    const parsedTime = new Date(`${deliveryDate}T${raw}`);
    if (!Number.isNaN(parsedTime.getTime())) {
      return new Intl.DateTimeFormat(localeFor(language), {
        hour: "numeric",
        minute: "2-digit",
      }).format(parsedTime);
    }
  }

  return raw;
}

function formatTimestamp(value, language, fallback) {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(localeFor(language), {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function localeFor(language) {
  if (language === "si") return "si-LK";
  if (language === "ta") return "ta-LK";
  return "en-LK";
}

function formatWindow(open, close, fallback) {
  if (!open || !close) return fallback;
  return `${open} – ${close}`;
}

function formatStatusValue(value, fallback) {
  if (!value) return fallback;

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default StoreManagerLiveTrackingPanel;
