import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  createDispatcherMonitoringSocket,
  getDispatcherDeliveryReports,
} from "../../../services/dispatcherMonitoringService";

const TRIPS_PER_PAGE = 5;

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

function formatDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
}

function isoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function outcomeLabel(outcome, status) {
  if (outcome === "DELIVERED_FULL") return "Delivered";
  if (outcome === "PARTIAL_DELIVERY") return "Partial";
  if (outcome === "UNABLE_TO_DELIVER") return "Unable";
  if (status === "ARRIVED") return "Arrived";
  if (status === "COMPLETED") return "Completed";
  if (status === "NEXT_STOP") return "Next Stop";
  return "Pending";
}

function resultClass(outcome, status) {
  if (outcome === "UNABLE_TO_DELIVER") return "text-red-500";
  if (outcome === "PARTIAL_DELIVERY") return "text-amber-600";
  if (outcome === "DELIVERED_FULL" || status === "COMPLETED") return "text-[var(--color-success)]";
  return "text-[var(--color-text-secondary)]";
}

const DeliveryReports = () => {
  const context = useOutletContext() || {};
  const {
    startDate = "",
    endDate = "",
    selectedDepot = "",
    selectedStatus = "All Statuses",
  } = context;

  const [trips, setTrips] = useState([]);
  const [selectedTripCode, setSelectedTripCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("All Vehicles");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllStops, setShowAllStops] = useState(false);

  async function loadReports({ quiet = false } = {}) {
    if (!quiet) setLoading(true);

    try {
      setError("");
      const data = await getDispatcherDeliveryReports({
        depot: selectedDepot || undefined,
      });
      const nextTrips = data.trips || [];
      setTrips(nextTrips);
      setSelectedTripCode((current) => {
        if (current && nextTrips.some((trip) => trip.tripCode === current)) return current;
        return nextTrips[0]?.tripCode || null;
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to load delivery reports."
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepot]);

  useEffect(() => {
    const socket = createDispatcherMonitoringSocket();
    const refresh = () => loadReports({ quiet: true });

    socket.on("monitoring:update", refresh);
    const poll = window.setInterval(refresh, 20000);

    return () => {
      window.clearInterval(poll);
      socket.off("monitoring:update", refresh);
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepot]);

  const vehicleOptions = useMemo(
    () => [...new Set(trips.map((trip) => trip.vehicleCode).filter(Boolean))],
    [trips]
  );

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    return trips.filter((trip) => {
      const deliveryDate = isoDate(trip.deliveryDate);
      const matchesDate =
        (!startDate || !deliveryDate || deliveryDate >= startDate) &&
        (!endDate || !deliveryDate || deliveryDate <= endDate);

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        trip.status === selectedStatus;

      const matchesVehicle =
        selectedVehicle === "All Vehicles" ||
        trip.vehicleCode === selectedVehicle;

      const matchesSearch =
        !query ||
        trip.tripCode?.toLowerCase().includes(query) ||
        trip.vehicleCode?.toLowerCase().includes(query) ||
        trip.driverName?.toLowerCase().includes(query) ||
        trip.stops?.some((stop) =>
          [stop.outletCode, stop.outletName, stop.pod?.receiverName]
            .some((value) => String(value || "").toLowerCase().includes(query))
        );

      return matchesDate && matchesStatus && matchesVehicle && matchesSearch;
    });
  }, [trips, search, startDate, endDate, selectedStatus, selectedVehicle]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, selectedDepot, selectedStatus, selectedVehicle]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / TRIPS_PER_PAGE));
  const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
  const paginatedTrips = filteredTrips.slice(startIndex, startIndex + TRIPS_PER_PAGE);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.tripCode === selectedTripCode) || null,
    [trips, selectedTripCode]
  );

  useEffect(() => {
    setShowAllStops(false);
  }, [selectedTripCode]);

  const visibleStops = selectedTrip
    ? (showAllStops ? selectedTrip.stops : selectedTrip.stops.slice(0, 6))
    : [];

  const summary = useMemo(() => ({
    completedTrips: filteredTrips.filter((trip) => trip.tripStatus === "COMPLETED").length,
    deliveredOrders: filteredTrips.reduce((sum, trip) => sum + Number(trip.deliveredOrders || 0), 0),
    partialFailed: filteredTrips.reduce((sum, trip) => sum + Number(trip.partialFailed || 0), 0),
    proofRecords: filteredTrips.reduce((sum, trip) => sum + Number(trip.proofRecords || 0), 0),
  }), [filteredTrips]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700">
          <span>{error}</span>
          <button type="button" className="font-semibold" onClick={() => loadReports()}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Completed Trips" value={summary.completedTrips} note="Driver completion records" type="green" icon="✓" />
        <SummaryCard title="Delivered Orders" value={summary.deliveredOrders} note="Full + partial deliveries" type="green" icon="◇" />
        <SummaryCard title="Partial / Failed" value={summary.partialFailed} note="Exceptions requiring visibility" type="amber" icon="△" />
        <SummaryCard title="Proof Records" value={summary.proofRecords} note="Submitted by Drivers" type="green" icon="▣" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[12px] font-semibold text-[var(--color-text)]">Delivery Records</h2>
              <span className="text-[9px] text-[var(--color-text-muted)]">({filteredTrips.length})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-7 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-2">
                <span className="mr-2 text-[9px] text-[var(--color-text-muted)]">⌕</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trip, POD receiver or outlet..."
                  className="w-[190px] bg-transparent text-[9px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <select
                value={selectedVehicle}
                onChange={(event) => setSelectedVehicle(event.target.value)}
                className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-2 text-[9px] text-[var(--color-text)] outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>{vehicle}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto px-3">
            <table className="w-full min-w-[760px] text-left text-[9px]">
              <thead className="border-y border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[8px] font-medium uppercase text-[var(--color-text-muted)]">
                <tr>
                  <th className="w-8 px-2 py-2" />
                  <th className="px-2 py-2">Trip ID</th>
                  <th className="px-2 py-2">Vehicle</th>
                  <th className="px-2 py-2">Driver</th>
                  <th className="px-2 py-2">Latest Activity</th>
                  <th className="px-2 py-2 text-center">Stops</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">POD</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading delivery records...</td></tr>
                ) : paginatedTrips.length ? (
                  paginatedTrips.map((trip) => {
                    const selected = selectedTrip?.tripCode === trip.tripCode;
                    return (
                      <tr
                        key={trip.tripCode}
                        onClick={() => setSelectedTripCode(trip.tripCode)}
                        className={`cursor-pointer border-b border-[var(--color-border)] ${selected ? "bg-[var(--color-primary-soft)]" : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)]"}`}
                      >
                        <td className="px-2 py-2"><input type="checkbox" checked={selected} readOnly className="accent-emerald-600" /></td>
                        <td className="px-2 py-2 font-semibold text-[var(--color-success)]">{trip.tripCode}</td>
                        <td className="px-2 py-2 text-[var(--color-text)]">{trip.vehicleCode}</td>
                        <td className="px-2 py-2 text-[var(--color-text)]">{trip.driverName}</td>
                        <td className="px-2 py-2 text-[var(--color-text-secondary)]">{formatDateTime(trip.lastActivityAt)}</td>
                        <td className="px-2 py-2 text-center text-[var(--color-text)]">{trip.completedStops}/{trip.totalStops}</td>
                        <td className="px-2 py-2"><StatusBadge status={trip.status} /></td>
                        <td className="px-2 py-2 font-semibold text-[var(--color-success)]">{trip.confirmation}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-[var(--color-text-muted)]">No delivery records match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[8px] text-[var(--color-text-muted)]">
            <span>Showing {paginatedTrips.length} of {filteredTrips.length} delivery records</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="h-6 w-6 rounded border border-[var(--color-border)] disabled:opacity-40">‹</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-6 w-6 rounded border ${currentPage === pageNumber ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--color-border)]"}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="h-6 w-6 rounded border border-[var(--color-border)] disabled:opacity-40">›</button>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {selectedTrip ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-bold text-[var(--color-text)]">{selectedTrip.tripCode} - {selectedTrip.vehicleCode}</h2>
                  <p className="mt-1 text-[8px] text-[var(--color-text-muted)]">Live Driver records are synchronized into this report.</p>
                </div>
                <StatusBadge status={selectedTrip.status} />
              </div>

              <div className="mt-4">
                <h3 className="text-[10px] font-semibold text-[var(--color-text)]">Trip Summary</h3>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  <Info label="VEHICLE TYPE" value={selectedTrip.vehicleType || "—"} />
                  <Info label="DEPOT" value={selectedTrip.depot || "—"} />
                  <Info label="DRIVER" value={selectedTrip.driverName} />
                  <Info label="DELIVERY DATE" value={formatDateOnly(selectedTrip.deliveryDate)} />
                  <Info label="LAST ACTIVITY" value={formatDateTime(selectedTrip.lastActivityAt)} />
                  <Info label="TOTAL STOPS" value={selectedTrip.totalStops} />
                </div>
              </div>

              <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-[8px] font-semibold text-[var(--color-success)]">
                Overall Result: {selectedTrip.status}
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-[10px] font-semibold text-[var(--color-text)]">Stop Outcomes ({selectedTrip.stops.length})</h3>
                <div className="overflow-hidden rounded border border-[var(--color-border)]">
                  <div className="grid grid-cols-[24px_minmax(0,1fr)_56px_56px_58px] bg-[var(--color-surface-soft)] px-2 py-1 text-[7px] text-[var(--color-text-muted)]">
                    <span>#</span><span>Outlet</span><span>Plan</span><span>Arrival</span><span>Result</span>
                  </div>
                  {visibleStops.map((stop) => (
                    <div key={stop.stopCode} className="grid grid-cols-[24px_minmax(0,1fr)_56px_56px_58px] items-center border-t border-[var(--color-border)] px-2 py-1.5 text-[8px]">
                      <span className="text-[var(--color-text-secondary)]">{stop.sequence}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[var(--color-text)]">{stop.outletName || stop.outletCode}</div>
                        {stop.pod && <div className="truncate text-[7px] font-semibold text-[var(--color-success)]">POD · {stop.pod.receiverName}</div>}
                      </div>
                      <span className="text-[var(--color-text-secondary)]">{stop.plannedEta || "—"}</span>
                      <span className="text-[var(--color-text-secondary)]">{stop.actualArrival || "—"}</span>
                      <span className={resultClass(stop.outcome, stop.status)}>● {outcomeLabel(stop.outcome, stop.status)}</span>
                    </div>
                  ))}
                </div>
                {selectedTrip.stops.length > 6 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[8px] text-[var(--color-text-muted)]">Showing {visibleStops.length} of {selectedTrip.stops.length} stops</span>
                    <button type="button" onClick={() => setShowAllStops((value) => !value)} className="text-[8px] font-semibold text-[var(--color-success)]">{showAllStops ? "Show Less" : "View All Stops >"}</button>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <h3 className="text-[10px] font-semibold text-[var(--color-text)]">Latest Proof of Delivery</h3>
                {selectedTrip.latestPod ? (
                  <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold text-[var(--color-text)]">{selectedTrip.latestPod.outletCode || "Outlet"}</p>
                        <p className="mt-0.5 text-[8px] text-[var(--color-text-secondary)]">Receiver: <strong>{selectedTrip.latestPod.receiverName || "—"}</strong></p>
                      </div>
                      <span className="rounded-full border border-[var(--color-success)] px-2 py-1 text-[7px] text-[var(--color-success)]">POD Submitted</span>
                    </div>
                    <p className="mt-2 text-[8px] text-[var(--color-text-secondary)]">{selectedTrip.latestPod.deliveryNote || "No delivery note."}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[7px] text-[var(--color-text-muted)]">
                      <span>Time: {formatDateTime(selectedTrip.latestPod.createdAt || selectedTrip.latestPod.recordedAt)}</span>
                      <span>Photo: {selectedTrip.latestPod.photoName || "Not supplied"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[8px] text-[var(--color-text-muted)]">No proof of delivery has been submitted for this trip yet.</p>
                )}
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-[10px] text-[var(--color-text-muted)]">Select a delivery record to view details.</div>
          )}
        </aside>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, note, type, icon }) => {
  const styles = {
    green: { icon: "bg-[var(--color-success-soft)] text-[var(--color-success)]", text: "text-[var(--color-success)]" },
    amber: { icon: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]", text: "text-orange-500" },
    red: { icon: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]", text: "text-red-500" },
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] ${styles[type].icon}`}>{icon}</div>
        <div>
          <p className="text-[8px] text-[var(--color-text-secondary)]">{title}</p>
          <p className="text-[20px] font-bold leading-none text-[var(--color-text)]">{value}</p>
          <p className={`mt-1 text-[7px] ${styles[type].text}`}>{note}</p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    "All Delivered": "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    "Partially Delivered": "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    "Issue to Review": "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    "Receipt Pending": "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    "In Progress": "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  };

  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[7px] font-medium ${styles[status] || "bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]"}`}>
      ● {status}
    </span>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-[7px] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-0.5 text-[8px] font-semibold text-[var(--color-text)]">{value}</p>
  </div>
);

export default DeliveryReports;
