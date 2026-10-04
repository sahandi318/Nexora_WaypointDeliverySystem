import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../../services/api";

const EMPTY_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function StoreSection() {
  const [districts, setDistricts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [district, setDistrict] = useState("");
  const [brand, setBrand] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [outlets, setOutlets] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOutlets() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await api.get("/public/outlets", {
          params: {
            page,
            ...(district ? { district } : {}),
            ...(brand ? { brand } : {}),
            ...(search ? { search } : {}),
          },
          signal: controller.signal,
        });

        setOutlets(response.data?.outlets || []);
        setPagination(response.data?.pagination || EMPTY_PAGINATION);
        setDistricts(response.data?.filters?.districts || []);
        setBrands(response.data?.filters?.brands || []);
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            "The outlet directory is temporarily unavailable."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadOutlets();

    return () => controller.abort();
  }, [district, brand, search, page, refreshKey]);

  function updateDistrict(value) {
    setDistrict(value);
    setPage(1);
  }

  function updateBrand(value) {
    setBrand(value);
    setPage(1);
  }

  function resetFilters() {
    setDistrict("");
    setBrand("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const hasFilters = useMemo(
    () => Boolean(district || brand || searchInput.trim()),
    [district, brand, searchInput]
  );

  return (
    <section
      id="stores"
      className="landing-soft-section scroll-mt-16 py-14 transition-colors duration-300 sm:scroll-mt-20 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-28">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)] sm:text-sm">
              Store network
            </p>

            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.035em] text-[var(--color-text)] sm:text-4xl lg:text-[2.8rem] lg:leading-[1.06]">
              Find a Waypoint outlet without the clutter.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
              Search the public outlet directory and narrow the list by district
              or brand. The directory stays compact so locations are quick to scan
              on desktop and mobile.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="landing-glass-card rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Coverage
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--color-text)]">
                  Nationwide
                </p>
              </div>

              <div className="landing-glass-card rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Directory
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--color-text)]">
                  Live filters
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              Public visitors see only location information intended for store
              discovery. Internal delivery and operational details remain inside
              authenticated workspaces.
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                    Outlet directory
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--color-text)] sm:text-2xl">
                    Browse stores
                  </h3>
                </div>

                <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {pagination.total} outlets
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.3fr_0.85fr_0.85fr_auto] md:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Search
                  </span>

                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    />

                    <input
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Outlet code, district or brand"
                      className="nexora-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pl-10 pr-3 text-sm font-medium text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    District
                  </span>

                  <ThemedSelect
                    value={district}
                    onChange={updateDistrict}
                    placeholder="All districts"
                    options={districts}
                    ariaLabel="Filter outlets by district"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Brand
                  </span>

                  <ThemedSelect
                    value={brand}
                    onChange={updateBrand}
                    placeholder="All brands"
                    options={brands}
                    ariaLabel="Filter outlets by brand"
                  />
                </label>

                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasFilters}
                  className="nexora-focus inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </div>

            <div>
              {isLoading ? (
                <OutletLoadingRows />
              ) : errorMessage ? (
                <DirectoryMessage
                  icon={Store}
                  title="Unable to load outlets"
                  message={errorMessage}
                  actionLabel="Try again"
                  onAction={() => setRefreshKey((current) => current + 1)}
                />
              ) : outlets.length === 0 ? (
                <DirectoryMessage
                  icon={Search}
                  title="No matching outlets"
                  message="Try another outlet code, district or brand."
                  actionLabel={hasFilters ? "Clear filters" : undefined}
                  onAction={hasFilters ? resetFilters : undefined}
                />
              ) : (
                <div className="grid gap-2.5 p-3 sm:p-4 md:grid-cols-2">
                  {outlets.map((outlet) => (
                    <article
                      key={outlet.id ?? outlet.outletCode}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                        <Store size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-extrabold text-[var(--color-text)]">
                            {outlet.outletCode}
                          </p>
                          <span className="shrink-0 rounded-full bg-[var(--color-surface-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                            {outlet.brand}
                          </span>
                        </div>

                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-[var(--color-text-secondary)]">
                          <MapPin size={12} className="shrink-0 text-[var(--color-primary)]" />
                          {outlet.district}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={isLoading || pagination.page <= 1}
                className="nexora-focus inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Prev
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                disabled={isLoading || pagination.page >= pagination.totalPages}
                className="nexora-focus inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutletLoadingRows() {
  return (
    <div className="grid gap-2.5 p-3 sm:p-4 md:grid-cols-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5"
        >
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface-soft)]" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-24 rounded bg-[var(--color-surface-soft)]" />
            <div className="mt-2 h-3 w-20 rounded bg-[var(--color-surface-soft)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DirectoryMessage({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
        <Icon size={19} />
      </div>
      <h3 className="mt-3 text-base font-extrabold text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
        {message}
      </p>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="nexora-focus mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <RefreshCw size={15} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ThemedSelect({
  value,
  onChange,
  placeholder,
  options,
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedLabel = value || placeholder;
  const allOptions = [
    { value: "", label: placeholder },
    ...options.map((option) => ({ value: option, label: option })),
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`
          nexora-focus
          flex
          h-11
          w-full
          items-center
          justify-between
          gap-3
          rounded-xl
          border
          px-3.5
          text-left
          text-sm
          font-semibold
          shadow-[var(--shadow-xs)]
          transition
          ${
            isOpen
              ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)] ring-2 ring-[var(--color-primary-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-input)] hover:border-[var(--color-primary)]"
          }
          text-[var(--color-text)]
        `}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--color-primary)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[90]
            max-h-72
            overflow-y-auto
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-1.5
            shadow-[var(--shadow-lg)]
            backdrop-blur-xl
          "
        >
          {allOptions.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value || "__all"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  nexora-focus
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  font-semibold
                  transition
                  ${
                    selected
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]"
                  }
                `}
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check size={15} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default StoreSection;
