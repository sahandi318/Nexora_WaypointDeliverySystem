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
    params.depot = depot;
  }


  const response =
    await api.get(
      "/dispatcher/dashboard",
      {
        params,
        signal,
      }
    );


  /*
   * Supports either:
   *
   * {
   *   success: true,
   *   data: {...}
   * }
   *
   * or:
   *
   * {...}
   */

  return (
    response.data?.data ??
    response.data
  );
}