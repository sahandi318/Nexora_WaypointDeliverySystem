import React, { useMemo, useState } from "react";

const trips = [
  {
    id: "TRP001",
    vehicle: "VEH001",
    driver: "Saman Liyanage",
    completionTime: "29 Sep 2026, 1:45 PM",
    stops: 12,
    status: "All Delivered",
    confirmation: "All Received",
  },
  {
    id: "TRP002",
    vehicle: "VEH003",
    driver: "Nuwan Perera",
    completionTime: "29 Sep 2026, 12:30 PM",
    stops: 10,
    status: "All Delivered",
    confirmation: "All Received",
  },
  {
    id: "TRP003",
    vehicle: "VEH006",
    driver: "Kasun Fernando",
    completionTime: "29 Sep 2026, 11:20 AM",
    stops: 9,
    status: "Partially Delivered",
    confirmation: "Partial (7/9)",
  },
  {
    id: "TRP004",
    vehicle: "VEH009",
    driver: "Dimal Jayasenka",
    completionTime: "29 Sep 2026, 10:05 AM",
    stops: 11,
    status: "All Delivered",
    confirmation: "All Received",
  },
  {
    id: "TRP005",
    vehicle: "VEH010",
    driver: "Tharindu Silva",
    completionTime: "29 Sep 2026, 9:50 AM",
    stops: 8,
    status: "Issue to Review",
    confirmation: "Partial (6/8)",
  },
  {
    id: "TRP006",
    vehicle: "VEH011",
    driver: "Chamika Rathnayake",
    completionTime: "28 Sep 2026, 5:15 PM",
    stops: 12,
    status: "All Delivered",
    confirmation: "All Received",
  },
  {
    id: "TRP007",
    vehicle: "VEH012",
    driver: "Indika Weerasinghe",
    completionTime: "28 Sep 2026, 3:40 PM",
    stops: 7,
    status: "Receipt Pending",
    confirmation: "Pending (0/7)",
  },
  {
    id: "TRP008",
    vehicle: "VEH013",
    driver: "Lahiru Bandara",
    completionTime: "28 Sep 2026, 2:10 PM",
    stops: 10,
    status: "All Delivered",
    confirmation: "All Received",
  },
  {
    id: "TRP009",
    vehicle: "VEH014",
    driver: "Chathura Wijesinghe",
    completionTime: "28 Sep 2026, 12:55 PM",
    stops: 8,
    status: "Partially Delivered",
    confirmation: "Partial (5/8)",
  },
  {
    id: "TRP010",
    vehicle: "VEH015",
    driver: "Akila Mendis",
    completionTime: "28 Sep 2026, 11:30 AM",
    stops: 9,
    status: "All Delivered",
    confirmation: "All Received",
  },
];

const stops = [
  {
    no: 1,
    outlet: "Kandy Fresh A",
    planned: 10,
    actual: 10,
    result: "Delivered",
  },
  {
    no: 2,
    outlet: "Peradeniya Fresh B",
    planned: 8,
    actual: 8,
    result: "Delivered",
  },
  {
    no: 3,
    outlet: "Gampola Fresh",
    planned: 12,
    actual: 12,
    result: "Delivered",
  },
  {
    no: 4,
    outlet: "Katugastota Fresh",
    planned: 10,
    actual: 10,
    result: "Delivered",
  },
  {
    no: 5,
    outlet: "Mawanella Foods",
    planned: 8,
    actual: 8,
    result: "Delivered",
  },
  {
    no: 6,
    outlet: "Kadugannawa Super",
    planned: 10,
    actual: 10,
    result: "Delivered",
  },
];

const DeliveryReports = () => {
  const [selectedTrip, setSelectedTrip] = useState(trips[0]);
  const [search, setSearch] = useState("");

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return trips;

    return trips.filter(
      (trip) =>
        trip.id.toLowerCase().includes(query) ||
        trip.vehicle.toLowerCase().includes(query) ||
        trip.driver.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="space-y-4">
      

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Completed Trips"
          value="18"
          change="↑ 12% vs previous period"
          type="green"
          icon="✓"
        />

        <SummaryCard
          title="Delivered Orders"
          value="286"
          change="↑ 8% vs previous period"
          type="green"
          icon="◇"
        />

        <SummaryCard
          title="Partial / Failed Deliveries"
          value="17"
          change="↓ 15% vs previous period"
          type="amber"
          icon="△"
        />

        <SummaryCard
          title="Unresolved Issues"
          value="5"
          change="↑ 25% vs previous period"
          type="red"
          icon="!"
        />
      </div>

      {/* Main reports section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        {/* Trips table */}
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[12px] font-semibold text-[var(--color-text)]">
                Completed Trips
              </h2>

              <span className="text-[9px] text-[var(--color-text-muted)]">(10)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-7 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-2">
                <span className="mr-2 text-[9px] text-[var(--color-text-muted)]">⌕</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trips, vehicle or driver..."
                  className="w-[165px] bg-transparent text-[9px] text-[var(--color-text-secondary)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <select className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[9px] text-[var(--color-text-secondary)] outline-none">
                <option>All Statuses</option>
              </select>

              <select className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[9px] text-[var(--color-text-secondary)] outline-none">
                <option>All Vehicles</option>
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
                  <th className="px-2 py-2">Completion Time</th>
                  <th className="px-2 py-2 text-center">Stops</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Confirmation</th>
                </tr>
              </thead>

              <tbody>
                {filteredTrips.map((trip) => {
                  const selected = selectedTrip.id === trip.id;

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`cursor-pointer border-b border-[var(--color-border)] ${
                        selected
                          ? "bg-[var(--color-primary-soft)]"
                          : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)]"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="accent-[var(--color-primary)]"
                        />
                      </td>

                      <td className="px-2 py-2 font-semibold text-[var(--color-success)]">
                        {trip.id}
                      </td>

                      <td className="px-2 py-2 text-[var(--color-text)]">
                        {trip.vehicle}
                      </td>

                      <td className="px-2 py-2 text-[var(--color-text)]">
                        {trip.driver}
                      </td>

                      <td className="px-2 py-2 text-[var(--color-text-secondary)]">
                        {trip.completionTime}
                      </td>

                      <td className="px-2 py-2 text-center text-[var(--color-text)]">
                        {trip.stops}
                      </td>

                      <td className="px-2 py-2">
                        <StatusBadge status={trip.status} />
                      </td>

                      <td
                        className={`px-2 py-2 ${
                          trip.confirmation.startsWith("All")
                            ? "text-[var(--color-success)]"
                            : trip.confirmation.startsWith("Pending")
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--color-warning)]"
                        }`}
                      >
                        {trip.confirmation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[8px] text-[var(--color-text-muted)]">
            <span>Showing 10 of 18 completed trips</span>

            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border border-[var(--color-border)]">
                ‹
              </button>

              <button className="h-6 w-6 rounded bg-[var(--color-success-soft)]0 text-white">
                1
              </button>

              <button className="h-6 w-6 rounded border border-[var(--color-border)]">
                2
              </button>

              <button className="h-6 w-6 rounded border border-[var(--color-border)]">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Trip details card */}
        <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold text-[var(--color-text)]">
                {selectedTrip.id} - {selectedTrip.vehicle}
              </h2>

              <span className="rounded bg-[var(--color-success-soft)] px-2 py-1 text-[7px] font-semibold text-[var(--color-success)]">
                COMPLETED
              </span>
            </div>

            <button className="text-[var(--color-text-secondary)]">×</button>
          </div>

          <div className="mt-3">
            <h3 className="text-[10px] font-semibold text-[var(--color-text)]">
              Trip Summary
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <Info label="VEHICLE TYPE" value="Refrigerated Truck" />
              <Info label="DEPOT" value="Kandy" />
              <Info label="DRIVER" value={selectedTrip.driver} />
              <Info
                label="ACTUAL DEPARTURE"
                value="29 Sep 2026, 8:15 AM"
              />
              <Info
                label="ACTUAL COMPLETION"
                value="29 Sep 2026, 1:45 PM"
              />
              <Info label="TOTAL STOPS" value="12" />
            </div>
          </div>

          <div className="mt-4 rounded-md bg-[var(--color-success-soft)] px-3 py-2 text-[8px] font-semibold text-[var(--color-success)]">
            ✓ Overall Result: All Delivered
          </div>

          {/* Stop outcomes */}
          <div className="mt-4">
            <h3 className="mb-2 text-[10px] font-semibold text-[var(--color-text)]">
              Stop Outcomes (12)
            </h3>

            <div className="overflow-hidden rounded border border-[var(--color-border)]">
              <div className="grid grid-cols-[24px_minmax(0,1fr)_36px_36px_58px] bg-[var(--color-surface-soft)] px-2 py-1 text-[7px] text-[var(--color-text-muted)]">
                <span>#</span>
                <span>Outlet</span>
                <span>Plan</span>
                <span>Actual</span>
                <span>Result</span>
              </div>

              {stops.map((stop) => (
                <div
                  key={stop.no}
                  className="grid grid-cols-[24px_minmax(0,1fr)_36px_36px_58px] items-center border-t border-[var(--color-border)] px-2 py-1.5 text-[8px]"
                >
                  <span className="text-[var(--color-text-secondary)]">{stop.no}</span>

                  <span className="truncate text-[var(--color-text)]">
                    {stop.outlet}
                  </span>

                  <span className="text-[var(--color-text-secondary)]">{stop.planned}</span>

                  <span className="text-[var(--color-text-secondary)]">{stop.actual}</span>

                  <span className="text-[var(--color-success)]">
                    ● {stop.result}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[8px] text-[var(--color-text-muted)]">
                Showing 6 of 12 stops
              </span>

              <button className="text-[8px] font-semibold text-[var(--color-success)]">
                View All Stops &gt;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Latest Store Manager response */}
      <div>
        <h3 className="mb-2 text-[9px] font-semibold text-[var(--color-text)]">
          Latest Store Manager Response
        </h3>

        <div className="flex items-start justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-success-soft)]0 text-[9px] font-semibold text-white">
              PK
            </div>

            <div>
              <p className="text-[9px] font-semibold text-[var(--color-text)]">
                Peradeniya Fresh B
              </p>

              <p className="text-[7px] text-[var(--color-text-muted)]">
                Store Manager
              </p>

              <p className="mt-1 text-[8px] text-[var(--color-text-secondary)]">
                All items received in good condition. Thank you for the
                timely delivery.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-[var(--color-primary)] px-2 py-1 text-[7px] text-[var(--color-success)]">
            Receipt Confirmed
          </span>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, change, type, icon }) => {
  const styles = {
    green: {
      icon: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      text: "text-[var(--color-success)]",
    },
    amber: {
      icon: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      text: "text-[var(--color-warning)]",
    },
    red: {
      icon: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      text: "text-[var(--color-danger)]",
    },
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] ${styles[type].icon}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[8px] text-[var(--color-text-secondary)]">{title}</p>

          <p className="text-[20px] font-bold leading-none text-[var(--color-text)]">
            {value}
          </p>

          <p className={`mt-1 text-[7px] ${styles[type].text}`}>
            {change}
          </p>
        </div>

        <span className="ml-auto text-[var(--color-text-muted)]">›</span>
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
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[7px] font-medium ${
        styles[status] || "bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]"
      }`}
    >
      ● {status}
    </span>
  );
};

const Info = ({ label, value }) => {
  return (
    <div>
      <p className="text-[7px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-[8px] font-semibold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
};

export default DeliveryReports;