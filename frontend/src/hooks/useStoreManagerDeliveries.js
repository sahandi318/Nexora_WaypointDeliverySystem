import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerDeliveries,
} from "../services/storeManagerService";

function useStoreManagerDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestIdRef = useRef(0);

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

  return {
    deliveries,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshDeliveries,
  };
}

export default useStoreManagerDeliveries;
