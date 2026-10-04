import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
  UserRound,
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

import api
  from "../../../services/api";


function LoadingExceptions() {
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


  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("ALL");


  const [
    selectedType,
    setSelectedType,
  ] = useState("ALL");


  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState("ALL");


  const [
    pageData,
    setPageData,
  ] = useState(null);


  const [
    selectedException,
    setSelectedException,
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
    saving,
    setSaving,
  ] = useState(false);


  const [
    decisionMessage,
    setDecisionMessage,
  ] = useState("");


  useEffect(() => {
    let mounted = true;


    async function loadExceptions() {
      try {
        setLoading(true);
        setError("");


        const response =
          await api.get(
            "/dispatcher/loading/exceptions",
            {
              params: {
                date:
                  selectedDate,

                depot:
                  selectedDepot ===
                  "ALL"
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


        setPageData(data);


        const exceptions =
          Array.isArray(
            data?.exceptions
          )
            ? data.exceptions
            : [];


        setSelectedException(
          exceptions.length > 0
            ? exceptions[0]
            : null
        );
      } catch (err) {
        if (!mounted) {
          return;
        }


        setPageData(null);
        setSelectedException(null);


        setError(
          err.response?.data
            ?.message ||
          "Loading exception data is currently unavailable."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }


    loadExceptions();


    return () => {
      mounted = false;
    };
  }, [
    selectedDate,
    selectedDepot,
  ]);


  const exceptions =
    Array.isArray(
      pageData?.exceptions
    )
      ? pageData.exceptions
      : [];


  const summary =
    pageData?.summary || {};


  const vehicles =
    useMemo(() => {
      const values =
        exceptions
          .map(
            (item) =>
              item.vehicleId ||
              item.vehicle
          )
          .filter(Boolean);

      return [
        ...new Set(values),
      ];
    }, [exceptions]);


  const filteredExceptions =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();


      return exceptions.filter(
        (item) => {
          const matchesSearch =
            !search ||
            String(
              item.exceptionId ||
              item.id ||
              ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              item.tripNo ||
              item.tripId ||
              ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              item.vehicleId ||
              item.vehicle ||
              ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              item.orderId ||
              ""
            )
              .toLowerCase()
              .includes(search);


          const matchesStatus =
            selectedStatus ===
              "ALL" ||
            item.status ===
              selectedStatus;


          const matchesType =
            selectedType ===
              "ALL" ||
            item.exceptionType ===
              selectedType;


          const matchesVehicle =
            selectedVehicle ===
              "ALL" ||
            (
              item.vehicleId ||
              item.vehicle
            ) ===
              selectedVehicle;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesType &&
            matchesVehicle
          );
        }
      );
    }, [
      exceptions,
      searchTerm,
      selectedStatus,
      selectedType,
      selectedVehicle,
    ]);


  async function saveDecision(
    action
  ) {
    if (!selectedException) {
      return;
    }


    try {
      setSaving(true);
      setDecisionMessage("");
      setError("");


      const id =
        selectedException.id ||
        selectedException
          .exceptionId;


      const response =
        await api.post(
          `/dispatcher/loading/exceptions/${id}/decision`,
          {
            action,
          }
        );


      setDecisionMessage(
        response.data?.message ||
        "Decision saved successfully."
      );


      setSelectedException(
        (current) => ({
          ...current,
          ...(
            response.data
              ?.exception || {}
          ),
        })
      );
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
        "Unable to save the exception decision."
      );
    } finally {
      setSaving(false);
    }
  }


  const displayValue = (
    value
  ) =>
    value === 0 ||
    value
      ? value
      : "—";


  return (
    <DispatcherLayout>

      <div className="loading-exceptions-page">


        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <header className="loading-exceptions-header">

          <div>
            <h1>
              Loading Coordination
            </h1>

            <p>
              Review reported loading issues
              and recent operational resolutions
              before departure.
            </p>
          </div>


          <div className="loading-exception-header-filters">

            <div className="exception-header-filter">
              <span>
                Delivery Date
              </span>

              <input
                type="date"
                value={selectedDate}
                onChange={(
                  event
                ) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
              />
            </div>


            <div className="exception-header-filter">
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
                  Peliyagoda
                </option>

                <option value="Kandy">
                  Kandy
                </option>
              </select>
            </div>


            <span className="published-chip">
              ● Published Trips
            </span>

          </div>

        </header>


        {/* ==========================================
            TABS
        ========================================== */}

        <div className="loading-exception-tabs">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dispatcher/loading"
              )
            }
          >
            Loading Overview
          </button>


          <button
            type="button"
            className="active"
          >
            Loading Exceptions
          </button>

        </div>


        {error && (
          <div className="loading-exception-error">
            {error}
          </div>
        )}


        {decisionMessage && (
          <div className="loading-exception-success">
            {decisionMessage}
          </div>
        )}


        {/* ==========================================
            SUMMARY CARDS
        ========================================== */}

        <section className="exception-summary-grid">

          <SummaryCard
            icon={AlertTriangle}
            title="Open Exceptions"
            value={
              displayValue(
                summary.openExceptions
              )
            }
            suffix="issues"
            tone="red"
          />


          <SummaryCard
            icon={Box}
            title="Missing Items"
            value={
              displayValue(
                summary.missingItems
              )
            }
            suffix="issues"
            tone="orange"
          />


          <SummaryCard
            icon={Package}
            title="Damaged Items"
            value={
              displayValue(
                summary.damagedItems
              )
            }
            suffix="issues"
            tone="blue"
          />


          <SummaryCard
            icon={CheckCircle2}
            title="Resolved Trips"
            value={
              displayValue(
                summary.resolvedTrips
              )
            }
            suffix="issues"
            tone="green"
          />

        </section>


        {/* ==========================================
            MAIN CONTENT
        ========================================== */}

        <div className="exception-main-grid">


          {/* LEFT SIDE */}

          <section className="exception-table-panel">

            <h2>
              Reported Exceptions
            </h2>


            <div className="exception-table-tools">

              <div className="exception-search">
                <Search size={15} />

                <input
                  type="text"
                  placeholder="Search exceptions, trip no, vehicle or order..."
                  value={searchTerm}
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

                <option value="OPEN">
                  Open
                </option>

                <option value="UNDER_REVIEW">
                  Under Review
                </option>

                <option value="RESOLVED">
                  Resolved
                </option>
              </select>


              <select
                value={
                  selectedType
                }
                onChange={(
                  event
                ) =>
                  setSelectedType(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Exception Types
                </option>

                <option value="MISSING_ITEMS">
                  Missing Items
                </option>

                <option value="DAMAGED_ITEMS">
                  Damaged Items
                </option>

                <option value="QUANTITY_MISMATCH">
                  Quantity Mismatch
                </option>

                <option value="OTHER">
                  Other Issue
                </option>
              </select>


              <select
                value={
                  selectedVehicle
                }
                onChange={(
                  event
                ) =>
                  setSelectedVehicle(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Vehicles
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle}
                      value={vehicle}
                    >
                      {vehicle}
                    </option>
                  )
                )}
              </select>

            </div>


            <div className="exception-table-wrapper">

              <table className="exception-table">

                <thead>
                  <tr>
                    <th></th>
                    <th>
                      Exception ID
                    </th>
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
                      Exception Type
                    </th>
                    <th>
                      Reported Time
                    </th>
                    <th>
                      Status
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {loading ? (

                    <tr>
                      <td
                        colSpan="8"
                        className="exception-empty"
                      >
                        Loading exceptions...
                      </td>
                    </tr>

                  ) : filteredExceptions
                      .length === 0 ? (

                    <tr>
                      <td
                        colSpan="8"
                        className="exception-empty"
                      >
                        No loading exceptions available.
                      </td>
                    </tr>

                  ) : (

                    filteredExceptions.map(
                      (
                        item,
                        index
                      ) => {

                        const id =
                          item.exceptionId ||
                          item.id;


                        const selected =
                          (
                            selectedException
                              ?.exceptionId ||
                            selectedException
                              ?.id
                          ) === id;


                        return (
                          <tr
                            key={
                              id ||
                              index
                            }
                            className={
                              selected
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              setSelectedException(
                                item
                              )
                            }
                          >

                            <td>
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                readOnly
                              />
                            </td>


                            <td className="exception-link">
                              {
                                id ||
                                "—"
                              }
                            </td>


                            <td>
                              {
                                item.tripNo ||
                                item.tripId ||
                                "—"
                              }
                            </td>


                            <td>
                              {
                                item.vehicleId ||
                                item.vehicle ||
                                "—"
                              }
                            </td>


                            <td>
                              {
                                item.depot ||
                                "—"
                              }
                            </td>


                            <td>
                              <ExceptionTypeBadge
                                type={
                                  item.exceptionType
                                }
                              />
                            </td>


                            <td>
                              {
                                item.reportedTime ||
                                "—"
                              }
                            </td>


                            <td>
                              <StatusBadge
                                status={
                                  item.status
                                }
                              />
                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>


            <div className="exception-table-footer">

              Showing{" "}
              {
                filteredExceptions
                  .length
              }{" "}
              of{" "}
              {
                exceptions.length
              }{" "}
              reported exceptions

            </div>

          </section>


          {/* RIGHT DETAILS */}

          <section className="exception-details-panel">

            {!selectedException ? (

              <div className="exception-no-selection">

                <AlertTriangle
                  size={30}
                />

                <strong>
                  No exception selected
                </strong>

                <span>
                  Select an exception to
                  review its details.
                </span>

              </div>

            ) : (

              <>

                <div className="exception-detail-title">

                  <div>
                    <h2>
                      {
                        selectedException
                          .exceptionId ||
                        selectedException
                          .id ||
                        "—"
                      }
                      {" • "}
                      {
                        selectedException
                          .tripNo ||
                        selectedException
                          .tripId ||
                        "—"
                      }
                      {" • "}
                      {
                        selectedException
                          .vehicleId ||
                        selectedException
                          .vehicle ||
                        "—"
                      }
                    </h2>
                  </div>


                  <StatusBadge
                    status={
                      selectedException
                        .status
                    }
                  />

                </div>


                {/* DETAILS */}

                <div className="exception-card">

                  <h3>
                    Exception Details
                  </h3>


                  <div className="exception-detail-grid">

                    <InfoItem
                      icon={MapPin}
                      label="Depot"
                      value={
                        selectedException
                          .depot
                      }
                    />

                    <InfoItem
                      icon={Clock3}
                      label="Reported Time"
                      value={
                        selectedException
                          .reportedTime
                      }
                    />

                    <InfoItem
                      icon={UserRound}
                      label="Loader Name"
                      value={
                        selectedException
                          .loaderName
                      }
                    />

                    <InfoItem
                      icon={Truck}
                      label="Planned Departure"
                      value={
                        selectedException
                          .plannedDeparture
                      }
                    />

                  </div>

                </div>


                {/* DISCREPANCY */}

                <div className="exception-card discrepancy-card">

                  <h3>
                    Item Discrepancy
                  </h3>


                  <div className="discrepancy-grid">

                    <InfoValue
                      label="Order No."
                      value={
                        selectedException
                          .orderId
                      }
                    />

                    <InfoValue
                      label="Customer"
                      value={
                        selectedException
                          .customer
                      }
                    />

                    <InfoValue
                      label="Item"
                      value={
                        selectedException
                          .item
                      }
                    />

                    <InfoValue
                      label="Expected"
                      value={
                        selectedException
                          .expectedQuantity
                      }
                    />

                    <InfoValue
                      label="Available"
                      value={
                        selectedException
                          .availableQuantity
                      }
                      danger
                    />

                  </div>

                </div>


                {/* LOADER NOTE */}

                <div className="exception-card">

                  <h3>
                    Loader Note
                  </h3>

                  <p className="loader-note">
                    {
                      selectedException
                        .loaderNote ||
                      "No loader note available."
                    }
                  </p>

                </div>


                {/* AFFECTED ORDERS */}

                <div className="exception-card">

                  <h3>
                    Assigned Orders Affected (
                    {
                      Array.isArray(
                        selectedException
                          .affectedOrders
                      )
                        ? selectedException
                            .affectedOrders
                            .length
                        : 0
                    }
                    )
                  </h3>


                  <AffectedOrdersTable
                    orders={
                      selectedException
                        .affectedOrders
                    }
                  />

                </div>

              </>

            )}

          </section>

        </div>


        {/* ==========================================
            RESOLUTION
        ========================================== */}

        <section className="resolution-panel">

          <div className="resolution-heading">

            <h2>
              Resolution & Decision
            </h2>

            <p>
              Actions, history, and final
              authorization for this exception.
            </p>

          </div>


          {!selectedException ? (

            <div className="resolution-empty">
              Select an exception to
              review resolution options.
            </div>

          ) : (

            <div className="resolution-grid">


              <div>

                <h3>
                  Resolution Actions
                </h3>


                <div className="resolution-actions">

                  <button
                    type="button"
                    className="replacement-button"
                    disabled={saving}
                    onClick={() =>
                      saveDecision(
                        "REQUEST_REPLACEMENT"
                      )
                    }
                  >
                    Request Replacement
                  </button>


                  <button
                    type="button"
                    className="partial-button"
                    disabled={saving}
                    onClick={() =>
                      saveDecision(
                        "APPROVE_PARTIAL_LOAD"
                      )
                    }
                  >
                    ✓ Approve Partial Load
                  </button>

                </div>


                {selectedException
                  .status !==
                  "RESOLVED" && (

                  <div className="departure-warning">

                    <AlertTriangle
                      size={16}
                    />

                    <div>
                      <strong>
                        Departure cannot be authorized
                      </strong>

                      <span>
                        This exception must
                        be resolved or a
                        decision recorded
                        before departure.
                      </span>
                    </div>

                  </div>

                )}

              </div>


              <div>

                <h3>
                  Resolution History
                </h3>


                <ResolutionHistory
                  history={
                    selectedException
                      .resolutionHistory
                  }
                />

              </div>

            </div>

          )}

        </section>

      </div>


      {/* ==========================================
          PAGE CSS
      ========================================== */}

      <style>{`

        .loading-exceptions-page {
          width: 100%;
        }

        .loading-exceptions-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 18px;
        }

        .loading-exceptions-header h1 {
          margin: 0;
          color: #1d3f35;
          font-size: 27px;
          font-weight: 700;
        }

        .loading-exceptions-header p {
          margin: 5px 0 0;
          color: #7a8983;
          font-size: 11px;
        }

        .loading-exception-header-filters {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .exception-header-filter {
          min-width: 130px;
          padding: 7px 10px;
          border: 1px solid #e1e8e5;
          border-radius: 7px;
          background: white;
        }

        .exception-header-filter span {
          display: block;
          margin-bottom: 2px;
          color: #8b9792;
          font-size: 7px;
        }

        .exception-header-filter input,
        .exception-header-filter select {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #355247;
          font-size: 9px;
          font-family: inherit;
        }

        .published-chip {
          padding: 9px 12px;
          border-radius: 7px;
          background: #dcf8ef;
          color: #188360;
          font-size: 8px;
          font-weight: 700;
        }

        .loading-exception-tabs {
          display: flex;
          gap: 28px;
          margin-bottom: 16px;
          border-bottom: 1px solid #dfe7e3;
        }

        .loading-exception-tabs button {
          padding: 0 0 10px;
          border: none;
          background: transparent;
          color: #75847e;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .loading-exception-tabs button.active {
          border-bottom: 2px solid #1ba875;
          color: #16835f;
          font-weight: 700;
        }

        .loading-exception-error,
        .loading-exception-success {
          margin-bottom: 12px;
          padding: 10px 13px;
          border-radius: 7px;
          font-size: 9px;
        }

        .loading-exception-error {
          border: 1px solid #f0bbbb;
          background: #fff1f1;
          color: #b64b4b;
        }

        .loading-exception-success {
          border: 1px solid #b9e4cf;
          background: #ebfaf3;
          color: #23815e;
        }

        .exception-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
          margin-bottom: 14px;
        }

        .exception-summary-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 76px;
          padding: 12px;
          border: 1px solid #e2e7e5;
          border-radius: 8px;
          background: #fff;
        }

        .exception-summary-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .exception-summary-icon.red {
          background: #fee7e7;
          color: #d45b5b;
        }

        .exception-summary-icon.orange {
          background: #fff0da;
          color: #cb832d;
        }

        .exception-summary-icon.blue {
          background: #e5effc;
          color: #477ec6;
        }

        .exception-summary-icon.green {
          background: #e1f7ea;
          color: #2a9567;
        }

        .exception-summary-card span {
          display: block;
          color: #7e8b86;
          font-size: 7px;
          text-transform: uppercase;
        }

        .exception-summary-card strong {
          display: inline-block;
          margin-top: 3px;
          color: #294b40;
          font-size: 20px;
        }

        .exception-summary-card small {
          margin-left: 4px;
          color: #86938e;
          font-size: 7px;
        }

        .exception-main-grid {
          display: grid;
          grid-template-columns: 1.5fr .9fr;
          gap: 12px;
        }

        .exception-table-panel,
        .exception-details-panel,
        .resolution-panel {
          border: 1px solid #dfe7e3;
          border-radius: 9px;
          background: #fff;
        }

        .exception-table-panel {
          padding: 12px;
        }

        .exception-table-panel h2 {
          margin: 0 0 11px;
          color: #29483e;
          font-size: 13px;
        }

        .exception-table-tools {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
        }

        .exception-search {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          height: 32px;
          padding: 0 9px;
          border: 1px solid #dfe7e3;
          border-radius: 6px;
        }

        .exception-search svg {
          color: #8a9892;
        }

        .exception-search input {
          width: 100%;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 7px;
        }

        .exception-table-tools select {
          height: 32px;
          border: 1px solid #dfe7e3;
          border-radius: 6px;
          background: white;
          padding: 0 8px;
          font-family: inherit;
          color: #52675e;
          font-size: 7px;
        }

        .exception-table-wrapper {
          overflow-x: auto;
        }

        .exception-table {
          width: 100%;
          border-collapse: collapse;
        }

        .exception-table th {
          padding: 8px 6px;
          background: #f6f8f7;
          color: #75857e;
          text-align: left;
          font-size: 6.5px;
        }

        .exception-table td {
          padding: 9px 6px;
          border-bottom: 1px solid #edf1ef;
          color: #52655e;
          font-size: 7px;
        }

        .exception-table tbody tr {
          cursor: pointer;
        }

        .exception-table tbody tr:hover,
        .exception-table tbody tr.selected {
          background: #eefaf6;
        }

        .exception-link {
          color: #267fbd !important;
          text-decoration: underline;
          font-weight: 600;
        }

        .exception-empty {
          height: 220px;
          text-align: center;
          color: #8c9893 !important;
        }

        .exception-table-footer {
          padding-top: 12px;
          color: #89958f;
          font-size: 7px;
        }

        .exception-status,
        .exception-type {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 8px;
          font-size: 6px;
          font-weight: 700;
          white-space: nowrap;
        }

        .exception-status.open {
          background: #fee9e9;
          color: #c55252;
        }

        .exception-status.under_review {
          background: #fff0d6;
          color: #b77a29;
        }

        .exception-status.resolved {
          background: #dff5e8;
          color: #26805a;
        }

        .exception-status.unknown {
          background: #edf0ef;
          color: #6f7e77;
        }

        .exception-type.missing_items {
          background: #fff0d9;
          color: #bd7a26;
        }

        .exception-type.damaged_items {
          background: #e5eefc;
          color: #4379bc;
        }

        .exception-type.quantity_mismatch {
          background: #efe6fb;
          color: #8054b0;
        }

        .exception-type.other {
          background: #e1f6e9;
          color: #2a885f;
        }

        .exception-details-panel {
          padding: 12px;
        }

        .exception-no-selection {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 7px;
          color: #86938e;
          text-align: center;
          font-size: 8px;
        }

        .exception-detail-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .exception-detail-title h2 {
          margin: 0;
          color: #294b40;
          font-size: 13px;
        }

        .exception-card {
          margin-top: 9px;
          padding: 10px;
          border: 1px solid #e1e7e4;
          border-radius: 7px;
        }

        .exception-card h3 {
          margin: 0 0 9px;
          color: #3a554c;
          font-size: 8px;
          text-transform: uppercase;
        }

        .exception-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .exception-info-item {
          display: flex;
          gap: 6px;
        }

        .exception-info-item svg {
          color: #4f7467;
        }

        .exception-info-item span,
        .info-value span {
          display: block;
          color: #8b9792;
          font-size: 6px;
        }

        .exception-info-item strong,
        .info-value strong {
          display: block;
          margin-top: 2px;
          color: #455d54;
          font-size: 7px;
        }

        .discrepancy-card {
          border-color: #f2d7d7;
          background: #fff8f8;
        }

        .discrepancy-card h3 {
          color: #c05151;
        }

        .discrepancy-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 7px;
        }

        .info-value.danger strong {
          color: #c85858;
        }

        .loader-note {
          margin: 0;
          color: #54675f;
          font-size: 7.5px;
          line-height: 1.6;
        }

        .affected-table {
          width: 100%;
          border-collapse: collapse;
        }

        .affected-table th,
        .affected-table td {
          padding: 6px 4px;
          border-bottom: 1px solid #edf1ef;
          text-align: left;
          font-size: 6.5px;
        }

        .affected-table th {
          color: #82908a;
        }

        .affected-table td {
          color: #4f635b;
        }

        .affected-table td:first-child {
          color: #267db8;
          text-decoration: underline;
        }

        .resolution-panel {
          margin-top: 13px;
          padding: 13px;
        }

        .resolution-heading h2 {
          margin: 0;
          color: #29483e;
          font-size: 13px;
        }

        .resolution-heading p {
          margin: 3px 0 11px;
          color: #7d8b85;
          font-size: 7px;
        }

        .resolution-grid {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 24px;
        }

        .resolution-grid h3 {
          margin: 0 0 9px;
          color: #53675e;
          font-size: 7px;
          text-transform: uppercase;
        }

        .resolution-actions {
          display: flex;
          gap: 6px;
        }

        .resolution-actions button {
          height: 34px;
          padding: 0 11px;
          border-radius: 5px;
          font-family: inherit;
          font-size: 7px;
          cursor: pointer;
        }

        .replacement-button {
          border: 1px solid #16845e;
          background: white;
          color: #16845e;
        }

        .partial-button {
          border: 1px solid #16845e;
          background: #16845e;
          color: white;
        }

        .resolution-actions button:disabled {
          cursor: not-allowed;
          opacity: .6;
        }

        .departure-warning {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding: 10px;
          border: 1px solid #efc4c4;
          border-radius: 6px;
          background: #fff3f3;
          color: #b55353;
        }

        .departure-warning strong,
        .departure-warning span {
          display: block;
          font-size: 7px;
        }

        .departure-warning span {
          margin-top: 2px;
          color: #956a6a;
        }

        .history-item {
          position: relative;
          padding: 0 0 12px 16px;
          border-left: 1px solid #d7e4de;
        }

        .history-dot {
          position: absolute;
          left: -4px;
          top: 2px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #20b879;
        }

        .history-item span {
          display: block;
          color: #8a9691;
          font-size: 6px;
        }

        .history-item p {
          margin: 2px 0 0;
          color: #50645b;
          font-size: 7px;
        }

        .resolution-empty {
          padding: 20px;
          color: #89958f;
          text-align: center;
          font-size: 8px;
        }

        @media (max-width: 1200px) {
          .exception-main-grid {
            grid-template-columns: 1fr;
          }

          .exception-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 800px) {
          .loading-exceptions-header {
            flex-direction: column;
          }

          .loading-exception-header-filters,
          .exception-table-tools {
            flex-wrap: wrap;
          }

          .exception-summary-grid,
          .resolution-grid {
            grid-template-columns: 1fr;
          }

          .discrepancy-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

      `}</style>

    </DispatcherLayout>
  );
}


function SummaryCard({
  icon: Icon,
  title,
  value,
  suffix,
  tone,
}) {
  return (
    <div className="exception-summary-card">

      <div
        className={
          `exception-summary-icon ${tone}`
        }
      >
        <Icon size={18} />
      </div>


      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {suffix}
        </small>
      </div>

    </div>
  );
}


function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status ||
      "UNKNOWN"
    ).toLowerCase();


  const labels = {
    open:
      "Open",

    under_review:
      "Under Review",

    resolved:
      "Resolved",

    unknown:
      "—",
  };


  return (
    <span
      className={
        `exception-status ${normalized}`
      }
    >
      {
        labels[normalized] ||
        status ||
        "—"
      }
    </span>
  );
}


function ExceptionTypeBadge({
  type,
}) {
  const normalized =
    String(
      type ||
      "OTHER"
    ).toLowerCase();


  const labels = {
    missing_items:
      "Missing Items",

    damaged_items:
      "Damaged Items",

    quantity_mismatch:
      "Quantity Mismatch",

    other:
      "Other Issue",
  };


  return (
    <span
      className={
        `exception-type ${normalized}`
      }
    >
      {
        labels[normalized] ||
        type ||
        "—"
      }
    </span>
  );
}


function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="exception-info-item">

      <Icon size={14} />

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value || "—"}
        </strong>
      </div>

    </div>
  );
}


function InfoValue({
  label,
  value,
  danger = false,
}) {
  return (
    <div
      className={
        `info-value ${
          danger
            ? "danger"
            : ""
        }`
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}


function AffectedOrdersTable({
  orders,
}) {
  if (
    !Array.isArray(orders) ||
    orders.length === 0
  ) {
    return (
      <div className="resolution-empty">
        No affected-order data available.
      </div>
    );
  }


  return (
    <table className="affected-table">

      <thead>
        <tr>
          <th>
            Order No.
          </th>

          <th>
            Customer
          </th>

          <th>
            Item
          </th>

          <th>
            Qty
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
                  "—"
                }
              </td>


              <td>
                {
                  order.item ||
                  "—"
                }
              </td>


              <td>
                {
                  order.quantity ??
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


function ResolutionHistory({
  history,
}) {
  if (
    !Array.isArray(history) ||
    history.length === 0
  ) {
    return (
      <div className="resolution-empty">
        No resolution history available.
      </div>
    );
  }


  return (
    <div>

      {history.map(
        (
          item,
          index
        ) => (

          <div
            className="history-item"
            key={
              item.id ||
              index
            }
          >

            <span className="history-dot" />


            <span>
              {
                item.time ||
                "—"
              }
            </span>


            <p>
              <strong>
                {
                  item.actor ||
                  "—"
                }
              </strong>

              {" - "}

              {
                item.action ||
                "—"
              }
            </p>

          </div>

        )
      )}

    </div>
  );
}


export default LoadingExceptions;