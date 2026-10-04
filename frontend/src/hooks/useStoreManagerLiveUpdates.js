import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  STORE_MANAGER_LIVE_STATUS,
  subscribeToStoreManagerLiveUpdates,
} from "../services/storeManagerLiveService";

function useStoreManagerLiveUpdates({
  onUpdate,
  onReconnect,
} = {}) {
  const [status, setStatus] = useState(
    STORE_MANAGER_LIVE_STATUS.CONNECTING
  );
  const [lastEventAt, setLastEventAt] = useState(null);

  const onUpdateRef = useRef(onUpdate);
  const onReconnectRef = useRef(onReconnect);
  const previousStatusRef = useRef(null);
  const hasBeenLiveRef = useRef(false);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    return subscribeToStoreManagerLiveUpdates({
      onUpdate: (payload) => {
        setLastEventAt(
          payload?.at || new Date().toISOString()
        );
        onUpdateRef.current?.(payload || {});
      },
      onStatus: (snapshot) => {
        const nextStatus =
          snapshot?.status ||
          STORE_MANAGER_LIVE_STATUS.CONNECTING;

        const previousStatus = previousStatusRef.current;

        setStatus(nextStatus);
        setLastEventAt(snapshot?.lastEventAt || null);
        previousStatusRef.current = nextStatus;

        if (nextStatus === STORE_MANAGER_LIVE_STATUS.LIVE) {
          const recoveredBeforeFirstLive =
            !hasBeenLiveRef.current &&
            [
              STORE_MANAGER_LIVE_STATUS.RECONNECTING,
              STORE_MANAGER_LIVE_STATUS.STALE,
              STORE_MANAGER_LIVE_STATUS.OFFLINE,
            ].includes(previousStatus);

          if (
            recoveredBeforeFirstLive ||
            (
              hasBeenLiveRef.current &&
              previousStatus &&
              previousStatus !== STORE_MANAGER_LIVE_STATUS.LIVE
            )
          ) {
            onReconnectRef.current?.();
          }

          hasBeenLiveRef.current = true;
        }
      },
    });
  }, []);

  return {
    liveStatus: status,
    lastLiveEventAt: lastEventAt,
    isLive:
      status === STORE_MANAGER_LIVE_STATUS.LIVE,
  };
}

export default useStoreManagerLiveUpdates;
