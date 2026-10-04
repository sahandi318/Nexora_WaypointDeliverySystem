import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  MapPin,
  Route,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";



function DispatcherSidebar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };


  const displayName =
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Dispatcher";


  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join("") || "D";


  const menuItems = [
    {
      name: "Operations Dashboard",
      path: "/dispatcher/dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "Delivery Planning",
      path: "/dispatcher/planning",
      icon: Route,
    },

    {
      name: "Loading Coordination",
      path: "/dispatcher/loading",
      icon: Boxes,
    },

    {
      name: "Live Delivery Monitoring",
      path: "/dispatcher/live",
      icon: MapPin,
    },

    {
      name: "Reports & Capacity",
      path: "/dispatcher/reports",
      icon: BarChart3,
    },
  ];


  return (
    <aside className="dispatcher-sidebar">

      <div className="dispatcher-sidebar-top">

        


        <nav className="dispatcher-nav">

          {menuItems.map(
            ({
              name,
              path,
              icon: Icon,
            }) => (

              <NavLink
                key={path}
                to={path}
                className={({
                  isActive,
                }) =>
                  `dispatcher-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <Icon
                  size={19}
                  strokeWidth={2}
                />

                <span>
                  {name}
                </span>

              </NavLink>

            )
          )}

        </nav>

      </div>


      <div className="dispatcher-user-section">

        <div className="dispatcher-avatar">
          {initials}
        </div>


        <div className="dispatcher-user-text">

          <strong>
            {displayName}
          </strong>

          <span>
            Dispatcher
          </span>

        </div>


        <button
          type="button"
          className="dispatcher-logout-button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
        >

          <LogOut
            size={18}
          />

        </button>

      </div>

    </aside>
  );
}


export default DispatcherSidebar;