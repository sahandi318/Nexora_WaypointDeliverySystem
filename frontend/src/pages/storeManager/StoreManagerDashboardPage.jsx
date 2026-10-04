import {
  Building2,
  Clock3,
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

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";

import useAuth from "../../hooks/useAuth";
import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useTranslations from "../../hooks/useTranslations";

function StoreManagerDashboardPage() {
  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();

  const {
    t,
  } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshContext,
  } = useStoreManagerContext();

  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  if (isLoading) {
    return (
      <WorkspaceLoadingState
        title={t(
          "storeManager.loadingWorkspace"
        )}
        description={t(
          "storeManager.loadingWorkspaceDescription"
        )}
      />
    );
  }

  if (
    errorMessage ||
    !user ||
    !outlet
  ) {
    return (
      <WorkspaceErrorState
        message={
          errorMessage ||
          t(
            "storeManager.workspaceUnavailable"
          )
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
        t={t}
      />
    );
  }

  const deliveryWindow =
    outlet.windowOpenTime &&
    outlet.windowCloseTime
      ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
      : t(
          "storeManager.notSpecified"
        );

  const mallWindow =
    outlet.mallWindow ||
    t(
      "storeManager.notApplicable"
    );

  const parkingConstraint =
    formatOperationalValue(
      outlet.parkingConstraint
    ) ||
    t(
      "storeManager.noneSpecified"
    );

  const dockType =
    formatOperationalValue(
      outlet.dockType
    ) ||
    t(
      "storeManager.notSpecified"
    );

  return (
    <StoreManagerShell
      user={user}
      outlet={outlet}
      depot={depot}
    >
      <StoreManagerPageHeader
        eyebrow={t(
          "storeManager.workspaceEyebrow"
        )}
        title={t(
          "storeManager.dashboardTitle"
        )}
        description={t(
          "storeManager.dashboardDescription"
        )}
        actions={
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
              inline-flex
              min-h-9
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-3
              text-[11.5px]
              font-semibold
              text-[var(--color-text-secondary)]
              shadow-sm
              transition
              duration-150
              hover:-translate-y-[1px]
              hover:border-[var(--color-border-strong)]
              hover:bg-[var(--color-surface-soft)]
              hover:text-[var(--color-text)]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={14}
              className={
                isRefreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span
              className="
                hidden
                sm:inline
              "
            >
              {t(
                "common.refresh"
              )}
            </span>
          </button>
        }
      />

      <div
        className="
          mt-5
          grid
          gap-5
          xl:grid-cols-[minmax(0,1.48fr)_minmax(300px,0.52fr)]
        "
      >
        <section
          className="
            relative
            overflow-hidden
            rounded-[20px]
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            shadow-[0_12px_30px_rgba(15,23,42,0.04)]
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-20
              top-10
              h-60
              w-60
              rounded-full
              bg-[#8DE0B6]/8
              blur-3xl
            "
          />

          <div
            className="
              absolute
              left-0
              top-0
              h-full
              w-[3px]
              bg-[linear-gradient(180deg,#16A572_0%,#5DE0B2_60%,transparent_100%)]
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-4
              border-b
              border-[var(--color-border)]
              px-5
              py-5
              sm:flex-row
              sm:items-start
              sm:justify-between
              sm:px-6
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[var(--color-primary)]
                "
              >
                {t(
                  "storeManager.assignedOperation"
                )}
              </p>

              <h2
                className="
                  mt-1.5
                  text-[17px]
                  font-bold
                  tracking-[-0.02em]
                  text-[var(--color-text)]
                "
              >
                {outlet.brand ||
                  t(
                    "storeManager.outlet"
                  )}
              </h2>

              <p
                className="
                  mt-1
                  text-[12px]
                  text-[var(--color-text-secondary)]
                "
              >
                {outlet.outletCode}

                {outlet.district
                  ? ` · ${outlet.district}`
                  : ""}
              </p>
            </div>

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-xl
                border
                border-[#C9F0DA]
                bg-[#F5FCF8]
                px-3
                py-2
                text-[10.5px]
                font-semibold
                text-[#356d59]
              "
            >
              <ShieldCheck
                size={14}
                className="
                  text-[#0FA968]
                "
              />

              {t(
                "storeManager.verifiedAssignment"
              )}
            </div>
          </div>

          <div
            className="
              relative
              grid
              gap-3
              p-4
              sm:grid-cols-2
              sm:p-5
            "
          >
            <ContextCard
              icon={Store}
              label={t(
                "storeManager.outletCode"
              )}
              value={
                outlet.outletCode
              }
            />

            <ContextCard
              icon={Building2}
              label={t(
                "storeManager.brand"
              )}
              value={
                outlet.brand ||
                t(
                  "storeManager.notAvailable"
                )
              }
            />

            <ContextCard
              icon={MapPin}
              label={t(
                "storeManager.district"
              )}
              value={
                outlet.district ||
                t(
                  "storeManager.notAvailable"
                )
              }
            />

            <ContextCard
              icon={Clock3}
              label={t(
                "common.deliveryWindow"
              )}
              value={
                deliveryWindow
              }
            />
          </div>
        </section>

        <section
          className="
            relative
            overflow-hidden
            rounded-[20px]
            border
            border-[#0E3D31]/20
            bg-[var(--color-surface)]
            p-5
            shadow-[0_12px_30px_rgba(15,23,42,0.04)]
            sm:p-6
          "
        >
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-12
              -top-12
              h-40
              w-40
              rounded-full
              bg-[#C9F0DA]/35
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              h-full
              flex-col
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
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-[#C9F0DA]
                  bg-[#EFFAF4]
                  text-[#0F6B4F]
                "
              >
                <Warehouse
                  size={19}
                />
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    text-[8.5px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-[var(--color-text-muted)]
                  "
                >
                  {t(
                    "common.assignedDepot"
                  )}
                </p>

                <h2
                  className="
                    mt-1.5
                    truncate
                    text-[17px]
                    font-bold
                    tracking-[-0.02em]
                    text-[var(--color-text)]
                  "
                >
                  {depot?.name ||
                    t(
                      "storeManager.notAssigned"
                    )}
                </h2>

                {depot?.code && (
                  <p
                    className="
                      mt-0.5
                      text-[9.5px]
                      font-semibold
                      uppercase
                      tracking-[0.09em]
                      text-[var(--color-primary)]
                    "
                  >
                    {depot.code}
                  </p>
                )}
              </div>
            </div>

            <div
              className="
                mt-5
                h-px
                w-full
                bg-[linear-gradient(90deg,#C9F0DA,var(--color-border),transparent)]
              "
            />

            <p
              className="
                mt-4
                text-[11.5px]
                leading-5
                text-[var(--color-text-secondary)]
              "
            >
              {t(
                "storeManager.depotDescription"
              )}
            </p>

            <div
              className="
                mt-auto
                pt-6
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface-soft)]
                  px-2.5
                  py-2
                  text-[9.5px]
                  font-semibold
                  text-[var(--color-text-secondary)]
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#16A572]
                    shadow-[0_0_0_4px_rgba(22,165,114,0.08)]
                  "
                />

                {t(
                  "storeManager.verifiedAssignment"
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section
        className="
          relative
          mt-5
          overflow-hidden
          rounded-[20px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          shadow-[0_10px_26px_rgba(15,23,42,0.035)]
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-14
            -top-14
            h-44
            w-44
            rounded-full
            bg-[#8DE0B6]/8
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-2
            border-b
            border-[var(--color-border)]
            px-5
            py-4
            sm:flex-row
            sm:items-end
            sm:justify-between
            sm:px-6
          "
        >
          <div>
            <h2
              className="
                text-[14.5px]
                font-bold
                tracking-[-0.015em]
                text-[var(--color-text)]
              "
            >
              {t(
                "storeManager.operationalDetails"
              )}
            </h2>

            <p
              className="
                mt-1
                text-[11.5px]
                text-[var(--color-text-secondary)]
              "
            >
              {t(
                "storeManager.operationalDetailsDescription"
              )}
            </p>
          </div>

          <span
            className="
              text-[8.5px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-[var(--color-text-muted)]
            "
          >
            OUTLET CONTEXT
          </span>
        </div>

        <div
          className="
            relative
            grid
            gap-3
            p-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <OperationalCard
            icon={ParkingCircle}
            label={t(
              "storeManager.parkingConstraint"
            )}
            value={
              parkingConstraint
            }
          />

          <OperationalCard
            icon={Warehouse}
            label={t(
              "storeManager.dockType"
            )}
            value={
              dockType
            }
          />

          <OperationalCard
            icon={Clock3}
            label={t(
              "storeManager.mallWindow"
            )}
            value={
              mallWindow
            }
          />

          <OperationalCard
            icon={ShieldCheck}
            label={t(
              "storeManager.accessStatus"
            )}
            value={t(
              "storeManager.verified"
            )}
          />
        </div>
      </section>
    </StoreManagerShell>
  );
}

function ContextCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        group
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        p-4
        transition
        duration-150
        hover:-translate-y-[1px]
        hover:border-[#C9F0DA]
        hover:shadow-[0_8px_18px_rgba(15,23,42,0.035)]
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
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-[#C9F0DA]
            bg-[#F2FBF6]
            text-[#0F6B4F]
          "
        >
          <Icon
            size={16}
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              text-[var(--color-text-muted)]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1.5
              break-words
              text-[12.5px]
              font-bold
              leading-5
              text-[var(--color-text)]
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function OperationalCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        p-4
        transition
        duration-150
        hover:-translate-y-[1px]
        hover:border-[#C9F0DA]
        hover:shadow-[0_8px_18px_rgba(15,23,42,0.03)]
      "
    >
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
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-[#E9F8F0]
            text-[#0F6B4F]
          "
        >
          <Icon
            size={15}
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              text-[var(--color-text-muted)]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              break-words
              text-[12px]
              font-bold
              leading-5
              text-[var(--color-text)]
            "
          >
            {value}
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="
          absolute
          bottom-0
          left-4
          right-4
          h-px
          origin-left
          scale-x-0
          bg-[linear-gradient(90deg,#0FA968,#8DE0B6)]
          transition-transform
          duration-200
          group-hover:scale-x-100
        "
      />
    </div>
  );
}

function WorkspaceLoadingState({
  title,
  description,
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
          max-w-sm
          text-center
        "
      >
        <div
          className="
            mx-auto
            h-9
            w-9
            animate-spin
            rounded-full
            border-[3px]
            border-[var(--color-primary-soft)]
            border-t-[var(--color-primary)]
          "
        />

        <h1
          className="
            mt-5
            text-lg
            font-bold
            text-[var(--color-text)]
          "
        >
          {title}
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function WorkspaceErrorState({
  message,
  onRetry,
  onLogout,
  isRefreshing,
  t,
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
          rounded-2xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-6
          text-center
          shadow-[var(--shadow-lg)]
          sm:p-8
        "
      >
        <div
          className="
            mx-auto
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-[var(--color-danger-soft)]
            text-[var(--color-danger)]
          "
        >
          <ShieldCheck
            size={21}
          />
        </div>

        <h1
          className="
            mt-5
            text-xl
            font-bold
            tracking-[-0.02em]
            text-[var(--color-text)]
          "
        >
          {t(
            "storeManager.unableToLoadWorkspace"
          )}
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
              min-h-11
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

            {t(
              "storeManager.tryAgain"
            )}
          </button>

          <button
            type="button"
            onClick={
              onLogout
            }
            className="
              nexora-focus
              inline-flex
              min-h-11
              flex-1
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-4
              text-sm
              font-bold
              text-[var(--color-text)]
              transition
              hover:bg-[var(--color-surface-soft)]
            "
          >
            {t(
              "common.signOut"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

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

export default StoreManagerDashboardPage;
