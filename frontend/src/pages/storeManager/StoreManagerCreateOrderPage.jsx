import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock3,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import StoreManagerShell from "../../components/storeManager/StoreManagerShell";

import CreateOrderBrowseStep from "../../components/storeManager/createOrder/CreateOrderBrowseStep";
import CreateOrderReviewStep from "../../components/storeManager/createOrder/CreateOrderReviewStep";
import CreateOrderSetupStep from "../../components/storeManager/createOrder/CreateOrderSetupStep";

import {
  SummaryMetric,
  formatTotalVolume,
  formatWeight,
  getOrderTypeLabel,
  roundNumber,
} from "../../components/storeManager/createOrder/CreateOrderShared";

import useDebouncedValue from "../../hooks/useDebouncedValue";
import useStoreManagerCatalog from "../../hooks/useStoreManagerCatalog";
import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerOrderSetup from "../../hooks/useStoreManagerOrderSetup";
import useTranslations from "../../hooks/useTranslations";

import {
  createStoreManagerOrder,
} from "../../services/storeManagerService";

const MAX_QUANTITY = 999;
const PAGE_SIZE = 20;

function StoreManagerCreateOrderPage() {
  const navigate = useNavigate();
  const { t } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading: isContextLoading,
    errorMessage: contextErrorMessage,
  } = useStoreManagerContext();

  const {
    setup,
    remainingSeconds,
    isLoading: isSetupLoading,
    isRefreshing: isSetupRefreshing,
    errorMessage: setupErrorMessage,
    refreshSetup,
  } = useStoreManagerOrderSetup();

  const [step, setStep] = useState("setup");
  const [orderType, setOrderType] = useState("");
  const [selectedById, setSelectedById] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [submitError, setSubmitError] = useState("");
  const [storeManagerNote, setStoreManagerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const searchBoxRef = useRef(null);
  const selectionSequenceRef = useRef(1);

  const availableOrderTypes = setup?.availableOrderTypes || [];
  const catalogEnabled = step === "browse" && Boolean(orderType);

  const {
    products,
    suggestions,
    categories,
    pagination,
    isLoading: isCatalogLoading,
    isRefreshing: isCatalogRefreshing,
    errorMessage: catalogErrorMessage,
    refreshCatalog,
  } = useStoreManagerCatalog({
    orderType,
    search: debouncedSearch,
    category,
    page,
    pageSize: PAGE_SIZE,
    enabled: catalogEnabled,
  });

  useEffect(() => {
    if (!setup || orderType) return;
    if (availableOrderTypes.length === 1) {
      setOrderType(availableOrderTypes[0]);
    }
  }, [setup, orderType, availableOrderTypes]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, orderType]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setIsSuggestionOpen(Boolean(debouncedSearch && suggestions.length > 0));
  }, [debouncedSearch, suggestions]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setIsSuggestionOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedItems = useMemo(
    () =>
      Object.values(selectedById)
        .filter((item) => item.quantity > 0)
        .sort((a, b) => (a.selectionOrder || 0) - (b.selectionOrder || 0)),
    [selectedById]
  );

  const totals = useMemo(() => {
    let totalUnits = 0;
    let estimatedWeightKg = 0;
    let estimatedVolumeM3 = 0;

    for (const item of selectedItems) {
      totalUnits += item.quantity;
      estimatedWeightKg += Number(item.product.unitWeightKg || 0) * item.quantity;
      estimatedVolumeM3 += Number(item.product.unitVolumeM3 || 0) * item.quantity;
    }

    return {
      totalUnits,
      estimatedWeightKg: roundNumber(estimatedWeightKg, 3),
      estimatedVolumeM3: roundNumber(estimatedVolumeM3, 6),
    };
  }, [selectedItems]);

  if (isContextLoading) {
    return <FullPageLoading message={t("storeManager.loadingWorkspace")} />;
  }

  if (contextErrorMessage || !user || !outlet) {
    return (
      <FullPageError
        title={t("storeManager.unableToLoadWorkspace")}
        message={contextErrorMessage || t("storeManager.workspaceUnavailable")}
      />
    );
  }

  function selectOrderType(nextType) {
    if (!availableOrderTypes.includes(nextType)) return;

    if (nextType !== orderType && selectedItems.length > 0) {
      setSelectedById({});
      selectionSequenceRef.current = 1;
    }

    setOrderType(nextType);
    setSearchInput("");
    setCategory("ALL");
    setPage(1);
    setSubmitError("");
  }

  function updateQuantity(product, rawValue) {
    const parsed = Number(rawValue);
    const nextValue = Number.isFinite(parsed)
      ? Math.max(0, Math.min(MAX_QUANTITY, Math.trunc(parsed)))
      : 0;

    setSelectedById((current) => {
      const next = { ...current };
      const existing = current[product.id];

      if (nextValue === 0) {
        delete next[product.id];
      } else {
        next[product.id] = {
          product,
          quantity: nextValue,
          selectionOrder:
            existing?.selectionOrder || selectionSequenceRef.current++,
        };
      }

      return next;
    });

    setSubmitError("");
  }

  function clearAllSelected() {
    setSelectedById({});
    selectionSequenceRef.current = 1;
    setSubmitError("");
  }

  function goToBrowse() {
    if (!orderType) {
      setSubmitError(t("storeManager.createOrderChooseOrderType"));
      return;
    }

    setSubmitError("");
    setStep("browse");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToReview() {
    if (selectedItems.length === 0) {
      setSubmitError(t("storeManager.createOrderSelectOne"));
      return;
    }

    setSubmitError("");
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseSuggestion(product) {
    setSearchInput(product.name);
    setPage(1);
    setIsSuggestionOpen(false);
    setActiveSuggestionIndex(-1);
  }

  function handleSearchKeyDown(event) {
    if (!isSuggestionOpen || suggestions.length === 0) {
      if (event.key === "Escape") setIsSuggestionOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestionIndex]);
      return;
    }

    if (event.key === "Escape") setIsSuggestionOpen(false);
  }

  async function submitOrder() {
    if (!orderType || selectedItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await createStoreManagerOrder({
        orderType,
        storeManagerNote,
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setResult(response);
      setStep("result");
      await refreshSetup();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
        error?.message ||
        t("storeManager.createOrderSubmitFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <section className="mt-3 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              {t("storeManager.workspaceEyebrow")}
            </p>

            <h1 className="mt-1 text-[23px] font-extrabold tracking-[-0.03em] text-[var(--color-text)]">
              {t("storeManager.createOrderPageTitle")}
            </h1>

            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[var(--color-text-secondary)]">
              {t("storeManager.createOrderC2Description")}
            </p>
          </div>

          {step !== "result" && (
            <button
              type="button"
              onClick={() => navigate("/store-manager/orders")}
              className="nexora-focus inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[10.5px] font-semibold text-[var(--color-text-secondary)] shadow-sm transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft size={14} />
              {t("storeManager.createOrderBack")}
            </button>
          )}
        </div>

        <OrderProgress step={step} t={t} />

        <div className="bg-[var(--color-bg)]/45 p-3 sm:p-4">
      {step === "setup" && (
        <CreateOrderSetupStep
          setup={setup}
          orderType={orderType}
          availableOrderTypes={availableOrderTypes}
          remainingSeconds={remainingSeconds}
          isLoading={isSetupLoading}
          isRefreshing={isSetupRefreshing}
          errorMessage={setupErrorMessage}
          submitError={submitError}
          onSelectOrderType={selectOrderType}
          onRefresh={refreshSetup}
          onContinue={goToBrowse}
          t={t}
        />
      )}

      {step === "browse" && (
        <CreateOrderBrowseStep
          orderType={orderType}
          products={products}
          suggestions={suggestions}
          categories={categories}
          pagination={pagination}
          selectedById={selectedById}
          selectedItems={selectedItems}
          totals={totals}
          searchInput={searchInput}
          category={category}
          isSuggestionOpen={isSuggestionOpen}
          activeSuggestionIndex={activeSuggestionIndex}
          searchBoxRef={searchBoxRef}
          isLoading={isCatalogLoading}
          isRefreshing={isCatalogRefreshing}
          errorMessage={catalogErrorMessage}
          submitError={submitError}
          onSearchInput={(value) => {
            setSearchInput(value);
            setIsSuggestionOpen(true);
          }}
          onSearchKeyDown={handleSearchKeyDown}
          onSearchFocus={() =>
            setIsSuggestionOpen(Boolean(debouncedSearch && suggestions.length > 0))
          }
          onSuggestion={chooseSuggestion}
          onClearSearch={() => {
            setSearchInput("");
            setIsSuggestionOpen(false);
            setPage(1);
          }}
          onCategory={(nextCategory) => {
            setCategory(nextCategory);
            setPage(1);
          }}
          onPage={setPage}
          onRefresh={refreshCatalog}
          onQuantity={updateQuantity}
          onClearSelected={clearAllSelected}
          onBack={() => setStep("setup")}
          onReview={goToReview}
          t={t}
        />
      )}

      {step === "review" && (
        <CreateOrderReviewStep
          setup={setup}
          orderType={orderType}
          selectedItems={selectedItems}
          totals={totals}
          storeManagerNote={storeManagerNote}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onStoreManagerNoteChange={setStoreManagerNote}
          onBack={() => setStep("browse")}
          onSubmit={submitOrder}
          t={t}
        />
      )}

      {step === "result" && result && (
        <ResultStep
          result={result}
          onViewOrder={() =>
            navigate(
              `/store-manager/orders/${encodeURIComponent(result.order.orderCode)}`
            )
          }
          onOrders={() => navigate("/store-manager/orders")}
          onCreateAnother={() => {
            setSelectedById({});
            setOrderType(
              availableOrderTypes.length === 1 ? availableOrderTypes[0] : ""
            );
            setSearchInput("");
            setCategory("ALL");
            setPage(1);
            setResult(null);
            setStoreManagerNote("");
            setSubmitError("");
            setStep("setup");
          }}
          t={t}
        />
      )}
        </div>
      </section>
    </StoreManagerShell>
  );
}

function OrderProgress({ step, t }) {
  const currentKey = step === "result" ? "review" : step;

  const steps = [
    {
      key: "setup",
      label: t("storeManager.createOrderStepSetup"),
      hint: t("storeManager.createOrderStep1Hint"),
    },
    {
      key: "browse",
      label: t("storeManager.createOrderStepBrowse"),
      hint: t("storeManager.createOrderStep2Hint"),
    },
    {
      key: "review",
      label: t("storeManager.createOrderStepReviewSubmit"),
      hint: t("storeManager.createOrderStep3Hint"),
    },
  ];

  const currentIndex = steps.findIndex((item) => item.key === currentKey);

  return (
    <div className="border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
      <div className="grid grid-cols-3 gap-2">
        {steps.map((item, index) => {
          const complete = step === "result" || index < currentIndex;
          const active = step !== "result" && index === currentIndex;
          const connectorComplete = index < currentIndex;

          return (
            <div key={item.key} className="relative flex min-w-0 flex-col items-center text-center">
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-[calc(50%+16px)] right-[-50%] top-[14px] border-t border-dashed ${
                    connectorComplete
                      ? "border-[#16A572]"
                      : "border-[var(--color-border)]"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold shadow-[0_0_0_5px_var(--color-surface)] ${
                  active || complete
                    ? "border-[#16A572] bg-[#16A572] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                }`}
              >
                {complete ? <Check size={12} /> : index + 1}
              </div>

              <p
                className={`mt-2 truncate text-[10px] font-bold ${
                  active || complete
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {item.label}
              </p>

              <p className="mt-0.5 hidden truncate text-[8.5px] text-[var(--color-text-muted)] sm:block">
                {item.hint}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultStep({ result, onViewOrder, onOrders, onCreateAnother, t }) {
  const order = result.order;
  const deferred =
    order.status === "DEFERRED" || order.cutoffDecision === "AFTER_CUTOFF";

  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
      <div className="px-5 py-8 text-center sm:px-7 sm:py-10">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${deferred ? "bg-amber-500/10 text-amber-600" : "bg-[#16A572]/10 text-[#0F6B4F]"}`}>
          {deferred ? <Clock3 size={22} /> : <Check size={22} />}
        </div>

        <p className="mt-4 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          {order.orderCode}
        </p>
        <h2 className="mt-2 text-[19px] font-extrabold tracking-[-0.025em] text-[var(--color-text)]">
          {deferred
            ? t("storeManager.createOrderDeferredTitle")
            : t("storeManager.createOrderSuccessTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-[11px] leading-5 text-[var(--color-text-secondary)]">
          {deferred
            ? t("storeManager.createOrderDeferredDescription")
            : t("storeManager.createOrderSuccessDescription")}
        </p>

        <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryMetric label={t("storeManager.createOrderResultStatus")} value={getStatusLabel(order.status, t)} />
          <SummaryMetric label={t("storeManager.orderTypeLabel")} value={getOrderTypeLabel(order.orderType, t)} />
          <SummaryMetric label={t("storeManager.createOrderResultUnits")} value={order.totalUnits} />
          <SummaryMetric label={t("storeManager.estimatedWeight")} value={formatWeight(order.estimatedWeightKg)} />
          <SummaryMetric label={t("storeManager.estimatedVolume")} value={formatTotalVolume(order.estimatedVolumeM3)} />
        </div>

        <p className="mx-auto mt-3 max-w-lg text-[8px] leading-4 text-[var(--color-text-muted)]">
          {t("storeManager.backendConfirmedTotals")}
        </p>

        {order.deferredReason && (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-amber-500/15 bg-amber-500/[0.055] px-4 py-3 text-left">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-amber-600">
              {t("storeManager.orderDetailsDeferredReason")}
            </p>
            <p className="mt-1.5 text-[10.5px] leading-4 text-[var(--color-text-secondary)]">
              {order.deferredReason}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onViewOrder}
            className="nexora-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[11px] font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            <ClipboardCheck size={14} />
            {t("storeManager.createOrderViewOrder")}
          </button>
          <button
            type="button"
            onClick={onOrders}
            className="nexora-focus inline-flex min-h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[11px] font-bold text-[var(--color-text)]"
          >
            {t("storeManager.createOrderBack")}
          </button>
          <button
            type="button"
            onClick={onCreateAnother}
            className="nexora-focus inline-flex min-h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[11px] font-bold text-[var(--color-text-secondary)]"
          >
            {t("storeManager.createOrderAnother")}
          </button>
        </div>
      </div>
    </section>
  );
}

function FullPageLoading({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function FullPageError({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-bold text-[var(--color-text)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function getStatusLabel(status, t) {
  const keys = {
    SUBMITTED: "storeManager.ordersStatusSubmitted",
    DEFERRED: "storeManager.ordersStatusDeferred",
    CONFIRMED: "storeManager.ordersStatusConfirmed",
    CANCELLED: "storeManager.ordersStatusCancelled",
  };
  return t(keys[status] || "storeManager.ordersStatusUnknown");
}

export default StoreManagerCreateOrderPage;
