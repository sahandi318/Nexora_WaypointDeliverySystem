import React from "react";
import { useNavigate } from "react-router-dom";

const MetricCard = ({
  title,
  value,
  unit,
  change,
  icon,
  iconStyle,
}) => {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${iconStyle}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[9px] text-[var(--color-text-secondary)]">{title}</p>

          <div className="flex items-end gap-1">
            <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
            <span className="mb-1 text-[8px] text-[var(--color-text-muted)]">{unit}</span>
          </div>

          {change && (
            <p className="mt-1 text-[8px] text-[var(--color-success)]">{change}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const forecastData = [
  {
    week: "Week 1",
    date: "5 - 11 Oct",
    fresh: 480,
    style: 210,
    tech: 95,
    total: 785,
    chilled: 260,
    trips: 11,
    status: "Sufficient",
  },
  {
    week: "Week 2",
    date: "12 - 18 Oct",
    fresh: 520,
    style: 230,
    tech: 110,
    total: 860,
    chilled: 290,
    trips: 12,
    status: "Sufficient",
  },
  {
    week: "Week 3",
    date: "19 - 25 Oct",
    fresh: 560,
    style: 300,
    tech: 150,
    total: 1010,
    chilled: 360,
    trips: 14,
    status: "Shortfall",
  },
  {
    week: "Week 4",
    date: "26 Oct - 1 Nov",
    fresh: 490,
    style: 260,
    tech: 125,
    total: 875,
    chilled: 310,
    trips: 13,
    status: "Sufficient",
  },
];

const FutureCapacityPlanning = () => {
  const navigate = useNavigate();
  const maxDemand = 600;

  // Temporary frontend capacity value. Replace with backend data later.
  const availableRefrigeratedCapacity = 200;

  // Find the forecast week with the largest refrigerated-capacity shortfall.
  // If no week exceeds capacity, no capacity alert is shown.
  const refrigeratedShortfalls = forecastData
    .map((item) => ({
      ...item,
      shortfall: item.chilled - availableRefrigeratedCapacity,
    }))
    .filter((item) => item.shortfall > 0);

  const criticalCapacityAlert =
    refrigeratedShortfalls.length > 0
      ? refrigeratedShortfalls.reduce((largest, item) =>
          item.shortfall > largest.shortfall ? item : largest
        )
      : null;

  const handlePlanAllocation = () => {
    navigate("/dispatcher/planning", {
      state: criticalCapacityAlert
        ? {
            source: "future-capacity",
            week: criticalCapacityAlert.week,
            dateRange: criticalCapacityAlert.date,
            shortfall: criticalCapacityAlert.shortfall,
            capacityType: "refrigerated",
            depot: "Kandy",
          }
        : undefined,
    });
  };

  return (
    <div>
      

      {/* Capacity summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Predicted Total Demand"
          value="968"
          unit="orders"
          change="↑ 12% vs. previous week"
          icon="◇"
          iconStyle="bg-[var(--color-success-soft)] text-emerald-500"
        />

        <MetricCard
          title="Predicted Chilled Demand"
          value="316"
          unit="orders"
          change="↑ 28% vs. previous week"
          icon="❄"
          iconStyle="bg-blue-50 text-blue-500"
        />

        <MetricCard
          title="Available Vehicles"
          value="16"
          unit="vehicles (Kandy Depot)"
          icon="▣"
          iconStyle="bg-purple-50 text-purple-500"
        />

        <MetricCard
          title="Refrigerated Vehicles"
          value="4"
          unit="vehicles (Kandy Depot)"
          icon="♨"
          iconStyle="bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        />
      </div>

      {/* Forecast chart and capacity comparison */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_290px]">
        {/* Demand chart */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-[var(--color-text)]">
              Predicted Demand by Brand (Kandy Depot)
            </h2>

            <div className="flex gap-3 text-[8px] text-[var(--color-text-secondary)]">
              <span>🟢 Fresh</span>
              <span>🟣 Style</span>
              <span>🟠 Tech</span>
            </div>
          </div>

          <div className="flex h-[190px] items-end justify-around gap-5 border-b border-[var(--color-border)] px-5 pb-4">
            {forecastData.map((item) => (
              <div
                key={item.week}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <div className="flex items-end justify-center gap-2">
                  {/* Fresh */}
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-[7px] font-semibold">
                      {item.fresh}
                    </span>

                    <div
                      className="w-4 rounded-t bg-[var(--color-success)]"
                      style={{
                        height: `${(item.fresh / maxDemand) * 130}px`,
                      }}
                    />
                  </div>

                  {/* Style */}
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-[7px] font-semibold">
                      {item.style}
                    </span>

                    <div
                      className="w-4 rounded-t bg-purple-500"
                      style={{
                        height: `${(item.style / maxDemand) * 130}px`,
                      }}
                    />
                  </div>

                  {/* Tech */}
                  <div className="flex flex-col items-center">
                    <span className="mb-1 text-[7px] font-semibold">
                      {item.tech}
                    </span>

                    <div
                      className="w-4 rounded-t bg-[var(--color-warning)]"
                      style={{
                        height: `${(item.tech / maxDemand) * 130}px`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-2 text-center text-[8px] font-semibold">
                  {item.week}
                </p>

                <p className="text-center text-[7px] text-[var(--color-text-muted)]">
                  {item.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity panel */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-[11px] font-semibold text-[var(--color-text)]">
            Demand vs Available Capacity (Week 3)
          </h2>

          <div className="mt-5 space-y-5">
            <CapacityBar
              label="Total Demand (orders)"
              value="1,010"
              percentage={90}
              status=""
              color="bg-[var(--color-success)]"
            />

            <CapacityBar
              label="Available Vehicle Capacity"
              value="1,120"
              percentage={100}
              status="Sufficient"
              color="bg-[var(--color-success)]"
              statusColor="text-[var(--color-success)]"
            />

            <CapacityBar
              label="Chilled Demand (orders)"
              value="360"
              percentage={90}
              color="bg-red-400"
            />

            <CapacityBar
              label="Available Refrigerated Capacity"
              value="200"
              percentage={50}
              status="Shortfall: 160"
              color="bg-[var(--color-danger)]"
              statusColor="text-[var(--color-danger)]"
            />
          </div>
        </div>
      </div>

      {/* Weekly summary and fleet availability */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_310px]">
        {/* Weekly forecast table */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-[11px] font-semibold text-[var(--color-text)]">
            Weekly Forecast Summary (Kandy Depot)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[8px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                  <th className="py-2">Week</th>
                  <th>Date Range</th>
                  <th>Fresh</th>
                  <th>Style</th>
                  <th>Tech</th>
                  <th>Total</th>
                  <th>Chilled Demand</th>
                  <th>Trips</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {forecastData.map((item) => (
                  <tr
                    key={item.week}
                    className={`border-b border-[var(--color-border)] ${
                      item.status === "Shortfall"
                        ? "bg-[var(--color-danger-soft)]"
                        : ""
                    }`}
                  >
                    <td className="py-2 font-semibold">{item.week}</td>
                    <td>{item.date}</td>
                    <td>{item.fresh}</td>
                    <td>{item.style}</td>
                    <td>{item.tech}</td>
                    <td className="font-semibold">{item.total}</td>
                    <td>{item.chilled}</td>
                    <td>{item.trips}</td>

                    <td
                      className={
                        item.status === "Shortfall"
                          ? "font-medium text-[var(--color-danger)]"
                          : "font-medium text-[var(--color-success)]"
                      }
                    >
                      {item.status === "Shortfall" ? "●" : "✓"}{" "}
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet availability */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold text-[var(--color-text)]">
              Fleet Availability (Kandy Depot)
            </h2>

            <button className="text-[8px] font-medium text-blue-500">
              View All
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <FleetRow
              icon="🚚"
              label="Total Vehicles"
              value="16 / 20"
              percentage="80%"
              barWidth="80%"
              barColor="bg-[var(--color-success)]"
            />

            <FleetRow
              icon="❄"
              label="Refrigerated Vehicles"
              value="4 / 8"
              percentage="50%"
              barWidth="50%"
              barColor="bg-[var(--color-warning)]"
            />

            <FleetRow
              icon="👤"
              label="Drivers"
              value="15 / 18"
              percentage="83%"
              barWidth="83%"
              barColor="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Capacity warning */}
      {criticalCapacityAlert && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[var(--color-danger)]">
              ⚠ Capacity Alert
            </p>

            <p className="mt-1 text-[9px] text-[var(--color-danger)]">
              {criticalCapacityAlert.week} has a predicted refrigerated capacity
              shortfall of {criticalCapacityAlert.shortfall} orders. Consider
              reallocating vehicles or arranging additional refrigerated trucks.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlanAllocation}
            className="shrink-0 rounded-md border border-[var(--color-primary)] bg-[var(--color-surface)] px-5 py-2 text-[9px] font-medium text-[var(--color-success)]"
          >
            ✎ Plan Allocation
          </button>
        </div>
      )}
    </div>
  );
};

const CapacityBar = ({
  label,
  value,
  percentage,
  status,
  color,
  statusColor = "",
}) => {
  return (
    <div>
      <p className="text-[8px] text-[var(--color-text-secondary)]">{label}</p>

      <div className="mt-1 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="w-10 text-right text-[8px] font-semibold">
          {value}
        </span>
      </div>

      {status && (
        <p className={`mt-1 text-right text-[7px] ${statusColor}`}>
          {status}
        </p>
      )}
    </div>
  );
};

const FleetRow = ({
  icon,
  label,
  value,
  percentage,
  barWidth,
  barColor,
}) => {
  return (
    <div className="grid grid-cols-[28px_1fr_45px] items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-soft)]">
        {icon}
      </div>

      <div>
        <div className="flex justify-between text-[8px]">
          <span>{label}</span>
          <span className="font-semibold">{value}</span>
        </div>

        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-soft)]">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: barWidth }}
          />
        </div>
      </div>

      <span className="text-right text-[8px] text-[var(--color-text-secondary)]">
        {percentage}
      </span>
    </div>
  );
};

export default FutureCapacityPlanning;