import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getStoreManagerIssues,
} from "../services/storeManagerService";

export default function useStoreManagerIssues({
  status = "ALL",
} = {}) {
  const [issues, setIssues] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadIssues = useCallback(
    async ({ signal, refreshing = false } = {}) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await getStoreManagerIssues({ status, signal });
        setIssues(data.issues || []);
        setSummary(data.summary || { total: 0, open: 0, resolved: 0 });
        setErrorMessage("");
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED" ||
          signal?.aborted
        ) {
          return;
        }

        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load issues."
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [status]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadIssues({ signal: controller.signal });
    return () => controller.abort();
  }, [loadIssues]);

  const refreshIssues = useCallback(
    () => loadIssues({ refreshing: true }),
    [loadIssues]
  );

  return {
    issues,
    summary,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshIssues,
  };
}
