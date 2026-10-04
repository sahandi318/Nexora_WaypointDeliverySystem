import {
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Search,
  Snowflake,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import DispatcherLayout
  from "../../../components/dispatcher/DispatcherLayout";

import {
  getDispatcherPlanning,
} from "../../../services/dispatcherPlanningService";


function FleetAvailability() {
  const navigate =
    useNavigate();


  const [selectedDate, setSelectedDate] = useState(
    sessionStorage.getItem("dispatcherPlanningDate") ||
      new Date().toISOString().split("T")[0]
  );


  const [selectedDepot, setSelectedDepot] =
    useState(
      sessionStorage.getItem(
        "dispatcherPlanningDepot"
      ) || "ALL"
    );


  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  const [
    selectedVehicleType,
    setSelectedVehicleType,
  ] = useState("ALL");


  const [
    selectedTemperature,
    setSelectedTemperature,
  ] = useState("ALL");


  const [
    selectedAvailability,
    setSelectedAvailability,
  ] = useState("ALL");


  const [
    selectedCapacity,
    setSelectedCapacity,
  ] = useState("ALL");


  const [
    suitableOnly,
    setSuitableOnly,
  ] = useState(false);


  const [planningData, setPlanningData] = useState({
    fleet: [],
    summary: {},
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getDispatcherPlanning({
      date: selectedDate,
      depot: selectedDepot,
      signal: controller.signal,
    })
      .then((data) => {
        setPlanningData(data || { fleet: [], summary: {} });
        setSelectedVehicleId((current) =>
          current && data?.fleet?.some((vehicle) => vehicle.vehicleId === current)
            ? current
            : data?.fleet?.[0]?.vehicleId || null
        );
      })
      .catch((error) => {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("Unable to load fleet availability:", error);
        }
      });

    return () => controller.abort();
  }, [selectedDate, selectedDepot]);

  const vehicles = planningData.fleet || [];
  const summary = planningData.summary || {};
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ||
    vehicles[0] ||
    null;


  const filteredVehicles =
    useMemo(() => {
      return vehicles.filter(
        (vehicle) => {

          const matchesSearch =
            !searchTerm ||
            String(
              vehicle.vehicleId ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              ) ||
            String(
              vehicle.type ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              ) ||
            String(
              vehicle.depot ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              );


          const matchesDepot =
            selectedDepot ===
              "ALL" ||
            vehicle.depot ===
              selectedDepot;


          const matchesType =
            selectedVehicleType ===
              "ALL" ||
            vehicle.type ===
              selectedVehicleType;


          const matchesTemperature =
            selectedTemperature ===
              "ALL" ||
            vehicle.temperature ===
              selectedTemperature;


          const matchesAvailability =
            selectedAvailability ===
              "ALL" ||
            vehicle.availability ===
              selectedAvailability;


          const matchesCapacity =
            selectedCapacity ===
              "ALL" ||
            vehicle.capacityGroup ===
              selectedCapacity;


          const matchesSuitable =
            !suitableOnly ||
            vehicle.isSuitable === true;


          return (
            matchesSearch &&
            matchesDepot &&
            matchesType &&
            matchesTemperature &&
            matchesAvailability &&
            matchesCapacity &&
            matchesSuitable
          );
        }
      );
    }, [
      vehicles,
      searchTerm,
      selectedDepot,
      selectedVehicleType,
      selectedTemperature,
      selectedAvailability,
      selectedCapacity,
      suitableOnly,
    ]);


  const showValue = (
    value
  ) =>
    value === 0 ||
    value
      ? value
      : "—";


  return (
    <DispatcherLayout>

      <div className="fleet-page">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="fleet-page-header">

          <div>

            <h1>
              Delivery Planning
            </h1>

            <p>
              Select a suitable vehicle for
              the selected order before
              building the trip.
            </p>

          </div>


          <div className="fleet-header-actions">

            <div className="fleet-header-status">

              <span className="status-dot" />

              Changes saved

            </div>


            <div className="fleet-control">

              <CalendarDays
                size={16}
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedDate(value);

                  sessionStorage.setItem(
                    "dispatcherPlanningDate",
                    value
                  );
                }}
              />

            </div>


            <div className="fleet-control">

              <MapPin
                size={16}
              />

              <select
                value={selectedDepot}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedDepot(value);

                  sessionStorage.setItem(
                    "dispatcherPlanningDepot",
                    value
                  );
                }}
              >
                <option value="ALL">
                  All Depots
                </option>

                <option value="Peliyagoda">
                  Peliyagoda Depot
                </option>

                <option value="Kandy">
                  Kandy Depot
                </option>
              </select>

            </div>


            <div className="draft-plan-badge">

              <ClipboardList
                size={16}
              />

              Draft Plan

            </div>

          </div>

        </div>


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="fleet-summary-grid">

          <SummaryCard
            icon={
              ClipboardList
            }
            label="Confirmed Orders"
            value={showValue(
              summary.confirmedOrders
            )}
            tone="green"
          />


          <SummaryCard
            icon={Truck}
            label="Allocated Orders"
            value={showValue(
              summary.allocatedOrders
            )}
            tone="teal"
          />


          <SummaryCard
            icon={Clock3}
            label="Unallocated Orders"
            value={showValue(
              summary.unallocatedOrders
            )}
            tone="orange"
          />


          <SummaryCard
            icon={Box}
            label="Deferred Orders"
            value={showValue(
              summary.deferredOrders
            )}
            tone="red"
          />

        </div>


        {/* ==================================================
            PLANNING TABS
        ================================================== */}

        <div className="planning-tabs">

          <button
            type="button"
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning"
              )
            }
          >

            <ClipboardList
              size={16}
            />

            Confirmed Orders

          </button>


          <button
            type="button"
            className="planning-tab active"
          >

            <Truck
              size={16}
            />

            Fleet Availability

          </button>


          <button
            type="button"
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning/planner"
              )
            }
          >

            <MapPin
              size={16}
            />

            Delivery Planner

          </button>


          <button
            type="button"
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning/deferred"
              )
            }
          >

            <Clock3
              size={16}
            />

            Deferred Orders

          </button>


          <button
            type="button"
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning/review"
              )
            }
          >

            <ChevronRight
              size={16}
            />

            Review & Publish

          </button>

        </div>


        {/* ==================================================
            MAIN LAYOUT
        ================================================== */}

        <div className="fleet-layout">

          {/* LEFT - VEHICLE LIST */}

          <section className="fleet-panel">

            <div className="fleet-panel-heading">

              <div>

                <h2>
                  Fleet Availability
                  <span>
                    (
                    {
                      filteredVehicles.length
                    }
                    )
                  </span>
                </h2>

                <p>
                  Select an available vehicle
                  that meets the order
                  requirements.
                </p>

              </div>


              <label className="suitable-toggle">

                <span>
                  Show only suitable vehicles
                </span>

                <input
                  type="checkbox"
                  checked={
                    suitableOnly
                  }
                  onChange={(
                    event
                  ) =>
                    setSuitableOnly(
                      event.target.checked
                    )
                  }
                />

              </label>

            </div>


            {/* SEARCH */}

            <div className="fleet-search">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search by vehicle ID, type or depot..."
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>


            {/* FILTERS */}

            <div className="fleet-filter-grid">

              <FilterSelect
                label="Depot"
                value={
                  selectedDepot
                }
                onChange={
                  setSelectedDepot
                }
                options={[
                  [
                    "ALL",
                    "All Depots",
                  ],
                  [
                    "Peliyagoda",
                    "Peliyagoda",
                  ],
                  [
                    "Kandy",
                    "Kandy",
                  ],
                ]}
              />


              <FilterSelect
                label="Vehicle Type"
                value={
                  selectedVehicleType
                }
                onChange={
                  setSelectedVehicleType
                }
                options={[
                  [
                    "ALL",
                    "All Types",
                  ],
                  [
                    "Truck",
                    "Truck",
                  ],
                  [
                    "Van",
                    "Van",
                  ],
                ]}
              />


              <FilterSelect
                label="Temperature Capability"
                value={
                  selectedTemperature
                }
                onChange={
                  setSelectedTemperature
                }
                options={[
                  [
                    "ALL",
                    "All Temperatures",
                  ],
                  [
                    "Refrigerated",
                    "Refrigerated",
                  ],
                  [
                    "Ambient",
                    "Ambient",
                  ],
                ]}
              />


              <FilterSelect
                label="Availability"
                value={
                  selectedAvailability
                }
                onChange={
                  setSelectedAvailability
                }
                options={[
                  [
                    "ALL",
                    "All Availability",
                  ],
                  [
                    "Available",
                    "Available",
                  ],
                  [
                    "Assigned",
                    "Assigned",
                  ],
                  [
                    "In Workshop",
                    "In Workshop",
                  ],
                ]}
              />


              <FilterSelect
                label="Capacity"
                value={
                  selectedCapacity
                }
                onChange={
                  setSelectedCapacity
                }
                options={[
                  [
                    "ALL",
                    "All Capacities",
                  ],
                ]}
              />

            </div>


            {/* VEHICLE TABLE */}

            <div className="fleet-table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>

                    <th>
                      Vehicle ID
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Depot
                    </th>

                    <th>
                      Temperature
                    </th>

                    <th>
                      Capacity
                      <br />
                      (kg / m³)
                    </th>

                    <th>
                      Current Load
                    </th>

                    <th>
                      Trips Left
                    </th>

                    <th>
                      Availability
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredVehicles.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="9"
                        className="fleet-empty-state"
                      >
                        No fleet data
                        available.
                      </td>

                    </tr>

                  ) : (

                    filteredVehicles.map(
                      (vehicle) => (

                          <tr
                            key={vehicle.vehicleId}
                            onClick={() =>
                              setSelectedVehicleId(vehicle.vehicleId)
                            }
                            className={
                              selectedVehicleId === vehicle.vehicleId
                                ? "fleet-row selected"
                                : "fleet-row"
                            }
                          >

                          <td>
                            <strong>
                              {
                                vehicle.vehicleId
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              vehicle.type ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              vehicle.depot ||
                              "—"
                            }
                          </td>

                          <td>
                            <TemperatureBadge
                              value={
                                vehicle.temperature
                              }
                            />
                          </td>

                          <td>
                            <strong>
                              {
                                vehicle.maxWeight ||
                                "—"
                              }
                            </strong>

                            <span>
                              {
                                vehicle.maxVolume ||
                                "—"
                              }
                            </span>
                          </td>

                          <td>
                            {
                              vehicle.currentLoad ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              vehicle.tripsLeft ||
                              "—"
                            }
                          </td>

                          <td>
                            <AvailabilityBadge
                              value={
                                vehicle.availability
                              }
                            />
                          </td>

                          <td>

                            <button
                              type="button"
                              className="fleet-more-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedVehicleId(
                                  vehicle.vehicleId
                                );
                              }}
                              aria-label={`View ${vehicle.vehicleId}`}
                            >
                              •••
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>


            {/* FOOTER */}

            <div className="fleet-table-footer">

              <span>
                Showing {filteredVehicles.length} of{" "}
                {vehicles.length} vehicles
              </span>


              <div className="fleet-pagination">

                <button
                  type="button"
                  disabled
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="active"
                >
                  1
                </button>

                <button
                  type="button"
                  disabled
                >
                  ›
                </button>

              </div>

            </div>

          </section>


          {/* RIGHT - VEHICLE DETAILS */}

          <aside className="vehicle-details-panel">

            <div className="vehicle-details-header">

              <h2>
                Vehicle Details
              </h2>


              {selectedVehicle && (
                <AvailabilityBadge
                  value={
                    selectedVehicle
                      .availability
                  }
                />
              )}

            </div>


            {!selectedVehicle ? (

              <div className="vehicle-details-empty">

                <Truck
                  size={38}
                />

                <strong>
                  No vehicle selected
                </strong>

                <span>
                  Select a vehicle from the
                  fleet table to view its
                  details and supported
                  constraints.
                </span>

              </div>

            ) : (

              <>

                <div className="vehicle-title">

                  <h3>
                    {
                      selectedVehicle
                        .vehicleId
                    }
                  </h3>

                  <span>
                    {
                      selectedVehicle
                        .temperature
                    }{" "}
                    {
                      selectedVehicle
                        .type
                    }
                  </span>

                </div>


                <div className="vehicle-detail-list">

                  <DetailRow
                    label="Home depot"
                    value={
                      selectedVehicle
                        .depot
                    }
                  />


                  <DetailRow
                    label="Vehicle type"
                    value={
                      selectedVehicle
                        .type
                    }
                  />


                  <DetailRow
                    label="Temperature"
                    value={
                      selectedVehicle
                        .temperature
                    }
                  />


                  <DetailRow
                    label="Maximum weight"
                    value={
                      selectedVehicle
                        .maxWeight
                    }
                  />


                  <DetailRow
                    label="Maximum volume"
                    value={
                      selectedVehicle
                        .maxVolume
                    }
                  />


                  <DetailRow
                    label="Current load"
                    value={
                      selectedVehicle
                        .currentLoad
                    }
                  />


                  <DetailRow
                    label="Trips left today"
                    value={
                      selectedVehicle
                        .tripsLeft
                    }
                  />


                  <DetailRow
                    label="Weekly fuel quota"
                    value={
                      selectedVehicle
                        .weeklyFuelQuota
                    }
                  />

                </div>


                <div className="supported-constraints">

                  <h3>
                    Supported Constraints
                  </h3>


                  {Array.isArray(
                    selectedVehicle
                      .supportedConstraints
                  ) &&
                  selectedVehicle
                    .supportedConstraints
                    .length > 0 ? (

                    selectedVehicle
                      .supportedConstraints
                      .map(
                        (
                          constraint,
                          index
                        ) => (

                          <div
                            className="constraint-row"
                            key={
                              `${constraint}-${index}`
                            }
                          >

                            <CheckCircle2
                              size={15}
                            />

                            <span>
                              {
                                constraint
                              }
                            </span>

                          </div>

                        )
                      )

                  ) : (

                    <span className="constraints-empty">
                      No constraint data
                      available.
                    </span>

                  )}

                </div>


                <button
                  type="button"
                  className="select-vehicle-button"
                  onClick={() =>
                    navigate(
                      "/dispatcher/planning/planner"
                    )
                  }
                >

                  <Truck
                    size={17}
                  />

                  Select Vehicle & Continue

                  <ChevronRight
                    size={17}
                  />

                </button>

              </>

            )}

          </aside>

        </div>

      </div>


      <style>{`

        .fleet-page {
          width: 100%;
        }


        /* ===============================================
           HEADER
        =============================================== */

        .fleet-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom: 18px;
        }


        .fleet-page-header h1 {
          margin: 0;

          color: #173d33;

          font-size: 27px;
          font-weight: 700;
        }


        .fleet-page-header p {
          margin: 5px 0 0;

          color: #7b8984;

          font-size: 11px;
        }


        .fleet-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 8px;

          flex-wrap: wrap;
        }


        .fleet-header-status {
          display: flex;
          align-items: center;
          gap: 5px;

          color: #2d9a70;

          font-size: 10px;
          font-weight: 600;
        }


        .status-dot {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background: #33b981;
        }


        .fleet-control {
          min-height: 36px;

          display: flex;
          align-items: center;

          gap: 7px;

          padding: 0 11px;

          border: 1px solid #dae4df;
          border-radius: 7px;

          background: #ffffff;

          color: #50645c;
        }


        .fleet-control input,
        .fleet-control select {
          border: none;
          outline: none;

          background: transparent;

          color: #465c54;

          font-family: inherit;
          font-size: 10px;
        }


        .draft-plan-badge {
          min-height: 36px;

          display: flex;
          align-items: center;

          gap: 7px;

          padding: 0 13px;

          border: 1px solid #8ad4b6;
          border-radius: 7px;

          background: #dcf5e8;

          color: #247759;

          font-size: 10px;
          font-weight: 600;
        }


        /* ===============================================
           SUMMARY
        =============================================== */

        .fleet-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 13px;

          margin-bottom: 16px;
        }


        .fleet-summary-card {
          min-height: 82px;

          display: flex;
          align-items: center;

          gap: 13px;

          padding: 15px;

          border: 1px solid #e1e8e5;
          border-radius: 9px;

          background: #ffffff;
        }


        .fleet-summary-icon {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;
        }


        .fleet-summary-icon.green {
          background: #dcf4e6;
          color: #288760;
        }


        .fleet-summary-icon.teal {
          background: #dbf2eb;
          color: #328f77;
        }


        .fleet-summary-icon.orange {
          background: #fff1dd;
          color: #d89335;
        }


        .fleet-summary-icon.red {
          background: #fde5e5;
          color: #cf5c5c;
        }


        .fleet-summary-card span {
          display: block;

          color: #71817b;

          font-size: 10px;
        }


        .fleet-summary-card strong {
          display: block;

          margin-top: 4px;

          color: #183e33;

          font-size: 22px;
        }


        /* ===============================================
           PLANNING TABS
        =============================================== */

        .planning-tabs {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          margin-bottom: 16px;

          border: 1px solid #e0e7e3;

          background: #f0f5f2;
        }


        .planning-tab {
          min-height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          border: none;
          border-right: 1px solid #dfe7e3;

          background: transparent;

          color: #5a6964;

          cursor: pointer;

          font-family: inherit;
          font-size: 10px;
          font-weight: 600;
        }


        .planning-tab:last-child {
          border-right: none;
        }


        .planning-tab.active {
          background: #123f34;

          color: #ffffff;
        }


        /* ===============================================
           MAIN LAYOUT
        =============================================== */

        .fleet-layout {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            270px;

          gap: 15px;
        }


        .fleet-panel,
        .vehicle-details-panel {
          border: 1px solid #e0e7e3;
          border-radius: 9px;

          background: #ffffff;
        }


        .fleet-panel {
          padding: 15px;
        }


        /* ===============================================
           FLEET HEADING
        =============================================== */

        .fleet-panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 15px;

          margin-bottom: 12px;
        }


        .fleet-panel-heading h2 {
          margin: 0;

          color: #1b4036;

          font-size: 14px;
        }


        .fleet-panel-heading h2 span {
          margin-left: 4px;
        }


        .fleet-panel-heading p {
          margin: 4px 0 0;

          color: #7f8d88;

          font-size: 9px;
        }


        .suitable-toggle {
          display: flex;
          align-items: center;

          gap: 8px;

          color: #6f7f79;

          font-size: 9px;
        }


        /* ===============================================
           SEARCH
        =============================================== */

        .fleet-search {
          min-height: 38px;

          display: flex;
          align-items: center;

          gap: 8px;

          padding: 0 11px;

          margin-bottom: 12px;

          border-radius: 6px;

          background: #f5f7f6;

          color: #8d9995;
        }


        .fleet-search input {
          width: 100%;

          border: none;
          outline: none;

          background: transparent;

          font-family: inherit;
          font-size: 10px;
        }


        /* ===============================================
           FILTERS
        =============================================== */

        .fleet-filter-grid {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          gap: 8px;

          margin-bottom: 13px;
        }


        .filter-block {
          display: flex;
          flex-direction: column;

          gap: 5px;
        }


        .filter-block label {
          color: #6c7b76;

          font-size: 9px;
        }


        .filter-block select {
          height: 35px;

          padding: 0 9px;

          border: 1px solid #dde5e1;
          border-radius: 6px;

          background: #ffffff;

          color: #53645e;

          outline: none;

          font-family: inherit;
          font-size: 9px;
        }


        /* ===============================================
           TABLE
        =============================================== */

        .fleet-table-wrapper {
          overflow-x: auto;

          border: 1px solid #e6ece9;
          border-radius: 6px;
        }


        .fleet-table {
          width: 100%;

          border-collapse: collapse;
        }


        .fleet-table th {
          padding: 10px 7px;

          background: #f4f7f5;

          color: #667873;

          text-align: left;

          font-size: 8px;
          font-weight: 600;

          white-space: nowrap;
        }


        .fleet-table td {
          padding: 10px 7px;

          border-top: 1px solid #edf1ef;

          color: #4e615a;

          font-size: 8.5px;

          vertical-align: middle;
        }


        .fleet-table td strong,
        .fleet-table td span {
          display: block;
        }


        .fleet-table td span {
          margin-top: 2px;

          font-size: 7.5px;

          color: #8a9692;
        }

        .fleet-row {
          cursor: pointer;
        }

        .fleet-row:hover {
          background: #f5faf7;
        }

        .fleet-row.selected {
          background: #e8f7f0;
        }

        .fleet-row.selected td {
          border-top-color: #b9e4d1;
        }
 
        .fleet-empty-state {
          height: 240px;

          text-align: center;

          color: #899690 !important;
        }


        .temperature-badge,
        .availability-badge {
          display: inline-block !important;

          margin: 0 !important;

          padding: 4px 7px;

          border-radius: 5px;

          font-size: 7.5px !important;
          font-weight: 600;
        }


        .temperature-badge.refrigerated {
          background: #dff1fb;

          color: #377899;
        }


        .temperature-badge.ambient {
          background: #edf0ef;

          color: #60706a;
        }


        .availability-badge.available {
          background: #dcf4e6;

          color: #27805c;
        }


        .availability-badge.assigned {
          background: #fff0d8;

          color: #b47a2d;
        }


        .availability-badge.in-workshop {
          background: #fde6da;

          color: #bd6a3a;
        }


        .fleet-more-button {
          border: none;

          background: transparent;

          color: #77857f;

          cursor: pointer;
        }


        .fleet-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-top: 13px;

          color: #7e8c87;

          font-size: 8.5px;
        }


        .fleet-pagination {
          display: flex;

          gap: 5px;
        }


        .fleet-pagination button {
          width: 27px;
          height: 27px;

          border: 1px solid #dbe4e0;
          border-radius: 5px;

          background: #ffffff;

          color: #697a74;

          cursor: pointer;
        }


        .fleet-pagination button.active {
          border-color: #28b77b;

          background: #28b77b;

          color: #ffffff;
        }


        /* ===============================================
           VEHICLE DETAILS
        =============================================== */

        .vehicle-details-panel {
          min-height: 520px;

          padding: 15px;
        }


        .vehicle-details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 15px;
        }


        .vehicle-details-header h2 {
          margin: 0;

          color: #1b4036;

          font-size: 13px;
        }


        .vehicle-details-empty {
          min-height: 400px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 8px;

          padding: 20px;

          color: #87958f;

          text-align: center;
        }


        .vehicle-details-empty svg {
          color: #49a47f;
        }


        .vehicle-details-empty strong {
          color: #53675f;

          font-size: 11px;
        }


        .vehicle-details-empty span {
          max-width: 190px;

          font-size: 9px;

          line-height: 1.5;
        }


        .vehicle-title {
          margin-bottom: 16px;
        }


        .vehicle-title h3 {
          margin: 0;

          color: #173c32;

          font-size: 20px;
        }


        .vehicle-title span {
          display: block;

          margin-top: 3px;

          color: #7f8c87;

          font-size: 9px;
        }


        .vehicle-detail-list {
          display: flex;
          flex-direction: column;

          gap: 2px;
        }


        .vehicle-detail-row {
          display: flex;
          justify-content: space-between;

          gap: 10px;

          padding: 6px 0;

          color: #71817b;

          font-size: 8.5px;
        }


        .vehicle-detail-row strong {
          color: #40574f;

          text-align: right;
        }


        .supported-constraints {
          margin-top: 15px;

          padding-top: 13px;

          border-top: 1px solid #e5ebe8;
        }


        .supported-constraints h3 {
          margin: 0 0 10px;

          color: #27483d;

          font-size: 10px;
        }


        .constraint-row {
          display: flex;
          align-items: center;

          gap: 7px;

          margin-bottom: 8px;

          color: #50665d;

          font-size: 8.5px;
        }


        .constraint-row svg {
          color: #28a173;
        }


        .constraints-empty {
          color: #86938e;

          font-size: 8.5px;
        }


        .select-vehicle-button {
          width: 100%;
          min-height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          margin-top: 18px;

          border: none;
          border-radius: 6px;

          background: #20b879;

          color: #ffffff;

          cursor: pointer;

          font-family: inherit;
          font-size: 9px;
          font-weight: 600;
        }


        /* ===============================================
           RESPONSIVE
        =============================================== */

        @media (max-width: 1150px) {

          .fleet-summary-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }


          .fleet-layout {
            grid-template-columns:
              1fr;
          }


          .fleet-filter-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }


          .planning-tabs {
            overflow-x: auto;

            grid-template-columns:
              repeat(5, 180px);
          }

        }


        @media (max-width: 760px) {

          .fleet-page-header {
            flex-direction: column;
          }


          .fleet-header-actions {
            justify-content:
              flex-start;
          }


          .fleet-summary-grid,
          .fleet-filter-grid {
            grid-template-columns:
              1fr;
          }

        }

      `}</style>

    </DispatcherLayout>
  );
}


/* ==========================================================
   SMALL COMPONENTS
========================================================== */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}) {
  return (
    <div className="fleet-summary-card">

      <div
        className={
          `fleet-summary-icon ${tone}`
        }
      >
        <Icon
          size={20}
        />
      </div>


      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="filter-block">

      <label>
        {label}
      </label>


      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >

        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (

            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>

          )
        )}

      </select>

    </div>
  );
}


function TemperatureBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );


  return (
    <span
      className={
        `temperature-badge ${normalized}`
      }
    >
      {value || "—"}
    </span>
  );
}


function AvailabilityBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );


  return (
    <span
      className={
        `availability-badge ${normalized}`
      }
    >
      {value || "—"}
    </span>
  );
}


function DetailRow({
  label,
  value,
}) {
  return (
    <div className="vehicle-detail-row">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


export default FleetAvailability;