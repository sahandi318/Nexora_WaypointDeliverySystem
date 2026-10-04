import {
  PackageCheck,
  Route,
  Truck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DispatcherPlanningShell, {
  PlanningBadge,
  PlanningEmpty,
  PlanningNotice,
} from "../../../components/dispatcher/planning/DispatcherPlanningShell";
import useDispatcherPlanningWorkspace from "../../../hooks/useDispatcherPlanningWorkspace";
import {
  allocateDispatcherPlanningOrder,
} from "../../../services/dispatcherService";

function DeliveryPlanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState("");
  const [selectedOrderCode, setSelectedOrderCode] = useState(searchParams.get("order") || "");
  const [driverUserId, setDriverUserId] = useState("");
  const [vehicleCode, setVehicleCode] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const { workspace, loading, error, refresh } = useDispatcherPlanningWorkspace({ date });
  const orders = workspace?.orders?.unallocated || [];

  useEffect(() => {
    if (!selectedOrderCode && orders[0]) setSelectedOrderCode(orders[0].orderCode);
  }, [orders, selectedOrderCode]);

  useEffect(() => {
    if (!driverUserId && workspace?.drivers?.[0]) {
      setDriverUserId(workspace.drivers[0].userId);
    }
  }, [workspace, driverUserId]);

  useEffect(() => {
    if (!vehicleCode && workspace?.vehicles?.[0]) {
      setVehicleCode(workspace.vehicles[0].vehicleCode);
      setVehicleType(workspace.vehicles[0].vehicleType || "Delivery vehicle");
    }
  }, [workspace, vehicleCode]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderCode === selectedOrderCode) || orders[0] || null,
    [orders, selectedOrderCode]
  );

  function handleVehicleChange(code) {
    setVehicleCode(code);
    const vehicle = workspace?.vehicles?.find((item) => item.vehicleCode === code);
    if (vehicle) setVehicleType(vehicle.vehicleType || "Delivery vehicle");
  }

  async function handleAllocate() {
    if (!selectedOrder || !vehicleCode.trim()) return;

    setSaving(true);
    setNotice(null);

    try {
      const result = await allocateDispatcherPlanningOrder(
        selectedOrder.orderCode,
        {
          driverUserId,
          vehicleCode: vehicleCode.trim(),
          vehicleType: vehicleType || "Delivery vehicle",
        }
      );

      await refresh();
      setNotice({
        tone: "success",
        message: `${selectedOrder.orderCode} allocated to ${result?.allocation?.tripCode || "a draft trip"}.`,
      });

      setTimeout(() => navigate("/dispatcher/planning/review"), 450);
    } catch (requestError) {
      setNotice({
        tone: "danger",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to allocate the order.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DispatcherPlanningShell
      activePath="/dispatcher/planning/planner"
      title="Delivery Planner"
      subtitle="Allocate confirmed Store Manager orders to persisted delivery trips using an active depot Driver and an observed fleet vehicle."
      workspace={workspace}
      loading={loading}
      error={error}
      date={date}
      onDateChange={setDate}
      onRetry={refresh}
    >
      {notice ? <PlanningNotice tone={notice.tone}>{notice.message}</PlanningNotice> : null}

      {orders.length === 0 ? (
        <section className="dp-panel">
          <PlanningEmpty
            icon={PackageCheck}
            title="No confirmed unallocated orders"
            message="Confirm a submitted Store Manager order first. Allocated orders move to Review & Publish."
          />
        </section>
      ) : (
        <div className="dp-split">
          <section className="dp-panel">
            <div className="dp-panel-header">
              <div>
                <h2>Unallocated confirmed orders</h2>
                <p>Each allocation creates a persisted LiveTrip and matching outlet stop.</p>
              </div>
              <PlanningBadge tone="warning">{orders.length} waiting</PlanningBadge>
            </div>

            <div className="dp-table-wrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Outlet</th>
                    <th>Delivery date</th>
                    <th>Handling</th>
                    <th>Load</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.orderCode}
                      className={selectedOrder?.orderCode === order.orderCode ? "selected" : ""}
                      onClick={() => setSelectedOrderCode(order.orderCode)}
                    >
                      <td><strong>{order.orderCode}</strong><small>{order.totalUnits} units</small></td>
                      <td><strong>{order.outlet.outletCode}</strong><small>{order.outlet.brand} · {order.outlet.district}</small></td>
                      <td>{order.effectiveDispatchDate}</td>
                      <td>{order.temperature}</td>
                      <td>{Number(order.estimatedWeightKg).toFixed(2)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="dp-detail">
            <h2>Allocation setup</h2>
            {selectedOrder ? (
              <>
                <div className="dp-card-head">
                  <div>
                    <h3>{selectedOrder.orderCode}</h3>
                    <p>{selectedOrder.outlet.outletCode} · {selectedOrder.outlet.deliveryWindow}</p>
                  </div>
                  <PlanningBadge tone="info">CONFIRMED</PlanningBadge>
                </div>

                <div className="dp-form-grid">
                  <div className="dp-form-field" style={{ gridColumn: "1 / -1" }}>
                    <label><UserRound size={12} /> Assigned driver</label>
                    <div className="dp-select-wrap">
                      <select className="dp-select" value={driverUserId} onChange={(event) => setDriverUserId(event.target.value)}>
                        <option value="">Unassigned driver</option>
                        {(workspace?.drivers || []).map((driver) => (
                          <option key={driver.userId} value={driver.userId}>{driver.fullName} ({driver.userId})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="dp-form-field" style={{ gridColumn: "1 / -1" }}>
                    <label><Truck size={12} /> Vehicle</label>
                    {(workspace?.vehicles || []).length > 0 ? (
                      <div className="dp-select-wrap">
                        <select className="dp-select" value={vehicleCode} onChange={(event) => handleVehicleChange(event.target.value)}>
                          {(workspace?.vehicles || []).map((vehicle) => (
                            <option key={vehicle.vehicleCode} value={vehicle.vehicleCode}>{vehicle.vehicleCode} · {vehicle.vehicleType}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="dp-input-wrap">
                        <input className="dp-input" value={vehicleCode} onChange={(event) => setVehicleCode(event.target.value)} placeholder="Enter known vehicle code" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="dp-detail-grid" style={{ marginTop: 15 }}>
                  <div className="dp-detail-row"><span>Depot</span><strong>{selectedOrder.outlet.depot?.name || "—"}</strong></div>
                  <div className="dp-detail-row"><span>Destination</span><strong>{selectedOrder.outlet.outletCode}</strong></div>
                  <div className="dp-detail-row"><span>Delivery window</span><strong>{selectedOrder.outlet.deliveryWindow}</strong></div>
                  <div className="dp-detail-row"><span>Access</span><strong>{selectedOrder.outlet.restriction}</strong></div>
                </div>

                {(workspace?.drivers || []).length === 0 ? (
                  <PlanningNotice tone="warning">No active Driver account is assigned to this depot. The trip can still be drafted as unassigned, but Driver execution will require an assignment later.</PlanningNotice>
                ) : null}

                <div className="dp-card-actions">
                  <button type="button" className="dp-button dp-button-secondary" onClick={() => navigate("/dispatcher/planning")}>
                    Back
                  </button>
                  <button type="button" className="dp-button dp-button-primary" disabled={saving || !vehicleCode.trim()} onClick={handleAllocate}>
                    <Route size={14} />
                    {saving ? "Creating draft…" : "Create draft allocation"}
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      )}
    </DispatcherPlanningShell>
  );
}

export default DeliveryPlanner;
