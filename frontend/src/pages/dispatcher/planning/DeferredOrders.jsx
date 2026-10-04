import {
  AlertTriangle,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Info,
  Mail,
  MapPin,
  Route,
  Save,
  Search,
  Snowflake,
  Truck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import DispatcherLayout
  from "../../../components/dispatcher/DispatcherLayout";


function DeferredOrders() {
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
    selectedBrand,
    setSelectedBrand,
  ] = useState("ALL");


  const [
    selectedTemperature,
    setSelectedTemperature,
  ] = useState("ALL");


  const [
    deferralReason,
    setDeferralReason,
  ] = useState("");


  const [
    nextDeliveryDate,
    setNextDeliveryDate,
  ] = useState("");


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    alternativesReviewed,
    setAlternativesReviewed,
  ] = useState(false);


  /*
   * No hardcoded operational data.
   * These will later come from the backend.
   */

  const orders = [];

  const selectedOrder =
    null;

  const summary = {
    unassigned: null,
    deferred: null,
    warnings: null,
    status: null,
  };


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
              ) ||
            String(
              order.location ||
                ""
            )
              .toLowerCase()
              .includes(
                searchTerm
                  .toLowerCase()
              );


          const matchesStatus =
            selectedStatus ===
              "ALL" ||
            order.status ===
              selectedStatus;


          const matchesBrand =
            selectedBrand ===
              "ALL" ||
            order.brand ===
              selectedBrand;


          const matchesTemperature =
            selectedTemperature ===
              "ALL" ||
            order.temperature ===
              selectedTemperature;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesBrand &&
            matchesTemperature
          );
        }
      );
    }, [
      orders,
      searchTerm,
      selectedStatus,
      selectedBrand,
      selectedTemperature,
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

      <div className="deferred-orders-page">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="deferred-page-header">

          <div>

            <h1>
              Delivery Planning
            </h1>

            <p>
              Review orders, plan allocations,
              record deferrals and publish the
              delivery plan.
            </p>

          </div>


          <div className="deferred-header-summary">

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
                summary.deferred
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
            className="planning-tab active"
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
            MAIN 3-COLUMN LAYOUT
        ================================================== */}

        <div className="deferred-main-grid">

          {/* LEFT COLUMN */}

          <section className="deferred-panel decision-list-panel">

            <div className="deferred-panel-title">

              <h2>
                Orders Requiring a Decision
              </h2>

              <span>
                {
                  filteredOrders
                    .length
                }
              </span>

            </div>


            <div className="deferred-search">

              <Search
                size={16}
              />

              <input
                type="text"
                placeholder="Search by order ID, customer or location..."
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


            <div className="deferred-filter-grid">

              <FilterSelect
                label="Status"
                value={
                  selectedStatus
                }
                onChange={
                  setSelectedStatus
                }
                options={[
                  [
                    "ALL",
                    "All",
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
                    "All",
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
                    "All",
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

            </div>


            <div className="decision-order-list">

              {filteredOrders.length ===
              0 ? (

                <EmptyState
                  text="No orders currently require a decision."
                />

              ) : (

                filteredOrders.map(
                  (
                    order
                  ) => (

                    <div
                      className="decision-order-card"
                      key={
                        order.orderId
                      }
                    >

                      <div className="decision-order-top">

                        <div>

                          <strong>
                            {
                              order.orderId
                            }
                          </strong>

                          <span>
                            {
                              order.outletName ||
                              "—"
                            }
                          </span>

                        </div>


                        <StatusBadge
                          value={
                            order.status
                          }
                        />

                      </div>


                      <div className="decision-order-meta">

                        <span>
                          <MapPin
                            size={12}
                          />

                          {
                            order.location ||
                            "—"
                          }
                        </span>


                        <span>
                          {
                            order.temperature ||
                            "—"
                          }
                        </span>


                        <span>
                          {
                            order.weight ||
                            "—"
                          }
                        </span>


                        <span>
                          {
                            order.volume ||
                            "—"
                          }
                        </span>

                      </div>


                      <div className="decision-order-bottom">

                        <span>
                          <Clock3
                            size={12}
                          />

                          {
                            order.deliveryWindow ||
                            "—"
                          }
                        </span>


                        {order.previousDeferrals >
                          0 && (
                          <span className="previously-deferred">
                            Deferred{" "}
                            {
                              order.previousDeferrals
                            }{" "}
                            time
                          </span>
                        )}

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </section>


          {/* MIDDLE COLUMN */}

          <section className="deferred-panel decision-panel">

            <div className="selected-order-heading">

              <span>
                Selected Order & Deferral Decision
              </span>

              <h2>
                {selectedOrder
                  ?.orderId ||
                  "No order selected"}
              </h2>

            </div>


            {!selectedOrder ? (

              <EmptyState
                text="Select an order from the left panel to review its deferral decision."
              />

            ) : (

              <>

                <div className="selected-tags">

                  <StatusBadge
                    value={
                      selectedOrder
                        .status
                    }
                  />


                  {selectedOrder
                    .temperature ===
                    "Chilled" && (

                    <span className="tag chilled">

                      <Snowflake
                        size={12}
                      />

                      Chilled

                    </span>

                  )}


                  {selectedOrder
                    .previousDeferrals >
                    0 && (

                    <span className="tag previous">

                      <AlertTriangle
                        size={12}
                      />

                      Previously deferred

                    </span>

                  )}

                </div>


                <div className="selected-order-details">

                  <DetailRow
                    label="Assigned depot"
                    value={
                      selectedOrder
                        .depot
                    }
                  />


                  <DetailRow
                    label="District"
                    value={
                      selectedOrder
                        .district
                    }
                  />


                  <DetailRow
                    label="Delivery window"
                    value={
                      selectedOrder
                        .deliveryWindow
                    }
                  />


                  <DetailRow
                    label="Weight"
                    value={
                      selectedOrder
                        .weight
                    }
                  />


                  <DetailRow
                    label="Volume"
                    value={
                      selectedOrder
                        .volume
                    }
                  />


                  <DetailRow
                    label="Outlet access"
                    value={
                      selectedOrder
                        .outletAccess
                    }
                  />

                </div>


                <div className="previous-deferral-box">

                  <div className="previous-deferral-title">

                    <Clock3
                      size={15}
                    />

                    <strong>
                      Previous deferral history
                    </strong>

                  </div>


                  <span>
                    {
                      selectedOrder
                        .previousDeferralReason ||
                      "No previous deferral information available."
                    }
                  </span>

                </div>


                <div className="record-deferral-section">

                  <h3>
                    Record a Deferral
                  </h3>


                  <div className="deferral-form-row">

                    <div className="form-field">

                      <label>
                        Reason for deferral *
                      </label>


                      <select
                        value={
                          deferralReason
                        }
                        onChange={(
                          event
                        ) =>
                          setDeferralReason(
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select reason
                        </option>

                        <option value="capacity">
                          Insufficient capacity
                        </option>

                        <option value="refrigerated">
                          Insufficient refrigerated capacity
                        </option>

                        <option value="vehicle">
                          No suitable vehicle
                        </option>

                        <option value="window">
                          Delivery window conflict
                        </option>

                        <option value="other">
                          Other
                        </option>

                      </select>

                    </div>


                    <div className="form-field">

                      <label>
                        Proposed next delivery date *
                      </label>


                      <input
                        type="date"
                        value={
                          nextDeliveryDate
                        }
                        onChange={(
                          event
                        ) =>
                          setNextDeliveryDate(
                            event.target.value
                          )
                        }
                      />

                    </div>

                  </div>


                  <div className="form-field notes-field">

                    <label>
                      Additional notes
                      (optional)
                    </label>


                    <textarea
                      rows="4"
                      maxLength="500"
                      value={notes}
                      onChange={(
                        event
                      ) =>
                        setNotes(
                          event.target.value
                        )
                      }
                      placeholder="Enter additional notes..."
                    />


                    <span className="notes-count">
                      {notes.length}/500
                    </span>

                  </div>


                  <label className="alternatives-checkbox">

                    <input
                      type="checkbox"
                      checked={
                        alternativesReviewed
                      }
                      onChange={(
                        event
                      ) =>
                        setAlternativesReviewed(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      I have reviewed feasible alternative vehicles and trips
                    </span>

                  </label>


                  <div className="deferral-form-actions">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/dispatcher/planning/planner"
                        )
                      }
                    >
                      Return to Planner
                    </button>


                    <button
                      type="button"
                      className="record-deferral-button"
                    >
                      Record Deferral
                    </button>

                  </div>

                </div>

              </>

            )}

          </section>


          {/* RIGHT COLUMN */}

          <section className="impact-panel">

            <h2>
              Alternatives & Planning Impact
            </h2>


            <ImpactCard
              icon={Truck}
              tone="green"
              title="Fleet alternatives"
              description="Check available refrigerated capacity for this order."
              action="Open Fleet"
              onClick={() =>
                navigate(
                  "/dispatcher/planning/fleet"
                )
              }
            />


            <ImpactCard
              icon={Route}
              tone="purple"
              title="Planner review"
              description="Try allocating this order in the live planning workspace."
              action="Open Planner"
              onClick={() =>
                navigate(
                  "/dispatcher/planning/planner"
                )
              }
            />


            <ImpactNotice
              icon={Info}
              tone="orange"
              title="Planning impact"
              description={
                selectedOrder
                  ? "Once deferred, this order will be removed from the unallocated queue and will not be included in published manifests."
                  : "Select an order to review its planning impact."
              }
            />


            <ImpactNotice
              icon={Mail}
              tone="green"
              title="Store Manager notification"
              description={
                selectedOrder
                  ? "A deferral notice will be prepared with the reason and proposed next delivery date and sent when the plan is published."
                  : "Select an order to view notification information."
              }
            />


            <ImpactNotice
              icon={
                AlertTriangle
              }
              tone="red"
              title={
                `${showValue(
                  summary.unassigned
                )} orders still need a decision`
              }
              description="Review pending orders or allocate them before publishing the plan."
            />

          </section>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="deferred-footer">

          <div className="deferred-footer-status">

            <ClipboardList
              size={15}
            />

            <strong>
              Draft plan
            </strong>

          </div>


          <div className="deferred-footer-actions">

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
              className="publish-button"
              onClick={() =>
                navigate(
                  "/dispatcher/planning/review"
                )
              }
            >
              Review & Publish

              <ChevronRight
                size={15}
              />
            </button>

          </div>

        </div>

      </div>


      <style>{`

        .deferred-orders-page {
          width: 100%;
        }


        /* ===============================================
           HEADER
        =============================================== */

        .deferred-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom: 16px;
        }


        .deferred-page-header h1 {
          margin: 0;

          color: #173d33;

          font-size: 27px;
        }


        .deferred-page-header p {
          max-width: 420px;

          margin: 5px 0 0;

          color: #7a8984;

          font-size: 11px;

          line-height: 1.4;
        }


        .deferred-header-summary {
          display: grid;

          grid-template-columns:
            repeat(6, auto);

          gap: 7px;
        }


        .header-info {
          min-width: 82px;

          min-height: 50px;

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


        .header-info.green
        strong {
          color: #218158;
        }


        .header-info.danger
        svg,
        .header-info.danger
        strong {
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
           MAIN GRID
        =============================================== */

        .deferred-main-grid {
          display: grid;

          grid-template-columns:
            minmax(250px, 0.9fr)
            minmax(360px, 1.25fr)
            minmax(270px, 0.9fr);

          gap: 13px;
        }


        .deferred-panel {
          min-height: 520px;

          border: 1px solid #dfe7e3;
          border-radius: 8px;

          background: #ffffff;

          overflow: hidden;
        }


        /* ===============================================
           LEFT LIST
        =============================================== */

        .deferred-panel-title {
          min-height: 50px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 14px;

          border-bottom: 1px solid #edf1ef;
        }


        .deferred-panel-title h2 {
          margin: 0;

          color: #1c4036;

          font-size: 12px;
        }


        .deferred-panel-title span {
          min-width: 22px;
          height: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background: #edf1ef;

          color: #566860;

          font-size: 8px;
          font-weight: 700;
        }


        .deferred-search {
          display: flex;
          align-items: center;

          gap: 7px;

          margin: 10px;

          padding: 0 9px;

          height: 35px;

          border-radius: 5px;

          background: #f4f7f5;

          color: #84928d;
        }


        .deferred-search input {
          width: 100%;

          border: none;
          outline: none;

          background: transparent;

          font-family: inherit;
          font-size: 9px;
        }


        .deferred-filter-grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 7px;

          padding: 0 10px 10px;
        }


        .filter-block {
          display: flex;
          flex-direction: column;

          gap: 4px;
        }


        .filter-block label {
          color: #78857f;

          font-size: 8px;
        }


        .filter-block select {
          height: 32px;

          padding: 0 7px;

          border: 1px solid #dce5e1;
          border-radius: 5px;

          background: #ffffff;

          font-family: inherit;
          font-size: 8px;
        }


        .decision-order-list {
          min-height: 380px;

          padding: 0 10px 10px;
        }


        .decision-order-card {
          margin-bottom: 8px;

          padding: 10px;

          border: 1px solid #e1e8e5;
          border-radius: 6px;

          background: #ffffff;
        }


        .decision-order-top {
          display: flex;
          justify-content: space-between;

          gap: 8px;
        }


        .decision-order-top > div {
          display: flex;
          flex-direction: column;
        }


        .decision-order-top strong {
          color: #25483d;

          font-size: 10px;
        }


        .decision-order-top span {
          color: #63756e;

          font-size: 8.5px;
        }


        .decision-order-meta,
        .decision-order-bottom {
          display: flex;
          align-items: center;

          gap: 10px;

          flex-wrap: wrap;

          margin-top: 7px;

          color: #6f8179;

          font-size: 7.5px;
        }


        .decision-order-meta span,
        .decision-order-bottom span {
          display: flex;
          align-items: center;

          gap: 4px;
        }


        .previously-deferred {
          margin-left: auto;

          color: #c25c5c !important;

          font-weight: 600;
        }


        /* ===============================================
           BADGES
        =============================================== */

        .status-badge,
        .tag {
          display: inline-flex;
          align-items: center;

          gap: 4px;

          padding: 4px 7px;

          border-radius: 5px;

          font-size: 7px;

          font-weight: 600;
        }


        .status-badge.unallocated {
          background: #fff0df;

          color: #ba7731;
        }


        .status-badge.deferred {
          background: #fde5e5;

          color: #bb5b5b;
        }


        .tag.chilled {
          background: #e4f3fb;

          color: #347d9d;
        }


        .tag.previous {
          background: #fff2df;

          color: #b4722e;
        }


        /* ===============================================
           MIDDLE PANEL
        =============================================== */

        .decision-panel {
          padding: 14px;
        }


        .selected-order-heading span {
          color: #7c8a85;

          font-size: 7px;

          text-transform: uppercase;
        }


        .selected-order-heading h2 {
          margin: 4px 0 8px;

          color: #173d33;

          font-size: 17px;
        }


        .selected-tags {
          display: flex;
          align-items: center;

          gap: 5px;

          flex-wrap: wrap;

          margin-bottom: 10px;
        }


        .selected-order-details {
          border: 1px solid #e0e7e3;
          border-radius: 6px;

          overflow: hidden;
        }


        .detail-row {
          display: flex;
          justify-content: space-between;

          gap: 10px;

          padding: 7px 9px;

          border-bottom: 1px solid #edf1ef;

          color: #6b7a74;

          font-size: 8px;
        }


        .detail-row:last-child {
          border-bottom: none;
        }


        .detail-row strong {
          color: #3d544c;
        }


        .previous-deferral-box {
          margin-top: 10px;

          padding: 10px;

          border: 1px solid #f1d9b2;
          border-radius: 6px;

          background: #fff8ec;
        }


        .previous-deferral-title {
          display: flex;
          align-items: center;

          gap: 6px;

          color: #b4762e;
        }


        .previous-deferral-title strong {
          font-size: 8.5px;
        }


        .previous-deferral-box > span {
          display: block;

          margin-top: 5px;

          color: #766c5b;

          font-size: 7.5px;

          line-height: 1.4;
        }


        .record-deferral-section {
          margin-top: 12px;
        }


        .record-deferral-section h3 {
          margin: 0 0 9px;

          color: #27483d;

          font-size: 10px;
        }


        .deferral-form-row {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 8px;
        }


        .form-field {
          display: flex;
          flex-direction: column;

          gap: 4px;
        }


        .form-field label {
          color: #687a73;

          font-size: 7.5px;
        }


        .form-field select,
        .form-field input,
        .form-field textarea {
          width: 100%;

          border: 1px solid #dce4e0;
          border-radius: 5px;

          background: #ffffff;

          color: #4c6058;

          outline: none;

          font-family: inherit;
          font-size: 8px;
        }


        .form-field select,
        .form-field input {
          height: 33px;

          padding: 0 8px;
        }


        .form-field textarea {
          padding: 8px;

          resize: vertical;
        }


        .notes-field {
          position: relative;

          margin-top: 9px;
        }


        .notes-count {
          align-self: flex-end;

          color: #9aa4a0;

          font-size: 7px;
        }


        .alternatives-checkbox {
          display: flex;
          align-items: center;

          gap: 6px;

          margin-top: 8px;

          color: #5f726a;

          font-size: 7.5px;
        }


        .deferral-form-actions {
          display: flex;
          justify-content: flex-end;

          gap: 7px;

          margin-top: 10px;
        }


        .deferral-form-actions button {
          min-height: 32px;

          padding: 0 12px;

          border: 1px solid #d8e1dd;
          border-radius: 5px;

          background: #ffffff;

          color: #53665e;

          font-family: inherit;
          font-size: 8px;

          cursor: pointer;
        }


        .deferral-form-actions
        .record-deferral-button {
          border-color: #20b879;

          background: #20b879;

          color: #ffffff;
        }


        /* ===============================================
           RIGHT PANEL
        =============================================== */

        .impact-panel {
          min-height: 520px;

          padding: 12px;
        }


        .impact-panel > h2 {
          margin: 0 0 10px;

          color: #324d43;

          font-size: 9px;

          text-transform: uppercase;
        }


        .impact-card,
        .impact-notice {
          display: flex;

          gap: 9px;

          margin-bottom: 9px;

          padding: 10px;

          border: 1px solid #e0e7e3;
          border-radius: 6px;

          background: #ffffff;
        }


        .impact-card-icon,
        .impact-notice-icon {
          width: 30px;
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 6px;
        }


        .impact-card-icon.green,
        .impact-notice-icon.green {
          background: #dff5e9;

          color: #2b8f68;
        }


        .impact-card-icon.purple {
          background: #efe9fb;

          color: #7c57b3;
        }


        .impact-notice-icon.orange {
          background: #fff0df;

          color: #bd7730;
        }


        .impact-notice-icon.red {
          background: #fde8e8;

          color: #bd5d5d;
        }


        .impact-card-content,
        .impact-notice-content {
          display: flex;
          flex-direction: column;

          gap: 3px;
        }


        .impact-card-content strong,
        .impact-notice-content strong {
          color: #304e43;

          font-size: 8.5px;
        }


        .impact-card-content span,
        .impact-notice-content span {
          color: #71807b;

          font-size: 7.5px;

          line-height: 1.4;
        }


        .impact-card-content button {
          align-self: flex-start;

          border: none;

          padding: 0;

          background: transparent;

          color: #26966b;

          cursor: pointer;

          font-family: inherit;
          font-size: 7.5px;

          font-weight: 600;
        }


        .impact-notice.orange {
          border-color: #f0d7ae;

          background: #fff8ee;
        }


        .impact-notice.green {
          border-color: #cce9d9;

          background: #f0fbf5;
        }


        .impact-notice.red {
          border-color: #efcaca;

          background: #fff3f3;
        }


        /* ===============================================
           FOOTER
        =============================================== */

        .deferred-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 13px;

          padding: 9px 12px;

          border: 1px solid #e0e7e3;
          border-radius: 7px;

          background: #ffffff;
        }


        .deferred-footer-status {
          display: flex;
          align-items: center;

          gap: 6px;

          color: #6a7d75;

          font-size: 8px;
        }


        .deferred-footer-actions {
          display: flex;

          gap: 7px;
        }


        .deferred-footer-actions button {
          min-height: 34px;

          display: flex;
          align-items: center;

          gap: 5px;

          padding: 0 12px;

          border: 1px solid #dbe3df;
          border-radius: 5px;

          background: #ffffff;

          color: #53665e;

          font-family: inherit;

          font-size: 8px;

          cursor: pointer;
        }


        .deferred-footer-actions
        .publish-button {
          border-color: #20b879;

          background: #20b879;

          color: #ffffff;
        }


        .empty-state {
          min-height: 250px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          color: #899690;

          text-align: center;

          font-size: 8.5px;
        }


        /* ===============================================
           RESPONSIVE
        =============================================== */

        @media (
          max-width: 1200px
        ) {

          .deferred-page-header {
            flex-direction: column;
          }


          .deferred-header-summary {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );

            width: 100%;
          }


          .deferred-main-grid {
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

          .deferred-header-summary {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }


          .deferred-filter-grid,
          .deferral-form-row {
            grid-template-columns:
              1fr;
          }


          .deferred-footer {
            flex-direction: column;

            align-items: stretch;

            gap: 8px;
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


function StatusBadge({
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
        `status-badge ${normalized}`
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


function ImpactCard({
  icon: Icon,
  tone,
  title,
  description,
  action,
  onClick,
}) {
  return (
    <div className="impact-card">

      <div
        className={
          `impact-card-icon ${tone}`
        }
      >
        <Icon
          size={16}
        />
      </div>


      <div className="impact-card-content">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

        <button
          type="button"
          onClick={onClick}
        >
          {action} →
        </button>

      </div>

    </div>
  );
}


function ImpactNotice({
  icon: Icon,
  tone,
  title,
  description,
}) {
  return (
    <div
      className={
        `impact-notice ${tone}`
      }
    >

      <div
        className={
          `impact-notice-icon ${tone}`
        }
      >
        <Icon
          size={16}
        />
      </div>


      <div className="impact-notice-content">

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
}) {
  return (
    <div className="empty-state">
      {text}
    </div>
  );
}


export default DeferredOrders;