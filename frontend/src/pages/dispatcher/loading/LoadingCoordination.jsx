import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DispatcherLayout
  from "../../../components/dispatcher/DispatcherLayout";

import api
  from "../../../services/api";


function LoadingCoordination() {
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

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("ALL");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    loadingData,
    setLoadingData,
  ] = useState(null);

  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/dispatcher/loading",
            {
              params: {
                date: selectedDate,
                depot:
                  selectedDepot === "ALL"
                    ? undefined
                    : selectedDepot,
              },
            }
          );

        if (!mounted) {
          return;
        }

        const data =
          response.data?.data ??
          response.data;

        setLoadingData(data);

        if (
          Array.isArray(
            data?.trips
          ) &&
          data.trips.length > 0
        ) {
          setSelectedTrip(
            data.trips[0]
          );
        } else {
          setSelectedTrip(null);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        setLoadingData(null);
        setSelectedTrip(null);

        setError(
          err.response?.data?.message ||
          "Loading coordination data is currently unavailable."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [
    selectedDate,
    selectedDepot,
  ]);


  const trips =
    Array.isArray(
      loadingData?.trips
    )
      ? loadingData.trips
      : [];


  const summary =
    loadingData?.summary || {};


  const filteredTrips =
    useMemo(() => {
      return trips.filter(
        (trip) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            !search ||
            String(
              trip.tripNo ||
              trip.tripId ||
              ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              trip.vehicle ||
              trip.vehicleId ||
              ""
            )
              .toLowerCase()
              .includes(search);

          const matchesStatus =
            selectedStatus ===
              "ALL" ||
            trip.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      trips,
      searchTerm,
      selectedStatus,
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

      <div className="loading-page">

        {/* HEADER */}

        <div className="loading-header">

          <div>
            <h1>
              Loading Coordination
            </h1>

            <p>
              Monitor published trips and coordinate
              loading activities before departure.
            </p>
          </div>


          <div className="loading-filters">

            <div className="loading-filter">

              <CalendarDays
                size={16}
              />

              <div>
                <span>
                  Delivery Date
                </span>

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedDate(
                      event.target.value
                    )
                  }
                />
              </div>

            </div>


            <div className="loading-filter">

              <MapPin
                size={16}
              />

              <div>
                <span>
                  Depot
                </span>

                <select
                  value={
                    selectedDepot
                  }
                  onChange={(
                    event
                  ) =>
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

            </div>

          </div>

        </div>


        {/* TABS */}

        <div className="loading-tabs">

          <button
            type="button"
            className="loading-tab active"
          >
            Loading Overview
          </button>

          <button
            type="button"
            className="loading-tab"
            onClick={() => {
              window.location.href =
                "/dispatcher/loading/exceptions";
            }}
          >
            Loading Exceptions
          </button>

        </div>


        {error && (
          <div className="loading-error">
            {error}
          </div>
        )}


        {/* SUMMARY */}

        <div className="loading-summary-grid">

          <SummaryCard
            icon={PackageCheck}
            label="Awaiting Loading"
            value={showValue(
              summary.awaitingLoading
            )}
            tone="orange"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Currently Loading"
            value={showValue(
              summary.currentlyLoading
            )}
            tone="blue"
          />

          <SummaryCard
            icon={Truck}
            label="Ready Awaiting Release"
            value={showValue(
              summary.readyAwaitingRelease
            )}
            tone="green"
          />

          <SummaryCard
            icon={AlertTriangle}
            label="Exceptions Reported"
            value={showValue(
              summary.exceptionsReported
            )}
            tone="red"
          />

        </div>


        {/* MAIN */}

        <div className="loading-main-grid">

          {/* LEFT TABLE */}

          <section className="loading-panel">

            <div className="panel-header">

              <h2>
                Published Trips
              </h2>


              <div className="table-controls">

                <div className="search-box">
                  <Search
                    size={14}
                  />

                  <input
                    type="text"
                    placeholder="Search trips, vehicle or orders..."
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


                <select
                  value={
                    selectedStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedStatus(
                      event.target.value
                    )
                  }
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  <option value="AWAITING_LOADING">
                    Awaiting Loading
                  </option>

                  <option value="LOADING">
                    Loading
                  </option>

                  <option value="READY">
                    Ready
                  </option>

                  <option value="EXCEPTION_REPORTED">
                    Exception Reported
                  </option>
                </select>

              </div>

            </div>


            <div className="loading-table-wrapper">

              <table className="loading-table">

                <thead>
                  <tr>
                    <th>
                      Trip No.
                    </th>

                    <th>
                      Vehicle
                    </th>

                    <th>
                      Depot
                    </th>

                    <th>
                      Planned Departure
                    </th>

                    <th>
                      Orders
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Progress
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {loading ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="empty-table"
                      >
                        Loading published trips...
                      </td>
                    </tr>

                  ) : filteredTrips.length ===
                  0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="empty-table"
                      >
                        No published trips available.
                      </td>
                    </tr>

                  ) : (

                    filteredTrips.map(
                      (
                        trip,
                        index
                      ) => (

                        <tr
                          key={
                            trip.id ||
                            trip.tripId ||
                            index
                          }
                          className={
                            selectedTrip?.id ===
                            trip.id
                              ? "selected-row"
                              : ""
                          }
                          onClick={() =>
                            setSelectedTrip(
                              trip
                            )
                          }
                        >

                          <td>
                            <strong>
                              {
                                trip.tripNo ||
                                trip.tripId ||
                                "—"
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              trip.vehicle ||
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
                              trip.plannedDeparture ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              trip.orderCount ??
                              "—"
                            }
                          </td>

                          <td>

                            <StatusBadge
                              status={
                                trip.status
                              }
                            />

                          </td>

                          <td>

                            <ProgressBar
                              value={
                                trip.progress
                              }
                            />

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>


            <div className="loading-table-footer">

              Showing{" "}
              {filteredTrips.length} of{" "}
              {showValue(
                loadingData
                  ?.totalPublishedTrips
              )}{" "}
              published trips

            </div>

          </section>


          {/* RIGHT DETAILS */}

          <section className="loading-details">

            {!selectedTrip ? (

              <div className="no-selected-trip">

                <Truck
                  size={30}
                />

                <strong>
                  No trip selected
                </strong>

                <span>
                  Select a published trip
                  to review its loading
                  progress.
                </span>

              </div>

            ) : (

              <>

                <div className="trip-detail-heading">

                  <div>
                    <h2>
                      {
                        selectedTrip.tripNo ||
                        selectedTrip.tripId
                      }
                      {" · "}
                      {
                        selectedTrip.vehicle ||
                        selectedTrip.vehicleId
                      }
                    </h2>

                    <StatusBadge
                      status={
                        selectedTrip.status
                      }
                    />
                  </div>


                  <strong>
                    {showValue(
                      selectedTrip.progress
                    )}
                    %
                  </strong>

                </div>


                <div className="trip-info-grid">

                  <DetailItem
                    icon={Truck}
                    label="Vehicle Type"
                    value={
                      selectedTrip.vehicleType
                    }
                  />

                  <DetailItem
                    icon={MapPin}
                    label="Depot"
                    value={
                      selectedTrip.depot
                    }
                  />

                  <DetailItem
                    icon={Clock3}
                    label="Planned Departure"
                    value={
                      selectedTrip.plannedDeparture
                    }
                  />

                  <DetailItem
                    icon={ClipboardList}
                    label="Assigned Orders"
                    value={
                      selectedTrip.orderCount
                    }
                  />

                  <DetailItem
                    icon={MapPin}
                    label="Delivery Stops"
                    value={
                      selectedTrip.stopCount
                    }
                  />

                  <DetailItem
                    icon={PackageCheck}
                    label="Temperature"
                    value={
                      selectedTrip.temperature
                    }
                  />

                </div>


                <DetailSection
                  title="Loading Progress"
                >

                  <LoadingSteps
                    steps={
                      selectedTrip.loadingSteps
                    }
                  />

                </DetailSection>


                <div className="details-two-column">

                  <DetailSection
                    title={`Assigned Orders (${showValue(
                      selectedTrip.orderCount
                    )})`}
                  >

                    <AssignedOrders
                      orders={
                        selectedTrip.orders
                      }
                    />

                  </DetailSection>


                  <DetailSection
                    title={`Planned Stop Sequence (${showValue(
                      selectedTrip.stopCount
                    )})`}
                  >

                    <StopSequence
                      stops={
                        selectedTrip.stops
                      }
                    />

                  </DetailSection>

                </div>


                <DetailSection
                  title="Latest Loader Update"
                >

                  {selectedTrip
                    .latestLoaderUpdate ? (

                    <div className="loader-update">

                      <div className="loader-avatar">
                        {
                          selectedTrip
                            .latestLoaderUpdate
                            .initials ||
                          "L"
                        }
                      </div>


                      <div>
                        <strong>
                          {
                            selectedTrip
                              .latestLoaderUpdate
                              .name ||
                            "Loader"
                          }
                        </strong>

                        <span>
                          {
                            selectedTrip
                              .latestLoaderUpdate
                              .time ||
                            "—"
                          }
                        </span>

                        <p>
                          {
                            selectedTrip
                              .latestLoaderUpdate
                              .message ||
                            "—"
                          }
                        </p>
                      </div>

                    </div>

                  ) : (

                    <div className="empty-detail">
                      No loader updates available.
                    </div>

                  )}

                </DetailSection>

              </>

            )}

          </section>

        </div>

      </div>


      <style>{`

        .loading-page {
          width: 100%;
        }

        .loading-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .loading-header h1 {
          margin: 0;
          color: #183f34;
          font-size: 27px;
        }

        .loading-header p {
          margin: 6px 0 0;
          color: #7d8c86;
          font-size: 11px;
        }

        .loading-filters {
          display: flex;
          gap: 10px;
        }

        .loading-filter {
          min-width: 165px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border: 1px solid #dfe8e4;
          border-radius: 8px;
          background: #fff;
        }

        .loading-filter svg {
          color: #29a979;
        }

        .loading-filter div {
          display: flex;
          flex-direction: column;
        }

        .loading-filter span {
          color: #8a9792;
          font-size: 7px;
        }

        .loading-filter input,
        .loading-filter select {
          border: none;
          outline: none;
          background: transparent;
          color: #355449;
          font-family: inherit;
          font-size: 9px;
          font-weight: 600;
        }

        .loading-tabs {
          display: flex;
          gap: 26px;
          margin-bottom: 18px;
          border-bottom: 1px solid #dfe7e3;
        }

        .loading-tab {
          padding: 0 0 10px;
          border: none;
          background: transparent;
          color: #71827b;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .loading-tab.active {
          border-bottom: 2px solid #20b879;
          color: #168d62;
          font-weight: 700;
        }

        .loading-error {
          margin-bottom: 12px;
          padding: 10px 12px;
          border: 1px solid #edc1c1;
          border-radius: 7px;
          background: #fff3f3;
          color: #b85c5c;
          font-size: 9px;
        }

        .loading-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
          margin-bottom: 14px;
        }

        .loading-summary-card {
          min-height: 72px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border: 1px solid #dfe7e3;
          border-radius: 7px;
          background: #fff;
        }

        .loading-summary-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .loading-summary-icon.orange {
          background: #fff0df;
          color: #cb7c30;
        }

        .loading-summary-icon.blue {
          background: #e6f3fa;
          color: #3183a7;
        }

        .loading-summary-icon.green {
          background: #e3f7ec;
          color: #268a62;
        }

        .loading-summary-icon.red {
          background: #fde7e7;
          color: #c96060;
        }

        .loading-summary-card span {
          color: #7f8c87;
          font-size: 8px;
        }

        .loading-summary-card strong {
          display: block;
          margin-top: 2px;
          color: #21483c;
          font-size: 19px;
        }

        .loading-main-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
        }

        .loading-panel,
        .loading-details {
          border: 1px solid #dfe7e3;
          border-radius: 8px;
          background: #fff;
        }

        .panel-header {
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 12px;
          border-bottom: 1px solid #edf1ef;
        }

        .panel-header h2 {
          margin: 0;
          color: #284b40;
          font-size: 11px;
        }

        .table-controls {
          display: flex;
          gap: 6px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 5px;
          width: 180px;
          height: 30px;
          padding: 0 8px;
          border: 1px solid #dfe6e3;
          border-radius: 5px;
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 7px;
        }

        .table-controls select {
          height: 30px;
          border: 1px solid #dfe6e3;
          border-radius: 5px;
          background: #fff;
          font-family: inherit;
          font-size: 7px;
        }

        .loading-table-wrapper {
          overflow-x: auto;
        }

        .loading-table {
          width: 100%;
          border-collapse: collapse;
        }

        .loading-table th {
          padding: 8px 7px;
          background: #f7f9f8;
          color: #798982;
          text-align: left;
          font-size: 7px;
        }

        .loading-table td {
          padding: 10px 7px;
          border-top: 1px solid #edf1ef;
          color: #53675f;
          font-size: 7.5px;
        }

        .loading-table tbody tr {
          cursor: pointer;
        }

        .loading-table tbody tr:hover,
        .selected-row {
          background: #f0fbf6;
        }

        .loading-table td strong {
          color: #24835f;
        }

        .empty-table {
          height: 260px;
          color: #8c9893 !important;
          text-align: center;
        }

        .loading-table-footer {
          padding: 12px;
          color: #87928e;
          font-size: 7px;
        }

        .status-badge {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 8px;
          font-size: 6.5px;
          font-weight: 700;
        }

        .status-badge.loading {
          background: #e4f3fb;
          color: #317fa2;
        }

        .status-badge.ready {
          background: #dff5e8;
          color: #287d5c;
        }

        .status-badge.awaiting_loading {
          background: #fff0df;
          color: #b97631;
        }

        .status-badge.exception_reported {
          background: #fde5e5;
          color: #bd5b5b;
        }

        .status-badge.unknown {
          background: #eef1ef;
          color: #718078;
        }

        .progress-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .progress-track {
          width: 55px;
          height: 5px;
          border-radius: 5px;
          background: #e6ece9;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #20b879;
        }

        .progress-wrapper span {
          color: #78877f;
          font-size: 6.5px;
        }

        .loading-details {
          padding: 12px;
        }

        .no-selected-trip {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #899690;
          text-align: center;
          font-size: 8px;
        }

        .trip-detail-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .trip-detail-heading h2 {
          margin: 0 0 5px;
          color: #25483d;
          font-size: 13px;
        }

        .trip-detail-heading > strong {
          color: #24835f;
          font-size: 9px;
        }

        .trip-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid #e0e7e3;
          border-radius: 6px;
          overflow: hidden;
        }

        .detail-item {
          display: flex;
          gap: 7px;
          padding: 9px;
          border-right: 1px solid #edf1ef;
          border-bottom: 1px solid #edf1ef;
        }

        .detail-item svg {
          color: #2e9b72;
        }

        .detail-item span {
          display: block;
          color: #8a9692;
          font-size: 6px;
        }

        .detail-item strong {
          display: block;
          margin-top: 2px;
          color: #3e584f;
          font-size: 7px;
        }

        .detail-section {
          margin-top: 10px;
          padding: 10px;
          border: 1px solid #e0e7e3;
          border-radius: 6px;
        }

        .detail-section h3 {
          margin: 0 0 9px;
          color: #315046;
          font-size: 8px;
        }

        .details-two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .loading-steps {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 5px;
        }

        .loading-step {
          text-align: center;
          color: #87948f;
          font-size: 6px;
        }

        .loading-step-dot {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto auto 5px;
          border-radius: 50%;
          background: #e5ebe8;
          color: #86938e;
        }

        .loading-step.done .loading-step-dot {
          background: #20b879;
          color: #fff;
        }

        .assigned-orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .assigned-orders-table th,
        .assigned-orders-table td {
          padding: 5px;
          border-bottom: 1px solid #edf1ef;
          text-align: left;
          font-size: 6px;
        }

        .assigned-orders-table th {
          color: #87948f;
        }

        .assigned-orders-table td {
          color: #53665e;
        }

        .stop-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .stop-number {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #20b879;
          color: #fff;
          font-size: 6px;
        }

        .stop-item div {
          display: flex;
          flex-direction: column;
        }

        .stop-item strong {
          color: #425a52;
          font-size: 6.5px;
        }

        .stop-item span {
          color: #8b9792;
          font-size: 6px;
        }

        .loader-update {
          display: flex;
          gap: 8px;
          padding: 9px;
          border-radius: 5px;
          background: #eaf9f1;
        }

        .loader-avatar {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: #20b879;
          color: #fff;
          font-size: 7px;
          font-weight: 700;
        }

        .loader-update div:last-child {
          display: flex;
          flex-direction: column;
        }

        .loader-update strong {
          color: #35594c;
          font-size: 7px;
        }

        .loader-update span,
        .loader-update p {
          margin: 2px 0 0;
          color: #71837a;
          font-size: 6.5px;
        }

        .empty-detail {
          color: #87948f;
          font-size: 7px;
        }

        @media (max-width: 1200px) {
          .loading-main-grid {
            grid-template-columns: 1fr;
          }

          .loading-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 760px) {
          .loading-header {
            flex-direction: column;
          }

          .loading-filters {
            flex-direction: column;
          }

          .loading-summary-grid,
          .details-two-column {
            grid-template-columns: 1fr;
          }

          .trip-info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

      `}</style>

    </DispatcherLayout>
  );
}


function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}) {
  return (
    <div className="loading-summary-card">

      <div
        className={
          `loading-summary-icon ${tone}`
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


function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status || "UNKNOWN"
    ).toLowerCase();

  const labels = {
    loading:
      "Loading",

    ready:
      "Ready",

    awaiting_loading:
      "Awaiting Loading",

    exception_reported:
      "Exception Reported",

    unknown:
      "—",
  };

  return (
    <span
      className={
        `status-badge ${normalized}`
      }
    >
      {labels[normalized] ||
        status ||
        "—"}
    </span>
  );
}


function ProgressBar({
  value,
}) {
  const numeric =
    Number(value) || 0;

  return (
    <div className="progress-wrapper">

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width:
              `${Math.min(
                numeric,
                100
              )}%`,
          }}
        />
      </div>

      <span>
        {numeric}%
      </span>

    </div>
  );
}


function DetailItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <Icon
        size={14}
      />

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value ?? "—"}
        </strong>
      </div>

    </div>
  );
}


function DetailSection({
  title,
  children,
}) {
  return (
    <section className="detail-section">

      <h3>
        {title}
      </h3>

      {children}

    </section>
  );
}


function LoadingSteps({
  steps,
}) {
  const fallback = [
    {
      key: "assigned",
      label: "Assigned",
    },
    {
      key: "picking",
      label: "Picking",
    },
    {
      key: "loading",
      label: "Loading",
    },
    {
      key: "ready",
      label: "Ready",
    },
    {
      key: "released",
      label: "Released",
    },
  ];

  const items =
    Array.isArray(steps) &&
    steps.length
      ? steps
      : fallback;


  return (
    <div className="loading-steps">

      {items.map(
        (
          step,
          index
        ) => (

          <div
            key={
              step.key ||
              index
            }
            className={
              `loading-step ${
                step.completed
                  ? "done"
                  : ""
              }`
            }
          >

            <div className="loading-step-dot">
              {step.completed
                ? "✓"
                : index + 1}
            </div>

            <span>
              {step.label}
            </span>

          </div>

        )
      )}

    </div>
  );
}


function AssignedOrders({
  orders,
}) {
  if (
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    return (
      <div className="empty-detail">
        No assigned-order data available.
      </div>
    );
  }

  return (
    <table className="assigned-orders-table">

      <thead>
        <tr>
          <th>
            Order No.
          </th>

          <th>
            Customer
          </th>

          <th>
            Qty
          </th>

          <th>
            Temp.
          </th>
        </tr>
      </thead>

      <tbody>

        {orders.map(
          (
            order,
            index
          ) => (

            <tr
              key={
                order.id ||
                order.orderId ||
                index
              }
            >
              <td>
                {
                  order.orderId ||
                  "—"
                }
              </td>

              <td>
                {
                  order.customer ||
                  order.outlet ||
                  "—"
                }
              </td>

              <td>
                {
                  order.quantity ??
                  "—"
                }
              </td>

              <td>
                {
                  order.temperature ||
                  "—"
                }
              </td>
            </tr>

          )
        )}

      </tbody>

    </table>
  );
}


function StopSequence({
  stops,
}) {
  if (
    !Array.isArray(stops) ||
    stops.length === 0
  ) {
    return (
      <div className="empty-detail">
        No stop-sequence data available.
      </div>
    );
  }

  return (
    <div>

      {stops.map(
        (
          stop,
          index
        ) => (

          <div
            className="stop-item"
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
                  stop.outlet ||
                  "—"
                }
              </strong>

              <span>
                {
                  stop.time ||
                  stop.eta ||
                  "—"
                }
              </span>
            </div>

          </div>

        )
      )}

    </div>
  );
}


export default LoadingCoordination;