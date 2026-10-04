import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Store,
  Truck,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useTranslations from "../../hooks/useTranslations";

import waypointMark from "../../assets/waypoint-mark.png";

const NAVIGATION_ITEMS = [
  {
    key: "dashboard",
    translationKey:
      "storeManager.navDashboard",
    icon: LayoutDashboard,
    path: "/store-manager/dashboard",
    end: true,
  },
  {
    key: "orders",
    translationKey:
      "storeManager.navOrders",
    icon: ClipboardList,
    path: "/store-manager/orders",
    end: true,
  },
  {
    key: "create-order",
    translationKey:
      "storeManager.navCreateOrder",
    icon: PackagePlus,
    path: "/store-manager/orders/new",
    end: true,
  },
  {
    key: "deliveries",
    translationKey:
      "storeManager.navDeliveries",
    icon: Truck,
    path: "/store-manager/deliveries",
    end: true,
  },
  {
    key: "issues",
    translationKey:
      "storeManager.navIssues",
    icon: TriangleAlert,
    path: "/store-manager/issues",
    end: true,
  },
];

function StoreManagerSidebar({
  user,
  outlet,
  depot,
  onNavigate,
}) {
  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();

  const {
    t,
  } = useTranslations();

  const displayName =
    user?.fullName ||
    user?.userId ||
    t(
      "role.storeManager"
    );

  const userInitials =
    getInitials(
      displayName
    );

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
    <aside
      className="
        relative
        flex
        h-full
        min-h-0
        flex-col
        overflow-hidden
        border-r
        border-white/10
        bg-[#07261E]
        text-white
      "
      style={{
        backgroundImage: `
          radial-gradient(circle at 22% 8%, rgba(93,224,178,0.18), transparent 22%),
          radial-gradient(circle at 105% 38%, rgba(22,165,114,0.20), transparent 30%),
          linear-gradient(155deg, rgba(14,61,49,0.92) 0%, rgba(7,38,30,0.98) 46%, rgba(10,54,42,0.98) 100%)
        `,
      }}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-60
        "
        style={{
          backgroundImage: `
            linear-gradient(135deg, transparent 0 48%, rgba(93,224,178,0.045) 48% 50%, transparent 50% 100%),
            linear-gradient(45deg, transparent 0 72%, rgba(255,255,255,0.02) 72% 73%, transparent 73% 100%)
          `,
          backgroundSize:
            "160px 160px, 220px 220px",
        }}
      />

      {/* BRAND */}

      <div
        className="
          relative
          z-10
          flex
          min-h-[68px]
          items-center
          border-b
          border-white/10
          px-4
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2.5
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/15
              bg-white/95
              p-1.5
              shadow-[0_6px_18px_rgba(0,0,0,0.14)]
            "
          >
            <img
              src={waypointMark}
              alt=""
              aria-hidden="true"
              className="
                h-full
                w-full
                object-contain
              "
            />
          </div>

          <div
            className="
              min-w-0
              leading-tight
            "
          >
            <p
              className="
                truncate
                text-[12.5px]
                font-extrabold
                tracking-[0.055em]
                text-white
              "
            >
              WAYPOINT
            </p>

            <p
              className="
                mt-1
                truncate
                text-[8px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-[#8DE0B6]
              "
            >
              {t(
                "storeManager.storeOperations"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}

      <div
        className="
          relative
          z-10
          min-h-0
          flex-1
          overflow-y-auto
          px-3
          py-4
        "
      >
        <p
          className="
            px-2.5
            text-[8.5px]
            font-bold
            uppercase
            tracking-[0.16em]
            text-[#8DE0B6]/65
          "
        >
          {t(
            "storeManager.navigation"
          )}
        </p>

        <nav
          aria-label={t(
            "storeManager.navigation"
          )}
          className="
            mt-2.5
            space-y-1
          "
        >
          {NAVIGATION_ITEMS.map(
            (item) => (
              <NavigationItem
                key={item.key}
                item={item}
                label={t(
                  item.translationKey
                )}
                onNavigate={
                  onNavigate
                }
              />
            )
          )}
        </nav>

        <div
          className="
            mx-2.5
            my-4
            border-t
            border-white/10
          "
        />

        {/* ASSIGNED OUTLET */}

        <div
          className="
            px-2.5
          "
        >
          <p
            className="
              text-[8.5px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-[#8DE0B6]/65
            "
          >
            {t(
              "storeManager.assignedOutlet"
            )}
          </p>

          <div
            className="
              mt-2.5
              overflow-hidden
              rounded-xl
              border
              border-white/10
              bg-white/[0.065]
              shadow-[0_10px_24px_rgba(0,0,0,0.10)]
              backdrop-blur-sm
            "
          >
            <div
              className="
                flex
                items-start
                gap-2.5
                p-3
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#C9F0DA]
                  text-[#0F6B4F]
                "
              >
                <Store
                  size={15}
                  strokeWidth={1.9}
                />
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate
                    text-[12px]
                    font-bold
                    text-white
                  "
                >
                  {outlet?.brand ||
                    t(
                      "storeManager.outlet"
                    )}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    font-medium
                    text-white/58
                  "
                >
                  {outlet?.outletCode ||
                    "—"}
                </p>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                border-t
                border-white/10
                bg-black/[0.08]
                px-3
                py-2.5
                text-[10px]
                text-white/60
              "
            >
              <Warehouse
                size={13}
                className="
                  shrink-0
                  text-[#5DE0B2]
                "
              />

              <span
                className="
                  truncate
                "
              >
                {depot?.name ||
                  t(
                    "storeManager.notAssigned"
                  )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* USER */}

      <div
        className="
          relative
          z-10
          border-t
          border-white/10
          bg-black/[0.10]
          p-3
        "
      >
        <div
          className="
            flex
            items-center
            gap-2.5
            rounded-xl
            px-1.5
            py-1.5
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#16A572]
              text-[10px]
              font-extrabold
              text-white
              ring-2
              ring-[#5DE0B2]/20
            "
          >
            {userInitials}
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                truncate
                text-[11px]
                font-bold
                text-white
              "
            >
              {displayName}
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-[9px]
                text-white/48
              "
            >
              {user?.userId ||
                t(
                  "role.storeManager"
                )}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            aria-label={t(
              "common.signOut"
            )}
            title={t(
              "common.signOut"
            )}
            className="
              nexora-focus
              inline-flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-white/55
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <LogOut
              size={15}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavigationItem({
  item,
  label,
  onNavigate,
}) {
  const Icon =
    item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={
        onNavigate
      }
      className={({
        isActive,
      }) => `
        nexora-focus
        relative
        flex
        min-h-[37px]
        w-full
        items-center
        gap-2.5
        overflow-hidden
        rounded-lg
        px-2.5
        text-[12px]
        font-semibold
        transition
        duration-150

        ${
          isActive
            ? `
                bg-[linear-gradient(90deg,rgba(15,107,79,0.95),rgba(22,165,114,0.78))]
                text-white
                shadow-[0_8px_20px_rgba(0,0,0,0.10)]
                ring-1
                ring-white/10
              `
            : `
                text-white/70
                hover:bg-white/[0.065]
                hover:text-white
              `
        }
      `}
    >
      {({
        isActive,
      }) => (
        <>
          {isActive && (
            <span
              className="
                absolute
                bottom-2
                left-0
                top-2
                w-[3px]
                rounded-r-full
                bg-[#5DE0B2]
              "
            />
          )}

          <Icon
            size={15.5}
            strokeWidth={
              isActive
                ? 2
                : 1.7
            }
            className={`
              shrink-0
              ${
                isActive
                  ? "text-[#C9F0DA]"
                  : ""
              }
            `}
          />

          <span
            className="
              truncate
            "
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function getInitials(
  value
) {
  if (!value) {
    return "SM";
  }

  const words =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[
      words.length - 1
    ][0]
  }`.toUpperCase();
}

export default StoreManagerSidebar;
