import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilterX,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";
import StoreManagerLiveConnectionBadge from "../../components/storeManager/deliveries/StoreManagerLiveConnectionBadge";
import {
  ATTENTION_STATUSES,
  DeliveryStatusBadge,
  formatDeliveryDate,
  getDeliveryStatusLabel,
} from "../../components/storeManager/deliveries/StoreManagerDeliveryUI";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerDeliveries from "../../hooks/useStoreManagerDeliveries";
import useTranslations from "../../hooks/useTranslations";

const ISSUE_FILTERS = ["ALL", "DEFERRED", "PARTIAL", "EXCEPTION", "CANCELLED"];

function StoreManagerIssuesPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading: isContextLoading,
    errorMessage: contextErrorMessage,
  } = useStoreManagerContext();

  const {
    deliveries,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshDeliveries,
    liveStatus,
  } = useStoreManagerDeliveries();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const attentionDeliveries = useMemo(
    () => deliveries.filter((delivery) => ATTENTION_STATUSES.has(delivery.deliveryStatus)),
    [deliveries]
  );

  const summary = useMemo(
    () => ({
      total: attentionDeliveries.length,
      deferred: attentionDeliveries.filter((item) => item.deliveryStatus === "DEFERRED").length,
      partial: attentionDeliveries.filter((item) => item.deliveryStatus === "PARTIAL").length,
      exception: attentionDeliveries.filter((item) =>
        ["EXCEPTION", "CANCELLED"].includes(item.deliveryStatus)
      ).length,
    }),
    [attentionDeliveries]
  );

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return attentionDeliveries.filter((delivery) => {
      if (statusFilter !== "ALL" && delivery.deliveryStatus !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        delivery.orderCode,
        delivery.deliveryStatus,
        delivery.deferredReason,
        delivery.plan?.tripCode,
        delivery.plan?.vehicleCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [attentionDeliveries, searchQuery, statusFilter]);

  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== "ALL";

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
    setStatusFilter("ALL");
  }

  function openDelivery(orderCode) {
    navigate(`/store-manager/deliveries/${encodeURIComponent(orderCode)}`);
  }

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <StoreManagerPageHeader
        eyebrow={t("storeManager.workspaceEyebrow")}
        title={t("storeManager.issuesPageTitle")}
        description={t("storeManager.issuesPageDescription")}
        actions={
          <div className="flex items-center gap-2">
            <StoreManagerLiveConnectionBadge status={liveStatus} t={t} compact />
            <button
              type="button"
              onClick={refreshDeliveries}
              disabled={isRefreshing || isLoading}
              className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10.5px] font-bold text-[var(--color-text-secondary)] shadow-sm transition hover:bg-[var(--color-surface-soft)] disabled:opacity-60"
            >
              <RefreshCw size={13.5} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </button>
          </div>
        }
      />

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IssueMetric
          icon={TriangleAlert}
          label={t("storeManager.issuesOpen")}
          value={isLoading ? "—" : summary.total}
          tone="danger"
        />
        <IssueMetric
          icon={Clock3}
          label={t("storeManager.deliveryStatusDeferred")}
          value={isLoading ? "—" : summary.deferred}
          tone="warning"
        />
        <IssueMetric
          icon={TriangleAlert}
          label={t("storeManager.deliveryStatusPartial")}
          value={isLoading ? "—" : summary.partial}
          tone="warning"
        />
        <IssueMetric
          icon={TriangleAlert}
          label={t("storeManager.deliveryStatusException")}
          value={isLoading ? "—" : summary.exception}
          tone="danger"
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 md:flex-row">
            <label className="relative block w-full md:max-w-[360px]">
              <span className="sr-only">{t("storeManager.issuesSearch")}</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("storeManager.issuesSearchPlaceholder")}
                className="nexora-focus h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pl-9 pr-3 text-[11px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label={t("storeManager.issuesTypeFilter")}
              className="nexora-focus h-10 min-w-[170px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)] outline-none"
            >
              {ISSUE_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL"
                    ? t("storeManager.issuesAllTypes")
                    : getDeliveryStatusLabel(t, status)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 xl:justify-end">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="nexora-focus inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[9.5px] font-bold text-[var(--color-primary)] hover:underline"
              >
                <FilterX size={12.5} />
                {t("storeManager.deliveriesClearFilters")}
              </button>
            ) : null}
            <p className="text-[9.5px] text-[var(--color-text-muted)]">
              {t("storeManager.issuesShowing")
                .replace("{shown}", String(filteredIssues.length))
                .replace("{total}", String(attentionDeliveries.length))}
            </p>
          </div>
        </div>

        <div className="border-b border-[var(--color-border)] bg-[var(--color-info-soft)]/35 px-4 py-2.5 text-[9.5px] leading-4 text-[var(--color-text-secondary)] sm:px-5">
          {t("storeManager.issuesSourceNote")}
        </div>

        {errorMessage ? (
          <InlineState
            icon={TriangleAlert}
            title={t("storeManager.deliveriesLoadFailed")}
            description={errorMessage}
            actionLabel={t("storeManager.tryAgain")}
            onAction={refreshDeliveries}
          />
        ) : isLoading ? (
          <InlineState
            icon={RefreshCw}
            iconClass="animate-spin"
            title={t("storeManager.deliveriesLoading")}
            description={t("storeManager.deliveriesLoadingDescription")}
          />
        ) : filteredIssues.length === 0 ? (
          <InlineState
            icon={CheckCircle2}
            title={
              hasFilters
                ? t("storeManager.issuesNoMatches")
                : t("storeManager.issuesEmptyTitle")
            }
            description={
              hasFilters
                ? t("storeManager.issuesNoMatchesDescription")
                : t("storeManager.issuesEmptyDescription")
            }
            actionLabel={hasFilters ? t("storeManager.deliveriesClearFilters") : undefined}
            onAction={hasFilters ? clearFilters : undefined}
            success={!hasFilters}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-[var(--color-surface-soft)]/65">
                  <tr className="border-b border-[var(--color-border)]">
                    <TableHeading>{t("storeManager.issuesOrder")}</TableHeading>
                    <TableHeading>{t("storeManager.issuesIssueType")}</TableHeading>
                    <TableHeading>{t("storeManager.issuesReason")}</TableHeading>
                    <TableHeading>{t("storeManager.issuesSchedule")}</TableHeading>
                    <TableHeading>{t("storeManager.deliveriesTrip")}</TableHeading>
                    <TableHeading align="right">{t("storeManager.issuesAction")}</TableHeading>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((delivery) => (
                    <IssueRow
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

            <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
              {filteredIssues.map((delivery) => (
                <IssueCard
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

function IssueMetric({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    warning: "border-[var(--color-warning)]/24 bg-[var(--color-warning-soft)]/85 text-[var(--color-warning)]",
    danger: "border-[var(--color-danger)]/24 bg-[var(--color-danger-soft)]/85 text-[var(--color-danger)]",
  };
  const cardClasses = {
    warning: "border-[var(--color-warning)]/24 bg-[linear-gradient(135deg,var(--color-warning-soft)_0%,var(--color-surface)_130%)]",
    danger: "border-[var(--color-danger)]/24 bg-[linear-gradient(135deg,var(--color-danger-soft)_0%,var(--color-surface)_130%)]",
  };

  return (
    <article className={`rounded-[18px] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.035)] ${cardClasses[tone] || cardClasses.warning}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-2 text-[1.5rem] font-extrabold tracking-[-0.04em] text-[var(--color-text)]">{value}</p>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-[13px] border ${toneClasses[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
    </article>
  );
}

function IssueRow({ delivery, language, t, onOpen }) {
  const scheduleDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate;

  return (
    <tr className="border-b border-[var(--color-border)] transition last:border-b-0 hover:bg-[var(--color-surface-soft)]/45">
      <td className="px-5 py-4">
        <p className="text-[11px] font-extrabold text-[var(--color-text)]">{delivery.orderCode}</p>
        <p className="mt-1 text-[9px] text-[var(--color-text-muted)]">{delivery.orderType === "CHILLED" ? t("storeManager.orderTypeChilled") : t("storeManager.orderTypeAmbient")}</p>
      </td>
      <td className="px-5 py-4">
        <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[320px] text-[10px] leading-4 text-[var(--color-text-secondary)]">
          {delivery.deferredReason || t("storeManager.issuesOperationalAttention")}
        </p>
      </td>
      <td className="px-5 py-4">
        <p className="text-[10.5px] font-semibold text-[var(--color-text)]">{formatDeliveryDate(scheduleDate, language)}</p>
      </td>
      <td className="px-5 py-4">
        <p className="text-[10.5px] font-semibold text-[var(--color-text)]">{delivery.plan?.tripCode || t("storeManager.deliveriesNotAssigned")}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onOpen(delivery.orderCode)}
          className="nexora-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[9.5px] font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-soft)]"
        >
          {t("storeManager.issuesViewDelivery")}
          <ArrowRight size={12} />
        </button>
      </td>
    </tr>
  );
}

function IssueCard({ delivery, language, t, onOpen }) {
  const scheduleDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate;

  const issueTone = getIssueCardTone(delivery.deliveryStatus);

  return (
    <article className={`rounded-[18px] border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)] ${issueTone.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold text-[var(--color-text)]">{delivery.orderCode}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)]">
            <CalendarDays size={11} />
            {formatDeliveryDate(scheduleDate, language)}
          </p>
        </div>
        <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
      </div>

      <div className={`mt-3 rounded-xl border px-3 py-2.5 text-[9.5px] leading-4 text-[var(--color-text-secondary)] ${issueTone.reason}`}>
        {delivery.deferredReason || t("storeManager.issuesOperationalAttention")}
      </div>

      <button
        type="button"
        onClick={() => onOpen(delivery.orderCode)}
        className="nexora-focus mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 text-[10px] font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
      >
        {t("storeManager.issuesViewDelivery")}
        <ArrowRight size={13} />
      </button>
    </article>
  );
}


function getIssueCardTone(status) {
  if (["EXCEPTION", "CANCELLED"].includes(status)) {
    return {
      card: "border-[var(--color-danger)]/22 bg-[linear-gradient(135deg,var(--color-danger-soft)_0%,var(--color-surface)_145%)]",
      reason: "border-[var(--color-danger)]/18 bg-[var(--color-danger-soft)]/62",
    };
  }

  if (status === "DEFERRED") {
    return {
      card: "border-[var(--color-danger)]/18 bg-[linear-gradient(135deg,var(--color-danger-soft)_0%,var(--color-surface)_155%)]",
      reason: "border-[var(--color-danger)]/16 bg-[var(--color-danger-soft)]/48",
    };
  }

  return {
    card: "border-[var(--color-warning)]/20 bg-[linear-gradient(135deg,var(--color-warning-soft)_0%,var(--color-surface)_150%)]",
    reason: "border-[var(--color-warning)]/18 bg-[var(--color-warning-soft)]/58",
  };
}

function TableHeading({ children, align = "left" }) {
  return (
    <th className={`px-5 py-3 text-[8.5px] font-extrabold uppercase tracking-[0.11em] text-[var(--color-text-muted)] ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function InlineState({ icon: Icon, iconClass = "", title, description, actionLabel, onAction, success = false }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${success ? "border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]" : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]"}`}>
        <Icon size={19} className={iconClass} />
      </span>
      <h2 className="mt-4 text-[13px] font-bold text-[var(--color-text)]">{title}</h2>
      <p className="mt-2 max-w-md text-[10.5px] leading-5 text-[var(--color-text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="nexora-focus mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[10px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function FullPageLoading({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
      <div className="text-center">
        <RefreshCw size={24} className="mx-auto animate-spin text-[var(--color-primary)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function FullPageError({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
      <div className="w-full max-w-md rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-md)]">
        <TriangleAlert size={22} className="mx-auto text-[var(--color-danger)]" />
        <h1 className="mt-4 text-lg font-bold text-[var(--color-text)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

export default StoreManagerIssuesPage;
