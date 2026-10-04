import "../../pages/dispatcher/dispatcherDashboard.css";

import ThemeToggle from "../common/ThemeToggle";
import DispatcherSidebar from "./DispatcherSidebar";

import waypointMark from "../../assets/waypoint-mark.png";

function DispatcherLayout({ children }) {
  return (
    <div className="dispatcher-page">

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
      <div className="dispatcher-layout">

        <DispatcherSidebar />

        <main className="dispatcher-main">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DispatcherLayout;