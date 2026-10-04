import {
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useState } from "react";

import DispatcherPlanningShell, {
  PlanningBadge,
  PlanningEmpty,
  PlanningNotice,
} from "../../../components/dispatcher/planning/DispatcherPlanningShell";
import useDispatcherPlanningWorkspace from "../../../hooks/useDispatcherPlanningWorkspace";
import {
  confirmDispatcherStoreOrder,
} from "../../../services/dispatcherService";

function DeferredOrders() {
  const [date, setDate] = useState("");
  const [workingOrderCode, setWorkingOrderCode] = useState(null);
  const [notice, setNotice] = useState(null);
  const { workspace, loading, error, refresh } = useDispatcherPlanningWorkspace({ date });
  const orders = workspace?.orders?.deferred || [];

  async function handleConfirm(orderCode) {
    setWorkingOrderCode(orderCode);
    setNotice(null);

    try {
      await confirmDispatcherStoreOrder(orderCode);
      await refresh();
      setNotice({
        tone: "success",
        message: `${orderCode} returned to the confirmed planning queue.`,
      });
    } catch (requestError) {
      setNotice({
        tone: "danger",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to confirm the deferred order.",
      });
    } finally {
      setWorkingOrderCode(null);
    }
  }

  return (
    <DispatcherPlanningShell
      activePath="/dispatcher/planning/deferred"
      title="Deferred Orders"
      subtitle="Review Store Manager orders that were deferred with an operational reason and a later effective delivery date."
      workspace={workspace}
      loading={loading}
      error={error}
      date={date}
      onDateChange={setDate}
      onRetry={refresh}
    >
      {notice ? <PlanningNotice tone={notice.tone}>{notice.message}</PlanningNotice> : null}

      <section className="dp-panel">
        <div className="dp-panel-header">
          <div>
            <h2>Deferred order queue</h2>
            <p>Re-confirm an order when it is ready to return to planning.</p>
          </div>
          <PlanningBadge tone="warning">{orders.length}</PlanningBadge>
        </div>

        {orders.length === 0 ? (
          <PlanningEmpty icon={Clock3} title="No deferred orders" message="Deferred Store Manager orders will appear here with their reason and revised effective date." />
        ) : (
          <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr><th>Order</th><th>Outlet</th><th>New date</th><th>Reason</th><th>Handling</th><th>Action</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderCode}>
                    <td><strong>{order.orderCode}</strong><small>{order.totalUnits} units</small></td>
                    <td><strong>{order.outlet.outletCode}</strong><small>{order.outlet.brand} · {order.outlet.district}</small></td>
                    <td>{order.effectiveDispatchDate}</td>
                    <td>{order.deferredReason || "No reason recorded"}</td>
                    <td>{order.temperature}</td>
                    <td>
                      <button type="button" className="dp-button dp-button-primary" disabled={workingOrderCode === order.orderCode} onClick={() => handleConfirm(order.orderCode)}>
                        <CheckCircle2 size={14} />
                        {workingOrderCode === order.orderCode ? "Confirming…" : "Confirm for planning"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DispatcherPlanningShell>
  );
}

export default DeferredOrders;
