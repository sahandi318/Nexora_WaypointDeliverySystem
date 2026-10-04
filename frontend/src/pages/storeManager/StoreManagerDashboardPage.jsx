import {
  Building2,
  Clock3,
  LogOut,
  MapPin,
  ParkingCircle,
  RefreshCw,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useStoreManagerContext from "../../hooks/useStoreManagerContext";

import waypointLogo from "../../assets/waypoint-logo.png";


// ============================================================
// STORE MANAGER DASHBOARD
// ============================================================

function StoreManagerDashboardPage() {
  const navigate =
    useNavigate();


  const {
    logout,
  } = useAuth();


  const {
    user,
    outlet,
    depot,

    isLoading,
    isRefreshing,

    errorMessage,

    refreshContext,
  } = useStoreManagerContext();


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {
    logout();


    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <WorkspaceLoadingState />
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    errorMessage ||
    !user ||
    !outlet
  ) {
    return (
      <WorkspaceErrorState
        message={
          errorMessage ||
          "Your Store Manager workspace could not be loaded."
        }
        onRetry={
          refreshContext
        }
        onLogout={
          handleLogout
        }
        isRefreshing={
          isRefreshing
        }
      />
    );
  }


  // ==========================================================
  // DELIVERY WINDOW
  // ==========================================================

  const deliveryWindow =
    outlet.windowOpenTime &&
    outlet.windowCloseTime
      ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
      : "Not specified";


  const mallWindow =
    outlet.mallWindow ||
    "Not applicable";


  const parkingConstraint =
    formatOperationalValue(
      outlet.parkingConstraint
    );


  const dockType =
    formatOperationalValue(
      outlet.dockType
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header
        className="
          sticky
          top-0
          z-30
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          shadow-[var(--shadow-xs)]
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
            py-3.5
            sm:px-8
          "
        >
          {/* BRAND */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
              "
            >
              <img
                src={
                  waypointLogo
                }
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
                  text-[0.95rem]
                  font-extrabold
                  tracking-[0.035em]
                "
              >
                WAYPOINT
              </p>


              <p
                className="
                  mt-0.5
                  text-xs
                  font-medium
                  text-[var(--color-text-muted)]
                "
              >
                Store Manager
              </p>
            </div>
          </div>


          {/* HEADER ACTIONS */}

          <div
            className="
              flex
              items-center
              gap-2
              pr-12
              sm:pr-12
            "
          >
            <button
              type="button"
              onClick={
                refreshContext
              }
              disabled={
                isRefreshing
              }
              className="
                nexora-focus
                hidden
                h-10
                items-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                px-3.5
                text-sm
                font-semibold
                text-[var(--color-text-secondary)]
                transition
                duration-200
                hover:border-[var(--color-border-strong)]
                hover:bg-[var(--color-surface-soft)]
                hover:text-[var(--color-text)]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:inline-flex
              "
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>


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
                px-3.5
                text-sm
                font-semibold
                transition
                duration-200
                hover:border-[var(--color-border-strong)]
                hover:bg-[var(--color-surface-soft)]
              "
            >
              <LogOut
                size={16}
              />


              <span
                className="
                  hidden
                  sm:inline
                "
              >
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
          py-8
          sm:px-8
          sm:py-10
        "
      >
        {/* ====================================================
            WELCOME / TRUSTED CONTEXT
            ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            shadow-[var(--shadow-md)]
          "
        >
          <div
            className="
              border-b
              border-[var(--color-border)]
              px-6
              py-7
              md:px-8
              md:py-8
            "
          >
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
                {/* TRUST BADGE */}

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-[var(--color-border)]
                    bg-[var(--color-success-soft)]
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-[var(--color-success)]
                  "
                >
                  <ShieldCheck
                    size={14}
                  />

                  Trusted server context
                </div>


                <h1
                  className="
                    mt-5
                    text-3xl
                    font-bold
                    tracking-[-0.04em]
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
                  Your workspace is connected
                  to your authenticated Waypoint
                  account and assigned outlet.
                  Outlet and depot information is
                  verified by the server before it
                  is displayed here.
                </p>
              </div>


              {/* IDENTITY */}

              <div
                className="
                  shrink-0
                  rounded-2xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface-soft)]
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-[var(--color-text-muted)]
                  "
                >
                  Signed in as
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-[var(--color-primary-strong)]
                  "
                >
                  {user.userId}
                  {" · "}
                  {formatRole(
                    user.role
                  )}
                </p>
              </div>
            </div>
          </div>


          {/* ==================================================
              OUTLET SUMMARY
              ================================================== */}

          <div
            className="
              px-6
              py-7
              md:px-8
              md:py-8
            "
          >
            <div
              className="
                flex
                flex-col
                justify-between
                gap-2
                sm:flex-row
                sm:items-end
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-[var(--color-primary)]
                  "
                >
                  Assigned operation
                </p>


                <h2
                  className="
                    mt-2
                    text-xl
                    font-bold
                    tracking-[-0.025em]
                  "
                >
                  Outlet overview
                </h2>
              </div>


              <p
                className="
                  text-xs
                  font-medium
                  text-[var(--color-text-muted)]
                "
              >
                Verified from current database
                assignment
              </p>
            </div>


            <div
              className="
                mt-6
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              <InfoCard
                icon={
                  Store
                }
                label="Outlet"
                value={
                  outlet.outletCode
                }
              />


              <InfoCard
                icon={
                  Building2
                }
                label="Brand"
                value={
                  outlet.brand ||
                  "Not available"
                }
              />


              <InfoCard
                icon={
                  MapPin
                }
                label="District"
                value={
                  outlet.district ||
                  "Not available"
                }
              />


              <InfoCard
                icon={
                  Clock3
                }
                label="Delivery Window"
                value={
                  deliveryWindow
                }
              />
            </div>


            {/* ================================================
                OPERATIONAL DETAILS
                ================================================ */}

            <div
              className="
                mt-7
                border-t
                border-[var(--color-border)]
                pt-7
              "
            >
              <div
                className="
                  mb-4
                  flex
                  items-center
                  gap-2
                "
              >
                <Warehouse
                  size={18}
                  className="
                    text-[var(--color-primary)]
                  "
                />

                <h3
                  className="
                    text-base
                    font-bold
                  "
                >
                  Operational details
                </h3>
              </div>


              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                "
              >
                <DetailRow
                  icon={
                    Building2
                  }
                  label="Assigned depot"
                  value={
                    depot?.name ||
                    "Not assigned"
                  }
                  secondaryValue={
                    depot?.code ||
                    null
                  }
                />


                <DetailRow
                  icon={
                    ParkingCircle
                  }
                  label="Parking constraint"
                  value={
                    parkingConstraint ||
                    "None specified"
                  }
                />


                <DetailRow
                  icon={
                    Warehouse
                  }
                  label="Dock type"
                  value={
                    dockType ||
                    "Not specified"
                  }
                />


                <DetailRow
                  icon={
                    Clock3
                  }
                  label="Mall window"
                  value={
                    mallWindow
                  }
                />
              </div>
            </div>
          </div>
        </section>


        {/* ====================================================
            DEVELOPMENT NOTE
            ==================================================== */}

        <section
          className="
            mt-5
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-5
            py-4
            shadow-[var(--shadow-xs)]
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--color-primary-soft)]
                text-[var(--color-primary)]
              "
            >
              <ShieldCheck
                size={17}
              />
            </div>


            <div>
              <p
                className="
                  text-sm
                  font-bold
                "
              >
                Store Manager access verified
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-[var(--color-text-muted)]
                "
              >
                Future orders, deliveries,
                issues and notifications will
                use this same authenticated
                Store Manager context.
              </p>
            </div>
          </div>
        </section>
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
        transition
        duration-200
        hover:border-[var(--color-border-strong)]
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
          text-[10px]
          font-bold
          uppercase
          tracking-[0.13em]
          text-[var(--color-text-muted)]
        "
      >
        {label}
      </p>


      <p
        className="
          mt-2
          text-[0.95rem]
          font-semibold
          text-[var(--color-text)]
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
  secondaryValue,
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
        bg-[var(--color-surface)]
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


      <div
        className="
          min-w-0
        "
      >
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
            truncate
            text-sm
            font-semibold
          "
        >
          {value}
        </p>


        {secondaryValue && (
          <p
            className="
              mt-0.5
              text-xs
              font-medium
              text-[var(--color-text-muted)]
            "
          >
            {secondaryValue}
          </p>
        )}
      </div>
    </div>
  );
}


// ============================================================
// LOADING STATE
// ============================================================

function WorkspaceLoadingState() {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        px-5
      "
    >
      <div
        className="
          flex
          flex-col
          items-center
          text-center
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            shadow-[var(--shadow-sm)]
          "
        >
          <RefreshCw
            size={23}
            className="
              animate-spin
              text-[var(--color-primary)]
            "
          />
        </div>


        <h1
          className="
            mt-5
            text-lg
            font-bold
            tracking-[-0.02em]
            text-[var(--color-text)]
          "
        >
          Loading your Store Manager workspace
        </h1>


        <p
          className="
            mt-2
            max-w-sm
            text-sm
            leading-6
            text-[var(--color-text-muted)]
          "
        >
          Verifying your account and current
          outlet assignment.
        </p>
      </div>
    </div>
  );
}


// ============================================================
// ERROR STATE
// ============================================================

function WorkspaceErrorState({
  message,
  onRetry,
  onLogout,
  isRefreshing,
}) {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        px-5
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-[26px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-7
          text-center
          shadow-[var(--shadow-lg)]
          sm:p-8
        "
      >
        <div
          className="
            mx-auto
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-[var(--color-danger-soft)]
            text-[var(--color-danger)]
          "
        >
          <ShieldCheck
            size={22}
          />
        </div>


        <h1
          className="
            mt-5
            text-xl
            font-bold
            tracking-[-0.025em]
          "
        >
          Unable to load workspace
        </h1>


        <p
          className="
            mt-3
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          {message}
        </p>


        <div
          className="
            mt-6
            flex
            flex-col
            gap-3
            sm:flex-row
          "
        >
          <button
            type="button"
            onClick={
              onRetry
            }
            disabled={
              isRefreshing
            }
            className="
              nexora-focus
              inline-flex
              h-11
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--color-primary)]
              px-4
              text-sm
              font-bold
              text-white
              transition
              hover:bg-[var(--color-primary-hover)]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Try again
          </button>


          <button
            type="button"
            onClick={
              onLogout
            }
            className="
              nexora-focus
              inline-flex
              h-11
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-4
              text-sm
              font-bold
              transition
              hover:bg-[var(--color-surface-soft)]
            "
          >
            <LogOut
              size={16}
            />

            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// VALUE FORMATTERS
// ============================================================

function formatOperationalValue(
  value
) {
  if (!value) {
    return "";
  }


  return value
    .replaceAll(
      "_",
      " "
    )
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word
          .slice(1)
          .toLowerCase()
    )
    .join(" ");
}


function formatRole(
  role
) {
  return formatOperationalValue(
    role
  );
}


export default StoreManagerDashboardPage;