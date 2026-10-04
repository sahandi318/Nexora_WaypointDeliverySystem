import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getDispatcherCapacity } from "../../../services/dispatcherPlanningService";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return Number.isFinite(number)
    ? number.toLocaleString("en-LK", { maximumFractionDigits: digits })
    : "0";
}

const MetricCard = ({ title, value, unit, note, icon, iconStyle }) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${iconStyle}`}>{icon}</div>
      <div>
        <p className="text-[9px] text-[var(--color-text-secondary)]">{title}</p>
        <div className="flex items-end gap-1">
          <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
          <span className="mb-1 text-[8px] text-[var(--color-text-muted)]">{unit}</span>
        </div>
        {note && <p className="mt-1 text-[8px] text-[var(--color-text-muted)]">{note}</p>}
      </div>
    </div>
  </div>
);

const CapacityBar = ({ label, value, percentage, color, status }) => (
  <div>
    <p className="text-[8px] text-[var(--color-text-secondary)]">{label}</p>
    <div className="mt-1 flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-20 text-right text-[8px] font-semibold">{value}</span>
    </div>
    <p className="mt-1 text-right text-[7px] text-[var(--color-text-muted)]">{status}</p>
  </div>
);

const FutureCapacityPlanning = () => {
  const navigate = useNavigate();
  const {
    selectedPlanningWeek = "",
    planningWeeks = [],
    selectedDepot = "",
  } = useOutletContext() || {};
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const week = planningWeeks.find((item) => item.value === selectedPlanningWeek);

  useEffect(() => {
    if (!week?.startDate || !week?.endDate) {
      setCapacity(null);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    async function loadCapacity() {
      setLoading(true);
      setError("");
      try {
        const result = await getDispatcherCapacity({
          startDate: week.startDate,
          endDate: week.endDate,
          depot: selectedDepot || undefined,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setCapacity(result);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setCapacity(null);
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load capacity data."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadCapacity();
    return () => controller.abort();
  }, [week?.startDate, week?.endDate, selectedDepot]);

  const demand = capacity?.demand || {};
  const fleet = capacity?.fleet || {};
  const byBrand = capacity?.byBrand || [];
  const byDate = capacity?.byDate || [];
  const maxBrandOrders = Math.max(1, ...byBrand.map((item) => Number(item.orders || 0)));
  const weightCapacity = Number(fleet.totalWeightCapacityKg || 0);
  const reeferCapacity = Number(fleet.refrigeratedCapacityWeightKg || 0);
  const totalWeightRatio = weightCapacity
    ? Math.min(100, (Number(demand.weightKg || 0) / weightCapacity) * 100)
    : 0;
  const chilledWeightRatio = reeferCapacity
    ? Math.min(100, (Number(demand.chilledWeightKg || 0) / reeferCapacity) * 100)
    : 0;
  const capacityAlerts = useMemo(() => {
    const alerts = [];
    if (Number(demand.totalOrders || 0) > 0 && Number(fleet.activeVehicles || 0) === 0) {
      alerts.push("Orders are scheduled, but no active vehicles are recorded for the selected depot.");
    }
    if (Number(demand.chilledOrders || 0) > 0 && Number(fleet.refrigeratedVehicles || 0) === 0) {
      alerts.push("Chilled orders are scheduled, but no active refrigerated vehicles are recorded.");
    }
    return alerts;
  }, [demand.totalOrders, demand.chilledOrders, fleet.activeVehicles, fleet.refrigeratedVehicles]);

  function openPlanning() {
    const planDate = byDate[0]?.date || week?.startDate;
    if (planDate) sessionStorage.setItem("dispatcherPlanningDate", planDate);
    if (selectedDepot && selectedDepot !== "ALL") {
      sessionStorage.setItem("dispatcherPlanningDepot", selectedDepot);
    } else {
      sessionStorage.removeItem("dispatcherPlanningDepot");
    }
    navigate("/dispatcher/planning");
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[10px] text-red-700">
          <span>{error}</span>
          <button type="button" className="font-semibold underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      {!week && !loading && (
        <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[10px] text-[var(--color-text-muted)]">
          Select an operating week from the Reports & Capacity filters to load the database-backed schedule.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Scheduled Demand" value={loading ? "…" : formatNumber(demand.totalOrders)} unit="orders" note="Confirmed orders in the selected week" icon="◇" iconStyle="bg-[var(--color-success-soft)] text-emerald-500" />
        <MetricCard title="Scheduled Chilled Demand" value={loading ? "…" : formatNumber(demand.chilledOrders)} unit="orders" note={`${formatNumber(demand.chilledWeightKg, 1)} kg recorded`} icon="❄" iconStyle="bg-blue-50 text-blue-500" />
        <MetricCard title="Active Vehicles" value={loading ? "…" : formatNumber(fleet.activeVehicles)} unit={`vehicles · ${capacity?.depot || "all depots"}`} note="From the Prisma vehicle table" icon="▣" iconStyle="bg-purple-50 text-purple-500" />
        <MetricCard title="Refrigerated Vehicles" value={loading ? "…" : formatNumber(fleet.refrigeratedVehicles)} unit="vehicles" note="Active reefer vehicles" icon="♨" iconStyle="bg-[var(--color-warning-soft)] text-[var(--color-warning)]" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_290px]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold text-[var(--color-text)]">
              Recorded Orders by Outlet Brand ({capacity?.depot || "All Depots"})
            </h2>
            <span className="text-[8px] text-[var(--color-text-muted)]">Not a forecast</span>
          </div>
          {byBrand.length ? (
            <div className="flex h-[190px] items-end justify-around gap-3 overflow-x-auto border-b border-[var(--color-border)] px-3 pb-4">
              {byBrand.map((item) => (
                <div key={item.brand} className="flex h-full min-w-14 flex-1 flex-col justify-end">
                  <div className="flex items-end justify-center gap-1">
                    <div className="flex flex-col items-center">
                      <span className="mb-1 text-[7px] font-semibold">{item.orders}</span>
                      <div className="w-5 rounded-t bg-[var(--color-success)]" style={{ height: `${Math.max(4, (item.orders / maxBrandOrders) * 125)}px` }} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="mb-1 text-[7px] font-semibold">{item.chilledOrders}</span>
                      <div className="w-5 rounded-t bg-blue-400" style={{ height: `${Math.max(item.chilledOrders ? 4 : 0, (item.chilledOrders / maxBrandOrders) * 125)}px` }} />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-center text-[8px] font-semibold" title={item.brand}>{item.brand}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-[190px] place-items-center text-center text-[9px] text-[var(--color-text-muted)]">
              {loading ? "Loading actual order data…" : "No submitted or confirmed orders exist for this week and depot."}
            </div>
          )}
          <div className="mt-2 flex gap-3 text-[8px] text-[var(--color-text-secondary)]">
            <span>■ All scheduled orders</span>
            <span className="text-blue-500">■ Chilled subset</span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-[11px] font-semibold text-[var(--color-text)]">Recorded Demand vs Fleet Capacity</h2>
          <p className="mt-1 text-[8px] text-[var(--color-text-muted)]">Capacity shown per vehicle trip; schedule demand covers the selected week.</p>
          <div className="mt-5 space-y-5">
            <CapacityBar
              label="Scheduled order weight / fleet weight per trip"
              value={`${formatNumber(demand.weightKg, 1)} / ${formatNumber(weightCapacity, 1)} kg`}
              percentage={totalWeightRatio}
              status={weightCapacity ? "Actual order weight compared with one-trip capacity" : "No active fleet capacity recorded"}
              color="bg-[var(--color-success)]"
            />
            <CapacityBar
              label="Scheduled chilled weight / reefer capacity per trip"
              value={`${formatNumber(demand.chilledWeightKg, 1)} / ${formatNumber(reeferCapacity, 1)} kg`}
              percentage={chilledWeightRatio}
              status={reeferCapacity ? "Actual chilled weight compared with one-trip capacity" : "No refrigerated fleet capacity recorded"}
              color="bg-blue-400"
            />
            <div className="border-t border-[var(--color-border)] pt-3 text-[8px] text-[var(--color-text-secondary)]">
              Saved trips: <strong>{loading ? "…" : formatNumber(fleet.plannedTrips)}</strong>
              {" · "}Published trips: <strong>{loading ? "…" : formatNumber(fleet.publishedTrips)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_310px]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-[11px] font-semibold text-[var(--color-text)]">
            Scheduled Demand by Delivery Date ({capacity?.depot || "All Depots"})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-[8px]">
              <thead><tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]"><th className="py-2">Date</th><th>Orders</th><th>Ambient</th><th>Chilled</th><th>Order Weight (kg)</th><th>Chilled Weight (kg)</th></tr></thead>
              <tbody>
                {byDate.map((item) => (
                  <tr key={item.date} className="border-b border-[var(--color-border)]">
                    <td className="py-2 font-semibold">{item.date}</td>
                    <td>{item.orders}</td>
                    <td>{item.ambientOrders}</td>
                    <td>{item.chilledOrders}</td>
                    <td>{formatNumber(item.weightKg, 1)}</td>
                    <td>{formatNumber(item.chilledWeightKg, 1)}</td>
                  </tr>
                ))}
                {!byDate.length && (
                  <tr><td colSpan="6" className="py-5 text-center text-[var(--color-text-muted)]">{loading ? "Loading…" : "No scheduled orders for this week."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-[var(--color-text)]">Active Fleet Resources</h2>
            <button type="button" onClick={openPlanning} className="text-[8px] font-medium text-blue-500">Open Planner</button>
          </div>
          <div className="mt-5 space-y-4 text-[8px]">
            {[
              ["Vehicles", formatNumber(fleet.activeVehicles)],
              ["Refrigerated vehicles", formatNumber(fleet.refrigeratedVehicles)],
              ["Active Drivers", formatNumber(fleet.drivers)],
              ["Fleet volume capacity per trip", `${formatNumber(fleet.totalVolumeCapacityM3, 2)} m³`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <span className="text-[var(--color-text-secondary)]">{label}</span>
                <strong className="text-[var(--color-text)]">{loading ? "…" : value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {capacityAlerts.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4">
          <p className="text-[10px] font-semibold text-[var(--color-danger)]">Capacity Alert</p>
          <ul className="mt-1 list-inside list-disc text-[9px] text-[var(--color-danger)]">
            {capacityAlerts.map((alert) => <li key={alert}>{alert}</li>)}
          </ul>
          <button type="button" onClick={openPlanning} className="mt-3 rounded-md border border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-[9px] font-medium text-[var(--color-success)]">Plan Allocation</button>
        </div>
      )}
    </div>
  );
};

export default FutureCapacityPlanning;
