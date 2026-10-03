import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerOrder,
} from "../services/storeManagerService";

function useStoreManagerOrder(
  orderCode
) {
  const [
    order,
    setOrder,
  ] = useState(null);

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

  const [
    errorCode,
    setErrorCode,
  ] = useState("");

  const requestIdRef =
    useRef(0);

  const loadOrder =
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

        setErrorCode(
          ""
        );

        try {
          const data =
            await getStoreManagerOrder({
              orderCode,
              signal,
            });

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setOrder(
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

          setOrder(
            null
          );

          setErrorCode(
            error?.response?.data
              ?.code ||
              ""
          );

          setErrorMessage(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Unable to load the order."
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
      [
        orderCode,
      ]
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadOrder({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadOrder,
    ]
  );

  const refreshOrder =
    useCallback(
      () =>
        loadOrder({
          isRefresh:
            true,
        }),
      [
        loadOrder,
      ]
    );

  return {
    order,
    isLoading,
    isRefreshing,
    errorMessage,
    errorCode,
    refreshOrder,
  };
}

export default useStoreManagerOrder;
