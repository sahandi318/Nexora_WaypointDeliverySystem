import {
  CheckCircle2,
  ClipboardList,
  Search,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DispatcherPlanningShell, {
  PlanningBadge,
  PlanningEmpty,
  PlanningNotice,
  planningStatusTone,
} from "../../../components/dispatcher/planning/DispatcherPlanningShell";
import useDispatcherPlanningWorkspace from "../../../hooks/useDispatcherPlanningWorkspace";
import {
  confirmDispatcherStoreOrder,
} from "../../../services/dispatcherService";

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)} kg`;
}

function formatM3(value) {
  return `${Number(value || 0).toFixed(3)} m³`;
}

function ConfirmedOrders() {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [actionOrderCode, setActionOrderCode] = useState(null);
  const [notice, setNotice] = useState(null);

  const {
    workspace,
    loading,
    error,
    refresh,
  } = useDispatcherPlanningWorkspace({ date });

  const orders = useMemo(() => {
    const source = [
      ...(workspace?.orders?.submitted || []),
      ...(workspace?.orders?.confirmed || []),
    ];

    const term = search.trim().toLowerCase();

    return source.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchesSearch =
        !term ||
        order.orderCode.toLowerCase().includes(term) ||
        order.outlet.outletCode.toLowerCase().includes(term) ||
        order.outlet.brand.toLowerCase().includes(term) ||
        order.outlet.district.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [workspace, search, statusFilter]);

  const selectedOrder = useMemo(() => {
    const all = [
      ...(workspace?.orders?.submitted || []),
      ...(workspace?.orders?.confirmed || []),
    ];
    return all.find((order) => order.orderCode === selectedOrderCode) || all[0] || null;
  }, [workspace, selectedOrderCode]);

  async function handleConfirm(orderCode) {
    setActionOrderCode(orderCode);
    setNotice(null);

    try {
      await confirmDispatcherStoreOrder(orderCode);
      await refresh();
      setSelectedOrderCode(orderCode);
      setNotice({
        tone: "success",
        message: `${orderCode} confirmed and is ready for allocation.`,
      });
    } catch (requestError) {
      setNotice({
        tone: "danger",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to confirm the order.",
      });
    } finally {
      setActionOrderCode(null);
    }
  }

  return (
    <DispatcherPlanningShell
      activePath="/dispatcher/planning"
      title="Delivery Planning"
      subtitle="Review Store Manager orders, confirm valid requests, and move confirmed orders into real trip allocation."
      workspace={workspace}
      loading={loading}
      error={error}
      date={date}
      onDateChange={setDate}
      onRetry={refresh}
    >
      {notice ? (
        <PlanningNotice tone={notice.tone}>{notice.message}</PlanningNotice>
      ) : null}

      <div className="dp-split">
        <section className="dp-panel">
          <div className="dp-panel-header">
            <div>
              <h2>Store Manager order queue</h2>
              <p>Submitted orders need a Dispatcher decision before they can be allocated.</p>
            </div>
            <PlanningBadge tone="info">
              {(workspace?.summary?.submittedOrders || 0) + (workspace?.summary?.confirmedOrders || 0)} active
            </PlanningBadge>
          </div>

          <div className="dp-toolbar">
            <label className="dp-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, outlet, brand or district"
              />
            </label>

            <div className="dp-select-wrap">
              <select
                className="dp-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All active statuses</option>
                <option value="SUBMITTED">Awaiting decision</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>
          </div>

          {orders.length === 0 ? (
            <PlanningEmpty
              icon={ClipboardList}
              title="No active orders found"
              message="Create a Store Manager order or clear the current filters. Orders are read directly from MySQL."
            />
          ) : (
            <div className="dp-table-wrap">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Outlet</th>
                    <th>Delivery date</th>
                    <th>Load</th>
                    <th>Handling</th>
                    <th>Planning</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.orderCode}
                      className={selectedOrder?.orderCode === order.orderCode ? "selected" : ""}
                      onClick={() => setSelectedOrderCode(order.orderCode)}
                    >
                      <td>
                        <strong>{order.orderCode}</strong>
                        <small>{order.totalUnits} units</small>
                      </td>
                      <td>
                        <strong>{order.outlet.outletCode}</strong>
                        <small>{order.outlet.brand} · {order.outlet.district}</small>
                      </td>
                      <td>{order.effectiveDispatchDate}</td>
                      <td>
                        <strong>{formatKg(order.estimatedWeightKg)}</strong>
                        <small>{formatM3(order.estimatedVolumeM3)}</small>
                      </td>
                      <td>{order.temperature}</td>
                      <td>
                        <PlanningBadge tone={planningStatusTone(order.allocation?.status || order.status)}>
                          {order.allocation?.status || order.status.replaceAll("_", " ")}
                        </PlanningBadge>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {order.status === "SUBMITTED" ? (
                          <button
                            type="button"
                            className="dp-button dp-button-primary"
                            disabled={actionOrderCode === order.orderCode}
                            onClick={() => handleConfirm(order.orderCode)}
                          >
                            <CheckCircle2 size={14} />
                            {actionOrderCode === order.orderCode ? "Confirming…" : "Confirm"}
                          </button>
                        ) : order.allocation ? (
                          <button
                            type="button"
                            className="dp-button dp-button-secondary"
                            onClick={() => navigate("/dispatcher/planning/review")}
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dp-button dp-button-primary"
                            onClick={() => navigate(`/dispatcher/planning/planner?order=${encodeURIComponent(order.orderCode)}`)}
                          >
                            <Send size={14} />
                            Allocate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="dp-detail">
          <h2>Order details</h2>
          {!selectedOrder ? (
            <PlanningEmpty
              title="Select an order"
              message="Choose an order from the queue to review its trusted outlet requirements."
            />
          ) : (
            <>
              <div className="dp-card-head" style={{ marginBottom: 14 }}>
                <div>
                  <h3>{selectedOrder.orderCode}</h3>
                  <p>{selectedOrder.outlet.brand} · {selectedOrder.outlet.outletCode}</p>
                </div>
                <PlanningBadge tone={planningStatusTone(selectedOrder.status)}>
                  {selectedOrder.status.replaceAll("_", " ")}
                </PlanningBadge>
              </div>

              <div className="dp-detail-grid">
                <div className="dp-detail-row"><span>Depot</span><strong>{selectedOrder.outlet.depot?.name || "—"}</strong></div>
                <div className="dp-detail-row"><span>District</span><strong>{selectedOrder.outlet.district}</strong></div>
                <div className="dp-detail-row"><span>Delivery window</span><strong>{selectedOrder.outlet.deliveryWindow}</strong></div>
                <div className="dp-detail-row"><span>Handling</span><strong>{selectedOrder.temperature}</strong></div>
                <div className="dp-detail-row"><span>Weight</span><strong>{formatKg(selectedOrder.estimatedWeightKg)}</strong></div>
                <div className="dp-detail-row"><span>Volume</span><strong>{formatM3(selectedOrder.estimatedVolumeM3)}</strong></div>
                <div className="dp-detail-row"><span>Access</span><strong>{selectedOrder.outlet.restriction}</strong></div>
                <div className="dp-detail-row"><span>Allocation</span><strong>{selectedOrder.allocation?.tripCode || "Not allocated"}</strong></div>
              </div>
            </>
          )}
        </aside>
      </div>
    </DispatcherPlanningShell>
  );
}

export default ConfirmedOrders;
