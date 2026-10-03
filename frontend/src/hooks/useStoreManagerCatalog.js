import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getStoreManagerCatalog,
} from "../services/storeManagerService";

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
  from: 0,
  to: 0,
};

function useStoreManagerCatalog({
  orderType,
  search = "",
  category = "ALL",
  page = 1,
  pageSize = 20,
  enabled = true,
} = {}) {
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [brand, setBrand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requestIdRef = useRef(0);

  const loadCatalog =
    useCallback(
      async ({
        signal,
        isRefresh = false,
      } = {}) => {
        if (!enabled || !orderType) {
          setProducts([]);
          setSuggestions([]);
          setCategories([]);
          setPagination(EMPTY_PAGINATION);
          setErrorMessage("");
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage("");

        try {
          const data = await getStoreManagerCatalog({
            orderType,
            search,
            category,
            page,
            pageSize,
            signal,
          });

          if (requestId !== requestIdRef.current) return;

          setProducts(data.products || []);
          setSuggestions(data.suggestions || []);
          setCategories(data.categories || []);
          setPagination(data.pagination || EMPTY_PAGINATION);
          setBrand(data.brand || "");
        } catch (error) {
          if (
            error?.name === "CanceledError" ||
            error?.code === "ERR_CANCELED" ||
            signal?.aborted
          ) {
            return;
          }

          if (requestId !== requestIdRef.current) return;

          setErrorMessage(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load the product catalog."
          );
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      },
      [
        orderType,
        search,
        category,
        page,
        pageSize,
        enabled,
      ]
    );

  useEffect(
    () => {
      const controller = new AbortController();
      loadCatalog({ signal: controller.signal });
      return () => controller.abort();
    },
    [loadCatalog]
  );

  const refreshCatalog =
    useCallback(
      () => loadCatalog({ isRefresh: true }),
      [loadCatalog]
    );

  return {
    products,
    suggestions,
    categories,
    pagination,
    brand,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshCatalog,
  };
}

export default useStoreManagerCatalog;
