import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerOrders,
} from "../services/storeManagerService";

function useStoreManagerOrders() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const requestIdRef =
    useRef(0);

  const loadOrders =
    useCallback(
      async ({
        signal,
        isRefresh = false,
      } = {}) => {
        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        if (isRefresh) {
          setIsRefreshing(
            true
          );
        } else {
          setIsLoading(
            true
          );
        }

        setErrorMessage(
          ""
        );

        try {
          const data =
            await getStoreManagerOrders({
              signal,
            });

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setOrders(
            data
          );
        } catch (error) {
          if (
            error?.name ===
              "CanceledError" ||
            error?.code ===
              "ERR_CANCELED" ||
            signal?.aborted
          ) {
            return;
          }

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          const message =
            error?.response?.data
              ?.message ||
            error?.message ||
            "Unable to load orders.";

          setErrorMessage(
            message
          );
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setIsLoading(
              false
            );

            setIsRefreshing(
              false
            );
          }
        }
      },
      []
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadOrders({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadOrders,
    ]
  );

  const refreshOrders =
    useCallback(
      () =>
        loadOrders({
          isRefresh:
            true,
        }),
      [
        loadOrders,
      ]
    );

  return {
    orders,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshOrders,
  };
}

export default useStoreManagerOrders;
