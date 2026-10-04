import {
  Truck,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import DispatcherPlanningShell, {
  PlanningBadge,
  PlanningEmpty,
  PlanningNotice,
} from "../../../components/dispatcher/planning/DispatcherPlanningShell";
import useDispatcherPlanningWorkspace from "../../../hooks/useDispatcherPlanningWorkspace";

function FleetAvailability() {
  const [date, setDate] = useState("");
  const { workspace, loading, error, refresh } = useDispatcherPlanningWorkspace({ date });
  const vehicles = workspace?.vehicles || [];
  const drivers = workspace?.drivers || [];

  return (
    <DispatcherPlanningShell
      activePath="/dispatcher/planning/fleet"
      title="Fleet Availability"
      subtitle="Use active depot Driver accounts and vehicle codes already observed in persisted live-monitoring trips."
      workspace={workspace}
      loading={loading}
      error={error}
      date={date}
      onDateChange={setDate}
      onRetry={refresh}
    >
      <PlanningNotice tone="info">
        Vehicle master data is not stored in the current Prisma schema. This page therefore shows real vehicle codes already observed in LiveTrip records instead of fabricating a fleet registry.
      </PlanningNotice>

      <div className="dp-card-grid">
        <section className="dp-panel">
          <div className="dp-panel-header">
            <div>
              <h2>Observed vehicles</h2>
              <p>Persisted vehicle identities from this Dispatcher depot.</p>
            </div>
            <PlanningBadge tone="info">{vehicles.length}</PlanningBadge>
          </div>

          {vehicles.length === 0 ? (
            <PlanningEmpty icon={Truck} title="No observed vehicles" message="A vehicle code can still be entered manually in Delivery Planner if it is known operationally." />
          ) : (
            <div className="dp-table-wrap">
              <table className="dp-table" style={{ minWidth: 520 }}>
                <thead><tr><th>Vehicle</th><th>Type</th><th>Temperature</th></tr></thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.vehicleCode}>
                      <td><strong>{vehicle.vehicleCode}</strong></td>
                      <td>{vehicle.vehicleType}</td>
                      <td>{vehicle.temperature || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dp-panel">
          <div className="dp-panel-header">
            <div>
              <h2>Active drivers</h2>
              <p>Driver accounts assigned to the authenticated depot.</p>
            </div>
            <PlanningBadge tone="success">{drivers.length}</PlanningBadge>
          </div>

          {drivers.length === 0 ? (
            <PlanningEmpty icon={UserRound} title="No active depot drivers" message="Create or assign a Driver account from Admin before operational execution." />
          ) : (
            <div className="dp-table-wrap">
              <table className="dp-table" style={{ minWidth: 520 }}>
                <thead><tr><th>User ID</th><th>Driver</th></tr></thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.userId}>
                      <td><strong>{driver.userId}</strong></td>
                      <td>{driver.fullName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DispatcherPlanningShell>
  );
}

export default FleetAvailability;
