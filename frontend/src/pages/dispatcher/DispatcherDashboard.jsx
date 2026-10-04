import {
  AlertTriangle,
  BarChart3,
  Box,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Route,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import DispatcherLayout
  from "../../components/dispatcher/DispatcherLayout";

import {
  getDispatcherDashboard,
} from "../../services/dispatcherService";

import "./dispatcherDashboard.css";


function DispatcherDashboard() {
  const navigate =
    useNavigate();


  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    selectedDepot,
    setSelectedDepot,
  ] = useState("ALL");


  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );


  /* ==========================================================
     LOAD DASHBOARD DATA
  ========================================================== */

  useEffect(() => {
    const controller =
      new AbortController();


    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");


        const data =
          await getDispatcherDashboard({
            date: selectedDate,
            depot: selectedDepot,
            signal:
              controller.signal,
          });


        setDashboardData(
          data || null
        );
      } catch (err) {
        if (
          err?.name ===
            "CanceledError" ||
          err?.name ===
            "AbortError"
        ) {
          return;
        }


        /*
         * No mock data is inserted here.
         *
         * Until the backend endpoint is
         * connected, the UI displays
         * empty values instead.
         */

        setDashboardData(null);

        setError(
          "Dashboard data is currently unavailable."
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }


    loadDashboard();


    return () => {
      controller.abort();
    };
  }, [
    selectedDate,
    selectedDepot,
  ]);


  /* ==========================================================
     DATA
  ========================================================== */

  const summary =
    dashboardData?.summary || {};


  const readiness =
    dashboardData?.readiness || {};


  const attentionItems =
    Array.isArray(
      dashboardData?.attentionItems
    )
      ? dashboardData.attentionItems
      : [];


  const trips =
    Array.isArray(
      dashboardData?.trips
    )
      ? dashboardData.trips
      : [];


  const recentActivity =
    Array.isArray(
      dashboardData?.recentActivity
    )
      ? dashboardData.recentActivity
      : [];


  const liveOverview =
    Array.isArray(
      dashboardData?.liveOverview
    )
      ? dashboardData.liveOverview
      : [];


  const displayValue = (
    value
  ) => {
    if (
      value === 0 ||
      value
    ) {
      return value;
    }

    return "—";
  };


  return (
    <DispatcherLayout>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <header className="dispatcher-header">

        <div>
          <h1>
            Operations Dashboard
          </h1>

          <p>
            Overview of today's
            delivery operations
          </p>
        </div>


        <div className="dispatcher-header-controls">

          {/* DATE */}

          <div className="dashboard-filter">

            <CalendarDays
              size={17}
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


          {/* DEPOT */}

          <select
            className="dashboard-filter depot-select"
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
              Peliyagoda
            </option>

            <option value="Kandy">
              Kandy
            </option>

          </select>


          {/* PLAN STATUS */}

          <span className="dashboard-plan-badge">
            {dashboardData?.planStatus ||
              "—"}
          </span>

        </div>

      </header>


      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="dashboard-message">
          {error}
        </div>
      )}


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="dashboard-stat-grid">

        <StatCard
          title="Confirmed Orders"
          value={displayValue(
            summary.confirmedOrders
          )}
          change={
            summary.confirmedOrdersChange
          }
          icon={ClipboardList}
          tone="green"
        />


        <StatCard
          title="Allocated Orders"
          value={displayValue(
            summary.allocatedOrders
          )}
          change={
            summary.allocatedOrdersChange
          }
          icon={PackageCheck}
          tone="teal"
        />


        <StatCard
          title="Unallocated Orders"
          value={displayValue(
            summary.unallocatedOrders
          )}
          change={
            summary.unallocatedOrdersChange
          }
          icon={AlertTriangle}
          tone="orange"
        />


        <StatCard
          title="Deferred Orders"
          value={displayValue(
            summary.deferredOrders
          )}
          change={
            summary.deferredOrdersChange
          }
          icon={Box}
          tone="yellow"
        />

      </section>


      {/* ======================================================
          ATTENTION + READINESS
      ====================================================== */}

      <section className="dashboard-two-column">

        {/* REQUIRES ATTENTION */}

        <section className="dashboard-card dashboard-attention">

          <div className="dashboard-card-header">

            <div className="dashboard-title-with-count">

              <h2>
                Requires Attention
              </h2>

              <span>
                {attentionItems.length}
              </span>

            </div>


            <button
              type="button"
              className="dashboard-link-button"
            >
              View all
            </button>

          </div>


          <div className="dashboard-table-wrapper">

            <table className="dashboard-table">

              <thead>
                <tr>

                  <th>
                    Issue Type
                  </th>

                  <th>
                    Trip / Order
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Severity
                  </th>

                  <th>
                    Action
                  </th>

                </tr>
              </thead>


              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="dashboard-empty-cell"
                    >
                      Loading...
                    </td>
                  </tr>

                ) : attentionItems.length ===
                  0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="dashboard-empty-cell"
                    >
                      No attention items
                      available.
                    </td>
                  </tr>

                ) : (

                  attentionItems.map(
                    (
                      item,
                      index
                    ) => (

                      <tr
                        key={
                          item.id ||
                          `${item.reference}-${index}`
                        }
                      >

                        <td>
                          {item.type ||
                            "—"}
                        </td>

                        <td className="dashboard-reference">
                          {item.reference ||
                            "—"}
                        </td>

                        <td>
                          {item.description ||
                            "—"}
                        </td>

                        <td>
                          {item.time ||
                            "—"}
                        </td>

                        <td>
                          <SeverityBadge
                            severity={
                              item.severity
                            }
                          />
                        </td>

                        <td>

                          <button
                            type="button"
                            className="dashboard-action-button"
                          >
                            {item.actionLabel ||
                              "Review"}
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* PLANNING & LOADING READINESS */}

        <section className="dashboard-card readiness-card">

          <div className="dashboard-card-header">

            <h2>
              Planning & Loading
              Readiness
            </h2>

          </div>


          <ReadinessRow
            icon={ClipboardList}
            label="Awaiting allocation"
            value={displayValue(
              readiness.awaitingAllocation
            )}
          />


          <ReadinessRow
            icon={Box}
            label="Awaiting loading"
            value={displayValue(
              readiness.awaitingLoading
            )}
          />


          <ReadinessRow
            icon={LoaderCircle}
            label="Loading now"
            value={displayValue(
              readiness.loadingNow
            )}
          />


          <ReadinessRow
            icon={Truck}
            label="Ready for departure"
            value={displayValue(
              readiness.readyForDeparture
            )}
          />


          <ReadinessRow
            icon={CheckCircle2}
            label="Published trips"
            value={displayValue(
              readiness.publishedTrips
            )}
          />


          <div className="dashboard-sync-info">

            <CheckCircle2
              size={16}
            />

            <span>
              {dashboardData
                ?.syncMessage ||
                "No sync information available."}
            </span>

          </div>

        </section>

      </section>


      {/* ======================================================
          LIVE DELIVERY OVERVIEW
      ====================================================== */}

      <section className="dashboard-card live-delivery-card">

        <div className="dashboard-card-header">

          <h2>
            Live Delivery Overview
          </h2>


          <button
            type="button"
            className="dashboard-link-button"
            onClick={() =>
              navigate(
                "/dispatcher/live"
              )
            }
          >
            All Trips
          </button>

        </div>


        <div className="live-delivery-grid">

          {/* MAP AREA */}

          <div className="live-map-placeholder">

            <MapPin
              size={36}
            />

            <span>
              Live map will display
              connected trip data.
            </span>

          </div>


          {/* LIVE STATUS LIST */}

          <div className="live-status-list">

            {liveOverview.length ===
            0 ? (

              <EmptyBlock
                text={
                  loading
                    ? "Loading live delivery data..."
                    : "No live trip data available."
                }
              />

            ) : (

              liveOverview.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className="live-status-item"
                    key={
                      item.id ||
                      item.reference ||
                      index
                    }
                  >

                    <span
                      className={
                        `live-status-dot ${
                          String(
                            item.status ||
                              ""
                          )
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )
                        }`
                      }
                    />


                    <div>

                      <strong>
                        {item.location ||
                          item.reference ||
                          "Trip"}
                      </strong>

                      <span>
                        {item.status ||
                          "—"}
                      </span>

                    </div>


                    <span className="live-status-progress">
                      {item.progress ||
                        "—"}
                    </span>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          TODAY'S TRIPS + RECENT ACTIVITY
      ====================================================== */}

      <section className="dashboard-two-column bottom-panels">

        {/* TODAY'S TRIPS */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <div className="dashboard-title-with-count">

              <h2>
                Today's Trips
              </h2>

              <span>
                {trips.length}
              </span>

            </div>


            <button
              type="button"
              className="dashboard-link-button"
              onClick={() =>
                navigate(
                  "/dispatcher/live"
                )
              }
            >
              View all
            </button>

          </div>


          {trips.length === 0 ? (

            <EmptyBlock
              text={
                loading
                  ? "Loading trips..."
                  : "No trip data available."
              }
            />

          ) : (

            <div className="trip-list">

              {trips.map(
                (
                  trip,
                  index
                ) => (

                  <div
                    className="trip-row"
                    key={
                      trip.id ||
                      trip.tripId ||
                      index
                    }
                  >

                    <div>

                      <strong>
                        {trip.tripId ||
                          "—"}
                      </strong>

                      <span>

                        {trip.vehicleId ||
                          "—"}

                        {trip.depot
                          ? ` · ${trip.depot}`
                          : ""}

                      </span>

                    </div>


                    <StatusBadge
                      status={
                        trip.status
                      }
                    />

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* RECENT ACTIVITY */}

        <section className="dashboard-card">

          <div className="dashboard-card-header">

            <h2>
              Recent Activity
            </h2>


            <button
              type="button"
              className="dashboard-link-button"
            >
              View all
            </button>

          </div>


          {recentActivity.length ===
          0 ? (

            <EmptyBlock
              text={
                loading
                  ? "Loading activity..."
                  : "No recent activity available."
              }
            />

          ) : (

            <div className="activity-list">

              {recentActivity.map(
                (
                  activity,
                  index
                ) => (

                  <div
                    className="activity-row"
                    key={
                      activity.id ||
                      index
                    }
                  >

                    <span className="activity-time">
                      {activity.time ||
                        "—"}
                    </span>

                    <span>
                      {activity.description ||
                        "—"}
                    </span>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </section>


      {/* ======================================================
          QUICK LINKS
      ====================================================== */}

      <section className="quick-links-section">

        <h2>
          Quick Links / Next
          Actions
        </h2>


        <div className="quick-links-grid">

          <QuickLink
            icon={Route}
            title="Go to Delivery Planning"
            description="Allocate orders and plan trips"
            onClick={() =>
              navigate(
                "/dispatcher/planning"
              )
            }
          />


          <QuickLink
            icon={Boxes}
            title="Go to Loading Coordination"
            description="Track loading progress"
            onClick={() =>
              navigate(
                "/dispatcher/loading"
              )
            }
          />


          <QuickLink
            icon={MapPin}
            title="Go to Live Delivery Monitoring"
            description="Track vehicles and set alerts"
            onClick={() =>
              navigate(
                "/dispatcher/live"
              )
            }
          />


          <QuickLink
            icon={BarChart3}
            title="Go to Reports & Capacity"
            description="View performance and vehicle capacity"
            onClick={() =>
              navigate(
                "/dispatcher/reports"
              )
            }
          />

        </div>

      </section>

    </DispatcherLayout>
  );
}


/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
}) {
  return (
    <article className="dashboard-stat-card">

      <div
        className={
          `dashboard-stat-icon ${tone}`
        }
      >

        <Icon
          size={22}
        />

      </div>


      <div>

        <span className="dashboard-stat-title">
          {title}
        </span>


        <div className="dashboard-stat-value-row">

          <strong>
            {value}
          </strong>


          {change && (
            <span className="dashboard-stat-change">
              {change}
            </span>
          )}

        </div>

      </div>

    </article>
  );
}


/* ==========================================================
   READINESS ROW
========================================================== */

function ReadinessRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="readiness-row">

      <div className="readiness-label">

        <Icon
          size={18}
        />

        <span>
          {label}
        </span>

      </div>


      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ==========================================================
   SEVERITY BADGE
========================================================== */

function SeverityBadge({
  severity,
}) {
  const normalized =
    String(
      severity || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );


  return (
    <span
      className={
        `severity-badge ${normalized}`
      }
    >
      {severity || "—"}
    </span>
  );
}


/* ==========================================================
   TRIP STATUS BADGE
========================================================== */

function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );


  return (
    <span
      className={
        `trip-status-badge ${normalized}`
      }
    >
      {status || "—"}
    </span>
  );
}


/* ==========================================================
   EMPTY STATE
========================================================== */

function EmptyBlock({
  text,
}) {
  return (
    <div className="dashboard-empty-block">
      {text}
    </div>
  );
}


/* ==========================================================
   QUICK LINK
========================================================== */

function QuickLink({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      className="quick-link-card"
      onClick={onClick}
    >

      <div className="quick-link-icon">

        <Icon
          size={21}
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


      <ChevronRight
        size={20}
        className="quick-link-arrow"
      />

    </button>
  );
}


export default DispatcherDashboard;