import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import DispatcherLayout from "../../../components/dispatcher/DispatcherLayout";

/**
 * Parent layout for all Dispatcher Reports & Capacity pages.
 * Keeps the title, filters, tabs and page content consistent.
 */
const ReportsCapacity = () => {
  const location = useLocation();

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
                <button
                  type="button"
                  className="
                    flex h-10 items-center gap-2
                    rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-surface)] px-4
                    text-[11px] text-[var(--color-text-secondary)]
                  "
                >
                  <span className="text-[var(--color-text-muted)]">▣</span>

                  <span className="text-[8px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    Planning Week
                  </span>

                  <span className="font-medium text-[var(--color-text)]">
                    5 - 11 Oct 2026
                  </span>

                  <span className="ml-1 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </button>

                {/* Depot filter */}
                <button
                  type="button"
                  className="
                    flex h-10 items-center gap-2
                    rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-surface)] px-4
                    text-[11px] text-[var(--color-text-secondary)]
                  "
                >
                  <span className="text-[var(--color-text-muted)]">⌖</span>

                  <span className="text-[8px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    Depot
                  </span>

                  <span className="font-medium text-[var(--color-text)]">
                    Kandy
                  </span>

                  <span className="ml-1 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* Date range */}
                <button
                  type="button"
                  className="
                    flex h-10 items-center gap-2
                    rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-surface)] px-4
                    text-[11px] text-[var(--color-text-secondary)]
                  "
                >
                  <span className="text-[var(--color-text-muted)]">▣</span>

                  <span>
                    22 Sep 2026 - 29 Sep 2026
                  </span>

                  <span className="ml-1 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </button>

                {/* Depot */}
                <button
                  type="button"
                  className="
                    flex h-10 items-center gap-2
                    rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-surface)] px-4
                    text-[11px] text-[var(--color-text-secondary)]
                  "
                >
                  <span className="text-[var(--color-text-muted)]">⌖</span>

                  <span>Kandy</span>

                  <span className="ml-1 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </button>

                {/* Trip status */}
                <button
                  type="button"
                  className="
                    flex h-10 items-center gap-2
                    rounded-lg border border-[var(--color-border)]
                    bg-[var(--color-surface)] px-4
                    text-[11px] text-[var(--color-text-secondary)]
                  "
                >
                  <span className="text-[var(--color-text-muted)]">▽</span>

                  <span>All Statuses</span>

                  <span className="ml-1 text-[var(--color-text-secondary)]">
                    ⌄
                  </span>
                </button>
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
          <Outlet />
        </section>
      </div>
    </DispatcherLayout>
  );
};

export default ReportsCapacity;