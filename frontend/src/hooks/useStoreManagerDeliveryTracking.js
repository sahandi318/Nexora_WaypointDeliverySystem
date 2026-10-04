import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerDeliveryTracking,
} from "../services/storeManagerService";
import useStoreManagerLiveUpdates from "./useStoreManagerLiveUpdates";

const TRACKING_POLL_MS = 30000;
const LIVE_REFRESH_DEBOUNCE_MS = 250;

const TRACKING_PENDING_CODES = new Set([
  "STORE_MANAGER_DELIVERY_NOT_PLANNED",
  "STORE_MANAGER_DELIVERY_NOT_PUBLISHED",
]);

function useStoreManagerDeliveryTracking(
  orderCode,
  {
    onInvalidate,
  } = {}
) {
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [availabilityCode, setAvailabilityCode] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const requestIdRef = useRef(0);
  const trackingRef = useRef(null);
  const liveRefreshTimerRef = useRef(null);
  const onInvalidateRef = useRef(onInvalidate);

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  const loadTracking = useCallback(async ({
    signal,
    isRefresh = false,
  } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage("");

    try {
      const data = await getStoreManagerDeliveryTracking({
        orderCode,
        signal,
      });

      if (requestId !== requestIdRef.current) return;

      setTracking(data);
      setAvailabilityCode("");
      setLastRefreshedAt(new Date().toISOString());
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        signal?.aborted
      ) {
        return;
      }

      if (requestId !== requestIdRef.current) return;

      const responseCode =
        error?.response?.data?.code || "";

      if (TRACKING_PENDING_CODES.has(responseCode)) {
        setTracking(null);
        setAvailabilityCode(responseCode);
        setErrorMessage("");
        setLastRefreshedAt(new Date().toISOString());
        return;
      }

      setTracking(null);
      setAvailabilityCode(responseCode);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load live delivery tracking."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [orderCode]);

  useEffect(() => {
    const controller = new AbortController();

    loadTracking({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadTracking]);

  const refreshTracking = useCallback(
    () => loadTracking({ isRefresh: true }),
    [loadTracking]
  );

  const refreshFromLiveInvalidation = useCallback(
    (payload = {}) => {
      const currentTripCode =
        trackingRef.current?.trip?.tripCode || null;

      if (
        currentTripCode &&
        payload?.tripCode &&
        String(payload.tripCode) !== String(currentTripCode)
      ) {
        return;
      }

      if (liveRefreshTimerRef.current) {
        window.clearTimeout(liveRefreshTimerRef.current);
      }

      liveRefreshTimerRef.current = window.setTimeout(() => {
        loadTracking({ isRefresh: true });
        onInvalidateRef.current?.(payload);
      }, LIVE_REFRESH_DEBOUNCE_MS);
    },
    [loadTracking]
  );

  const refreshAfterReconnect = useCallback(() => {
    loadTracking({ isRefresh: true });
    onInvalidateRef.current?.({
      reason: "socket-reconnected",
      eventKind: "STATUS",
    });
  }, [loadTracking]);

  const liveConnection = useStoreManagerLiveUpdates({
    onUpdate: refreshFromLiveInvalidation,
    onReconnect: refreshAfterReconnect,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadTracking({ isRefresh: true });
    }, TRACKING_POLL_MS);

    return () => {
      window.clearInterval(intervalId);

      if (liveRefreshTimerRef.current) {
        window.clearTimeout(liveRefreshTimerRef.current);
      }
    };
  }, [loadTracking]);

  return {
    tracking,
    isLoading,
    isRefreshing,
    errorMessage,
    availabilityCode,
    lastRefreshedAt,
    refreshTracking,
    ...liveConnection,
  };
}

export default useStoreManagerDeliveryTracking;
