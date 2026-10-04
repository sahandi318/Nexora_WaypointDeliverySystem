import React, { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import DispatcherLayout from "../../../components/dispatcher/DispatcherLayout";
import useAuth from "../../../hooks/useAuth";

/**
 * Parent layout for all Dispatcher Reports & Capacity pages.
 * Keeps the title, filters, tabs and page content consistent.
 */
const ReportsCapacity = () => {
  const location = useLocation();
  const { user } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedDepot, setSelectedDepot] = useState(user?.depot?.name || "");

  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [planningWeeks, setPlanningWeeks] = useState([]);
  const [selectedPlanningWeek, setSelectedPlanningWeek] = useState("");

  useEffect(() => {
    if (user?.depot?.name) {
      setSelectedDepot(user.depot.name);
    }
  }, [user?.depot?.name]);

  useEffect(() => {
    const loadCalendarDates = async () => {
      try {
        const response = await fetch("/data/calendar.csv");

        if (!response.ok) {
          throw new Error(`Calendar request failed: ${response.status}`);
        }

        const csvText = await response.text();

        const lines = csvText
          .trim()
          .split(/\r?\n/);

        // Skip CSV header.
        const rows = lines.slice(1);

        const calendarRows = rows
          .map((row) => {
            const columns = row.split(",");

            return {
              date: columns[0]?.trim(),
              isoYear: columns[4]?.trim(),
              isoWeek: columns[5]?.trim(),
              isOperating: columns[11]?.trim(),
            };
          })
          .filter((row) => row.date && row.isoYear && row.isoWeek);

        if (calendarRows.length === 0) {
          return;
        }

        const dates = calendarRows.map((row) => row.date);

        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];

        setMinDate(firstDate);
        setMaxDate(lastDate);

        // Keep reports unfiltered initially so newly synchronized
        // Driver records appear immediately. The Dispatcher can
        // apply a date range when required.

        // Build selectable planning weeks from the actual calendar file.
        const latestCalendarYear = Math.max(
          ...calendarRows.map((row) => Number(row.isoYear))
        );

        const weekMap = new Map();

        calendarRows
          .filter(
            (row) =>
              Number(row.isoYear) === latestCalendarYear &&
              row.isOperating === "1"
          )
          .forEach((row) => {
            const key = `${row.isoYear}-W${String(row.isoWeek).padStart(2, "0")}`;

            if (!weekMap.has(key)) {
              weekMap.set(key, {
                value: key,
                isoYear: Number(row.isoYear),
                isoWeek: Number(row.isoWeek),
                startDate: row.date,
                endDate: row.date,
              });
            } else {
              weekMap.get(key).endDate = row.date;
            }
          });

        const weeks = Array.from(weekMap.values()).sort(
          (a, b) => a.isoWeek - b.isoWeek
        );

        setPlanningWeeks(weeks);

        // Default to the latest available operating week in calendar.csv.
        if (weeks.length > 0) {
          setSelectedPlanningWeek(weeks[weeks.length - 1].value);
        }
      } catch (error) {
        console.error("Failed to load calendar.csv:", error);
      }
    };

    loadCalendarDates();
  }, []);

  // Future Capacity uses a different filter set.
  const isCapacityPage =
    location.pathname.includes("/capacity");

  const tabs = [
    {
      label: "Delivery Reports",
      path: "/dispatcher/reports",
      end: true,
    },
    {
      label: "Receipt Discrepancy Resolution",
      path: "/dispatcher/reports/discrepancies",
      end: false,
    },
    {
      label: "Future Capacity Planning",
      path: "/dispatcher/reports/capacity",
      end: false,
    },
  ];

  return (
    <DispatcherLayout>
      <div
  className="
    min-h-screen
    bg-[var(--color-bg)]
    px-5 py-4 lg:px-6
    text-[var(--color-text)]
    transition-colors duration-300
  "
>
        {/* =====================================================
            PAGE HEADER
            ===================================================== */}
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: title and description */}
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-[var(--color-text)]">
              Reports & Capacity
            </h1>

            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {isCapacityPage
                ? "Review completed deliveries and plan future capacity using demand forecasts."
                : "Review completed trips, delivery outcomes, proof of delivery and unresolved issues."}
            </p>
          </div>

          {/* Right: filters */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isCapacityPage ? (
              <>
                {/* Planning week filter */}
                <div className="relative flex h-10 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="pointer-events-none absolute left-3 text-[var(--color-text-muted)]">
                    ▣
                  </span>

                  <span className="pointer-events-none absolute left-8 text-[8px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    Planning Week
                  </span>

                  <select
                    value={selectedPlanningWeek}
                    onChange={(event) =>
                      setSelectedPlanningWeek(event.target.value)
                    }
                    className="
                      h-10 min-w-[265px]
                      appearance-none
                      rounded-lg
                      bg-transparent
                      pl-[108px] pr-9
                      text-[11px] font-medium
                      text-[var(--color-text)]
                      outline-none
                      cursor-pointer
                    "
                  >
                    {planningWeeks.length === 0 ? (
                      <option value="">Loading weeks...</option>
                    ) : (
                      planningWeeks.map((week) => (
                        <option key={week.value} value={week.value}>
                          {`Week ${week.isoWeek} · ${formatShortDate(
                            week.startDate
                          )} - ${formatShortDate(week.endDate)}`}
                        </option>
                      ))
                    )}
                  </select>

                  <span className="pointer-events-none absolute right-3 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </div>

                {/* Depot filter */}
                <div className="relative flex items-center">
  <span
    className="
      pointer-events-none
      absolute left-3
      text-[var(--color-text-muted)]
    "
  >
    ⌖
  </span>

  <select
    value={selectedDepot}
    onChange={(event) => setSelectedDepot(event.target.value)}
    className="
      h-10
      appearance-none
      rounded-lg
      border border-[var(--color-border)]
      bg-[var(--color-surface)]
      pl-8 pr-9
      text-[11px]
      text-[var(--color-text)]
      outline-none
    "
  >
    <option value="">All Depots</option>
    <option value="Kandy">Kandy</option>
    <option value="Peliyagoda">Peliyagoda</option>
  </select>

  <span
    className="
      pointer-events-none
      absolute right-3
      text-[var(--color-text-secondary)]
    "
  >
    ⌄
  </span>
</div>
              </>
            ) : (
              <>
                {/* Date range */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker((prev) => !prev)}
                    className="
                      flex h-10 items-center gap-2
                      rounded-lg
                      border border-[var(--color-border)]
                      bg-[var(--color-surface)]
                      px-4
                      text-[11px]
                      text-[var(--color-text-secondary)]
                    "
                  >
                    <span className="text-[var(--color-text-muted)]">▣</span>

                    <span>
                      {startDate && endDate
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : "Select date range"}
                    </span>

                    <span className="ml-1">⌄</span>
                  </button>

                  {showDatePicker && (
                    <div
                      className="
                        absolute right-0 top-12 z-50
                        w-[280px]
                        rounded-lg
                        border border-[var(--color-border)]
                        bg-[var(--color-surface)]
                        p-4
                        shadow-lg
                      "
                    >
                      <div className="space-y-3">
                        <div>
                          <label
                            className="
                              mb-1 block
                              text-[8px]
                              text-[var(--color-text-muted)]
                            "
                          >
                            From
                          </label>

                          <input
                            type="date"
                            value={startDate}
                            min={minDate}
                            max={endDate || maxDate}
                            onChange={(event) =>
                              setStartDate(event.target.value)
                            }
                            className="
                              w-full
                              rounded-md
                              border border-[var(--color-border)]
                              bg-[var(--color-input)]
                              px-3 py-2
                              text-[10px]
                              text-[var(--color-text)]
                              outline-none
                            "
                          />
                        </div>

                        <div>
                          <label
                            className="
                              mb-1 block
                              text-[8px]
                              text-[var(--color-text-muted)]
                            "
                          >
                            To
                          </label>

                          <input
                            type="date"
                            value={endDate}
                            min={startDate || minDate}
                            max={maxDate}
                            onChange={(event) =>
                              setEndDate(event.target.value)
                            }
                            className="
                              w-full
                              rounded-md
                              border border-[var(--color-border)]
                              bg-[var(--color-input)]
                              px-3 py-2
                              text-[10px]
                              text-[var(--color-text)]
                              outline-none
                            "
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowDatePicker(false)}
                          disabled={!startDate || !endDate}
                          className="
                            w-full
                            rounded-md
                            bg-[var(--color-primary)]
                            py-2
                            text-[9px]
                            font-medium
                            text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Depot */}
                <div className="relative flex items-center">
                  <span
                    className="
                      pointer-events-none
                      absolute left-3
                      text-[var(--color-text-muted)]
                    "
                  >
                    ⌖
                  </span>

                  <select
                    value={selectedDepot}
                    onChange={(event) => setSelectedDepot(event.target.value)}
                    className="
                      h-10
                      appearance-none
                      rounded-lg
                      border border-[var(--color-border)]
                      bg-[var(--color-surface)]
                      pl-8 pr-9
                      text-[11px]
                      text-[var(--color-text)]
                      outline-none
                      cursor-pointer
                    "
                  >
                    <option value="">All Depots</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Peliyagoda">Peliyagoda</option>
                  </select>

                  <span
                    className="
                      pointer-events-none
                      absolute right-3
                      text-[var(--color-text-secondary)]
                    "
                  >
                    ⌄
                  </span>
                </div>

                {/* Trip status */}
                <div className="relative flex items-center">
                  <span
                    className="
                      pointer-events-none
                      absolute left-3
                      text-[var(--color-text-muted)]
                    "
                  >
                    ▽
                  </span>

                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="
                      h-10
                      appearance-none
                      rounded-lg
                      border border-[var(--color-border)]
                      bg-[var(--color-surface)]
                      pl-8 pr-9
                      text-[11px]
                      text-[var(--color-text)]
                      outline-none
                      cursor-pointer
                    "
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="All Delivered">All Delivered</option>
                    <option value="Partially Delivered">Partially Delivered</option>
                    <option value="Issue to Review">Issue to Review</option>
                    <option value="Receipt Pending">Receipt Pending</option>
                  </select>

                  <span
                    className="
                      pointer-events-none
                      absolute right-3
                      text-[var(--color-text-secondary)]
                    "
                  >
                    ⌄
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* =====================================================
            TAB NAVIGATION
            ===================================================== */}
        <div className="mb-4 border-b border-[var(--color-border)]">
          <nav
            className="flex min-w-max gap-7 overflow-x-auto"
            aria-label="Reports and capacity tabs"
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.path}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "relative whitespace-nowrap pb-2",
                    "text-[11px] font-medium transition-colors",
                    isActive
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {tab.label}

                    {/* Active tab underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[var(--color-primary)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* =====================================================
            SELECTED REPORT PAGE
            ===================================================== */}
        <section>
          <Outlet
  context={{
    startDate,
    endDate,
    selectedDepot,
    selectedStatus,
    selectedPlanningWeek,
    planningWeeks,
  }}
/>
        </section>
      </div>
    </DispatcherLayout>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default ReportsCapacity;