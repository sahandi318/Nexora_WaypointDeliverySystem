import {
  AlertTriangle,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  MapPin,
  Route,
  Save,
  Send,
  Truck,
  UserRound,
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
  publishDispatcherTrip,
} from "../../../services/dispatcherPlanningService";


function ReviewPublish() {
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


  const [planningData, setPlanningData] = useState({
    summary: {},
    suggestedTrips: [],
    publicationPreview: [],
  });

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  async function loadPlanning() {
    const data = await getDispatcherPlanning({
      date: selectedDate,
      depot: selectedDepot,
    });

    setPlanningData(
      data || {
        summary: {},
        suggestedTrips: [],
        publicationPreview: [],
      }
    );

    setSelectedTripId((current) =>
      current && data?.suggestedTrips?.some((trip) => trip.tripId === current)
        ? current
        : data?.suggestedTrips?.[0]?.tripId || null
    );
  }

  useEffect(() => {
    loadPlanning().catch((error) => {
      console.error("Unable to load plan review:", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedDepot]);

  const summary = planningData.summary || {};
  const trips = planningData.suggestedTrips || [];
  const selectedTrip =
    trips.find((trip) => trip.tripId === selectedTripId) ||
    trips[0] ||
    null;

  const validationItems = selectedTrip
    ? [
        {
          id: "capacity",
          title: "Vehicle capacity",
          description: selectedTrip.capacityUsage || "Capacity checked.",
          status: selectedTrip.validation || "Ready",
        },
        {
          id: "driver",
          title: "Driver assignment",
          description: selectedTrip.driverName || "No active Driver assigned.",
          status: selectedTrip.driverUserId ? "Ready" : "Blocking",
        },
        {
          id: "organizer-data",
          title: "Organizer operational data",
          description: `${selectedTrip.estimatedDistanceKm ?? 0} km · ${selectedTrip.estimatedDurationMinutes ?? 0} min · ${selectedTrip.estimatedFuelL ?? 0} L fuel`,
          status: selectedTrip.validationWarnings?.length ? "Warning" : "Ready",
        },
      ]
    : [];

  const nonBlockingWarnings = [
    ...(selectedTrip?.validation === "Warning"
      ? ["Review vehicle compatibility and operational timing before publication."]
      : []),
    ...(selectedTrip?.validationWarnings || []),
  ];

  const publicationPreview = planningData.publicationPreview || [];

  async function handlePublishPlan() {
    if (!selectedTrip || publishing) return;

    try {
      setPublishing(true);
      setPublishMessage("");

      const result = await publishDispatcherTrip(selectedTrip);

      setPublishMessage(
        `${result.tripCode} published. The assigned Driver can now see the trip.`
      );

      await loadPlanning();
    } catch (error) {
      setPublishMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to publish the plan."
      );
    } finally {
      setPublishing(false);
    }
  }


  const showValue = (
    value
  ) =>
    value === 0 ||
    value
      ? value
      : "—";


  return (
    <DispatcherLayout>

      <div className="review-publish-page">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="review-page-header">

          <div>

            <h1>
              Delivery Planning
            </h1>

            <p>
              Review the completed delivery
              plan before publishing.
            </p>

          </div>


          <div className="review-header-summary">

            <HeaderInfo
              icon={CalendarDays}
              label="Delivery Date"
              value={
                selectedDate ||
                "—"
              }
            />


            <HeaderInfo
              icon={MapPin}
              label="Depot"
              value={
                selectedDepot ===
                "ALL"
                  ? "All Depots"
                  : `${selectedDepot} Depot`
              }
            />


            <HeaderInfo
              icon={ClipboardList}
              label="Status"
              value={
                summary.status ||
                "—"
              }
              green
            />


            <HeaderInfo
              icon={Box}
              label="Unassigned"
              value={showValue(
                summary.unassigned
              )}
            />


            <HeaderInfo
              icon={Clock3}
              label="Deferred"
              value={showValue(
                summary.deferredOrders
              )}
            />


            <HeaderInfo
              icon={AlertTriangle}
              label="Warnings"
              value={showValue(
                summary.warnings
              )}
              danger
            />

          </div>

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
            className="planning-tab"
            onClick={() =>
              navigate(
                "/dispatcher/planning/fleet"
              )
            }
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
            <Route
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
            className="planning-tab active"
          >
            <ChevronRight
              size={16}
            />

            Review & Publish
          </button>

        </div>


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="review-summary-grid">

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
            tone="green"
          />


          <SummaryCard
            icon={Clock3}
            label="Deferred Orders"
            value={showValue(
              summary.deferredOrders
            )}
            tone="orange"
          />


          <SummaryCard
            icon={Truck}
            label="Planned Trips"
            value={showValue(
              summary.plannedTrips
            )}
            tone="green"
          />


          <SummaryCard
            icon={AlertTriangle}
            label="Blocking Errors"
            value={showValue(
              summary.blockingErrors
            )}
            tone="red"
          />


          <div className="orders-accounted-card">

            <CheckCircle2
              size={25}
            />

            <div>

              <strong>
                All orders accounted for
              </strong>

              <span>
                Every confirmed order must
                be allocated to a trip or
                have a documented deferral.
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="review-main-grid">

          {/* LEFT - PLANNED TRIPS */}

          <section className="review-panel planned-trips-panel">

            <div className="review-panel-header">

              <div className="panel-title-icon">

                <Truck
                  size={16}
                />

                <h2>
                  Planned Trips
                </h2>

              </div>


              <input
                type="text"
                placeholder="Search trips, vehicles or depot..."
                className="trip-search"
              />

            </div>


            <div className="review-table-wrapper">

              <table className="review-table">

                <thead>

                  <tr>

                    <th>
                      Trip ID
                    </th>

                    <th>
                      Vehicle
                    </th>

                    <th>
                      Depot
                    </th>

                    <th>
                      Orders
                    </th>

                    <th>
                      Stops
                    </th>

                    <th>
                      Departure
                    </th>

                    <th>
                      Validation
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {trips.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        className="review-empty-cell"
                      >
                        No planned trip
                        data available.
                      </td>

                    </tr>

                  ) : (

                    trips.map(
                      (
                        trip,
                        index
                      ) => (

                        <tr
                          key={
                            trip.tripId ||
                            index
                          }
                        >

                          <td>
                            <strong>
                              {
                                trip.tripId ||
                                "—"
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              trip.vehicleId ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              trip.depot ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              trip.orders ??
                              "—"
                            }
                          </td>

                          <td>
                            {
                              trip.stops ??
                              "—"
                            }
                          </td>

                          <td>
                            {
                              trip.departure ||
                              "—"
                            }
                          </td>

                          <td>

                            <ValidationBadge
                              value={
                                trip.validation
                              }
                            />

                          </td>

                          <td>

                            <button
                              type="button"
                              className="view-details-button"
                              onClick={() => setSelectedTripId(trip.tripId)}
                            >
                              View Details
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>


            <div className="review-table-footer">

              <span>
                Showing{" "}
                {trips.length} of{" "}
                {showValue(
                  summary.plannedTrips
                )}{" "}
                planned trips
              </span>


              <div className="review-pagination">

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


          {/* MIDDLE - SELECTED TRIP */}

          <section className="review-panel selected-trip-panel">

            <div className="selected-trip-heading">

              <div>

                <span>
                  Selected Trip Details
                </span>

                <h2>
                  {selectedTrip
                    ?.tripId ||
                    "No trip selected"}
                </h2>

              </div>


              <button
                type="button"
                className="edit-planner-button"
                onClick={() =>
                  navigate(
                    "/dispatcher/planning/planner"
                  )
                }
              >
                Edit in Planner
                <ChevronRight
                  size={14}
                />
              </button>

            </div>


            {!selectedTrip ? (

              <EmptyState
                text="Select a planned trip to review its vehicle, capacity and stop sequence."
              />

            ) : (

              <>

                <div className="selected-trip-summary">

                  <DetailBlock
                    label="Vehicle"
                    value={
                      selectedTrip.vehicleId
                    }
                  />


                  <DetailBlock
                    label="Type"
                    value={
                      selectedTrip.vehicleType
                    }
                  />


                  <DetailBlock
                    label="Orders"
                    value={
                      selectedTrip.orders
                    }
                  />


                  <DetailBlock
                    label="Stops"
                    value={
                      selectedTrip.stops
                    }
                  />


                  <DetailBlock
                    label="Departure"
                    value={
                      selectedTrip.departure
                    }
                  />


                  <DetailBlock
                    label="Capacity usage"
                    value={
                      selectedTrip.capacityUsage
                    }
                  />

                  <DetailBlock
                    label="Estimated distance"
                    value={`${selectedTrip.estimatedDistanceKm ?? 0} km`}
                  />

                  <DetailBlock
                    label="Estimated fuel"
                    value={`${selectedTrip.estimatedFuelL ?? 0} L`}
                  />

                </div>


                <div className="stop-sequence">

                  <h3>
                    Stop Sequence
                  </h3>


                  {Array.isArray(
                    selectedTrip.stopsList
                  ) &&
                  selectedTrip.stopsList
                    .length > 0 ? (

                    selectedTrip
                      .stopsList
                      .map(
                        (
                          stop,
                          index
                        ) => (

                          <div
                            className="stop-row"
                            key={
                              stop.id ||
                              index
                            }
                          >

                            <span className="stop-number">
                              {index + 1}
                            </span>


                            <div>

                              <strong>
                                {
                                  stop.name ||
                                  "—"
                                }
                              </strong>

                              <span>
                                ETA{" "}
                                {
                                  stop.eta ||
                                  "—"
                                }
                                {stop.serviceAllowanceMinutes ? ` · ${stop.serviceAllowanceMinutes} min service` : ""}
                              </span>

                            </div>

                          </div>

                        )
                      )

                  ) : (

                    <EmptyState
                      compact
                      text="No stop sequence available."
                    />

                  )}

                </div>

              </>

            )}

          </section>


          {/* RIGHT */}

          <div className="review-right-column">

            {/* VALIDATION */}

            <section className="review-panel validation-summary-panel">

              <div className="review-panel-header">

                <div className="panel-title-icon">

                  <CheckCircle2
                    size={16}
                  />

                  <h2>
                    Validation Summary
                  </h2>

                </div>

              </div>


              <div className="blocking-errors">

                <span>
                  {showValue(
                    summary.blockingErrors
                  )}
                </span>

                blocking errors

              </div>


              {validationItems.length ===
              0 ? (

                <EmptyState
                  compact
                  text="No validation information available."
                />

              ) : (

                validationItems.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="validation-item"
                      key={
                        item.id ||
                        index
                      }
                    >

                      <CheckCircle2
                        size={14}
                      />

                      <span>
                        {
                          item.label ||
                          "—"
                        }
                      </span>

                    </div>

                  )
                )

              )}


              <div className="warning-summary">

                <div className="warning-summary-title">

                  <AlertTriangle
                    size={14}
                  />

                  <strong>
                    Warnings
                    (non-blocking)
                  </strong>

                  <span>
                    {
                      nonBlockingWarnings
                        .length
                    }
                  </span>

                </div>


                {nonBlockingWarnings.length >
                0 ? (

                  nonBlockingWarnings.map(
                    (
                      warning,
                      index
                    ) => (

                      <p
                        key={
                          warning.id ||
                          index
                        }
                      >
                        {
                          warning.message ||
                          "—"
                        }
                      </p>

                    )
                  )

                ) : (

                  <p>
                    No non-blocking
                    warnings available.
                  </p>

                )}

              </div>

            </section>


            {/* PUBLICATION PREVIEW */}

            <section className="review-panel publication-panel">

              <div className="review-panel-header">

                <div className="panel-title-icon">

                  <Send
                    size={16}
                  />

                  <h2>
                    Publication Preview
                  </h2>

                </div>

              </div>


              <div className="publication-list">

                {publicationPreview.length ===
                0 ? (

                  <>
                    <PublicationItem
                      icon={UserRound}
                      title="Loader"
                      description="Loading tasks and vehicle information will appear here when plan data is available."
                    />


                    <PublicationItem
                      icon={UserRound}
                      title="Driver"
                      description="Trip and route information will appear here when plan data is available."
                    />


                    <PublicationItem
                      icon={UserRound}
                      title="Store Manager"
                      description="Delivery schedule or deferral information will appear here when plan data is available."
                    />
                  </>

                ) : (

                  publicationPreview.map(
                    (
                      item,
                      index
                    ) => (

                      <PublicationItem
                        key={
                          item.id ||
                          index
                        }
                        icon={
                          UserRound
                        }
                        title={
                          item.title
                        }
                        description={
                          item.description
                        }
                      />

                    )
                  )

                )}

              </div>

            </section>

          </div>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="review-footer">

          <div />


          <div className="review-footer-actions">

            <button
              type="button"
            >
              <Save
                size={15}
              />

              Save Draft
            </button>


            <button
              type="button"
            >
              <Eye
                size={15}
              />

              Preview Published Plan
            </button>


            <button
              type="button"
              className="publish-plan-button"
              onClick={handlePublishPlan}
              disabled={!selectedTrip || publishing}
            >
              {publishing ? "Publishing..." : "Confirm & Publish Plan"}

              <ChevronRight
                size={15}
              />
            </button>

          </div>

          {publishMessage && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 700,
                color: publishMessage.includes("published")
                  ? "#218158"
                  : "#b42318",
              }}
            >
              {publishMessage}
            </div>
          )}

        </div>

      </div>


      <style>{`

        .review-publish-page {
          width: 100%;
        }


        /* ===============================================
           HEADER
        =============================================== */

        .review-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom: 14px;
        }


        .review-page-header h1 {
          margin: 0;

          color: #173d33;

          font-size: 27px;
        }


        .review-page-header p {
          max-width: 300px;

          margin: 5px 0 0;

          color: #7b8984;

          font-size: 10px;

          line-height: 1.4;
        }


        .review-header-summary {
          display: grid;

          grid-template-columns:
            repeat(6, auto);

          gap: 6px;
        }


        .header-info {
          min-width: 82px;
          min-height: 49px;

          display: flex;
          align-items: center;

          gap: 7px;

          padding: 7px 9px;

          border: 1px solid #e0e7e3;
          border-radius: 7px;

          background: #ffffff;
        }


        .header-info svg {
          color: #338c6b;
        }


        .header-info-text {
          display: flex;
          flex-direction: column;
        }


        .header-info-text span {
          color: #87938f;

          font-size: 7px;

          text-transform: uppercase;
        }


        .header-info-text strong {
          margin-top: 2px;

          color: #304b42;

          font-size: 9px;
        }


        .header-info.green strong {
          color: #218158;
        }


        .header-info.danger svg,
        .header-info.danger strong {
          color: #d15e5e;
        }


        /* ===============================================
           TABS
        =============================================== */

        .planning-tabs {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          margin-bottom: 14px;

          border: 1px solid #dfe7e3;

          background: #f0f5f2;
        }


        .planning-tab {
          min-height: 44px;

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


        /* ===============================================
           SUMMARY
        =============================================== */

        .review-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(5, minmax(0, 1fr))
            minmax(190px, 1.4fr);

          gap: 10px;

          margin-bottom: 14px;
        }


        .review-summary-card {
          min-height: 78px;

          display: flex;
          align-items: center;

          gap: 10px;

          padding: 12px;

          border: 1px solid #dfe8e3;
          border-radius: 7px;

          background: #ffffff;
        }


        .review-summary-icon {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 6px;
        }


        .review-summary-icon.green {
          background: #ddf5e7;
          color: #26845f;
        }


        .review-summary-icon.orange {
          background: #fff0dd;
          color: #bd7830;
        }


        .review-summary-icon.red {
          background: #fde5e5;
          color: #c65d5d;
        }


        .review-summary-card span {
          display: block;

          color: #74827d;

          font-size: 7.5px;
        }


        .review-summary-card strong {
          display: block;

          margin-top: 3px;

          color: #1e4438;

          font-size: 18px;
        }


        .orders-accounted-card {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 12px;

          border: 1px solid #9ddbbd;
          border-radius: 7px;

          background: #effbf4;
        }


        .orders-accounted-card svg {
          color: #20a56f;

          flex-shrink: 0;
        }


        .orders-accounted-card div {
          display: flex;
          flex-direction: column;
        }


        .orders-accounted-card strong {
          color: #257552;

          font-size: 9px;
        }


        .orders-accounted-card span {
          margin-top: 2px;

          color: #638075;

          font-size: 7.5px;

          line-height: 1.35;
        }


        /* ===============================================
           MAIN GRID
        =============================================== */

        .review-main-grid {
          display: grid;

          grid-template-columns:
            minmax(400px, 1.35fr)
            minmax(280px, 0.9fr)
            minmax(280px, 0.9fr);

          gap: 12px;
        }


        .review-panel {
          border: 1px solid #dfe7e3;
          border-radius: 7px;

          background: #ffffff;

          overflow: hidden;
        }


        .review-panel-header {
          min-height: 45px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding: 0 12px;

          border-bottom: 1px solid #edf1ef;
        }


        .panel-title-icon {
          display: flex;
          align-items: center;

          gap: 6px;
        }


        .panel-title-icon svg {
          color: #367f64;
        }


        .panel-title-icon h2 {
          margin: 0;

          color: #27483d;

          font-size: 10px;
        }


        .trip-search {
          width: 180px;
          height: 28px;

          padding: 0 8px;

          border: 1px solid #e0e6e3;
          border-radius: 5px;

          outline: none;

          font-family: inherit;
          font-size: 8px;
        }


        /* ===============================================
           TABLE
        =============================================== */

        .planned-trips-panel {
          min-height: 520px;
        }


        .review-table-wrapper {
          overflow-x: auto;
        }


        .review-table {
          width: 100%;

          border-collapse: collapse;
        }


        .review-table th {
          padding: 8px 6px;

          background: #f5f7f6;

          color: #71817b;

          text-align: left;

          font-size: 7px;

          white-space: nowrap;
        }


        .review-table td {
          padding: 9px 6px;

          border-top: 1px solid #edf1ef;

          color: #53665e;

          font-size: 7.5px;
        }


        .review-table td strong {
          color: #294c40;
        }


        .review-empty-cell {
          height: 280px;

          text-align: center;

          color: #899690 !important;
        }


        .validation-badge {
          display: inline-flex;

          padding: 4px 6px;

          border-radius: 4px;

          font-size: 7px;

          font-weight: 600;
        }


        .validation-badge.valid {
          background: #ddf3e6;
          color: #2d7d5d;
        }


        .validation-badge.warning {
          background: #fff0dd;
          color: #b7742f;
        }


        .validation-badge.error {
          background: #fde5e5;
          color: #bb5a5a;
        }


        .view-details-button {
          border: none;

          padding: 5px 7px;

          border-radius: 4px;

          background: #20b879;

          color: #ffffff;

          cursor: pointer;

          font-family: inherit;
          font-size: 7px;
        }


        .review-table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 10px;

          color: #788781;

          font-size: 7.5px;
        }


        .review-pagination {
          display: flex;

          gap: 4px;
        }


        .review-pagination button {
          width: 24px;
          height: 24px;

          border: 1px solid #dbe4e0;
          border-radius: 4px;

          background: #ffffff;

          color: #63766e;
        }


        .review-pagination button.active {
          border-color: #20b879;

          background: #20b879;

          color: #ffffff;
        }


        /* ===============================================
           SELECTED TRIP
        =============================================== */

        .selected-trip-panel {
          min-height: 520px;

          padding: 12px;
        }


        .selected-trip-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 12px;
        }


        .selected-trip-heading span {
          color: #7d8985;

          font-size: 7px;

          text-transform: uppercase;
        }


        .selected-trip-heading h2 {
          margin: 3px 0 0;

          color: #173d33;

          font-size: 16px;
        }


        .edit-planner-button {
          display: flex;
          align-items: center;

          gap: 4px;

          min-height: 28px;

          padding: 0 8px;

          border: 1px solid #42ae82;
          border-radius: 5px;

          background: #ffffff;

          color: #2a8a65;

          cursor: pointer;

          font-family: inherit;
          font-size: 7px;
        }


        .selected-trip-summary {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          border: 1px solid #e1e8e5;
          border-radius: 5px;

          overflow: hidden;
        }


        .detail-block {
          padding: 8px;

          border-right: 1px solid #edf1ef;
          border-bottom: 1px solid #edf1ef;
        }


        .detail-block span {
          display: block;

          color: #899690;

          font-size: 7px;
        }


        .detail-block strong {
          display: block;

          margin-top: 3px;

          color: #354f46;

          font-size: 8px;
        }


        .stop-sequence {
          margin-top: 14px;
        }


        .stop-sequence h3 {
          margin: 0 0 9px;

          color: #294a3f;

          font-size: 9px;
        }


        .stop-row {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 9px;
        }


        .stop-number {
          width: 21px;
          height: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 50%;

          background: #20b879;

          color: #ffffff;

          font-size: 7px;

          font-weight: 700;
        }


        .stop-row div {
          display: flex;
          flex-direction: column;
        }


        .stop-row strong {
          color: #3b574d;

          font-size: 8px;
        }


        .stop-row div span {
          color: #84928d;

          font-size: 7px;
        }


        /* ===============================================
           RIGHT COLUMN
        =============================================== */

        .review-right-column {
          display: flex;
          flex-direction: column;

          gap: 12px;
        }


        .validation-summary-panel {
          padding-bottom: 10px;
        }


        .blocking-errors {
          display: inline-flex;

          align-items: center;

          gap: 4px;

          margin: 10px 12px;

          padding: 4px 7px;

          border-radius: 4px;

          background: #e4f5eb;

          color: #347b5f;

          font-size: 7px;
        }


        .blocking-errors span {
          font-weight: 700;
        }


        .validation-item {
          display: flex;
          align-items: center;

          gap: 6px;

          padding: 4px 12px;

          color: #53675f;

          font-size: 7.5px;
        }


        .validation-item svg {
          color: #24a26f;
        }


        .warning-summary {
          margin: 10px 12px 0;

          padding: 9px;

          border-radius: 5px;

          background: #fff6e9;
        }


        .warning-summary-title {
          display: flex;
          align-items: center;

          gap: 5px;

          color: #b7712d;
        }


        .warning-summary-title strong {
          font-size: 7.5px;
        }


        .warning-summary-title span {
          margin-left: auto;

          font-size: 7px;
        }


        .warning-summary p {
          margin: 6px 0 0;

          color: #796a57;

          font-size: 7px;

          line-height: 1.4;
        }


        /* ===============================================
           PUBLICATION PREVIEW
        =============================================== */

        .publication-list {
          padding: 9px;
        }


        .publication-item {
          display: flex;

          gap: 8px;

          margin-bottom: 8px;

          padding: 9px;

          border-radius: 5px;

          background: #effaf4;
        }


        .publication-icon {
          width: 26px;
          height: 26px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 5px;

          background: #dcf3e7;

          color: #28825f;
        }


        .publication-item div:last-child {
          display: flex;
          flex-direction: column;
        }


        .publication-item strong {
          color: #347359;

          font-size: 8px;
        }


        .publication-item span {
          margin-top: 2px;

          color: #647a70;

          font-size: 7px;

          line-height: 1.35;
        }


        /* ===============================================
           FOOTER
        =============================================== */

        .review-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 13px;

          padding: 8px 11px;

          border: 1px solid #dfe7e3;
          border-radius: 7px;

          background: #ffffff;
        }


        .review-footer-actions {
          display: flex;

          gap: 7px;
        }


        .review-footer-actions button {
          min-height: 34px;

          display: flex;
          align-items: center;

          gap: 5px;

          padding: 0 12px;

          border: 1px solid #dbe4e0;
          border-radius: 5px;

          background: #ffffff;

          color: #52665e;

          cursor: pointer;

          font-family: inherit;
          font-size: 8px;
        }


        .review-footer-actions
        .publish-plan-button {
          border-color: #20b879;

          background: #20b879;

          color: #ffffff;
        }


        .empty-state {
          min-height: 260px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          color: #899690;

          text-align: center;

          font-size: 8px;
        }


        .empty-state.compact {
          min-height: 70px;
        }


        /* ===============================================
           RESPONSIVE
        =============================================== */

        @media (
          max-width: 1250px
        ) {

          .review-page-header {
            flex-direction: column;
          }


          .review-header-summary {
            width: 100%;

            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }


          .review-summary-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }


          .review-main-grid {
            grid-template-columns:
              1fr;
          }


          .planning-tabs {
            overflow-x: auto;

            grid-template-columns:
              repeat(
                5,
                180px
              );
          }

        }


        @media (
          max-width: 760px
        ) {

          .review-header-summary,
          .review-summary-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }


          .review-footer {
            align-items: stretch;

            flex-direction: column;

            gap: 8px;
          }


          .review-footer-actions {
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

function HeaderInfo({
  icon: Icon,
  label,
  value,
  green = false,
  danger = false,
}) {
  return (
    <div
      className={
        `header-info ${
          green
            ? "green"
            : ""
        } ${
          danger
            ? "danger"
            : ""
        }`
      }
    >

      <Icon
        size={15}
      />


      <div className="header-info-text">

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


function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}) {
  return (
    <div className="review-summary-card">

      <div
        className={
          `review-summary-icon ${tone}`
        }
      >

        <Icon
          size={18}
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


function ValidationBadge({
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
        `validation-badge ${normalized}`
      }
    >
      {value || "—"}
    </span>
  );
}


function DetailBlock({
  label,
  value,
}) {
  return (
    <div className="detail-block">

      <span>
        {label}
      </span>

      <strong>
        {value ?? "—"}
      </strong>

    </div>
  );
}


function PublicationItem({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="publication-item">

      <div className="publication-icon">

        <Icon
          size={14}
        />

      </div>


      <div>

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

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


export default ReviewPublish;