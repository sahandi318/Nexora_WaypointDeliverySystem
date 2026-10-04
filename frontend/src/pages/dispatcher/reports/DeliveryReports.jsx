import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

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
  {
    no: 7,
    outlet: "Pilimathalawa Fresh",
    planned: 9,
    actual: 9,
    result: "Delivered",
  },
  {
    no: 8,
    outlet: "Gelioya Fresh",
    planned: 7,
    actual: 7,
    result: "Delivered",
  },
  {
    no: 9,
    outlet: "Digana Fresh",
    planned: 11,
    actual: 11,
    result: "Delivered",
  },
  {
    no: 10,
    outlet: "Teldeniya Fresh",
    planned: 8,
    actual: 8,
    result: "Delivered",
  },
  {
    no: 11,
    outlet: "Akurana Fresh",
    planned: 10,
    actual: 10,
    result: "Delivered",
  },
  {
    no: 12,
    outlet: "Wattegama Fresh",
    planned: 6,
    actual: 6,
    result: "Delivered",
  },
];

const DeliveryReports = () => {
  const {
    startDate,
    endDate,
    selectedDepot,
    selectedStatus,
  } = useOutletContext();

  const [selectedTrip, setSelectedTrip] = useState(trips[0]);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("All Vehicles");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllStops, setShowAllStops] = useState(false);
  const tripsPerPage = 5;

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesDate =
        (!startDate || !trip.completionDate || trip.completionDate >= startDate) &&
        (!endDate || !trip.completionDate || trip.completionDate <= endDate);

      const matchesDepot =
        !selectedDepot ||
        !trip.depot ||
        trip.depot === selectedDepot;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        trip.status === selectedStatus;

      const matchesVehicle =
        selectedVehicle === "All Vehicles" ||
        trip.vehicle === selectedVehicle;

      const matchesSearch =
        !query ||
        trip.id.toLowerCase().includes(query) ||
        trip.vehicle.toLowerCase().includes(query) ||
        trip.driver.toLowerCase().includes(query);

      return (
        matchesDate &&
        matchesDepot &&
        matchesStatus &&
        matchesVehicle &&
        matchesSearch
      );
    });
  }, [
    search,
    startDate,
    endDate,
    selectedDepot,
    selectedStatus,
    selectedVehicle,
  ]);

  const vehicleOptions = useMemo(
    () => [...new Set(trips.map((trip) => trip.vehicle))],
    []
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrips.length / tripsPerPage)
  );

  const startIndex = (currentPage - 1) * tripsPerPage;

  const paginatedTrips = filteredTrips.slice(
    startIndex,
    startIndex + tripsPerPage
  );

  // Return to the first page whenever a report filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    startDate,
    endDate,
    selectedDepot,
    selectedStatus,
    selectedVehicle,
  ]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const visibleStops = showAllStops ? stops : stops.slice(0, 6);

  useEffect(() => {
    setShowAllStops(false);
  }, [selectedTrip]);

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
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[12px] font-semibold text-slate-800">
                Completed Trips
              </h2>

              <span className="text-[9px] text-slate-400">(10)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2">
                <span className="mr-2 text-[9px] text-slate-400">⌕</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trips, vehicle or driver..."
                  className="w-[165px] bg-transparent text-[9px] text-slate-600 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={selectedVehicle}
                onChange={(event) => setSelectedVehicle(event.target.value)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[9px] text-slate-600 outline-none"
              >
                <option value="All Vehicles">All Vehicles</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>
                    {vehicle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto px-3">
            <table className="w-full min-w-[760px] text-left text-[9px]">
              <thead className="border-y border-slate-100 bg-slate-50 text-[8px] font-medium uppercase text-slate-400">
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
                {paginatedTrips.map((trip) => {
                  const selected = selectedTrip.id === trip.id;

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`cursor-pointer border-b border-slate-100 ${
                        selected
                          ? "bg-[#e8f7f1]"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="accent-emerald-600"
                        />
                      </td>

                      <td className="px-2 py-2 font-semibold text-emerald-700">
                        {trip.id}
                      </td>

                      <td className="px-2 py-2 text-slate-700">
                        {trip.vehicle}
                      </td>

                      <td className="px-2 py-2 text-slate-700">
                        {trip.driver}
                      </td>

                      <td className="px-2 py-2 text-slate-500">
                        {trip.completionTime}
                      </td>

                      <td className="px-2 py-2 text-center text-slate-700">
                        {trip.stops}
                      </td>

                      <td className="px-2 py-2">
                        <StatusBadge status={trip.status} />
                      </td>

                      <td
                        className={`px-2 py-2 ${
                          trip.confirmation.startsWith("All")
                            ? "text-emerald-600"
                            : trip.confirmation.startsWith("Pending")
                            ? "text-amber-500"
                            : "text-orange-500"
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

          <div className="flex items-center justify-between px-4 py-3 text-[8px] text-slate-400">
            <span>
              Showing {paginatedTrips.length} of {filteredTrips.length} completed trips
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-6 w-6 rounded border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isActivePage = currentPage === pageNumber;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-6 w-6 rounded border ${
                      isActivePage
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200"
                    }`}
                    aria-current={isActivePage ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-6 w-6 rounded border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Trip details card */}
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold text-slate-800">
                {selectedTrip.id} - {selectedTrip.vehicle}
              </h2>

              <span className="rounded bg-emerald-50 px-2 py-1 text-[7px] font-semibold text-emerald-600">
                COMPLETED
              </span>
            </div>

            <button className="text-slate-500">×</button>
          </div>

          <div className="mt-3">
            <h3 className="text-[10px] font-semibold text-slate-800">
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

          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-[8px] font-semibold text-emerald-700">
            ✓ Overall Result: All Delivered
          </div>

          {/* Stop outcomes */}
          <div className="mt-4">
            <h3 className="mb-2 text-[10px] font-semibold text-slate-800">
              Stop Outcomes (12)
            </h3>

            <div className="overflow-hidden rounded border border-slate-100">
              <div className="grid grid-cols-[24px_minmax(0,1fr)_36px_36px_58px] bg-slate-50 px-2 py-1 text-[7px] text-slate-400">
                <span>#</span>
                <span>Outlet</span>
                <span>Plan</span>
                <span>Actual</span>
                <span>Result</span>
              </div>

              {visibleStops.map((stop) => (
                <div
                  key={stop.no}
                  className="grid grid-cols-[24px_minmax(0,1fr)_36px_36px_58px] items-center border-t border-slate-100 px-2 py-1.5 text-[8px]"
                >
                  <span className="text-slate-500">{stop.no}</span>

                  <span className="truncate text-slate-700">
                    {stop.outlet}
                  </span>

                  <span className="text-slate-600">{stop.planned}</span>

                  <span className="text-slate-600">{stop.actual}</span>

                  <span className="text-emerald-600">
                    ● {stop.result}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[8px] text-slate-400">
                Showing {visibleStops.length} of {stops.length} stops
              </span>

              <button
                type="button"
                onClick={() => setShowAllStops((value) => !value)}
                className="text-[8px] font-semibold text-emerald-700"
              >
                {showAllStops ? "Show Less" : "View All Stops >"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Latest Store Manager response */}
      <div>
        <h3 className="mb-2 text-[9px] font-semibold text-slate-700">
          Latest Store Manager Response
        </h3>

        <div className="flex items-start justify-between rounded-md border border-emerald-100 bg-[#f1fbf7] px-4 py-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-semibold text-white">
              PK
            </div>

            <div>
              <p className="text-[9px] font-semibold text-slate-700">
                Peradeniya Fresh B
              </p>

              <p className="text-[7px] text-slate-400">
                Store Manager
              </p>

              <p className="mt-1 text-[8px] text-slate-500">
                All items received in good condition. Thank you for the
                timely delivery.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-emerald-400 px-2 py-1 text-[7px] text-emerald-700">
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
      icon: "bg-emerald-50 text-emerald-600",
      text: "text-emerald-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-500",
      text: "text-orange-500",
    },
    red: {
      icon: "bg-red-50 text-red-500",
      text: "text-red-500",
    },
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] ${styles[type].icon}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[8px] text-slate-500">{title}</p>

          <p className="text-[20px] font-bold leading-none text-slate-800">
            {value}
          </p>

          <p className={`mt-1 text-[7px] ${styles[type].text}`}>
            {change}
          </p>
        </div>

        <span className="ml-auto text-slate-400">›</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    "All Delivered": "bg-emerald-50 text-emerald-600",
    "Partially Delivered": "bg-amber-50 text-amber-600",
    "Issue to Review": "bg-red-50 text-red-500",
    "Receipt Pending": "bg-orange-50 text-orange-500",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[7px] font-medium ${
        styles[status] || "bg-slate-100 text-slate-500"
      }`}
    >
      ● {status}
    </span>
  );
};

const Info = ({ label, value }) => {
  return (
    <div>
      <p className="text-[7px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[8px] font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
};

export default DeliveryReports;