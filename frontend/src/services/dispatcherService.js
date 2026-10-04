import api from "./api";


export async function getDispatcherDashboard(
  {
    date,
    depot,
    signal,
  } = {}
) {
  const params = {};


  if (date) {
    params.date = date;
  }


  if (
    depot &&
    depot !== "ALL"
  ) {
    params.depotCode = depot;
  }


  const response =
    await api.get(
      "/dispatcher/dashboard",
      {
        params,
        signal,
      }
    );


  const data = response.data?.data ?? response.data;
  if (!data?.summary || !data?.readiness || !Array.isArray(data.trips)) {
    throw new Error("Invalid Dispatcher dashboard response.");
  }
  const displayTime = (value) => value ? new Date(value).toLocaleTimeString("en-LK", {
    timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit",
  }) : "?";
  return {
    ...data,
    trips: data.trips.map((trip) => ({ ...trip, status: trip.status?.replaceAll("_", " ") })),
    attentionItems: (data.attentionItems || []).map((item) => ({ ...item, time: displayTime(item.time) })),
    recentActivity: (data.recentActivity || []).map((item) => ({ ...item, time: displayTime(item.time) })),
  };
}

export async function getDispatcherPlanningWorkspace({ date, signal } = {}) {
  const params = {};
  if (date) params.date = date;

  const response = await api.get(
    "/dispatcher/planning/workspace",
    {
      params,
      signal,
    }
  );

  const data = response.data?.data ?? response.data;
  if (!data?.summary || !data?.orders || !Array.isArray(data?.trips)) {
    throw new Error("Invalid Dispatcher planning response.");
  }
  return data;
}

export async function confirmDispatcherStoreOrder(orderCode) {
  const response = await api.post(
    `/dispatcher/orders/${encodeURIComponent(orderCode)}/confirm`
  );
  return response.data?.data ?? response.data;
}

export async function deferDispatcherStoreOrder(
  orderCode,
  { reason, nextDeliveryDate }
) {
  const response = await api.post(
    `/dispatcher/orders/${encodeURIComponent(orderCode)}/defer`,
    {
      reason,
      nextDeliveryDate,
    }
  );
  return response.data?.data ?? response.data;
}

export async function allocateDispatcherPlanningOrder(
  orderCode,
  { driverUserId, vehicleCode, vehicleType }
) {
  const response = await api.post(
    `/dispatcher/planning/orders/${encodeURIComponent(orderCode)}/allocate`,
    {
      driverUserId: driverUserId || null,
      vehicleCode,
      vehicleType,
    }
  );
  return response.data?.data ?? response.data;
}

export async function publishDispatcherPlanningTrip(tripCode) {
  const response = await api.post(
    `/dispatcher/planning/trips/${encodeURIComponent(tripCode)}/publish`,
    {}
  );
  return response.data?.data ?? response.data;
}
