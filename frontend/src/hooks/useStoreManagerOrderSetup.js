import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerOrderSetup,
} from "../services/storeManagerService";

function useStoreManagerOrderSetup() {
  const [
    setup,
    setSetup,
  ] = useState(null);

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

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

  const cutoffRefreshTriggeredRef =
    useRef(false);

  const loadSetup =
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
            await getStoreManagerOrderSetup({
              signal,
            });

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setSetup(
            data
          );

          setRemainingSeconds(
            Math.max(
              0,
              Number(
                data?.cutoff
                  ?.remainingSeconds ||
                0
              )
            )
          );

          cutoffRefreshTriggeredRef.current =
            Boolean(
              data?.cutoff
                ?.cutoffPassed
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

          setErrorMessage(
            error?.response?.data
              ?.message ||
            error?.message ||
            "Unable to load order setup."
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

      loadSetup({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadSetup,
    ]
  );

  useEffect(
    () => {
      if (
        !setup ||
        setup?.cutoff
          ?.cutoffPassed
      ) {
        return undefined;
      }

      const timer =
        window.setInterval(
          () => {
            setRemainingSeconds(
              (current) =>
                Math.max(
                  0,
                  current - 1
                )
            );
          },
          1000
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      setup,
    ]
  );

  useEffect(
    () => {
      if (
        !setup ||
        setup?.cutoff
          ?.cutoffPassed ||
        remainingSeconds >
          0 ||
        cutoffRefreshTriggeredRef.current
      ) {
        return;
      }

      cutoffRefreshTriggeredRef.current =
        true;

      loadSetup({
        isRefresh:
          true,
      });
    },
    [
      setup,
      remainingSeconds,
      loadSetup,
    ]
  );

  const refreshSetup =
    useCallback(
      () =>
        loadSetup({
          isRefresh:
            true,
        }),
      [
        loadSetup,
      ]
    );

  return {
    setup,
    remainingSeconds,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshSetup,
  };
}

export default useStoreManagerOrderSetup;
