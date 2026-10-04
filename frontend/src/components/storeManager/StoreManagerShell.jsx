import {
  useCallback,
  useEffect,
  useState,
} from "react";

import StoreManagerMobileDrawer from "./StoreManagerMobileDrawer";
import StoreManagerSidebar from "./StoreManagerSidebar";
import StoreManagerTopbar from "./StoreManagerTopbar";

import { ATTENTION_STATUSES } from "./deliveries/StoreManagerDeliveryUI";
import { getStoreManagerDeliveries } from "../../services/storeManagerService";

const ISSUE_COUNT_POLL_MS = 45000;

function StoreManagerShell({
  user,
  outlet,
  depot,
  children,
}) {
  const [
    isMobileNavigationOpen,
    setIsMobileNavigationOpen,
  ] = useState(false);

  const [issueCount, setIssueCount] = useState(null);

  const refreshIssueCount = useCallback(async ({ signal } = {}) => {
    try {
      const deliveries = await getStoreManagerDeliveries({ signal });
      const nextCount = deliveries.filter((delivery) =>
        ATTENTION_STATUSES.has(delivery.deliveryStatus)
      ).length;

      setIssueCount(nextCount);
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        signal?.aborted
      ) {
        return;
      }

      // Keep the last known value. The badge is supplemental and must not
      // interrupt the Store Manager workspace if the count refresh fails.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshIssueCount({ signal: controller.signal });

    const intervalId = window.setInterval(() => {
      refreshIssueCount();
    }, ISSUE_COUNT_POLL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshIssueCount]);

  return (
    <div
      className="
        min-h-screen
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
      style={{
        backgroundImage:
          "radial-gradient(circle at 82% 8%, rgba(60,203,143,0.07), transparent 24%), radial-gradient(circle at 68% 28%, rgba(141,224,182,0.06), transparent 20%)",
        fontFamily:
          '"Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontOpticalSizing:
          "auto",
        fontFeatureSettings:
          '"cv02" 1, "cv03" 1, "cv04" 1, "cv11" 1',
        WebkitFontSmoothing:
          "antialiased",
        MozOsxFontSmoothing:
          "grayscale",
        textRendering:
          "optimizeLegibility",
        fontKerning:
          "normal",
      }}
    >
      <div
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-[236px]
          lg:block
        "
      >
        <StoreManagerSidebar
          user={user}
          outlet={outlet}
          depot={depot}
          issueCount={issueCount}
        />
      </div>

      <StoreManagerMobileDrawer
        isOpen={
          isMobileNavigationOpen
        }
        onClose={() =>
          setIsMobileNavigationOpen(
            false
          )
        }
        user={user}
        outlet={outlet}
        depot={depot}
        issueCount={issueCount}
      />

      <div
        className="
          min-h-screen
          lg:pl-[236px]
        "
      >
        <StoreManagerTopbar
          user={user}
          outlet={outlet}
          depot={depot}
          onOpenNavigation={() =>
            setIsMobileNavigationOpen(
              true
            )
          }
        />

        <main
          className="
            mx-auto
            w-full
            max-w-[1520px]
            px-4
            py-6
            sm:px-6
            sm:py-8
            xl:px-8
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default StoreManagerShell;
