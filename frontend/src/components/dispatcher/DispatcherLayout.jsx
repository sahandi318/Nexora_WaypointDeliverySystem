import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Shared layout for all Dispatcher pages.
 * Keeps the sidebar consistent while page-specific content
 * is rendered inside the main content area.
 */
const DispatcherLayout = ({ children }) => {
  const navItems = [
    {
      label: "Operations Dashboard",
      path: "/dispatcher",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: "Delivery Planning",
      path: "/dispatcher/planning",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 5.5 9 3l6 2.5L20 3v15.5L15 21l-6-2.5L4 21V5.5Z" />
          <path d="M9 3v15.5M15 5.5V21" />
        </svg>
      ),
    },
    {
      label: "Loading Coordination",
      path: "/dispatcher/loading",
      icon: (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h11v10H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
    },
    {
      label: "Live Delivery Monitoring",
      path: "/dispatcher/monitoring",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      ),
    },
    {
      label: "Reports & Capacity",
      path: "/dispatcher/reports",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Shared dispatcher sidebar */}
      <aside
        className="
          fixed left-0 top-0 z-40
          flex h-screen w-[230px] flex-col
          bg-[var(--color-sidebar)] text-white
        "
      >
        {/* Waypoint branding */}
        <div className="flex h-[74px] items-center border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            {/* Temporary logo mark.
                Replace this with the project's real Waypoint logo later. */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13c58b] text-xs font-bold">
              W
            </div>

            <span className="text-[13px] font-semibold">
              Waypoint Group
            </span>
          </div>
        </div>

        {/* Dispatcher navigation */}
        <nav className="flex-1 px-3 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
  key={item.label}
  to={item.path}
  end={item.path === "/dispatcher"}
  className={({ isActive }) =>
    [
      "flex items-center gap-3 rounded-md px-3 py-3",
      "text-[12px] font-medium transition-colors",

      // Active sidebar item
      isActive
        ? "bg-[var(--color-sidebar-active)] text-white"

        // Normal sidebar item
        : "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-white",
    ].join(" ")
  }
>
                <span className="flex h-5 w-5 items-center justify-center">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logged-in dispatcher section */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#145d49] text-xs font-semibold">
              JD
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white">
                Jordan Dissanayake
              </p>

              <p className="text-[9px] text-[#34d399]">
                Dispatcher
              </p>
            </div>

            {/* Logout icon - functionality can be connected later */}
            <button
              type="button"
              className="text-white/70 transition hover:text-white"
              aria-label="Logout"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Page-specific content.
          ml-[230px] keeps content from going underneath the sidebar. */}
      <main className="ml-[230px] min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default DispatcherLayout;