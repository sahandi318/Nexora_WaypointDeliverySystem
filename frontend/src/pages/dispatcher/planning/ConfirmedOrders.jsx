import {
  Box,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  Filter,
  MapPin,
  PackageCheck,
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


function ConfirmedOrders() {
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
    selectedBrand,
    setSelectedBrand,
  ] = useState("ALL");


  const [
    selectedDistrict,
    setSelectedDistrict,
  ] = useState("ALL");


  const [
    selectedTemperature,
    setSelectedTemperature,
  ] = useState("ALL");


  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("ALL");


  const [
    showDeferredOnly,
    setShowDeferredOnly,
  ] = useState(false);


  const [planningData, setPlanningData] = useState({
    orders: [],
    summary: {},
  });

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getDispatcherPlanning({
      date: selectedDate,
      depot: selectedDepot,
      signal: controller.signal,
    })
      .then((data) => {
        setPlanningData(data || { orders: [], summary: {} });
        setSelectedOrderId((current) =>
          current && data?.orders?.some((order) => order.id === current)
            ? current
            : data?.orders?.[0]?.id || null
        );
      })
      .catch((error) => {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("Unable to load confirmed orders:", error);
        }
      });

    return () => controller.abort();
  }, [selectedDate, selectedDepot]);

  const orders = planningData.orders || [];
  const summary = planningData.summary || {};
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ||
    orders[0] ||
    null;


  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const matchesSearch =
            !searchTerm ||
            String(
              order.orderId ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              ) ||
            String(
              order.outletName ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              );


          const matchesBrand =
            selectedBrand ===
              "ALL" ||
            order.brand ===
              selectedBrand;


          const matchesDistrict =
            selectedDistrict ===
              "ALL" ||
            order.district ===
              selectedDistrict;


          const matchesTemperature =
            selectedTemperature ===
              "ALL" ||
            order.temperature ===
              selectedTemperature;


          const matchesStatus =
            selectedStatus ===
              "ALL" ||
            order.status ===
              selectedStatus;


          const matchesDeferred =
            !showDeferredOnly ||
            order.previouslyDeferred;


          return (
            matchesSearch &&
            matchesBrand &&
            matchesDistrict &&
            matchesTemperature &&
            matchesStatus &&
            matchesDeferred
          );
        }
      );
    }, [
      orders,
      searchTerm,
      selectedBrand,
      selectedDistrict,
      selectedTemperature,
      selectedStatus,
      showDeferredOnly,
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

      <div className="confirmed-orders-page">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="planning-page-header">

          <div>

            <h1>
              Delivery Planning
            </h1>

            <p>
              Review confirmed orders and
              prepare them for allocation
            </p>

          </div>


          <div className="planning-header-actions">

            <div className="planning-header-status">
              <span className="status-dot" />

              Changes saved
            </div>


            <div className="planning-control">

              <CalendarDays
                size={16}
              />

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


            <div className="planning-control">

              <MapPin
                size={16}
              />

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

        <div className="planning-summary-grid">

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
            icon={PackageCheck}
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
            className="planning-tab active"
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
            MAIN CONTENT
        ================================================== */}

        <div className="confirmed-orders-layout">

          {/* LEFT SIDE */}

          <section className="confirmed-orders-panel">

            <div className="confirmed-orders-heading">

              <h2>
                Confirmed Orders
                <span>
                  (
                  {showValue(
                    summary.confirmedOrders
                  )}
                  )
                </span>
              </h2>


              <label className="deferred-toggle">

                <span>
                  Show previously deferred
                  only
                </span>

                <input
                  type="checkbox"
                  checked={
                    showDeferredOnly
                  }
                  onChange={(
                    event
                  ) =>
                    setShowDeferredOnly(
                      event.target.checked
                    )
                  }
                />

              </label>

            </div>


            {/* SEARCH */}

            <div className="confirmed-search">

              <Search
                size={17}
              />

              <input
                type="text"
                placeholder="Search by order ID or outlet name..."
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

            <div className="confirmed-filter-grid">

              <FilterSelect
                label="Brand"
                value={
                  selectedBrand
                }
                onChange={
                  setSelectedBrand
                }
                options={[
                  [
                    "ALL",
                    "All Brands",
                  ],
                  [
                    "Fresh",
                    "Fresh",
                  ],
                  [
                    "Style",
                    "Style",
                  ],
                  [
                    "Tech",
                    "Tech",
                  ],
                ]}
              />


              <FilterSelect
                label="District"
                value={
                  selectedDistrict
                }
                onChange={
                  setSelectedDistrict
                }
                options={[
                  [
                    "ALL",
                    "All Districts",
                  ],
                ]}
              />


              <FilterSelect
                label="Temperature"
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
                    "Chilled",
                    "Chilled",
                  ],
                  [
                    "Ambient",
                    "Ambient",
                  ],
                ]}
              />


              <FilterSelect
                label="Allocation Status"
                value={
                  selectedStatus
                }
                onChange={
                  setSelectedStatus
                }
                options={[
                  [
                    "ALL",
                    "All Statuses",
                  ],
                  [
                    "Allocated",
                    "Allocated",
                  ],
                  [
                    "Unallocated",
                    "Unallocated",
                  ],
                  [
                    "Deferred",
                    "Deferred",
                  ],
                ]}
              />

            </div>


            {/* TABLE */}

            <div className="orders-table-wrapper">

              <table className="orders-table">

                <thead>

                  <tr>

                    <th>
                      Order ID
                    </th>

                    <th>
                      Outlet / Brand
                    </th>

                    <th>
                      District
                    </th>

                    <th>
                      Delivery Window
                    </th>

                    <th>
                      Load
                    </th>

                    <th>
                      Temperature
                    </th>

                    <th>
                      Special Restrictions
                    </th>

                    <th>
                      Planning Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredOrders.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="9"
                        className="orders-empty-state"
                      >
                        No confirmed order
                        data available.
                      </td>

                    </tr>

                  ) : (

                    filteredOrders.map(
                      (order) => (

                        <tr
                          key={
                            order.orderId
                          }
                        >

                          <td>
                            {
                              order.orderId
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                order.outletName
                              }
                            </strong>

                            <span>
                              {
                                order.brand
                              }
                            </span>
                          </td>

                          <td>
                            {
                              order.district
                            }
                          </td>

                          <td>
                            {
                              order.deliveryWindow
                            }
                          </td>

                          <td>
                            {
                              order.load
                            }
                          </td>

                          <td>
                            <TemperatureBadge
                              value={
                                order.temperature
                              }
                            />
                          </td>

                          <td>
                            {
                              order.restriction
                            }
                          </td>

                          <td>
                            <PlanningStatusBadge
                              value={
                                order.status
                              }
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="row-more-button"
                              onClick={() => setSelectedOrderId(order.id)}
                              aria-label={`View ${order.orderId}`}
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


            {/* TABLE FOOTER */}

            <div className="orders-table-footer">

              <span>
                Showing {filteredOrders.length} of{" "}
                {showValue(
                  summary.confirmedOrders
                )}{" "}
                orders
              </span>


              <div className="pagination">

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


          {/* RIGHT SIDE DETAILS */}

          <aside className="order-details-panel">

            <div className="order-details-header">

              <h2>
                Order Details
              </h2>


              <button
                type="button"
                className="view-full-order"
                disabled={
                  !selectedOrder
                }
              >
                View full order
              </button>

            </div>


            {!selectedOrder ? (

              <div className="order-details-empty">

                <ClipboardList
                  size={36}
                />

                <strong>
                  No order selected
                </strong>

                <span>
                  Select an order from the
                  table to view its delivery
                  requirements.
                </span>

              </div>

            ) : (

              <>
                <div className="selected-order-title">

                  <div>

                    <h3>
                      {
                        selectedOrder.orderId
                      }
                    </h3>

                    <span>
                      {
                        selectedOrder.status
                      }
                    </span>

                  </div>

                </div>


                <div className="selected-outlet-card">

                  <MapPin
                    size={18}
                  />

                  <div>

                    <strong>
                      {
                        selectedOrder.outletId
                      }
                    </strong>

                    <span>
                      {
                        selectedOrder.brand
                      }
                    </span>

                  </div>

                </div>


                <div className="order-requirements">

                  <h3>
                    Delivery Requirements
                  </h3>


                  <RequirementRow
                    label="Assigned Depot"
                    value={
                      selectedOrder.depot
                    }
                  />


                  <RequirementRow
                    label="District"
                    value={
                      selectedOrder.district
                    }
                  />


                  <RequirementRow
                    label="Delivery Window"
                    value={
                      selectedOrder.deliveryWindow
                    }
                  />


                  <RequirementRow
                    label="Temperature"
                    value={
                      selectedOrder.temperature
                    }
                  />


                  <RequirementRow
                    label="Order Weight"
                    value={
                      selectedOrder.weight
                    }
                  />


                  <RequirementRow
                    label="Order Volume"
                    value={
                      selectedOrder.volume
                    }
                  />


                  <RequirementRow
                    label="Outlet Access"
                    value={
                      selectedOrder.restriction
                    }
                  />

                </div>


                {selectedOrder.temperature ===
                  "Chilled" && (

                  <div className="refrigerated-notice">

                    <Snowflake
                      size={16}
                    />

                    Refrigerated vehicle
                    required

                  </div>

                )}


                <div className="deferral-history">

                  <h3>
                    Previous Deferral History
                  </h3>

                  <span>
                    No deferral information
                    available.
                  </span>

                </div>


                <button
                  type="button"
                  className="eligible-vehicle-button"
                  onClick={() =>
                    navigate(
                      "/dispatcher/planning/fleet"
                    )
                  }
                >

                  <Truck
                    size={17}
                  />

                  Find Eligible Vehicles

                </button>

              </>

            )}

          </aside>

        </div>

      </div>


      <style>{`

        .confirmed-orders-page {
          width: 100%;
        }


        /* ===============================================
           HEADER
        =============================================== */

        .planning-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;

          margin-bottom: 18px;
        }


        .planning-page-header h1 {
          margin: 0;

          font-size: 27px;
          font-weight: 700;

          color: #173d33;
        }


        .planning-page-header p {
          margin: 5px 0 0;

          font-size: 11px;

          color: #7b8984;
        }


        .planning-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;

          flex-wrap: wrap;
          justify-content: flex-end;
        }


        .planning-header-status {
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


        .planning-control {
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


        .planning-control input,
        .planning-control select {
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
           SUMMARY CARDS
        =============================================== */

        .planning-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 13px;

          margin-bottom: 16px;
        }


        .planning-summary-card {
          min-height: 82px;

          display: flex;
          align-items: center;
          gap: 13px;

          padding: 15px;

          border: 1px solid #e1e8e5;
          border-radius: 9px;

          background: #ffffff;
        }


        .planning-summary-icon {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;
        }


        .planning-summary-icon.green {
          background: #dcf4e6;
          color: #288760;
        }


        .planning-summary-icon.teal {
          background: #dbf2eb;
          color: #328f77;
        }


        .planning-summary-icon.orange {
          background: #fff1dd;
          color: #d89335;
        }


        .planning-summary-icon.red {
          background: #fde5e5;
          color: #cf5c5c;
        }


        .planning-summary-card span {
          display: block;

          color: #71817b;

          font-size: 10px;
        }


        .planning-summary-card strong {
          display: block;

          margin-top: 4px;

          color: #183e33;

          font-size: 22px;
        }


        /* ===============================================
           TABS
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
           MAIN GRID
        =============================================== */

        .confirmed-orders-layout {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            255px;

          gap: 15px;
        }


        .confirmed-orders-panel,
        .order-details-panel {
          border: 1px solid #e0e7e3;
          border-radius: 9px;

          background: #ffffff;
        }


        .confirmed-orders-panel {
          padding: 15px;
        }


        /* ===============================================
           CONFIRMED ORDER CONTROLS
        =============================================== */

        .confirmed-orders-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          margin-bottom: 12px;
        }


        .confirmed-orders-heading h2 {
          margin: 0;

          color: #1b4036;

          font-size: 14px;
        }


        .confirmed-orders-heading h2 span {
          margin-left: 4px;
        }


        .deferred-toggle {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #6f7f79;

          font-size: 9px;
        }


        .confirmed-search {
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


        .confirmed-search input {
          width: 100%;

          border: none;
          outline: none;

          background: transparent;

          font-family: inherit;
          font-size: 10px;
        }


        .confirmed-filter-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

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

        .orders-table-wrapper {
          overflow-x: auto;

          border: 1px solid #e6ece9;
          border-radius: 6px;
        }


        .orders-table {
          width: 100%;

          border-collapse: collapse;
        }


        .orders-table th {
          padding: 10px 7px;

          background: #f4f7f5;

          color: #667873;

          text-align: left;

          font-size: 8px;
          font-weight: 600;

          white-space: nowrap;
        }


        .orders-table td {
          padding: 10px 7px;

          border-top: 1px solid #edf1ef;

          color: #4e615a;

          font-size: 8.5px;

          vertical-align: middle;
        }


        .orders-table td strong,
        .orders-table td span {
          display: block;
        }


        .orders-table td span {
          margin-top: 2px;

          color: #8a9692;

          font-size: 7.5px;
        }


        .orders-empty-state {
          height: 220px;

          text-align: center;

          color: #899690 !important;
        }


        .temperature-badge,
        .planning-status-badge {
          display: inline-block !important;

          margin: 0 !important;

          padding: 4px 7px;

          border-radius: 5px;

          font-size: 7.5px !important;
          font-weight: 600;
        }


        .temperature-badge.chilled {
          background: #dff1fb;

          color: #377899;
        }


        .temperature-badge.ambient {
          background: #edf0ef;

          color: #60706a;
        }


        .planning-status-badge.allocated {
          background: #dbf3e6;

          color: #2e7e5e;
        }


        .planning-status-badge.unallocated {
          background: #fff0dd;

          color: #b87530;
        }


        .planning-status-badge.deferred {
          background: #fde5e5;

          color: #bb5a5a;
        }


        .row-more-button {
          border: none;

          background: transparent;

          color: #77857f;

          cursor: pointer;
        }


        .orders-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-top: 13px;

          color: #7e8c87;

          font-size: 8.5px;
        }


        .pagination {
          display: flex;
          gap: 5px;
        }


        .pagination button {
          width: 27px;
          height: 27px;

          border: 1px solid #dbe4e0;
          border-radius: 5px;

          background: #ffffff;

          color: #697a74;

          cursor: pointer;
        }


        .pagination button.active {
          border-color: #28b77b;

          background: #28b77b;

          color: #ffffff;
        }


        /* ===============================================
           ORDER DETAILS
        =============================================== */

        .order-details-panel {
          min-height: 530px;

          padding: 15px;
        }


        .order-details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 18px;
        }


        .order-details-header h2 {
          margin: 0;

          color: #1b4036;

          font-size: 13px;
        }


        .view-full-order {
          border: none;

          background: transparent;

          color: #24956b;

          font-family: inherit;
          font-size: 8px;
          font-weight: 600;
        }


        .order-details-empty {
          min-height: 420px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 8px;

          padding: 20px;

          color: #87958f;

          text-align: center;
        }


        .order-details-empty svg {
          color: #49a47f;
        }


        .order-details-empty strong {
          color: #53675f;

          font-size: 11px;
        }


        .order-details-empty span {
          max-width: 180px;

          font-size: 9px;
          line-height: 1.5;
        }


        .selected-order-title h3 {
          margin: 0 0 5px;

          font-size: 18px;

          color: #173c32;
        }


        .selected-order-title span {
          color: #b97732;

          font-size: 8px;
        }


        .selected-outlet-card {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 10px;

          margin: 13px 0 16px;

          border: 1px solid #e1e8e5;
        }


        .selected-outlet-card > div {
          display: flex;
          flex-direction: column;
        }


        .selected-outlet-card strong {
          font-size: 10px;

          color: #38554c;
        }


        .selected-outlet-card span {
          font-size: 8px;

          color: #899690;
        }


        .order-requirements h3,
        .deferral-history h3 {
          font-size: 10px;

          color: #27483d;
        }


        .requirement-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;

          padding: 5px 0;

          color: #73817d;

          font-size: 8.5px;
        }


        .requirement-row strong {
          color: #3f554d;

          text-align: right;
        }


        .refrigerated-notice {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 12px;

          padding: 10px;

          border: 1px solid #bfe4f4;
          border-radius: 6px;

          background: #eaf7fc;

          color: #327a9b;

          font-size: 8.5px;
          font-weight: 600;
        }


        .deferral-history {
          margin-top: 14px;
          padding-top: 12px;

          border-top: 1px solid #e4ebe7;
        }


        .deferral-history span {
          color: #83908b;

          font-size: 8.5px;
        }


        .eligible-vehicle-button {
          width: 100%;
          min-height: 38px;

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

        @media (max-width: 1100px) {

          .planning-summary-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }


          .confirmed-orders-layout {
            grid-template-columns:
              1fr;
          }


          .order-details-panel {
            min-height: auto;
          }


          .planning-tabs {
            overflow-x: auto;

            grid-template-columns:
              repeat(5, 180px);
          }

        }


        @media (max-width: 760px) {

          .planning-page-header {
            flex-direction: column;
          }


          .planning-header-actions {
            justify-content:
              flex-start;
          }


          .planning-summary-grid {
            grid-template-columns:
              1fr;
          }


          .confirmed-filter-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
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
    <div className="planning-summary-card">

      <div
        className={
          `planning-summary-icon ${tone}`
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
      .toLowerCase();


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


function PlanningStatusBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    )
      .toLowerCase();


  return (
    <span
      className={
        `planning-status-badge ${normalized}`
      }
    >
      {value || "—"}
    </span>
  );
}


function RequirementRow({
  label,
  value,
}) {
  return (
    <div className="requirement-row">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


export default ConfirmedOrders;