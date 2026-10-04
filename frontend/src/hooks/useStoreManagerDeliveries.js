import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerDeliveries,
} from "../services/storeManagerService";
import useStoreManagerLiveUpdates from "./useStoreManagerLiveUpdates";

const DELIVERIES_POLL_MS = 45000;
const LIVE_REFRESH_DEBOUNCE_MS = 250;

function useStoreManagerDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestIdRef = useRef(0);
  const liveRefreshTimerRef = useRef(null);

  const loadDeliveries = useCallback(async ({
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
      const data = await getStoreManagerDeliveries({ signal });

      if (requestId !== requestIdRef.current) return;
      setDeliveries(data);
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        signal?.aborted
      ) {
        return;
      }

      if (requestId !== requestIdRef.current) return;

      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load deliveries."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadDeliveries({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadDeliveries]);

  const refreshDeliveries = useCallback(
    () => loadDeliveries({ isRefresh: true }),
    [loadDeliveries]
  );

  const scheduleLiveRefresh = useCallback(() => {
    if (liveRefreshTimerRef.current) {
      window.clearTimeout(liveRefreshTimerRef.current);
    }

    liveRefreshTimerRef.current = window.setTimeout(() => {
      loadDeliveries({ isRefresh: true });
    }, LIVE_REFRESH_DEBOUNCE_MS);
  }, [loadDeliveries]);

  const liveConnection = useStoreManagerLiveUpdates({
    onUpdate: scheduleLiveRefresh,
    onReconnect: scheduleLiveRefresh,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadDeliveries({ isRefresh: true });
    }, DELIVERIES_POLL_MS);

    return () => {
      window.clearInterval(intervalId);

      if (liveRefreshTimerRef.current) {
        window.clearTimeout(liveRefreshTimerRef.current);
      }
    };
  }, [loadDeliveries]);

  return {
    deliveries,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshDeliveries,
    ...liveConnection,
  };
}

export default useStoreManagerDeliveries;
