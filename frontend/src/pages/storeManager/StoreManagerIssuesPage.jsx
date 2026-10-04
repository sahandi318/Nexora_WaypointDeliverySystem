import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileWarning,
  FilterX,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";
import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerIssues from "../../hooks/useStoreManagerIssues";
import useTranslations from "../../hooks/useTranslations";
import {
  createStoreManagerIssue,
  resolveStoreManagerIssue,
} from "../../services/storeManagerService";

const ISSUE_CATEGORIES = [
  "DELIVERY_SHORTFALL",
  "DAMAGED_GOODS",
  "LATE_DELIVERY",
  "DELIVERY_EXCEPTION",
  "ORDER_PROBLEM",
  "OTHER",
];

function StoreManagerIssuesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading: isContextLoading,
    errorMessage: contextErrorMessage,
  } = useStoreManagerContext();

  const {
    issues,
    summary,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshIssues,
  } = useStoreManagerIssues();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [category, setCategory] = useState("DELIVERY_SHORTFALL");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [resolvingCode, setResolvingCode] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionBusy, setResolutionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const requestedOrderCode = String(searchParams.get("orderCode") || "")
      .trim()
      .toUpperCase();

    if (requestedOrderCode) {
      setOrderCode(requestedOrderCode);
      setIsReportOpen(true);
    }
  }, [searchParams]);

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return issues.filter((issue) => {
      if (statusFilter !== "ALL" && issue.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "ALL" && issue.category !== categoryFilter) {
        return false;
      }

      if (!query) return true;

      return [
        issue.issueCode,
        issue.order?.orderCode,
        issue.category,
        issue.status,
        issue.description,
        issue.resolutionNote,
        issue.reportedBy?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [issues, searchQuery, statusFilter, categoryFilter]);

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL";

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
    setCategoryFilter("ALL");
  }

  function openReportForm() {
    setFormError("");
    setFormMessage("");
    setIsReportOpen(true);
  }

  function closeReportForm() {
    setIsReportOpen(false);
    setFormError("");
    setFormMessage("");
    if (searchParams.has("orderCode")) {
      setSearchParams({}, { replace: true });
    }
  }

  async function handleReportIssue(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");
    setFormMessage("");

    try {
      await createStoreManagerIssue({
        orderCode,
        category,
        description,
      });

      setFormMessage(t("storeManager.issuesCreateSuccess"));
      setDescription("");
      setStatusFilter("OPEN");
      await refreshIssues();
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          t("storeManager.issuesCreateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginResolve(issueCode) {
    setResolvingCode(issueCode);
    setResolutionNote("");
    setActionError("");
  }

  async function handleResolve(issueCode) {
    if (resolutionBusy) return;

    setResolutionBusy(true);
    setActionError("");

    try {
      await resolveStoreManagerIssue({
        issueCode,
        resolutionNote,
      });
      setResolvingCode("");
      setResolutionNote("");
      await refreshIssues();
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          t("storeManager.issuesResolveFailed")
      );
    } finally {
      setResolutionBusy(false);
    }
  }

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <StoreManagerPageHeader
        eyebrow={t("storeManager.workspaceEyebrow")}
        title={t("storeManager.issuesPageTitle")}
        description={t("storeManager.issuesPageDescription")}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshIssues}
              disabled={isRefreshing || isLoading}
              className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10.5px] font-bold text-[var(--color-text-secondary)] shadow-sm transition hover:bg-[var(--color-surface-soft)] disabled:opacity-60"
            >
              <RefreshCw size={13.5} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </button>
            <button
              type="button"
              onClick={openReportForm}
              className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 text-[10.5px] font-bold text-white shadow-[0_8px_18px_rgba(15,169,104,0.14)] transition hover:bg-[var(--color-primary-hover)]"
            >
              <Plus size={14} />
              {t("storeManager.issuesReport")}
            </button>
          </div>
        }
      />

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <IssueMetric
          icon={CircleAlert}
          label={t("storeManager.issuesOpen")}
          value={isLoading ? "—" : summary.open}
          tone="danger"
        />
        <IssueMetric
          icon={CheckCircle2}
          label={t("storeManager.issuesResolved")}
          value={isLoading ? "—" : summary.resolved}
          tone="success"
        />
        <IssueMetric
          icon={FileWarning}
          label={t("storeManager.issuesTotal")}
          value={isLoading ? "—" : summary.total}
          tone="info"
        />
      </section>

      {isReportOpen ? (
        <section className="mt-5 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_26px_rgba(15,23,42,0.035)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-bold text-[var(--color-text)]">
                {t("storeManager.issuesReportTitle")}
              </h2>
              <p className="mt-1 text-[10px] leading-5 text-[var(--color-text-secondary)]">
                {t("storeManager.issuesReportDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={closeReportForm}
              className="nexora-focus inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleReportIssue} className="mt-4 grid gap-4 lg:grid-cols-[220px_260px_minmax(0,1fr)_auto] lg:items-end">
            <label className="grid gap-1.5">
              <span className="text-[9.5px] font-bold text-[var(--color-text-secondary)]">
                {t("storeManager.issuesOrderCode")}
              </span>
              <input
                value={orderCode}
                onChange={(event) => setOrderCode(event.target.value.toUpperCase())}
                placeholder="ORD-..."
                className="nexora-focus h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] text-[var(--color-text)] outline-none"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[9.5px] font-bold text-[var(--color-text-secondary)]">
                {t("storeManager.issuesCategory")}
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="nexora-focus h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)] outline-none"
              >
                {ISSUE_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {getCategoryLabel(t, value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[9.5px] font-bold text-[var(--color-text-secondary)]">
                {t("storeManager.issuesDescription")}
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
                placeholder={t("storeManager.issuesDescriptionPlaceholder")}
                className="nexora-focus h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] text-[var(--color-text)] outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !orderCode.trim() || description.trim().length < 5}
              className="nexora-focus inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[10.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {isSubmitting ? t("storeManager.issuesReporting") : t("storeManager.issuesSubmitReport")}
            </button>
          </form>

          {formError ? (
            <p className="mt-3 text-[10px] font-semibold text-[var(--color-danger)]">{formError}</p>
          ) : null}
          {formMessage ? (
            <p className="mt-3 text-[10px] font-semibold text-[var(--color-primary)]">{formMessage}</p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-5 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 md:flex-row">
            <label className="relative block w-full md:max-w-[360px]">
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
              className="nexora-focus h-10 min-w-[150px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)] outline-none"
            >
              <option value="ALL">{t("storeManager.issuesAllStatuses")}</option>
              <option value="OPEN">{t("storeManager.issuesOpen")}</option>
              <option value="RESOLVED">{t("storeManager.issuesResolved")}</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="nexora-focus h-10 min-w-[190px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)] outline-none"
            >
              <option value="ALL">{t("storeManager.issuesAllTypes")}</option>
              {ISSUE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {getCategoryLabel(t, value)}
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
                .replace("{total}", String(issues.length))}
            </p>
          </div>
        </div>

        <div className="border-b border-[var(--color-border)] bg-[var(--color-info-soft)]/35 px-4 py-2.5 text-[9.5px] leading-4 text-[var(--color-text-secondary)] sm:px-5">
          {t("storeManager.issuesSourceNote")}
        </div>

        {errorMessage ? (
          <InlineState
            icon={TriangleAlert}
            title={t("storeManager.issuesLoadFailed")}
            description={errorMessage}
            actionLabel={t("storeManager.tryAgain")}
            onAction={refreshIssues}
          />
        ) : isLoading ? (
          <InlineState
            icon={RefreshCw}
            iconClass="animate-spin"
            title={t("storeManager.issuesLoading")}
            description={t("storeManager.issuesLoadingDescription")}
          />
        ) : filteredIssues.length === 0 ? (
          <InlineState
            icon={CheckCircle2}
            title={hasFilters ? t("storeManager.issuesNoMatches") : t("storeManager.issuesEmptyTitle")}
            description={hasFilters ? t("storeManager.issuesNoMatchesDescription") : t("storeManager.issuesEmptyDescription")}
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {filteredIssues.map((issue) => (
              <IssueRow
                key={issue.issueCode}
                issue={issue}
                language={language}
                t={t}
                isResolving={resolvingCode === issue.issueCode}
                resolutionNote={resolvingCode === issue.issueCode ? resolutionNote : ""}
                resolutionBusy={resolutionBusy}
                actionError={resolvingCode === issue.issueCode ? actionError : ""}
                onOpenDelivery={() => navigate(`/store-manager/deliveries/${encodeURIComponent(issue.order?.orderCode || "")}`)}
                onBeginResolve={() => beginResolve(issue.issueCode)}
                onCancelResolve={() => {
                  setResolvingCode("");
                  setResolutionNote("");
                  setActionError("");
                }}
                onResolutionNoteChange={setResolutionNote}
                onResolve={() => handleResolve(issue.issueCode)}
              />
            ))}
          </div>
        )}
      </section>
    </StoreManagerShell>
  );
}

function IssueMetric({ icon: Icon, label, value, tone }) {
  const tones = {
    danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-primary)]",
    info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  };

  return (
    <div className="flex min-h-[88px] items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone] || tones.info}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-[9.5px] font-semibold text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

function IssueRow({
  issue,
  language,
  t,
  isResolving,
  resolutionNote,
  resolutionBusy,
  actionError,
  onOpenDelivery,
  onBeginResolve,
  onCancelResolve,
  onResolutionNoteChange,
  onResolve,
}) {
  const isOpen = issue.status === "OPEN";

  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} t={t} />
            <span className="text-[10px] font-bold text-[var(--color-text)]">{issue.issueCode}</span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--color-text-secondary)]">
              {getCategoryLabel(t, issue.category)}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{issue.description}</p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[9.5px] text-[var(--color-text-muted)]">
            <span>{t("storeManager.issuesOrder")}: <strong className="text-[var(--color-text-secondary)]">{issue.order?.orderCode || "—"}</strong></span>
            <span>{t("storeManager.issuesReportedAt")}: <strong className="text-[var(--color-text-secondary)]">{formatDateTime(issue.reportedAt, language)}</strong></span>
            {issue.reportedBy?.fullName ? (
              <span>{t("storeManager.issuesReportedBy")}: <strong className="text-[var(--color-text-secondary)]">{issue.reportedBy.fullName}</strong></span>
            ) : null}
          </div>

          {!isOpen ? (
            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-success-soft)]/65 px-3 py-2.5 text-[10px] leading-5 text-[var(--color-text-secondary)]">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>{t("storeManager.issuesResolvedAt")}: <strong>{formatDateTime(issue.resolvedAt, language)}</strong></span>
                {issue.resolvedBy?.fullName ? <span>{t("storeManager.issuesResolvedBy")}: <strong>{issue.resolvedBy.fullName}</strong></span> : null}
              </div>
              {issue.resolutionNote ? <p className="mt-1">{issue.resolutionNote}</p> : null}
            </div>
          ) : null}

          {isResolving ? (
            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/55 p-3">
              <label className="grid gap-1.5">
                <span className="text-[9.5px] font-bold text-[var(--color-text-secondary)]">{t("storeManager.issuesResolutionNote")}</span>
                <textarea
                  value={resolutionNote}
                  onChange={(event) => onResolutionNoteChange(event.target.value.slice(0, 1000))}
                  rows={2}
                  placeholder={t("storeManager.issuesResolutionPlaceholder")}
                  className="nexora-focus resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[10.5px] text-[var(--color-text)] outline-none"
                />
              </label>
              {actionError ? <p className="mt-2 text-[10px] font-semibold text-[var(--color-danger)]">{actionError}</p> : null}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onResolve}
                  disabled={resolutionBusy}
                  className="nexora-focus inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 text-[9.5px] font-bold text-white disabled:opacity-55"
                >
                  {resolutionBusy ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  {t("storeManager.issuesMarkResolved")}
                </button>
                <button
                  type="button"
                  onClick={onCancelResolve}
                  className="nexora-focus h-8 rounded-lg border border-[var(--color-border)] px-3 text-[9.5px] font-bold text-[var(--color-text-secondary)]"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenDelivery}
            className="nexora-focus inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 text-[9.5px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"
          >
            {t("storeManager.issuesViewDelivery")}
            <ArrowRight size={12.5} />
          </button>
          {isOpen && !isResolving ? (
            <button
              type="button"
              onClick={onBeginResolve}
              className="nexora-focus inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--color-success-soft)] px-3 text-[9.5px] font-bold text-[var(--color-primary)]"
            >
              <CheckCircle2 size={12.5} />
              {t("storeManager.issuesResolve")}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function IssueStatusBadge({ status, t }) {
  const open = status === "OPEN";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold ${
      open
        ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        : "bg-[var(--color-success-soft)] text-[var(--color-primary)]"
    }`}>
      {open ? <Clock3 size={10.5} /> : <CheckCircle2 size={10.5} />}
      {open ? t("storeManager.issuesOpenStatus") : t("storeManager.issuesResolved")}
    </span>
  );
}

function InlineState({ icon: Icon, iconClass = "", title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
      <Icon size={28} className={`text-[var(--color-text-muted)] ${iconClass}`} />
      <h3 className="mt-3 text-[12px] font-bold text-[var(--color-text)]">{title}</h3>
      <p className="mt-1 max-w-[520px] text-[10.5px] leading-5 text-[var(--color-text-secondary)]">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="nexora-focus mt-4 rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-[10px] font-bold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function FullPageLoading({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <RefreshCw size={16} className="animate-spin" />
        {message}
      </div>
    </div>
  );
}

function FullPageError({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-5">
      <div className="w-full max-w-lg rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <TriangleAlert size={26} className="mx-auto text-[var(--color-danger)]" />
        <h2 className="mt-3 text-sm font-bold text-[var(--color-text)]">{title}</h2>
        <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function getCategoryLabel(t, category) {
  const keyMap = {
    DELIVERY_SHORTFALL: "storeManager.issuesCategoryDeliveryShortfall",
    DAMAGED_GOODS: "storeManager.issuesCategoryDamagedGoods",
    LATE_DELIVERY: "storeManager.issuesCategoryLateDelivery",
    DELIVERY_EXCEPTION: "storeManager.issuesCategoryDeliveryException",
    ORDER_PROBLEM: "storeManager.issuesCategoryOrderProblem",
    OTHER: "storeManager.issuesCategoryOther",
  };
  return t(keyMap[category] || keyMap.OTHER);
}

function formatDateTime(value, language) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const locale = language === "si" ? "si-LK" : language === "ta" ? "ta-LK" : "en-LK";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default StoreManagerIssuesPage;
