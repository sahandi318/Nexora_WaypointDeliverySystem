import { io } from "socket.io-client";

import {
  ACCESS_TOKEN_KEY,
} from "./api";

export const STORE_MANAGER_DELIVERY_SOCKET_EVENT =
  "store-manager:delivery-update";

export const STORE_MANAGER_LIVE_STATUS = {
  CONNECTING: "CONNECTING",
  LIVE: "LIVE",
  RECONNECTING: "RECONNECTING",
  STALE: "STALE",
  OFFLINE: "OFFLINE",
};

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const STALE_AFTER_MS = 15000;

let socket = null;
let activeToken = null;
let staleTimer = null;
let currentStatus = STORE_MANAGER_LIVE_STATUS.CONNECTING;
let lastEventAt = null;

const updateSubscribers = new Set();
const statusSubscribers = new Set();

function getToken() {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function notifyStatus(nextStatus) {
  currentStatus = nextStatus;

  const snapshot = {
    status: currentStatus,
    lastEventAt,
  };

  statusSubscribers.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyUpdate(payload) {
  lastEventAt = payload?.at || new Date().toISOString();

  updateSubscribers.forEach((listener) => {
    listener(payload || {});
  });

  notifyStatus(currentStatus);
}

function clearStaleTimer() {
  if (staleTimer) {
    window.clearTimeout(staleTimer);
    staleTimer = null;
  }
}

function scheduleStaleStatus() {
  clearStaleTimer();

  staleTimer = window.setTimeout(() => {
    if (
      currentStatus !== STORE_MANAGER_LIVE_STATUS.LIVE &&
      currentStatus !== STORE_MANAGER_LIVE_STATUS.OFFLINE
    ) {
      notifyStatus(STORE_MANAGER_LIVE_STATUS.STALE);
    }
  }, STALE_AFTER_MS);
}

function handleBrowserOffline() {
  clearStaleTimer();
  notifyStatus(STORE_MANAGER_LIVE_STATUS.OFFLINE);
}

function handleBrowserOnline() {
  if (!socket) return;

  notifyStatus(STORE_MANAGER_LIVE_STATUS.RECONNECTING);
  scheduleStaleStatus();

  if (!socket.connected) {
    socket.connect();
  }
}

function destroySocket() {
  clearStaleTimer();

  if (socket) {
    socket.removeAllListeners();
    socket.io?.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
  activeToken = null;
  currentStatus = STORE_MANAGER_LIVE_STATUS.CONNECTING;

  if (typeof window !== "undefined") {
    window.removeEventListener("offline", handleBrowserOffline);
    window.removeEventListener("online", handleBrowserOnline);
  }
}

function ensureSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getToken();

  if (!token) {
    notifyStatus(STORE_MANAGER_LIVE_STATUS.STALE);
    return null;
  }

  if (socket && activeToken === token) {
    return socket;
  }

  destroySocket();
  activeToken = token;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    clearStaleTimer();
    notifyStatus(STORE_MANAGER_LIVE_STATUS.LIVE);
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io client disconnect") {
      return;
    }

    if (navigator.onLine === false) {
      notifyStatus(STORE_MANAGER_LIVE_STATUS.OFFLINE);
      return;
    }

    notifyStatus(STORE_MANAGER_LIVE_STATUS.RECONNECTING);
    scheduleStaleStatus();
  });

  socket.on("connect_error", () => {
    if (navigator.onLine === false) {
      notifyStatus(STORE_MANAGER_LIVE_STATUS.OFFLINE);
      return;
    }

    notifyStatus(STORE_MANAGER_LIVE_STATUS.RECONNECTING);
    scheduleStaleStatus();
  });

  socket.io.on("reconnect_attempt", () => {
    if (navigator.onLine === false) {
      notifyStatus(STORE_MANAGER_LIVE_STATUS.OFFLINE);
      return;
    }

    notifyStatus(STORE_MANAGER_LIVE_STATUS.RECONNECTING);
    scheduleStaleStatus();
  });

  socket.on(
    STORE_MANAGER_DELIVERY_SOCKET_EVENT,
    notifyUpdate
  );

  window.addEventListener("offline", handleBrowserOffline);
  window.addEventListener("online", handleBrowserOnline);

  notifyStatus(
    navigator.onLine === false
      ? STORE_MANAGER_LIVE_STATUS.OFFLINE
      : STORE_MANAGER_LIVE_STATUS.CONNECTING
  );

  if (navigator.onLine !== false) {
    socket.connect();
  }

  return socket;
}

function maybeCloseSocket() {
  if (
    updateSubscribers.size === 0 &&
    statusSubscribers.size === 0
  ) {
    destroySocket();
  }
}

export function subscribeToStoreManagerLiveUpdates({
  onUpdate,
  onStatus,
} = {}) {
  if (typeof onUpdate === "function") {
    updateSubscribers.add(onUpdate);
  }

  if (typeof onStatus === "function") {
    statusSubscribers.add(onStatus);
    onStatus({
      status: currentStatus,
      lastEventAt,
    });
  }

  ensureSocket();

  return () => {
    if (typeof onUpdate === "function") {
      updateSubscribers.delete(onUpdate);
    }

    if (typeof onStatus === "function") {
      statusSubscribers.delete(onStatus);
    }

    maybeCloseSocket();
  };
}
