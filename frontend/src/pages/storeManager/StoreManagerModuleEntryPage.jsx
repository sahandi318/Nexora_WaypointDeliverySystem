import {
  ClipboardList,
  PackagePlus,
  RefreshCw,
  Store,
  Truck,
  TriangleAlert,
} from "lucide-react";

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useTranslations from "../../hooks/useTranslations";

const SECTION_CONFIG = {
  orders: {
    icon: ClipboardList,
    titleKey:
      "storeManager.ordersPageTitle",
    descriptionKey:
      "storeManager.ordersPageDescription",
  },
  "create-order": {
    icon: PackagePlus,
    titleKey:
      "storeManager.createOrderPageTitle",
    descriptionKey:
      "storeManager.createOrderPageDescription",
  },
  deliveries: {
    icon: Truck,
    titleKey:
      "storeManager.deliveriesPageTitle",
    descriptionKey:
      "storeManager.deliveriesPageDescription",
  },
  issues: {
    icon: TriangleAlert,
    titleKey:
      "storeManager.issuesPageTitle",
    descriptionKey:
      "storeManager.issuesPageDescription",
  },
};

function StoreManagerModuleEntryPage({
  section,
}) {
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

  const config =
    SECTION_CONFIG[
      section
    ] ||
    SECTION_CONFIG.orders;

  const Icon =
    config.icon;

  if (isLoading) {
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

          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-[var(--color-text-secondary)]
            "
          >
            {t(
              "storeManager.loadingWorkspace"
            )}
          </p>
        </div>
      </div>
    );
  }

  if (
    errorMessage ||
    !user ||
    !outlet
  ) {
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
          "
        >
          <TriangleAlert
            size={22}
            className="
              mx-auto
              text-[var(--color-danger)]
            "
          />

          <h1
            className="
              mt-4
              text-lg
              font-bold
              text-[var(--color-text)]
            "
          >
            {t(
              "storeManager.unableToLoadWorkspace"
            )}
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-[var(--color-text-secondary)]
            "
          >
            {errorMessage ||
              t(
                "storeManager.workspaceUnavailable"
              )}
          </p>

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
              mt-5
              inline-flex
              min-h-10
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
              size={15}
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
        </div>
      </div>
    );
  }

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
          config.titleKey
        )}
        description={t(
          config.descriptionKey
        )}
      />

      <section
        className="
          relative
          mt-5
          overflow-hidden
          rounded-[20px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          px-5
          py-8
          shadow-[0_10px_26px_rgba(15,23,42,0.035)]
          sm:px-7
          sm:py-10
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-64
            w-64
            rounded-full
            bg-[#8DE0B6]/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            mx-auto
            max-w-xl
            text-center
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
              border
              border-[#C9F0DA]
              bg-[#F2FBF6]
              text-[#0F6B4F]
              shadow-[0_8px_20px_rgba(15,169,104,0.06)]
            "
          >
            <Icon
              size={21}
            />
          </div>

          <p
            className="
              mt-5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-[var(--color-primary)]
            "
          >
            {t(
              "storeManager.moduleFoundationReady"
            )}
          </p>

          <h2
            className="
              mt-2
              text-lg
              font-bold
              tracking-[-0.02em]
              text-[var(--color-text)]
            "
          >
            {t(
              "storeManager.moduleRouteConnected"
            )}
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-lg
              text-[12.5px]
              leading-5
              text-[var(--color-text-secondary)]
            "
          >
            {t(
              "storeManager.moduleRouteDescription"
            )}
          </p>

          <div
            className="
              mx-auto
              mt-6
              flex
              max-w-sm
              items-center
              gap-3
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface-soft)]
              px-4
              py-3
              text-left
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
              <Store
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
                  text-[9.5px]
                  font-semibold
                  text-[var(--color-text-muted)]
                "
              >
                {t(
                  "storeManager.assignedOutlet"
                )}
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[12px]
                  font-bold
                  text-[var(--color-text)]
                "
              >
                {outlet.brand ||
                  t(
                    "storeManager.outlet"
                  )}

                {outlet.outletCode
                  ? ` · ${outlet.outletCode}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </section>
    </StoreManagerShell>
  );
}

export default StoreManagerModuleEntryPage;
