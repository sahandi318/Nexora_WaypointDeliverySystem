import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Route,
  ShieldCheck,
  Store,
  Truck,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import waypointLogo from "../../assets/waypoint-logo.png";
import useAuth from "../../hooks/useAuth";
import ThemeToggle from "../common/ThemeToggle";


const STAFF_REGISTRATION_LINKS = [
  {
    label:
      "Store Manager",

    description:
      "Assign to an outlet",

    to:
      "/admin/staff/store-managers/register",

    icon:
      Store,
  },
  {
    label:
      "Dispatcher",

    description:
      "Assign to a depot",

    to:
      "/admin/staff/dispatchers/register",

    icon:
      Route,
  },
  {
    label:
      "Loader",

    description:
      "Assign to a depot",

    to:
      "/admin/staff/loaders/register",

    icon:
      PackageCheck,
  },
  {
    label:
      "Driver",

    description:
      "Assign to a depot",

    to:
      "/admin/staff/drivers/register",

    icon:
      Truck,
  },
];


function AdminShell({
  children,
  title,
  description,
}) {
  const {
    user,
    logout,
  } = useAuth();

  const location =
    useLocation();

  const navigate =
    useNavigate();


  function handleLogout() {
    logout();

    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );
  }


  return (
    <div
      className="
        min-h-screen
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
    >
      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1500px]
            items-center
            justify-between
            gap-4
            px-4
            py-3
            sm:px-6
            lg:px-8
          "
        >
          <Link
            to="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-white
                p-1
                shadow-sm
              "
            >
              <img
                src={waypointLogo}
                alt="Waypoint"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-extrabold
                  tracking-[0.08em]
                "
              >
                WAYPOINT
              </p>

              <p
                className="
                  truncate
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[var(--color-text-muted)]
                "
              >
                Administration
              </p>
            </div>
          </Link>


          <nav
            className="
              flex
              items-center
              gap-1.5
              pr-14
              sm:gap-2
              sm:pr-14
            "
          >
            <AdminNavLink
              to="/admin/dashboard"
              active={
                location.pathname ===
                "/admin/dashboard"
              }
              icon={LayoutDashboard}
              label="Dashboard"
            />

            <RegisterRoleMenu
              pathname={
                location.pathname
              }
            />

            <AdminNavLink
              to="/admin/profile"
              active={
                location.pathname ===
                  "/admin/profile" ||
                location.pathname ===
                  "/admin/change-password"
              }
              icon={UserRound}
              label="Profile"
            />

            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="
                nexora-focus
                inline-flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                text-[var(--color-text-muted)]
                transition
                hover:border-[var(--color-border-strong)]
                hover:bg-[var(--color-surface-soft)]
                hover:text-[var(--color-danger)]
              "
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>


      <main
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-4
          py-7
          sm:px-6
          lg:px-8
          lg:py-9
        "
      >
        <div
          className="
            mb-7
            flex
            flex-col
            gap-4
            border-b
            border-[var(--color-border)]
            pb-6
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                mb-2
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-[var(--color-primary-soft)]
                px-3
                py-1.5
                text-xs
                font-bold
                text-[var(--color-primary)]
              "
            >
              <ShieldCheck size={14} />
              Admin Portal
            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-[-0.035em]
                sm:text-3xl
              "
            >
              {title}
            </h1>

            {description && (
              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                "
              >
                {description}
              </p>
            )}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-4
              py-2.5
              text-sm
              shadow-[var(--shadow-xs)]
            "
          >
            <span className="text-[var(--color-text-muted)]">
              Signed in as
            </span>{" "}
            <strong>
              {user?.fullName ||
                user?.userId}
            </strong>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}


function RegisterRoleMenu({
  pathname,
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const wrapperRef =
    useRef(null);

  const isActive =
    pathname.startsWith(
      "/admin/staff/"
    );


  useEffect(() => {
    function handlePointerDown(
      event
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    }


    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsOpen(false);
      }
    }


    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);


  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <div
        className="
          inline-flex
          overflow-hidden
          rounded-xl
          border
          border-[var(--color-primary)]
          bg-[var(--color-primary)]
          text-white
        "
      >
        <button
          type="button"
          onClick={() =>
            setIsOpen(
              (current) =>
                !current
            )
          }
          className={
            `nexora-focus inline-flex h-10 items-center justify-center gap-2 px-3 text-sm font-bold transition hover:bg-[var(--color-primary-hover)] ${
              isActive
                ? "bg-[var(--color-primary-hover)]"
                : ""
            }`
          }
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <UserPlus size={17} />

          <span className="hidden lg:inline">
            Register
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setIsOpen(
              (current) =>
                !current
            )
          }
          className="
            nexora-focus
            flex
            h-10
            w-9
            items-center
            justify-center
            border-l
            border-white/25
            transition
            hover:bg-[var(--color-primary-hover)]
          "
          aria-label="Choose staff role to register"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <ChevronDown
            size={16}
            className={
              `transition-transform ${
                isOpen
                  ? "rotate-180"
                  : ""
              }`
            }
          />
        </button>
      </div>


      {isOpen && (
        <div
          role="menu"
          className="
            absolute
            right-0
            top-[calc(100%+10px)]
            z-50
            w-[290px]
            overflow-hidden
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-2
            shadow-[var(--shadow-lg)]
          "
        >
          <div
            className="
              border-b
              border-[var(--color-border)]
              px-3
              pb-2.5
              pt-1.5
            "
          >
            <p className="text-sm font-bold">
              Register staff account
            </p>

            <p
              className="
                mt-0.5
                text-xs
                leading-5
                text-[var(--color-text-muted)]
              "
            >
              Choose an operational role.
            </p>
          </div>


          <div className="mt-1 space-y-1">
            {STAFF_REGISTRATION_LINKS.map(
              ({
                label,
                description,
                to,
                icon: Icon,
              }) => {
                const active =
                  pathname ===
                  to;


                return (
                  <Link
                    key={to}
                    to={to}
                    role="menuitem"
                    onClick={() =>
                      setIsOpen(false)
                    }
                    className={
                      `nexora-focus flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                        active
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]"
                      }`
                    }
                  >
                    <span
                      className="
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
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {label}
                      </span>

                      <span
                        className="
                          block
                          truncate
                          text-xs
                          text-[var(--color-text-muted)]
                        "
                      >
                        {description}
                      </span>
                    </span>
                  </Link>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function AdminNavLink({
  to,
  active,
  icon: Icon,
  label,
}) {
  const activeClasses =
    "bg-[var(--color-surface-soft)] text-[var(--color-primary)] border-[var(--color-border-strong)]";

  const idleClasses =
    "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]";


  return (
    <Link
      to={to}
      className={`
        nexora-focus
        inline-flex
        h-10
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        px-3
        text-sm
        font-bold
        transition
        ${
          active
            ? activeClasses
            : idleClasses
        }
      `}
    >
      <Icon size={17} />

      <span className="hidden lg:inline">
        {label}
      </span>
    </Link>
  );
}


export default AdminShell;
