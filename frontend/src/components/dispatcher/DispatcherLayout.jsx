import ThemeToggle from "../common/ThemeToggle";
import DispatcherSidebar from "./DispatcherSidebar";

import waypointMark from "../../assets/waypoint-logo.png";

function DispatcherLayout({ children }) {
  return (
    <div className="dispatcher-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">

      {/* COMMON DISPATCHER HEADER */}
      <header className="dispatcher-top-header">

        <div className="dispatcher-top-brand">
          <img
            src={waypointMark}
            alt="Waypoint Group"
            className="dispatcher-top-logo"
          />

          <span>
            Waypoint Group
          </span>
        </div>


        <div className="dispatcher-top-theme">
          <ThemeToggle />
        </div>

      </header>


      {/* COMMON DISPATCHER BODY */}
      <div className="dispatcher-layout min-h-screen bg-[var(--color-bg)]">

        <DispatcherSidebar />

        <main className="dispatcher-main min-h-screen bg-[var(--color-bg)]">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DispatcherLayout;