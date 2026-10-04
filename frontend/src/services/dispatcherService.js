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
