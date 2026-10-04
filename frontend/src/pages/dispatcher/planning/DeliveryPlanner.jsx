import {
  AlertTriangle,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Fuel,
  MapPin,
  Package,
  RefreshCw,
  Route,
  Save,
  Snowflake,
  Truck,
  Weight,
} from "lucide-react";

import {
  useEffect,
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


function DeliveryPlanner() {
  const navigate =
    useNavigate();


  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );


  const [
    selectedDepot,
    setSelectedDepot,
  ] = useState("ALL");


  const [planningData, setPlanningData] = useState({
    orders: [],
    fleet: [],
    suggestedTrips: [],
    summary: {},
  });

  useEffect(() => {
    const controller = new AbortController();

    getDispatcherPlanning({
      date: selectedDate,
      depot: selectedDepot,
      signal: controller.signal,
    })
      .then((data) => {
        setPlanningData(
          data || {
            orders: [],
            fleet: [],
            suggestedTrips: [],
            summary: {},
          }
        );
      })
      .catch((error) => {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("Unable to load delivery planner:", error);
        }
      });

    return () => controller.abort();
  }, [selectedDate, selectedDepot]);

  const summary = {
    unassignedOrders: planningData.summary?.unallocatedOrders ?? 0,
    plannedTrips: planningData.summary?.plannedTrips ?? 0,
    validationWarnings: planningData.summary?.warnings ?? 0,
  };

  const unassignedOrders = (planningData.orders || []).filter(
    (order) => order.status === "Confirmed"
  );

  const selectedVehicle = planningData.fleet?.[0] || null;

  const selectedTrip = planningData.suggestedTrips?.[0] || null;

  const validationChecks = selectedTrip
    ? [
        {
          title: "Vehicle capacity",
          description: selectedTrip.capacityUsage || "Capacity checked",
          status: selectedTrip.validation || "Ready",
        },
        {
          title: "Driver assignment",
          description: selectedTrip.driverName || "No Driver assigned",
          status: selectedTrip.driverUserId ? "Ready" : "Warning",
        },
      ]
    : [];

  const routeSummary = selectedTrip
    ? {
        distance: "Calculated when Driver starts navigation",
        duration: "Live ETA updates from Driver",
        stops: selectedTrip.stops,
      }
    : null;

  const capacityWarning =
    selectedTrip && selectedTrip.validation !== "Ready"
      ? "Review vehicle compatibility before publishing."
      : null;


  const showValue = (
    value
  ) =>
    value === 0 ||
    value
      ? value
      : "—";


  return (
    <DispatcherLayout>

      <div className="delivery-planner-page">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="planner-page-header">

          <div>

            <h1>
              Delivery Planning
            </h1>

            <p>
              Assign orders to vehicles,
              build trips, arrange stops and
              validate the plan.
            </p>

          </div>


          <div className="planner-header-actions">

            <div className="planner-save-status">

              <CheckCircle2
                size={15}
              />

              Changes saved

            </div>


            <div className="planner-control">

              <CalendarDays
                size={16}
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="planner-control">

              <MapPin
                size={16}
              />

              <select
                value={selectedDepot}
                onChange={(event) =>
                  setSelectedDepot(
                    event.target.value
                  )
                }
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


            <div className="planner-draft-badge">

              <ClipboardList
                size={16}
              />

              Draft Plan

            </div>

          </div>

        </div>


        {/* ==================================================
            TOP SUMMARY
        ================================================== */}

        <div className="planner-summary-grid">

          <SummaryCard
            icon={CalendarDays}
            label="Delivery Date"
            value={
              selectedDate ||
              "—"
            }
          />


          <SummaryCard
            icon={MapPin}
            label="Depot"
            value={
              selectedDepot === "ALL"
                ? "All Depots"
                : `${selectedDepot} Depot`
            }
          />


          <SummaryCard
            icon={ClipboardList}
            label="Status"
            value="Draft plan"
          />


          <SummaryCard
            icon={Box}
            label="Unassigned Orders"
            value={showValue(
              summary.unassignedOrders
            )}
          />


          <SummaryCard
            icon={Truck}
            label="Planned Trips"
            value={showValue(
              summary.plannedTrips
            )}
          />


          <SummaryCard
            icon={AlertTriangle}
            label="Validation Warnings"
            value={showValue(
              summary.validationWarnings
            )}
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
            <ClipboardList size={16} />
            Confirmed Orders
          </button>


          <button
            type="button"
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning/fleet"
              )
            }
          >
            <Truck size={16} />
            Fleet Availability
          </button>


          <button
            type="button"
            className="planning-tab active"
          >
            <Route size={16} />
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
            <Clock3 size={16} />
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
            <ChevronRight size={16} />
            Review & Publish
          </button>

        </div>


        {/* ==================================================
            MAIN 3-COLUMN AREA
        ================================================== */}

        <div className="planner-main-grid">

          {/* LEFT COLUMN */}

          <section className="planner-panel">

            <div className="planner-panel-header">

              <h2>
                Unassigned Orders
              </h2>

              <span>
                {showValue(
                  summary.unassignedOrders
                )}
              </span>

            </div>


            <div className="planner-search">

              <input
                type="text"
                placeholder="Search by order, outlet or location..."
              />

            </div>


            <div className="planner-filter-row">

              <select>
                <option>
                  All Brands
                </option>
              </select>

              <select>
                <option>
                  All
                </option>
              </select>

              <select>
                <option>
                  All
                </option>
              </select>

            </div>


            <div className="unassigned-list">

              {unassignedOrders.length ===
              0 ? (

                <EmptyState
                  text="No unassigned order data available."
                />

              ) : (

                unassignedOrders.map(
                  (order) => (

                    <div
                      className="unassigned-order-card"
                      key={
                        order.orderId
                      }
                    >
                      <strong>
                        {order.orderId}
                      </strong>
                    </div>

                  )
                )

              )}

            </div>

          </section>


          {/* MIDDLE COLUMN */}

          <section className="planner-panel trip-builder-panel">

            <div className="planner-panel-header">

              <h2>
                Vehicle & Trip Builder
              </h2>

            </div>


            <div className="builder-top-row">

              <select>
                <option>
                  {selectedVehicle
                    ? selectedVehicle.vehicleId
                    : "Select vehicle"}
                </option>
              </select>


              <div className="trip-tabs">

                <button
                  type="button"
                  className="active"
                >
                  Trip 1
                </button>

                <button
                  type="button"
                >
                  Trip 2
                </button>

              </div>

            </div>


            <div className="trip-builder-area">

              {!selectedTrip ? (

                <EmptyState
                  text="Select a vehicle and build a trip to begin planning."
                />

              ) : (

                <>

                  <div className="selected-trip-header">

                    <Truck
                      size={18}
                    />

                    <div>

                      <strong>
                        {
                          selectedTrip.tripId
                        }
                      </strong>

                      <span>
                        {
                          selectedTrip.description
                        }
                      </span>

                    </div>

                  </div>

                </>

              )}

            </div>


            <div className="builder-actions">

              <button
                type="button"
                className="primary-action"
              >
                + Add selected order
              </button>


              <button
                type="button"
              >
                Remove stop
              </button>


              <button
                type="button"
              >
                <RefreshCw
                  size={14}
                />

                Reorder stops
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dispatcher/planning/deferred"
                  )
                }
              >
                Record deferral
              </button>

            </div>


            <div className="trip-load-summary">

              <h3>
                Trip Load Summary
              </h3>


              <div className="load-summary-grid">

                <LoadSummaryItem
                  icon={MapPin}
                  label="Stops"
                  value={
                    selectedTrip
                      ?.stopsCount ||
                    "—"
                  }
                />


                <LoadSummaryItem
                  icon={Weight}
                  label="Total weight"
                  value={
                    selectedTrip
                      ?.totalWeight ||
                    "—"
                  }
                />


                <LoadSummaryItem
                  icon={Package}
                  label="Total volume"
                  value={
                    selectedTrip
                      ?.totalVolume ||
                    "—"
                  }
                />


                <LoadSummaryItem
                  icon={Clock3}
                  label="Est. duration"
                  value={
                    selectedTrip
                      ?.estimatedDuration ||
                    "—"
                  }
                />

              </div>

            </div>

          </section>


          {/* RIGHT COLUMN */}

          <section className="planner-panel validation-panel">

            <div className="planner-panel-header">

              <h2>
                Validation & Route Preview
              </h2>

            </div>


            <div className="validation-section">

              <h3>
                Validation Checks
              </h3>


              {validationChecks.length ===
              0 ? (

                <EmptyState
                  text="No validation results available."
                  compact
                />

              ) : (

                validationChecks.map(
                  (
                    check,
                    index
                  ) => (

                    <div
                      className="validation-row"
                      key={index}
                    >

                      <CheckCircle2
                        size={15}
                      />

                      <span>
                        {check.label}
                      </span>

                      <strong>
                        {check.value}
                      </strong>

                    </div>

                  )
                )

              )}

            </div>


            <div className="route-summary-section">

              <h3>
                Route Summary
              </h3>


              {!routeSummary ? (

                <div className="route-empty">

                  <MapPin
                    size={28}
                  />

                  <span>
                    Route preview will appear
                    after a trip is built.
                  </span>

                </div>

              ) : (

                <>

                  <DetailRow
                    label="Planned departure"
                    value={
                      routeSummary.departure
                    }
                  />

                  <DetailRow
                    label="Estimated duration"
                    value={
                      routeSummary.duration
                    }
                  />

                  <DetailRow
                    label="Estimated distance"
                    value={
                      routeSummary.distance
                    }
                  />

                  <DetailRow
                    label="Estimated fuel use"
                    value={
                      routeSummary.fuel
                    }
                  />

                  <DetailRow
                    label="Remaining capacity"
                    value={
                      routeSummary.remainingCapacity
                    }
                  />

                </>

              )}

            </div>


            {capacityWarning && (

              <div className="planner-warning">

                <AlertTriangle
                  size={18}
                />

                <div>

                  <strong>
                    Adding order exceeds
                    capacity
                  </strong>

                  <span>
                    {capacityWarning}
                  </span>

                </div>

              </div>

            )}

          </section>

        </div>


        {/* ==================================================
            BOTTOM ACTION BAR
        ================================================== */}

        <div className="planner-footer-bar">

          <div className="planner-footer-status">

            <ClipboardList
              size={15}
            />

            <span>
              Draft plan
            </span>

          </div>


          <div className="planner-footer-actions">

            <button
              type="button"
            >
              <Save size={15} />
              Save Draft
            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dispatcher/planning/deferred"
                )
              }
            >
              Review Deferrals
            </button>


            <button
              type="button"
              className="review-plan-button"
              onClick={() =>
                navigate(
                  "/dispatcher/planning/review"
                )
              }
            >
              Review Plan
              <ChevronRight
                size={15}
              />
            </button>

          </div>

        </div>

      </div>


      <style>{`

        .delivery-planner-page {
          width: 100%;
        }


        .planner-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          gap: 20px;

          margin-bottom: 18px;
        }


        .planner-page-header h1 {
          margin: 0;

          color: #173d33;

          font-size: 27px;
        }


        .planner-page-header p {
          margin: 5px 0 0;

          color: #7a8984;

          font-size: 11px;
        }


        .planner-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 8px;

          flex-wrap: wrap;
        }


        .planner-save-status {
          display: flex;
          align-items: center;
          gap: 5px;

          color: #29966d;

          font-size: 10px;
          font-weight: 600;
        }


        .planner-control,
        .planner-draft-badge {
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


        .planner-control input,
        .planner-control select {
          border: none;
          outline: none;

          background: transparent;

          font-family: inherit;
          font-size: 10px;
        }


        .planner-draft-badge {
          background: #dcf5e8;
          border-color: #8ad4b6;

          color: #247759;

          font-size: 10px;
          font-weight: 600;
        }


        .planner-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(6, minmax(0, 1fr));

          gap: 10px;

          margin-bottom: 15px;
        }


        .planner-summary-card {
          min-height: 76px;

          padding: 13px;

          border: 1px solid #e1e8e5;
          border-radius: 8px;

          background: #ffffff;
        }


        .planner-summary-card svg {
          color: #2d9d73;

          margin-bottom: 5px;
        }


        .planner-summary-card span {
          display: block;

          color: #74837e;

          font-size: 8px;
        }


        .planner-summary-card strong {
          display: block;

          margin-top: 4px;

          color: #173d33;

          font-size: 13px;
        }


        .planning-tabs {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          margin-bottom: 14px;

          border: 1px solid #dfe7e3;

          background: #f0f5f2;
        }


        .planning-tab {
          min-height: 45px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          border: none;
          border-right: 1px solid #dfe7e3;

          background: transparent;

          color: #5b6b65;

          cursor: pointer;

          font-family: inherit;
          font-size: 10px;
          font-weight: 600;
        }


        .planning-tab.active {
          background: #123f34;

          color: #ffffff;
        }


        .planner-main-grid {
          display: grid;

          grid-template-columns:
            minmax(220px, 0.8fr)
            minmax(350px, 1.35fr)
            minmax(300px, 1fr);

          gap: 13px;
        }


        .planner-panel {
          min-height: 500px;

          border: 1px solid #dfe7e3;
          border-radius: 8px;

          background: #ffffff;

          overflow: hidden;
        }


        .planner-panel-header {
          min-height: 49px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 14px;

          border-bottom: 1px solid #edf1ef;
        }


        .planner-panel-header h2 {
          margin: 0;

          color: #1d4136;

          font-size: 12px;
        }


        .planner-panel-header span {
          padding: 3px 7px;

          border-radius: 12px;

          background: #dcf5e8;
          color: #25805d;

          font-size: 8px;
        }


        .planner-search {
          padding: 10px;
        }


        .planner-search input {
          width: 100%;
          height: 34px;

          padding: 0 10px;

          border: none;
          border-radius: 6px;

          background: #f4f7f5;

          outline: none;

          font-family: inherit;
          font-size: 9px;
        }


        .planner-filter-row {
          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 6px;

          padding: 0 10px 10px;
        }


        .planner-filter-row select {
          height: 32px;

          border: 1px solid #dde5e1;
          border-radius: 5px;

          background: #ffffff;

          color: #5c6c66;

          font-family: inherit;
          font-size: 8px;
        }


        .unassigned-list {
          min-height: 360px;
        }


        .builder-top-row {
          display: grid;

          grid-template-columns:
            1fr auto;

          gap: 10px;

          padding: 10px;
        }


        .builder-top-row select {
          height: 34px;

          border: 1px solid #dde5e1;
          border-radius: 5px;

          padding: 0 8px;

          font-size: 9px;
        }


        .trip-tabs {
          display: flex;

          gap: 4px;
        }


        .trip-tabs button {
          min-width: 70px;

          border: none;
          border-radius: 5px;

          background: #edf2ef;

          color: #6b7974;

          font-size: 8px;
        }


        .trip-tabs button.active {
          background: #20b879;

          color: #ffffff;
        }


        .trip-builder-area {
          min-height: 260px;

          margin: 0 10px;

          border: 1px solid #e3e9e6;
          border-radius: 6px;
        }


        .selected-trip-header {
          display: flex;
          align-items: center;

          gap: 8px;

          padding: 10px;

          background: #e7f6ed;
        }


        .selected-trip-header div {
          display: flex;
          flex-direction: column;
        }


        .selected-trip-header strong {
          font-size: 10px;
        }


        .selected-trip-header span {
          font-size: 8px;

          color: #7d8a85;
        }


        .builder-actions {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 6px;

          padding: 10px;
        }


        .builder-actions button {
          min-height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          border: 1px solid #dce5e1;
          border-radius: 5px;

          background: #ffffff;

          color: #596a63;

          font-family: inherit;
          font-size: 8px;

          cursor: pointer;
        }


        .builder-actions button.primary-action {
          border-color: #20b879;

          background: #20b879;

          color: #ffffff;
        }


        .trip-load-summary {
          margin: 0 10px 10px;

          border-top: 1px solid #edf1ef;

          padding-top: 10px;
        }


        .trip-load-summary h3 {
          margin: 0 0 9px;

          font-size: 10px;

          color: #27483d;
        }


        .load-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 8px;
        }


        .load-summary-item {
          display: flex;
          flex-direction: column;

          gap: 3px;
        }


        .load-summary-item svg {
          color: #29976e;
        }


        .load-summary-item strong {
          color: #27483d;

          font-size: 10px;
        }


        .load-summary-item span {
          color: #7c8a85;

          font-size: 7px;
        }


        .validation-section,
        .route-summary-section {
          padding: 12px;
        }


        .validation-section h3,
        .route-summary-section h3 {
          margin: 0 0 9px;

          color: #27483d;

          font-size: 10px;
        }


        .validation-row {
          display: grid;

          grid-template-columns:
            auto 1fr auto;

          gap: 7px;

          align-items: center;

          margin-bottom: 8px;

          color: #60716b;

          font-size: 8px;
        }


        .validation-row svg {
          color: #25a173;
        }


        .validation-row strong {
          color: #2c805f;

          font-size: 8px;
        }


        .route-summary-section {
          border-top: 1px solid #edf1ef;
        }


        .route-empty {
          min-height: 150px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 8px;

          color: #85938e;

          text-align: center;

          font-size: 8px;
        }


        .route-empty svg {
          color: #36a178;
        }


        .detail-row {
          display: flex;
          justify-content: space-between;

          gap: 10px;

          padding: 5px 0;

          color: #71807b;

          font-size: 8px;
        }


        .detail-row strong {
          color: #394e47;
        }


        .planner-warning {
          display: flex;

          gap: 8px;

          margin: 12px;

          padding: 10px;

          border: 1px solid #f2cccc;
          border-radius: 6px;

          background: #fff0f0;

          color: #c35c5c;
        }


        .planner-warning div {
          display: flex;
          flex-direction: column;

          gap: 3px;
        }


        .planner-warning strong {
          font-size: 9px;
        }


        .planner-warning span {
          font-size: 8px;
        }


        .planner-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 13px;

          padding: 8px 12px;

          border: 1px solid #e0e7e3;
          border-radius: 7px;

          background: #ffffff;
        }


        .planner-footer-status {
          display: flex;
          align-items: center;

          gap: 6px;

          color: #72817b;

          font-size: 9px;
        }


        .planner-footer-actions {
          display: flex;

          gap: 7px;
        }


        .planner-footer-actions button {
          min-height: 34px;

          display: flex;
          align-items: center;

          gap: 5px;

          padding: 0 12px;

          border: 1px solid #28b579;
          border-radius: 5px;

          background: #ffffff;

          color: #267e5d;

          font-family: inherit;
          font-size: 8px;

          cursor: pointer;
        }


        .planner-footer-actions
        .review-plan-button {
          background: #20b879;

          color: #ffffff;
        }


        .empty-state {
          min-height: 180px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          color: #8b9893;

          font-size: 9px;

          text-align: center;
        }


        .empty-state.compact {
          min-height: 80px;
        }


        @media (max-width: 1200px) {

          .planner-summary-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }


          .planner-main-grid {
            grid-template-columns:
              1fr;
          }


          .planning-tabs {
            overflow-x: auto;

            grid-template-columns:
              repeat(5, 180px);
          }

        }


        @media (max-width: 760px) {

          .planner-page-header {
            flex-direction: column;
          }


          .planner-summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }


          .planner-footer-bar {
            flex-direction: column;

            gap: 10px;

            align-items: stretch;
          }


          .planner-footer-actions {
            flex-wrap: wrap;
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
}) {
  return (
    <div className="planner-summary-card">

      <Icon
        size={17}
      />

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function LoadSummaryItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="load-summary-item">

      <Icon
        size={16}
      />

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}


function DetailRow({
  label,
  value,
}) {
  return (
    <div className="detail-row">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


function EmptyState({
  text,
  compact = false,
}) {
  return (
    <div
      className={
        `empty-state ${
          compact
            ? "compact"
            : ""
        }`
      }
    >
      {text}
    </div>
  );
}


export default DeliveryPlanner;