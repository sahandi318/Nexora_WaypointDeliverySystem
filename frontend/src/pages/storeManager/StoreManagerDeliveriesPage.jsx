import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilterX,
  Package,
  RefreshCw,
  Route,
  Search,
  Snowflake,
  ThermometerSun,
  TriangleAlert,
  Truck,
  Weight,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";
import {
  DeliveryMetricCard,
  DeliveryStatusBadge,
  formatDeliveryDate,
  formatDeliveryDateTime,
  formatWeight,
  getDeliveryGroup,
} from "../../components/storeManager/deliveries/StoreManagerDeliveryUI";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerDeliveries from "../../hooks/useStoreManagerDeliveries";
import useTranslations from "../../hooks/useTranslations";

const GROUP_FILTERS = [
  "ALL",
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "ATTENTION",
];

const TYPE_FILTERS = [
  "ALL",
  "AMBIENT_DRY",
  "CHILLED",
];

function StoreManagerDeliveriesPage() {
  const navigate = useNavigate();

  const {
    t,
    language,
  } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading: isContextLoading,
    errorMessage: contextErrorMessage,
  } = useStoreManagerContext();

  const {
    deliveries,
    isLoading: isDeliveriesLoading,
    isRefreshing,
    errorMessage: deliveriesErrorMessage,
    refreshDeliveries,
  } = useStoreManagerDeliveries();

  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const summary = useMemo(() => {
    const counts = {
      upcoming: 0,
      active: 0,
      completed: 0,
      attention: 0,
    };

    deliveries.forEach((delivery) => {
      const group = getDeliveryGroup(delivery.deliveryStatus);

      if (group === "UPCOMING") counts.upcoming += 1;
      if (group === "ACTIVE") counts.active += 1;
      if (group === "COMPLETED") counts.completed += 1;
      if (group === "ATTENTION") counts.attention += 1;
    });

    return counts;
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const group = getDeliveryGroup(delivery.deliveryStatus);
      const matchesGroup = groupFilter === "ALL" || group === groupFilter;
      const matchesType = typeFilter === "ALL" || delivery.orderType === typeFilter;

      const deliveryDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate || "";
      const matchesDate = !dateFilter || deliveryDate === dateFilter;

      if (!matchesGroup || !matchesType || !matchesDate) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        delivery.orderCode,
        delivery.deliveryStatus,
        delivery.orderStatus,
        delivery.orderType,
        delivery.plan?.tripCode,
        delivery.plan?.vehicleCode,
        delivery.plan?.vehicleType,
        delivery.outlet?.depot?.name,
        delivery.outlet?.depot?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [deliveries, searchQuery, groupFilter, typeFilter, dateFilter]);

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    groupFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    Boolean(dateFilter);

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

  function clearFilters() {
    setSearchQuery("");
    setGroupFilter("ALL");
    setTypeFilter("ALL");
    setDateFilter("");
  }

  function openDelivery(orderCode) {
    navigate(`/store-manager/deliveries/${encodeURIComponent(orderCode)}`);
  }

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <StoreManagerPageHeader
        eyebrow={t("storeManager.workspaceEyebrow")}
        title={t("storeManager.deliveriesPageTitle")}
        description={t("storeManager.deliveriesPageDescription")}
        actions={
          <button
            type="button"
            onClick={refreshDeliveries}
            disabled={isRefreshing}
            className="nexora-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[11.5px] font-semibold text-[var(--color-text-secondary)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {t("common.refresh")}
          </button>
        }
      />

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DeliveryMetricCard
          icon={Clock3}
          label={t("storeManager.deliveriesUpcoming")}
          value={summary.upcoming}
          detail={t("storeManager.deliveriesUpcomingHint")}
        />
        <DeliveryMetricCard
          icon={Truck}
          label={t("storeManager.deliveriesInTransit")}
          value={summary.active}
          detail={t("storeManager.deliveriesInTransitHint")}
          tone="transit"
        />
        <DeliveryMetricCard
          icon={CheckCircle2}
          label={t("storeManager.deliveriesCompleted")}
          value={summary.completed}
          detail={t("storeManager.deliveriesCompletedHint")}
          tone="success"
        />
        <DeliveryMetricCard
          icon={TriangleAlert}
          label={t("storeManager.deliveriesAttention")}
          value={summary.attention}
          detail={t("storeManager.deliveriesAttentionHint")}
          tone="attention"
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-2.5 lg:flex-row">
              <label className="relative block w-full lg:max-w-[330px]">
                <span className="sr-only">{t("storeManager.deliveriesSearch")}</span>
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("storeManager.deliveriesSearchPlaceholder")}
                  className="nexora-focus h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pl-9 pr-3 text-[11.5px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
              </label>

              <FilterSelect
                value={groupFilter}
                onChange={setGroupFilter}
                ariaLabel={t("storeManager.deliveriesStageFilter")}
              >
                {GROUP_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {getGroupLabel(t, value)}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                value={typeFilter}
                onChange={setTypeFilter}
                ariaLabel={t("storeManager.ordersTypeFilter")}
              >
                {TYPE_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {getTypeLabel(t, value)}
                  </option>
                ))}
              </FilterSelect>

              <label className="relative block w-full sm:w-auto">
                <span className="sr-only">{t("storeManager.deliveriesDateFilter")}</span>
                <CalendarDays
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="nexora-focus h-10 w-full min-w-[160px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pl-9 pr-3 text-[11px] text-[var(--color-text)] outline-none sm:w-auto"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <p className="text-[10.5px] font-medium text-[var(--color-text-muted)]">
                {t("storeManager.deliveriesShowing", undefined, {
                  shown: filteredDeliveries.length,
                  total: deliveries.length,
                })}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="nexora-focus inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                >
                  <FilterX size={13.5} />
                  {t("storeManager.deliveriesClearFilters")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {isDeliveriesLoading ? (
          <InlineState
            icon={RefreshCw}
            iconClass="animate-spin"
            title={t("storeManager.deliveriesLoading")}
            description={t("storeManager.deliveriesLoadingDescription")}
          />
        ) : deliveriesErrorMessage ? (
          <InlineState
            icon={TriangleAlert}
            title={t("storeManager.deliveriesLoadFailed")}
            description={deliveriesErrorMessage}
            actionLabel={t("storeManager.tryAgain")}
            onAction={refreshDeliveries}
          />
        ) : filteredDeliveries.length === 0 ? (
          <InlineState
            icon={Truck}
            title={
              hasFilters
                ? t("storeManager.deliveriesNoMatchesTitle")
                : t("storeManager.deliveriesEmptyTitle")
            }
            description={
              hasFilters
                ? t("storeManager.deliveriesNoMatchesDescription")
                : t("storeManager.deliveriesEmptyDescription")
            }
            actionLabel={hasFilters ? t("storeManager.deliveriesClearFilters") : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-[var(--color-surface-soft)]/65">
                  <tr className="border-b border-[var(--color-border)]">
                    <TableHeading>{t("storeManager.deliveriesOrder")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesStatus")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesSchedule")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesTrip")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesVehicle")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesLoad")}</TableHeading>
                    <TableHeading align="right">{t("storeManager.deliveriesAction")}</TableHeading>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <DeliveryTableRow
                      key={delivery.orderCode}
                      delivery={delivery}
                      language={language}
                      t={t}
                      onOpen={openDelivery}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 sm:p-4 xl:hidden">
              {filteredDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.orderCode}
                  delivery={delivery}
                  language={language}
                  t={t}
                  onOpen={openDelivery}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </StoreManagerShell>
  );
}

function DeliveryTableRow({ delivery, language, t, onOpen }) {
  const scheduleDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate;
  const plannedEta = delivery.plan?.plannedEta;

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-soft)]/35">
      <td className="px-5 py-4 align-top">
        <p className="text-[11.5px] font-bold text-[var(--color-text)]">{delivery.orderCode}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
          {delivery.orderType === "CHILLED" ? <Snowflake size={12} /> : <ThermometerSun size={12} />}
          {getTypeLabel(t, delivery.orderType)}
        </div>
      </td>

      <td className="px-5 py-4 align-top">
        <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
        {delivery.deferredReason ? (
          <p className="mt-2 max-w-[190px] text-[9.5px] leading-4 text-[var(--color-warning)]">
            {delivery.deferredReason}
          </p>
        ) : null}
      </td>

      <td className="px-5 py-4 align-top">
        <p className="text-[11px] font-semibold text-[var(--color-text)]">
          {formatDeliveryDate(scheduleDate, language)}
        </p>
        <p className="mt-1 text-[9.5px] text-[var(--color-text-muted)]">
          {plannedEta
            ? `${t("storeManager.deliveriesPlannedEta")}: ${formatDeliveryDateTime(plannedEta, language)}`
            : t("storeManager.deliveriesEtaPending")}
        </p>
      </td>

      <td className="px-5 py-4 align-top">
        <p className="text-[11px] font-semibold text-[var(--color-text)]">
          {delivery.plan?.tripCode || "—"}
        </p>
        <p className="mt-1 text-[9.5px] text-[var(--color-text-muted)]">
          {delivery.plan?.tripStatus
            ? delivery.plan.tripStatus.replaceAll("_", " ")
            : t("storeManager.deliveriesAwaitingAssignment")}
        </p>
      </td>

      <td className="px-5 py-4 align-top">
        <p className="text-[11px] font-semibold text-[var(--color-text)]">
          {delivery.plan?.vehicleCode || "—"}
        </p>
        <p className="mt-1 text-[9.5px] text-[var(--color-text-muted)]">
          {delivery.plan?.vehicleType || t("storeManager.deliveriesNotAssigned")}
        </p>
      </td>

      <td className="px-5 py-4 align-top">
        <p className="text-[11px] font-semibold text-[var(--color-text)]">
          {delivery.totalUnits ?? 0} {t("storeManager.ordersUnits").toLowerCase()}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[9.5px] text-[var(--color-text-muted)]">
          <Weight size={11.5} />
          {formatWeight(delivery.estimatedWeightKg)}
        </p>
      </td>

      <td className="px-5 py-4 text-right align-top">
        <button
          type="button"
          onClick={() => onOpen(delivery.orderCode)}
          className="nexora-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[10px] font-bold text-[var(--color-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)]"
        >
          {t("storeManager.deliveriesViewDetails")}
          <ArrowRight size={12.5} />
        </button>
      </td>
    </tr>
  );
}

function DeliveryCard({ delivery, language, t, onOpen }) {
  const scheduleDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate;

  return (
    <article className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-[var(--color-text)]">{delivery.orderCode}</p>
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{getTypeLabel(t, delivery.orderType)}</p>
        </div>
        <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MiniField
          icon={CalendarDays}
          label={t("storeManager.deliveriesSchedule")}
          value={formatDeliveryDate(scheduleDate, language)}
        />
        <MiniField
          icon={Route}
          label={t("storeManager.deliveriesTrip")}
          value={delivery.plan?.tripCode || t("storeManager.deliveriesNotAssigned")}
        />
        <MiniField
          icon={Truck}
          label={t("storeManager.deliveriesVehicle")}
          value={delivery.plan?.vehicleCode || t("storeManager.deliveriesNotAssigned")}
        />
        <MiniField
          icon={Package}
          label={t("storeManager.deliveriesLoad")}
          value={`${delivery.totalUnits ?? 0} ${t("storeManager.ordersUnits").toLowerCase()}`}
        />
      </div>

      {delivery.deferredReason ? (
        <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-warning-soft)] px-3 py-2.5 text-[10px] leading-4 text-[var(--color-warning)]">
          {delivery.deferredReason}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onOpen(delivery.orderCode)}
        className="nexora-focus mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 text-[10.5px] font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        {t("storeManager.deliveriesViewDetails")}
        <ArrowRight size={13.5} />
      </button>
    </article>
  );
}

function MiniField({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/55 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.09em] text-[var(--color-text-muted)]">
        <Icon size={11.5} className="text-[var(--color-primary)]" />
        {label}
      </div>
      <p className="mt-1.5 truncate text-[10.5px] font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3 text-[9px] font-bold uppercase tracking-[0.11em] text-[var(--color-text-muted)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function FilterSelect({ value, onChange, ariaLabel, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="nexora-focus h-10 w-full min-w-[150px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[11px] font-medium text-[var(--color-text-secondary)] outline-none sm:w-auto"
    >
      {children}
    </select>
  );
}

function InlineState({
  icon: Icon,
  iconClass = "",
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex min-h-[310px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
        <Icon size={18} className={iconClass} />
      </span>
      <h2 className="mt-4 text-[14px] font-bold text-[var(--color-text)]">{title}</h2>
      <p className="mt-2 max-w-md text-[11px] leading-5 text-[var(--color-text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="nexora-focus mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[10.5px] font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function FullPageLoading({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center">
        <RefreshCw size={22} className="mx-auto animate-spin text-[var(--color-primary)]" />
        <p className="mt-3 text-[12px] font-semibold text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function FullPageError({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-lg">
        <TriangleAlert size={22} className="mx-auto text-[var(--color-warning)]" />
        <h1 className="mt-3 text-[15px] font-bold text-[var(--color-text)]">{title}</h1>
        <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function getGroupLabel(t, value) {
  const labels = {
    ALL: t("storeManager.deliveriesAllStages"),
    UPCOMING: t("storeManager.deliveriesUpcoming"),
    ACTIVE: t("storeManager.deliveriesInTransit"),
    COMPLETED: t("storeManager.deliveriesCompleted"),
    ATTENTION: t("storeManager.deliveriesAttention"),
  };

  return labels[value] || value;
}

function getTypeLabel(t, value) {
  const labels = {
    ALL: t("storeManager.ordersAllTypes"),
    AMBIENT_DRY: t("storeManager.orderTypeAmbient"),
    CHILLED: t("storeManager.orderTypeChilled"),
  };

  return labels[value] || value;
}

export default StoreManagerDeliveriesPage;
