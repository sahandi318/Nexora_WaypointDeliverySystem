import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerDelivery,
} from "../services/storeManagerService";

function useStoreManagerDelivery(orderCode) {
  const [delivery, setDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const requestIdRef = useRef(0);

  const loadDelivery = useCallback(async ({
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
    setErrorCode("");

    try {
      const data = await getStoreManagerDelivery({
        orderCode,
        signal,
      });

      if (requestId !== requestIdRef.current) return;
      setDelivery(data);
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        signal?.aborted
      ) {
        return;
      }

      if (requestId !== requestIdRef.current) return;

      setDelivery(null);
      setErrorCode(error?.response?.data?.code || "");
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load the delivery."
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

    loadDelivery({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadDelivery]);

  const refreshDelivery = useCallback(
    () => loadDelivery({ isRefresh: true }),
    [loadDelivery]
  );

  return {
    delivery,
    isLoading,
    isRefreshing,
    errorMessage,
    errorCode,
    refreshDelivery,
  };
}

export default useStoreManagerDelivery;
