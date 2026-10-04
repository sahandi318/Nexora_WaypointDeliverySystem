import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getDispatcherDeliveryReports, saveDispatcherReceiptDecision } from "../../../services/dispatcherMonitoringService";

const resolutionOptions = [
  "Arrange replacement delivery",
  "Confirm quantity adjustment",
  "Request additional evidence",
  "Escalate for further investigation",
  "Mark as resolved (no further action)",
];

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-LK", { timeZone: "Asia/Colombo" });
}

function dateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function SummaryCard({ title, value, type, icon }) {
  const styles = {
    green: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    amber: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    red: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  };
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-full text-[13px] ${styles[type]}`}>{icon}</div>
        <div>
          <p className="text-[8px] text-[var(--color-text-secondary)]">{title}</p>
          <p className="text-[20px] font-bold leading-none text-[var(--color-text)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[7px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-[8px] font-semibold text-[var(--color-text)]">{value || "Not available"}</p>
    </div>
  );
}

function EvidenceCard({ title, badge, values }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-semibold text-[var(--color-text)]">{title}</h3>
        <span className="rounded bg-[var(--color-surface-soft)] px-2 py-1 text-[7px] font-semibold text-[var(--color-text-secondary)]">{badge}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        {values.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="text-[7px] text-[var(--color-text-muted)]">{label}</span>
            <span className="max-w-[65%] break-words text-right text-[8px] font-medium text-[var(--color-text)]">{value || "Not recorded"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReceiptDiscrepancyResolution() {
  const navigate = useNavigate();
  const {
    startDate = "",
    endDate = "",
    selectedDepot = "",
    selectedStatus = "All Statuses",
  } = useOutletContext() || {};
  const [report, setReport] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [resolution, setResolution] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const data = await getDispatcherDeliveryReports({
        depot: selectedDepot && selectedDepot !== "ALL" ? selectedDepot : undefined,
      });
      setReport(data);
      setSelectedId((current) =>
        current && data.discrepancies?.some((item) => item.id === current)
          ? current
          : data.discrepancies?.[0]?.id || ""
      );
    } catch (requestError) {
      setReport(null);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load delivery discrepancy data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepot]);

  const trips = report?.trips || [];
  const filteredTrips = useMemo(
    () =>
      trips.filter((trip) => {
        const tripDate = dateOnly(trip.deliveryDate);
        const matchesDate =
          (!startDate || !tripDate || tripDate >= startDate) &&
          (!endDate || !tripDate || tripDate <= endDate);
        const matchesStatus =
          selectedStatus === "All Statuses" || trip.status === selectedStatus;
        return matchesDate && matchesStatus;
      }),
    [trips, startDate, endDate, selectedStatus]
  );
  const allowedTripCodes = new Set(filteredTrips.map((trip) => trip.tripCode));
  const discrepancies = (report?.discrepancies || []).filter((item) =>
    allowedTripCodes.has(item.tripCode)
  );
  const selectedDiscrepancy =
    discrepancies.find((item) => item.id === selectedId) || discrepancies[0] || null;
  const selectedTrip =
    filteredTrips.find((trip) => trip.tripCode === selectedDiscrepancy?.tripCode) || null;
  const selectedStop =
    selectedTrip?.stops.find((stop) => stop.stopCode === selectedDiscrepancy?.stopCode) || null;
  const summary = {
    completedTrips: filteredTrips.filter((trip) => trip.tripStatus === "COMPLETED").length,
    deliveredOrders: filteredTrips.reduce((sum, trip) => sum + Number(trip.deliveredOrders || 0), 0),
    partialFailed: filteredTrips.reduce((sum, trip) => sum + Number(trip.partialFailed || 0), 0),
    open: discrepancies.filter((item) => item.status === "OPEN").length,
  };
  const quantityDifference = selectedDiscrepancy?.quantityDifference || 0;
  const currentIndex = discrepancies.findIndex((item) => item.id === selectedDiscrepancy?.id);

  useEffect(() => {
    setSelectedId((current) =>
      discrepancies.some((item) => item.id === current)
        ? current
        : discrepancies[0]?.id || ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discrepancies.map((item) => item.id).join("|")]);

  useEffect(() => {
    setResolution(selectedDiscrepancy?.resolutionAction || "");
    setNotes(selectedDiscrepancy?.resolutionNote || "");
    setSaveMessage("");
  }, [selectedDiscrepancy?.id]);

  function moveSelection(direction) {
    if (!discrepancies.length) return;
    const nextIndex =
      (currentIndex + direction + discrepancies.length) % discrepancies.length;
    setSelectedId(discrepancies[nextIndex].id);
  }

  async function handleSaveDecision() {
    if (!selectedDiscrepancy || saving) return;
    if (!resolution || !notes.trim()) {
      setSaveMessage("Select a resolution and enter notes before saving.");
      return;
    }
    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      const result = await saveDispatcherReceiptDecision({
        tripCode: selectedDiscrepancy.tripCode,
        stopCode: selectedDiscrepancy.stopCode,
        action: resolution,
        note: notes,
      });
      setReport((current) => ({
        ...current,
        discrepancies: current.discrepancies.map((item) =>
          item.id === result.decision.id
            ? {
                ...item,
                status: result.decision.status,
                resolutionAction: result.decision.action,
                resolutionNote: result.decision.note,
                resolvedAt: result.decision.resolvedAt,
              }
            : item
        ),
      }));
      setSaveMessage(result.message || "Decision saved.");
      await loadReports();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to save the discrepancy decision."
      );
    } finally {
      setSaving(false);
    }
  }

  const resolutionTime = formatDate(selectedDiscrepancy?.reportedAt);
  const driverEvidence = selectedStop?.pod || selectedStop?.exception || {};

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700">
          {error}
          <button type="button" className="ml-3 font-semibold underline" onClick={loadReports}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Completed Trips" value={summary.completedTrips} type="green" icon="✓" />
        <SummaryCard title="Delivered Orders" value={summary.deliveredOrders} type="green" icon="◇" />
        <SummaryCard title="Partial / Failed Deliveries" value={summary.partialFailed} type="amber" icon="△" />
        <SummaryCard title="Open Discrepancies" value={summary.open} type="red" icon="!" />
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate("/dispatcher/reports")} className="text-[9px] font-semibold text-[var(--color-success)]">
          ← Back to Delivery Reports
        </button>
        <div className="flex items-center gap-2 text-[9px]">
          <button type="button" onClick={() => moveSelection(-1)} disabled={!discrepancies.length} className="grid h-6 w-6 place-items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40" aria-label="Previous discrepancy">‹</button>
          <span className="font-semibold text-[var(--color-text)]">
            {selectedDiscrepancy
              ? `${selectedDiscrepancy.tripCode} · ${selectedDiscrepancy.vehicleCode}`
              : loading ? "Loading delivery records…" : "No delivery discrepancies"}
          </span>
          <button type="button" onClick={() => moveSelection(1)} disabled={!discrepancies.length} className="grid h-6 w-6 place-items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40" aria-label="Next discrepancy">›</button>
        </div>
      </div>

      {!selectedDiscrepancy ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
          {loading
            ? "Loading delivery report data…"
            : "No partial or failed delivery outcomes were recorded for the selected filters."}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-border)] px-4 py-3 md:grid-cols-4">
              <Detail label="TRIP DETAILS" value={selectedDiscrepancy.tripCode} />
              <Detail label="VEHICLE" value={selectedDiscrepancy.vehicleCode} />
              <Detail label="DRIVER" value={selectedDiscrepancy.driverName} />
              <Detail label="DELIVERY STATUS" value={selectedDiscrepancy.outcome?.replaceAll("_", " ")} />
            </div>
            <div className="grid grid-cols-2 gap-4 px-4 py-3 md:grid-cols-4">
              <Detail label={`STOP ${selectedStop?.sequence || ""}`} value={selectedDiscrepancy.outletName} />
              <Detail label="ORDER ID" value={selectedDiscrepancy.orderCode} />
              <Detail label="DEPOT" value={selectedDiscrepancy.depot} />
              <Detail label="SCHEDULED TIME" value={selectedStop?.plannedEta} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[9px] text-amber-900">
            <strong>Driver-reported quantity difference</strong>
            <span>
              Expected {selectedDiscrepancy.expectedQuantity} units; the Driver recorded {selectedDiscrepancy.driverReportedQuantity} units
              {quantityDifference > 0
                ? ` (${quantityDifference} fewer than expected).`
                : quantityDifference < 0
                  ? ` (${Math.abs(quantityDifference)} more than expected).`
                  : "."}
              {" "}A separate Store Manager receipt confirmation is not recorded in this system.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_310px]">
            <div className="space-y-4">
              <EvidenceCard
                title="Driver Delivery Record"
                badge={selectedStop?.pod ? "POD RECORDED" : "OUTCOME RECORDED"}
                values={[
                  ["Driver reported quantity", `${selectedDiscrepancy.driverReportedQuantity} units`],
                  ["Receiver", selectedStop?.pod?.receiverName],
                  ["Reported at", resolutionTime],
                  ["Driver note", selectedDiscrepancy.driverNote],
                  ["Photo filename", driverEvidence.photoName],
                ]}
              />
              <EvidenceCard
                title="Store Receipt Confirmation"
                badge="NOT AVAILABLE"
                values={[
                  ["Received quantity", "Not recorded"],
                  ["Confirmation time", "Not recorded"],
                  ["Receipt note", "No Store Manager confirmation is stored for this delivery."],
                ]}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="text-[11px] font-semibold text-[var(--color-text)]">Discrepancy History</h3>
              <div className="text-[9px] text-[var(--color-text-secondary)]">
                <strong>{selectedDiscrepancy.status === "RESOLVED" ? "Decision recorded" : "Awaiting Dispatcher decision"}</strong>
                <p className="mt-1">{selectedDiscrepancy.resolutionAction || "No decision recorded yet."}</p>
                {selectedDiscrepancy.resolutionNote && <p className="mt-1">{selectedDiscrepancy.resolutionNote}</p>}
                {selectedDiscrepancy.resolvedAt && <p className="mt-1">{formatDate(selectedDiscrepancy.resolvedAt)}</p>}
              </div>
              <p className="text-[8px] text-[var(--color-text-muted)]">
                Reported {resolutionTime}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="text-[11px] font-semibold text-[var(--color-text)]">Resolution & Decision</h3>
              <label className="mt-4 block text-[8px] font-medium text-[var(--color-text-secondary)]" htmlFor="receipt-resolution">
                Select Resolution *
              </label>
              <select id="receipt-resolution" value={resolution} onChange={(event) => setResolution(event.target.value)} className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-[8px] text-[var(--color-text)]">
                <option value="">Choose an action</option>
                {resolutionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <label className="mt-4 block text-[8px] font-medium text-[var(--color-text-secondary)]" htmlFor="receipt-resolution-notes">
                Resolution Notes *
              </label>
              <textarea id="receipt-resolution-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} rows={5} className="mt-2 w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-[8px] text-[var(--color-text)] outline-none" />
              <p className="mt-1 text-right text-[7px] text-[var(--color-text-muted)]">{notes.length} / 5000</p>
              <p className="mt-3 text-[8px] text-[var(--color-text-muted)]">
                The decision and note are saved to the live trip history. Notifications are not configured.
              </p>
              {saveMessage && <p className="mt-3 text-[8px] font-medium text-[var(--color-success)]">{saveMessage}</p>}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setResolution(selectedDiscrepancy.resolutionAction || ""); setNotes(selectedDiscrepancy.resolutionNote || ""); setSaveMessage(""); }} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[9px] text-[var(--color-text-secondary)]">Cancel</button>
                <button type="button" onClick={handleSaveDecision} disabled={saving || loading} className="rounded-md bg-[var(--color-primary)] py-2 text-[9px] font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50">{saving ? "Saving..." : "Save Decision"}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
