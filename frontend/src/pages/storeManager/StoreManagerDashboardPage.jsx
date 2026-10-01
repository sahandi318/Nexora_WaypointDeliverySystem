import {
  Building2,
  Clock3,
  LogOut,
  MapPin,
  ParkingCircle,
  Store,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import ThemeToggle from "../../components/common/ThemeToggle";

import useAuth from "../../hooks/useAuth";

import waypointLogo from "../../assets/waypoint-logo.png";


function StoreManagerDashboardPage() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const outlet =
    user?.outlet;


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header
        className="
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            gap-4
            px-5
            py-4
            sm:px-8
          "
        >
          {/* BRAND */}

          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                overflow-hidden
              "
            >
              <img
                src={waypointLogo}
                alt="Waypoint"
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            </div>


            <div>
              <p
                className="
                  font-extrabold
                  tracking-[0.03em]
                "
              >
                WAYPOINT
              </p>

              <p
                className="
                  text-xs
                  text-[var(--color-text-muted)]
                "
              >
                Store Manager
              </p>
            </div>
          </div>


          {/* HEADER ACTIONS */}

          <div className="flex items-center gap-2">
            <ThemeToggle />


            <button
              type="button"
              onClick={
                handleLogout
              }
              className="
                nexora-focus
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                px-4
                text-sm
                font-semibold
                transition
                hover:bg-[var(--color-surface-soft)]
              "
            >
              <LogOut
                size={17}
              />

              <span className="hidden sm:inline">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </header>


      {/* ======================================================
          PAGE CONTENT
          ====================================================== */}

      <main
        className="
          mx-auto
          max-w-7xl
          px-5
          py-10
          sm:px-8
        "
      >
        <div
          className="
            rounded-[26px]
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-6
            shadow-[var(--shadow-md)]
            md:p-8
          "
        >
          {/* PAGE HEADER */}

          <div
            className="
              flex
              flex-col
              justify-between
              gap-6
              md:flex-row
              md:items-start
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-[var(--color-success-soft)]
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-[var(--color-success)]
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-[var(--color-success)]
                  "
                />

                Authenticated
              </div>


              <h1
                className="
                  mt-5
                  text-3xl
                  font-bold
                  tracking-[-0.035em]
                  md:text-4xl
                "
              >
                Welcome,{" "}
                {user.fullName}
              </h1>


              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                "
              >
                Your Store Manager
                account is connected
                to the official
                organizer outlet data.
                The full dashboard
                will be implemented in
                the upcoming stages.
              </p>
            </div>


            <div
              className="
                rounded-xl
                bg-[var(--color-primary-soft)]
                px-4
                py-3
                text-sm
                font-bold
                text-[var(--color-primary-strong)]
              "
            >
              {user.userId}
              {" · "}
              {user.role}
            </div>
          </div>


          {/* ==================================================
              OUTLET SUMMARY
              ================================================== */}

          <div
            className="
              mt-8
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <InfoCard
              icon={Store}
              label="Outlet"
              value={
                outlet?.outletCode ||
                "Not assigned"
              }
            />


            <InfoCard
              icon={Building2}
              label="Brand"
              value={
                outlet?.brand ||
                "Not available"
              }
            />


            <InfoCard
              icon={MapPin}
              label="District"
              value={
                outlet?.district ||
                "Not available"
              }
            />


            <InfoCard
              icon={Clock3}
              label="Delivery Window"
              value={
                outlet?.windowOpenTime &&
                outlet?.windowCloseTime
                  ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
                  : "Not specified"
              }
            />
          </div>


          {/* ==================================================
              ADDITIONAL OUTLET DETAILS
              ================================================== */}

          <div
            className="
              mt-5
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <DetailRow
              icon={Building2}
              label="Assigned depot"
              value={
                outlet?.depot?.name ||
                "Not assigned"
              }
            />


            <DetailRow
              icon={ParkingCircle}
              label="Parking constraint"
              value={
                outlet?.parkingConstraint ||
                "None specified"
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}


// ============================================================
// INFORMATION CARD
// ============================================================

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        p-5
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-[var(--color-primary-soft)]
          text-[var(--color-primary)]
        "
      >
        <Icon
          size={19}
        />
      </div>


      <p
        className="
          mt-5
          text-xs
          font-bold
          uppercase
          tracking-[0.12em]
          text-[var(--color-text-muted)]
        "
      >
        {label}
      </p>


      <p
        className="
          mt-2
          font-semibold
        "
      >
        {value}
      </p>
    </div>
  );
}


// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-[var(--color-border)]
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[var(--color-primary-soft)]
          text-[var(--color-primary)]
        "
      >
        <Icon
          size={18}
        />
      </div>


      <div>
        <p
          className="
            text-xs
            font-semibold
            text-[var(--color-text-muted)]
          "
        >
          {label}
        </p>


        <p
          className="
            mt-1
            text-sm
            font-semibold
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}


export default StoreManagerDashboardPage;