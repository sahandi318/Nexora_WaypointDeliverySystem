import {
  CheckCircle2,
  ClipboardCheck,
  Radio,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DispatcherPlanningShell, {
  PlanningBadge,
  PlanningEmpty,
  PlanningNotice,
  planningStatusTone,
} from "../../../components/dispatcher/planning/DispatcherPlanningShell";
import useDispatcherPlanningWorkspace from "../../../hooks/useDispatcherPlanningWorkspace";
import {
  publishDispatcherPlanningTrip,
} from "../../../services/dispatcherService";

function ReviewPublish() {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [publishingTripCode, setPublishingTripCode] = useState(null);
  const [notice, setNotice] = useState(null);

  const { workspace, loading, error, refresh } = useDispatcherPlanningWorkspace({ date });
  const trips = workspace?.trips || [];

  async function handlePublish(tripCode) {
    setPublishingTripCode(tripCode);
    setNotice(null);

    try {
      const result = await publishDispatcherPlanningTrip(tripCode);
      await refresh();
      setNotice({
        tone: "success",
        message: `${result.tripCode} published. Relevant Store Managers can now see the scheduled delivery and live-tracking workspace.`,
      });
    } catch (requestError) {
      setNotice({
        tone: "danger",
        message:
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to publish the trip.",
      });
    } finally {
      setPublishingTripCode(null);
    }
  }

  return (
    <DispatcherPlanningShell
      activePath="/dispatcher/planning/review"
      title="Review & Publish"
      subtitle="Validate persisted draft allocations and publish them into the shared Store Manager delivery workflow."
      workspace={workspace}
      loading={loading}
      error={error}
      date={date}
      onDateChange={setDate}
      onRetry={refresh}
    >
      {notice ? <PlanningNotice tone={notice.tone}>{notice.message}</PlanningNotice> : null}

      {trips.length === 0 ? (
        <section className="dp-panel">
          <PlanningEmpty
            icon={ClipboardCheck}
            title="No planning trips yet"
            message="Allocate a confirmed order in Delivery Planner first. The resulting persisted trip will appear here for publication."
          />
        </section>
      ) : (
        <div className="dp-card-grid">
          {trips.map((trip) => (
            <article key={trip.tripCode} className="dp-card">
              <div className="dp-card-head">
                <div>
                  <h3>{trip.tripCode}</h3>
                  <p>{trip.deliveryDate} · {trip.vehicleCode} · {trip.driverName}</p>
                </div>
                <PlanningBadge tone={trip.isPublished ? "success" : planningStatusTone(trip.status)}>
                  {trip.isPublished ? "PUBLISHED" : "DRAFT"}
                </PlanningBadge>
              </div>

              <div className="dp-card-meta">
                <div className="dp-meta"><span>Vehicle</span><strong>{trip.vehicleCode}</strong></div>
                <div className="dp-meta"><span>Driver</span><strong>{trip.driverName}</strong></div>
                <div className="dp-meta"><span>Orders</span><strong>{trip.allocations.length}</strong></div>
                <div className="dp-meta"><span>Next destination</span><strong>{trip.nextDestination || "—"}</strong></div>
              </div>

              <div style={{ marginTop: 14 }}>
                {trip.allocations.map((allocation) => (
                  <div key={allocation.id} className="dp-detail-row">
                    <span>{allocation.orderCode} · {allocation.outletCode}</span>
                    <PlanningBadge tone={allocation.status === "PUBLISHED" ? "success" : "info"}>{allocation.status}</PlanningBadge>
                  </div>
                ))}
              </div>

              <div className="dp-card-actions">
                {trip.isPublished ? (
                  <button type="button" className="dp-button dp-button-secondary" onClick={() => navigate("/dispatcher/live-monitoring")}>
                    <Radio size={14} /> Live monitoring
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dp-button dp-button-primary"
                    disabled={!trip.canPublish || publishingTripCode === trip.tripCode}
                    onClick={() => handlePublish(trip.tripCode)}
                  >
                    {publishingTripCode === trip.tripCode ? <CheckCircle2 size={14} /> : <Send size={14} />}
                    {publishingTripCode === trip.tripCode ? "Publishing…" : "Publish plan"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </DispatcherPlanningShell>
  );
}

export default ReviewPublish;
