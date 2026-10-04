import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  MapPin,
  PackagePlus,
  ParkingCircle,
  RefreshCw,
  Route,
  Store,
  TriangleAlert,
  Truck,
  Warehouse,
} from "lucide-react";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import StoreManagerPageHeader from "../../components/storeManager/StoreManagerPageHeader";
import StoreManagerShell from "../../components/storeManager/StoreManagerShell";
import StoreManagerLiveConnectionBadge from "../../components/storeManager/deliveries/StoreManagerLiveConnectionBadge";
import {
  DeliveryStatusBadge,
  formatDeliveryDate,
  formatDeliveryDateTime,
  getDeliveryGroup,
} from "../../components/storeManager/deliveries/StoreManagerDeliveryUI";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerDeliveries from "../../hooks/useStoreManagerDeliveries";
import useStoreManagerOrders from "../../hooks/useStoreManagerOrders";
import useTranslations from "../../hooks/useTranslations";

function StoreManagerDashboardPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading: isContextLoading,
    isRefreshing: isContextRefreshing,
    errorMessage: contextErrorMessage,
    refreshContext,
  } = useStoreManagerContext();

  const {
    orders,
    isLoading: isOrdersLoading,
    isRefreshing: isOrdersRefreshing,
    errorMessage: ordersErrorMessage,
    refreshOrders,
  } = useStoreManagerOrders();

  const {
    deliveries,
    isLoading: isDeliveriesLoading,
    isRefreshing: isDeliveriesRefreshing,
    errorMessage: deliveriesErrorMessage,
    refreshDeliveries,
    liveStatus,
  } = useStoreManagerDeliveries();

  const dashboard = useMemo(() => {
    const groups = {
      upcoming: 0,
      active: 0,
      completed: 0,
      attention: 0,
    };

    deliveries.forEach((delivery) => {
      const group = getDeliveryGroup(delivery.deliveryStatus);
      if (group === "UPCOMING") groups.upcoming += 1;
      if (group === "ACTIVE") groups.active += 1;
      if (group === "COMPLETED") groups.completed += 1;
      if (group === "ATTENTION") groups.attention += 1;
    });

    const activeOrders = orders.filter((order) =>
      ["SUBMITTED", "CONFIRMED"].includes(order.status)
    ).length;

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.submittedAt || 0).getTime() -
          new Date(a.submittedAt || 0).getTime()
      )
      .slice(0, 5);

    const nextDelivery = [...deliveries]
      .filter((delivery) =>
        ["UPCOMING", "ACTIVE"].includes(
          getDeliveryGroup(delivery.deliveryStatus)
        )
      )
      .sort((a, b) => {
        const aDate = a.plan?.plannedEta || a.plan?.deliveryDate || a.effectiveDispatchDate || "9999";
        const bDate = b.plan?.plannedEta || b.plan?.deliveryDate || b.effectiveDispatchDate || "9999";
        return String(aDate).localeCompare(String(bDate));
      })[0] || null;

    const attentionDeliveries = deliveries
      .filter((delivery) => getDeliveryGroup(delivery.deliveryStatus) === "ATTENTION")
      .slice(0, 3);

    return {
      groups,
      activeOrders,
      recentOrders,
      nextDelivery,
      attentionDeliveries,
    };
  }, [orders, deliveries]);

  if (isContextLoading) {
    return <FullPageLoading message={t("storeManager.loadingWorkspace")} />;
  }

  if (contextErrorMessage || !user || !outlet) {
    return (
      <FullPageError
        title={t("storeManager.unableToLoadWorkspace")}
        message={contextErrorMessage || t("storeManager.workspaceUnavailable")}
        onRetry={refreshContext}
        isRefreshing={isContextRefreshing}
        retryLabel={t("storeManager.tryAgain")}
      />
    );
  }

  const isRefreshing =
    isContextRefreshing || isOrdersRefreshing || isDeliveriesRefreshing;

  function refreshDashboard() {
    refreshContext();
    refreshOrders();
    refreshDeliveries();
  }

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <StoreManagerPageHeader
        eyebrow={t("storeManager.workspaceEyebrow")}
        title={t("storeManager.dashboardTitle")}
        description={t("storeManager.dashboardDescription")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StoreManagerLiveConnectionBadge status={liveStatus} t={t} compact />
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={isRefreshing}
              className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10.5px] font-bold text-[var(--color-text-secondary)] shadow-sm transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] disabled:opacity-60"
            >
              <RefreshCw size={13.5} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/store-manager/orders/new")}
              className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 text-[10.5px] font-bold text-white shadow-[0_8px_18px_rgba(15,169,104,0.16)] transition hover:bg-[var(--color-primary-hover)]"
            >
              <PackagePlus size={14} />
              {t("storeManager.ordersCreateOrder")}
            </button>
          </div>
        }
      />

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          icon={ClipboardList}
          label={t("storeManager.dashboardOrdersInProgress")}
          value={isOrdersLoading ? "—" : dashboard.activeOrders}
          tone="primary"
        />
        <DashboardMetric
          icon={CalendarDays}
          label={t("storeManager.dashboardUpcomingDeliveries")}
          value={isDeliveriesLoading ? "—" : dashboard.groups.upcoming}
          tone="warning"
        />
        <DashboardMetric
          icon={Truck}
          label={t("storeManager.dashboardLiveDeliveries")}
          value={isDeliveriesLoading ? "—" : dashboard.groups.active}
          tone="info"
        />
        <DashboardMetric
          icon={TriangleAlert}
          label={t("storeManager.dashboardNeedsAttention")}
          value={isDeliveriesLoading ? "—" : dashboard.groups.attention}
          tone={dashboard.groups.attention > 0 ? "danger" : "success"}
        />
      </section>

      {(ordersErrorMessage || deliveriesErrorMessage) && (
        <div className="mt-4 flex flex-col gap-2 rounded-[16px] border border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)]/55 px-4 py-3 text-[10.5px] text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <span>{ordersErrorMessage || deliveriesErrorMessage}</span>
          <button
            type="button"
            onClick={refreshDashboard}
            className="nexora-focus inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 font-bold text-[var(--color-text)] sm:self-auto"
          >
            <RefreshCw size={12} />
            {t("storeManager.tryAgain")}
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <div className="min-w-0 space-y-5">
          <DashboardPanel
            title={t("storeManager.dashboardNextDelivery")}
            description={t("storeManager.dashboardNextDeliveryDescription")}
            action={
              <TextAction
                label={t("storeManager.dashboardViewDeliveries")}
                onClick={() => navigate("/store-manager/deliveries")}
              />
            }
          >
            {isDeliveriesLoading ? (
              <PanelLoading />
            ) : dashboard.nextDelivery ? (
              <NextDeliveryCard
                delivery={dashboard.nextDelivery}
                language={language}
                t={t}
                onOpen={() =>
                  navigate(
                    `/store-manager/deliveries/${encodeURIComponent(
                      dashboard.nextDelivery.orderCode
                    )}`
                  )
                }
              />
            ) : (
              <PanelEmpty
                icon={Truck}
                title={t("storeManager.dashboardNoDeliveries")}
              />
            )}
          </DashboardPanel>

          <DashboardPanel
            title={t("storeManager.dashboardRecentOrders")}
            description={t("storeManager.dashboardRecentOrdersDescription")}
            noPadding
            action={
              <TextAction
                label={t("storeManager.dashboardViewOrders")}
                onClick={() => navigate("/store-manager/orders")}
              />
            }
          >
            {isOrdersLoading ? (
              <PanelLoading />
            ) : dashboard.recentOrders.length ? (
              <div className="divide-y divide-[var(--color-border)]">
                {dashboard.recentOrders.map((order) => (
                  <button
                    type="button"
                    key={order.orderCode}
                    onClick={() =>
                      navigate(
                        `/store-manager/orders/${encodeURIComponent(order.orderCode)}`
                      )
                    }
                    className="nexora-focus group grid w-full gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--color-surface-soft)]/65 sm:grid-cols-[minmax(0,1fr)_120px_130px_28px] sm:items-center sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[var(--color-text)]">
                        {order.orderCode}
                      </p>
                      <p className="mt-1 text-[9px] text-[var(--color-text-muted)]">
                        {formatDateTime(order.submittedAt, language)} · {order.totalUnits ?? 0} {t("storeManager.ordersUnits").toLowerCase()}
                      </p>
                    </div>
                    <p className="text-[9.5px] font-semibold text-[var(--color-text-secondary)]">
                      {order.orderType === "CHILLED"
                        ? t("storeManager.orderTypeChilled")
                        : t("storeManager.orderTypeAmbient")}
                    </p>
                    <OrderStatusPill status={order.status} t={t} />
                    <ArrowRight size={14} className="hidden text-[var(--color-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)] sm:block" />
                  </button>
                ))}
              </div>
            ) : (
              <PanelEmpty
                icon={ClipboardList}
                title={t("storeManager.dashboardNoOrders")}
              />
            )}
          </DashboardPanel>
        </div>

        <aside className="space-y-5">
          <DashboardPanel
            title={t("storeManager.dashboardNeedsAttention")}
            description={t("storeManager.dashboardAttentionDescription")}
            noPadding
          >
            {isDeliveriesLoading ? (
              <PanelLoading />
            ) : dashboard.attentionDeliveries.length ? (
              <div className="divide-y divide-[var(--color-border)]">
                {dashboard.attentionDeliveries.map((delivery) => (
                  <button
                    type="button"
                    key={delivery.orderCode}
                    onClick={() =>
                      navigate(
                        `/store-manager/deliveries/${encodeURIComponent(
                          delivery.orderCode
                        )}`
                      )
                    }
                    className="nexora-focus w-full px-4 py-3.5 text-left transition hover:bg-[var(--color-surface-soft)]/65"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[10.5px] font-extrabold text-[var(--color-text)]">
                          {delivery.orderCode}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[var(--color-text-muted)]">
                          {delivery.deferredReason || t("storeManager.deliveryDetailsAttentionDescription")}
                        </p>
                      </div>
                      <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <p className="text-[10.5px] font-bold text-[var(--color-text)]">
                    {t("storeManager.dashboardNoAttention")}
                  </p>
                  <p className="mt-1 text-[9px] text-[var(--color-text-muted)]">
                    {t("storeManager.dashboardNoAttentionDescription")}
                  </p>
                </div>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel
            title={t("storeManager.dashboardOutletOperations")}
            description={t("storeManager.dashboardOutletOperationsDescription")}
          >
            <div className="grid gap-2.5">
              <OperationalRow
                icon={Store}
                label={t("storeManager.outletCode")}
                value={outlet.outletCode || "—"}
                tone="success"
              />
              <OperationalRow
                icon={Warehouse}
                label={t("common.assignedDepot")}
                value={depot?.name || t("storeManager.notAssigned")}
                tone="info"
              />
              <OperationalRow
                icon={MapPin}
                label={t("storeManager.district")}
                value={outlet.district || t("storeManager.notSpecified")}
                tone="info"
              />
              <OperationalRow
                icon={Clock3}
                label={t("common.deliveryWindow")}
                value={formatWindow(outlet.windowOpenTime, outlet.windowCloseTime, t("storeManager.notSpecified"))}
                tone="warning"
              />
              <OperationalRow
                icon={Building2}
                label={t("storeManager.mallWindow")}
                value={outlet.mallWindow || t("storeManager.notApplicable")}
                tone="warning"
              />
              <OperationalRow
                icon={ParkingCircle}
                label={t("storeManager.parkingConstraint")}
                value={formatOperationalValue(outlet.parkingConstraint) || t("storeManager.noneSpecified")}
                tone="neutral"
              />
            </div>
          </DashboardPanel>
        </aside>
      </div>
    </StoreManagerShell>
  );
}

function DashboardMetric({ icon: Icon, label, value, tone = "primary" }) {
  const tones = {
    primary: "border-[var(--color-primary)]/22 bg-[var(--color-primary-soft)]/70 text-[var(--color-primary-strong)]",
    warning: "border-[var(--color-warning)]/24 bg-[var(--color-warning-soft)]/85 text-[var(--color-warning)]",
    info: "border-[var(--color-info)]/24 bg-[var(--color-info-soft)]/85 text-[var(--color-info)]",
    danger: "border-[var(--color-danger)]/24 bg-[var(--color-danger-soft)]/82 text-[var(--color-danger)]",
    success: "border-[var(--color-success)]/24 bg-[var(--color-success-soft)]/85 text-[var(--color-success)]",
  };

  const cards = {
    primary: "border-[var(--color-primary)]/22 bg-[linear-gradient(135deg,var(--color-primary-soft)_0%,var(--color-surface)_130%)]",
    warning: "border-[var(--color-warning)]/25 bg-[linear-gradient(135deg,var(--color-warning-soft)_0%,var(--color-surface)_130%)]",
    info: "border-[var(--color-info)]/24 bg-[linear-gradient(135deg,var(--color-info-soft)_0%,var(--color-surface)_130%)]",
    danger: "border-[var(--color-danger)]/24 bg-[linear-gradient(135deg,var(--color-danger-soft)_0%,var(--color-surface)_130%)]",
    success: "border-[var(--color-success)]/24 bg-[linear-gradient(135deg,var(--color-success-soft)_0%,var(--color-surface)_130%)]",
  };

  return (
    <article className={`rounded-[18px] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.035)] ${cards[tone] || cards.primary}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[1.55rem] font-extrabold tracking-[-0.045em] text-[var(--color-text)]">
            {value}
          </p>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-[13px] border ${tones[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
    </article>
  );
}

function DashboardPanel({ title, description, action, children, noPadding = false }) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[12px] font-bold text-[var(--color-text)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-[9.5px] leading-4 text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className={noPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

function NextDeliveryCard({ delivery, language, t, onOpen }) {
  const scheduleDate = delivery.plan?.deliveryDate || delivery.effectiveDispatchDate;
  const eta = delivery.plan?.plannedEta;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[var(--color-info)]/18 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-info-soft)_180%)] p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--color-info)]/[0.06] blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
            <span className="text-[9.5px] font-bold text-[var(--color-text-muted)]">{delivery.orderCode}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
            <div>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
                {t("storeManager.deliveryDetailsScheduledDate")}
              </p>
              <p className="mt-1 text-[18px] font-extrabold tracking-[-0.035em] text-[var(--color-text)]">
                {formatDeliveryDate(scheduleDate, language)}
              </p>
            </div>
            <div>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
                {t("storeManager.liveTrackingEta")}
              </p>
              <p className="mt-1 text-[12px] font-bold text-[var(--color-text)]">
                {eta ? formatDeliveryDateTime(eta, language) : t("storeManager.deliveriesEtaPending")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[9.5px] text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-2.5 py-1.5">
              <Route size={11.5} className="text-[var(--color-info)]" />
              {delivery.plan?.tripCode || t("storeManager.deliveriesAwaitingAssignment")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-2.5 py-1.5">
              <Truck size={11.5} className="text-[var(--color-info)]" />
              {delivery.plan?.vehicleCode || t("storeManager.deliveriesNotAssigned")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="nexora-focus inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[10.5px] font-bold text-white shadow-[0_8px_18px_rgba(15,169,104,0.16)] transition hover:bg-[var(--color-primary-hover)]"
        >
          {t("storeManager.dashboardTrackDelivery")}
          <ArrowRight size={13.5} />
        </button>
      </div>
    </div>
  );
}

function OperationalRow({ icon: Icon, label, value, tone = "primary" }) {
  const toneClasses = {
    primary: "border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)]/60 text-[var(--color-primary)]",
    success: "border-[var(--color-success)]/20 bg-[var(--color-success-soft)]/80 text-[var(--color-success)]",
    info: "border-[var(--color-info)]/20 bg-[var(--color-info-soft)]/78 text-[var(--color-info)]",
    warning: "border-[var(--color-warning)]/22 bg-[var(--color-warning-soft)]/82 text-[var(--color-warning)]",
    neutral: "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/45 px-3 py-2.5 transition hover:bg-[var(--color-surface-soft)]/70">
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClasses[tone] || toneClasses.primary}`}>
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[8.5px] font-semibold text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-0.5 truncate text-[10.5px] font-bold text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

function OrderStatusPill({ status, t }) {
  const classes = {
    SUBMITTED: "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    CONFIRMED: "border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]",
    DEFERRED: "border-[var(--color-danger)]/18 bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    CANCELLED: "border-[var(--color-danger)]/18 bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  };

  const labels = {
    SUBMITTED: t("storeManager.ordersStatusSubmitted"),
    CONFIRMED: t("storeManager.ordersStatusConfirmed"),
    DEFERRED: t("storeManager.ordersStatusDeferred"),
    CANCELLED: t("storeManager.ordersStatusCancelled"),
  };

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-[8.5px] font-bold ${classes[status] || "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]"}`}>
      {labels[status] || status}
    </span>
  );
}

function TextAction({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nexora-focus inline-flex shrink-0 items-center gap-1 text-[9.5px] font-bold text-[var(--color-primary)] hover:underline"
    >
      {label}
      <ArrowRight size={11.5} />
    </button>
  );
}

function PanelLoading() {
  return (
    <div className="flex min-h-[120px] items-center justify-center">
      <RefreshCw size={18} className="animate-spin text-[var(--color-primary)]" />
    </div>
  );
}

function PanelEmpty({ icon: Icon, title }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center px-4 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]">
        <Icon size={17} />
      </span>
      <p className="mt-3 text-[10.5px] font-semibold text-[var(--color-text-secondary)]">{title}</p>
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

function FullPageError({ title, message, onRetry, isRefreshing, retryLabel }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5">
      <div className="w-full max-w-md rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-md)]">
        <TriangleAlert size={22} className="mx-auto text-[var(--color-danger)]" />
        <h1 className="mt-4 text-lg font-bold text-[var(--color-text)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRefreshing}
            className="nexora-focus mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatDateTime(value, language) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "si" ? "si-LK" : language === "ta" ? "ta-LK" : "en-LK";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWindow(open, close, fallback) {
  if (!open || !close) return fallback;
  return `${open} – ${close}`;
}

function formatOperationalValue(value) {
  if (!value) return "";
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default StoreManagerDashboardPage;
