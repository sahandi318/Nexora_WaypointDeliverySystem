import { useCallback, useEffect, useState } from "react";

import { getDispatcherPlanningWorkspace } from "../services/dispatcherService";

export default function useDispatcherPlanningWorkspace({ date = "" } = {}) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDispatcherPlanningWorkspace({ date });
      setWorkspace(data);
      return data;
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load Dispatcher planning data."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    workspace,
    loading,
    error,
    refresh,
    setWorkspace,
  };
}
