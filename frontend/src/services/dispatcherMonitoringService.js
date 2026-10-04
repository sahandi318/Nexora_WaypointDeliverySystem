import { io } from "socket.io-client";
import api, { ACCESS_TOKEN_KEY } from "./api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export async function getDispatcherMonitoring({ depotId, date, signal, status = "ACTIVE" } = {}) {
  const response = await api.get("/dispatcher/live-monitoring", {
    signal,
    params: {
      ...(date ? { date } : {}),
      ...(depotId ? { depotId } : {}),
      status,
    },
  });

  return response.data;
}

export async function getDispatcherTrip(tripCode) {
  const response = await api.get(`/dispatcher/live-monitoring/${tripCode}`);
  return response.data.trip;
}

export async function getDispatcherDeliveryReports({ depot } = {}) {
  const response = await api.get("/dispatcher/delivery-reports", {
    params: {
      ...(depot ? { depot } : {}),
    },
  });

  return response.data;
}

export function createDispatcherMonitoringSocket() {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
}
