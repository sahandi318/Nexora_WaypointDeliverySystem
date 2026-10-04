import {
  ArrowLeft,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Package,
  RefreshCw,
  Route,
  Snowflake,
  Store,
  ThermometerSun,
  TriangleAlert,
  Truck,
  UserRound,
  Warehouse,
  Weight,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import StoreManagerShell from "../../components/storeManager/StoreManagerShell";
import StoreManagerLiveConnectionBadge from "../../components/storeManager/deliveries/StoreManagerLiveConnectionBadge";
import {
  DELIVERY_PROGRESS_STEPS,
  DeliveryField,
  DeliveryStatusBadge,
  formatDeliveryDate,
  formatDeliveryDateTime,
  formatOperationalValue,
  formatVolume,
  formatWeight,
  getDeliveryStatusLabel,
} from "../../components/storeManager/deliveries/StoreManagerDeliveryUI";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerDelivery from "../../hooks/useStoreManagerDelivery";
import useStoreManagerDeliveryTracking from "../../hooks/useStoreManagerDeliveryTracking";
import useTranslations from "../../hooks/useTranslations";

function StoreManagerDeliveryDetailsPage() {
  const navigate = useNavigate();
  const { orderCode } = useParams();

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
    delivery,
    isLoading: isDeliveryLoading,
    isRefreshing,
    errorMessage: deliveryErrorMessage,
    errorCode,
    refreshDelivery,
  } = useStoreManagerDelivery(orderCode);

  const {
    isLoading: isTrackingLoading,
    isRefreshing: isTrackingRefreshing,
    refreshTracking,
    liveStatus,
  } = useStoreManagerDeliveryTracking(
    orderCode,
    {
      onInvalidate: refreshDelivery,
    }
  );

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

  return (
    <StoreManagerShell user={user} outlet={outlet} depot={depot}>
      <div className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="relative border-b border-[var(--color-border)] px-4 py-4 sm:px-5 sm:py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#8DE0B6]/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate("/store-manager/deliveries")}
                className="nexora-focus inline-flex items-center gap-1.5 rounded-lg text-[10.5px] font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
              >
                <ArrowLeft size={13.5} />
                {t("storeManager.deliveryDetailsBack")}
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <h1 className="text-[1.45rem] font-bold tracking-[-0.04em] text-[var(--color-text)] sm:text-[1.65rem]">
                  {delivery?.orderCode || orderCode}
                </h1>

                {delivery ? (
                  <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} />
                ) : null}
              </div>

              <p className="mt-1.5 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                {t("storeManager.deliveryDetailsDescription")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StoreManagerLiveConnectionBadge
                status={liveStatus}
                t={t}
                compact
              />

              {delivery ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/store-manager/orders/${encodeURIComponent(delivery.orderCode)}`)
                  }
                  className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[10.5px] font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                >
                  <FileText size={13.5} />
                  {t("storeManager.deliveryDetailsViewOrder")}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  refreshDelivery();
                  refreshTracking();
                }}
                disabled={
                  isRefreshing ||
                  isDeliveryLoading ||
                  isTrackingRefreshing ||
                  isTrackingLoading
                }
                className="nexora-focus inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 text-[10.5px] font-bold text-white shadow-[0_8px_18px_rgba(15,169,104,0.14)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={13.5}
                  className={
                    isRefreshing || isTrackingRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                {t("common.refresh")}
              </button>
            </div>
          </div>
        </div>

        {isDeliveryLoading ? (
          <InlineState
            icon={RefreshCw}
            iconClass="animate-spin"
            title={t("storeManager.deliveryDetailsLoading")}
            description={t("storeManager.deliveriesLoadingDescription")}
          />
        ) : deliveryErrorMessage || !delivery ? (
          <InlineState
            icon={TriangleAlert}
            title={
              errorCode === "STORE_MANAGER_DELIVERY_NOT_FOUND"
                ? t("storeManager.deliveryDetailsNotFound")
                : t("storeManager.deliveryDetailsLoadFailed")
            }
            description={deliveryErrorMessage || t("storeManager.deliveryDetailsUnavailable")}
            actionLabel={t("storeManager.tryAgain")}
            onAction={refreshDelivery}
          />
        ) : (
          <DeliveryWorkspace delivery={delivery} language={language} t={t} />
        )}
      </div>
    </StoreManagerShell>
  );
}

function DeliveryWorkspace({ delivery, language, t }) {
  const plan = delivery.plan;
  const scheduleDate = plan?.deliveryDate || delivery.effectiveDispatchDate;
  const deliveryWindow = formatWindow(
    delivery.outlet?.windowOpenTime,
    delivery.outlet?.windowCloseTime,
    t("storeManager.notSpecified")
  );

  const latestDecision = delivery.dispatcherDecisions?.[0] || null;

  return (
    <div className="bg-[var(--color-bg)]/45 p-4 sm:p-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon={CalendarDays}
          label={t("storeManager.deliveryDetailsScheduledDate")}
          value={formatDeliveryDate(scheduleDate, language)}
          detail={
            plan?.plannedEta
              ? `${t("storeManager.deliveriesPlannedEta")}: ${formatDeliveryDateTime(plan.plannedEta, language)}`
              : t("storeManager.deliveriesEtaPending")
          }
        />
        <OverviewCard
          icon={Route}
          label={t("storeManager.deliveriesTrip")}
          value={plan?.tripCode || t("storeManager.deliveriesNotAssigned")}
          detail={
            plan?.tripStatus
              ? formatOperationalValue(plan.tripStatus)
              : t("storeManager.deliveriesAwaitingAssignment")
          }
        />
        <OverviewCard
          icon={Package}
          label={t("storeManager.ordersUnits")}
          value={delivery.totalUnits ?? 0}
          detail={`${delivery.items?.length ?? 0} ${t("storeManager.deliveryDetailsProductLines")}`}
        />
        <OverviewCard
          icon={Weight}
          label={t("storeManager.estimatedWeight")}
          value={formatWeight(delivery.estimatedWeightKg)}
          detail={formatVolume(delivery.estimatedVolumeM3)}
        />
      </section>

      {isAttentionStatus(delivery.deliveryStatus) ? (
        <AttentionPanel delivery={delivery} latestDecision={latestDecision} language={language} t={t} />
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="min-w-0 space-y-5">
          <Panel
            title={t("storeManager.deliveryDetailsProgress")}
            description={t("storeManager.deliveryDetailsProgressDescription")}
          >
            <DeliveryProgress status={delivery.deliveryStatus} t={t} />
          </Panel>

          <Panel
            title={t("storeManager.deliveryDetailsItems")}
            description={t("storeManager.deliveryDetailsItemsDescription")}
            noPadding
          >
            <DeliveryItems items={delivery.items || []} t={t} />
          </Panel>

          {delivery.storeManagerNote ? (
            <Panel
              title={t("storeManager.deliveryDetailsNotes")}
              description={t("storeManager.deliveryDetailsNotesDescription")}
            >
              <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/55 px-4 py-3.5">
                <MessageSquareText size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                <p className="text-[11px] leading-5 text-[var(--color-text-secondary)]">
                  {delivery.storeManagerNote}
                </p>
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Panel
            title={t("storeManager.deliveryDetailsSchedule")}
            description={t("storeManager.deliveryDetailsScheduleDescription")}
          >
            <div className="grid gap-2.5">
              <DeliveryField
                icon={CalendarDays}
                label={t("storeManager.deliveryDetailsScheduledDate")}
                value={formatDeliveryDate(scheduleDate, language)}
              />
              <DeliveryField
                icon={Clock3}
                label={t("storeManager.deliveriesPlannedEta")}
                value={formatDeliveryDateTime(plan?.plannedEta, language)}
                hint={plan?.actualArrival ? `${t("storeManager.deliveryDetailsActualArrival")}: ${formatDeliveryDateTime(plan.actualArrival, language)}` : undefined}
              />
              <DeliveryField
                icon={Store}
                label={t("common.deliveryWindow")}
                value={deliveryWindow}
              />
              {delivery.outlet?.mallWindow ? (
                <DeliveryField
                  icon={Clock3}
                  label={t("storeManager.mallWindow")}
                  value={delivery.outlet.mallWindow}
                />
              ) : null}
            </div>
          </Panel>

          <Panel
            title={t("storeManager.deliveryDetailsTransport")}
            description={t("storeManager.deliveryDetailsTransportDescription")}
          >
            <div className="grid gap-2.5">
              <DeliveryField
                icon={Route}
                label={t("storeManager.deliveriesTrip")}
                value={plan?.tripCode || t("storeManager.deliveriesNotAssigned")}
              />
              <DeliveryField
                icon={Truck}
                label={t("storeManager.deliveriesVehicle")}
                value={plan?.vehicleCode || t("storeManager.deliveriesNotAssigned")}
                hint={plan?.vehicleType || undefined}
              />
              <DeliveryField
                icon={UserRound}
                label={t("storeManager.deliveryDetailsDriver")}
                value={plan?.driverName || t("storeManager.deliveriesNotAssigned")}
              />
              <DeliveryField
                icon={Warehouse}
                label={t("common.assignedDepot")}
                value={delivery.outlet?.depot?.name || delivery.outlet?.depot?.code || t("storeManager.notSpecified")}
                hint={delivery.outlet?.depot?.district || undefined}
              />
              {plan?.temperature ? (
                <DeliveryField
                  icon={Snowflake}
                  label={t("storeManager.deliveryDetailsTemperature")}
                  value={plan.temperature}
                />
              ) : null}
            </div>
          </Panel>

          <Panel
            title={t("storeManager.deliveryDetailsOrderContext")}
            description={t("storeManager.deliveryDetailsOrderContextDescription")}
          >
            <div className="grid gap-2.5">
              <DeliveryField
                icon={delivery.orderType === "CHILLED" ? Snowflake : ThermometerSun}
                label={t("storeManager.orderTypeLabel")}
                value={getTypeLabel(t, delivery.orderType)}
              />
              <DeliveryField
                icon={CalendarDays}
                label={t("storeManager.deliveryDetailsRequestedDate")}
                value={formatDeliveryDate(delivery.requestedDispatchDate, language)}
              />
              <DeliveryField
                icon={CalendarDays}
                label={t("storeManager.ordersProcessingDate")}
                value={formatDeliveryDate(delivery.effectiveDispatchDate, language)}
              />
              <DeliveryField
                icon={Clock3}
                label={t("storeManager.ordersCutoff")}
                value={getCutoffLabel(t, delivery.cutoffDecision)}
              />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function AttentionPanel({ delivery, latestDecision, language, t }) {
  const isDanger = delivery.deliveryStatus === "EXCEPTION" || delivery.deliveryStatus === "CANCELLED";

  return (
    <section
      className={`mt-5 rounded-[18px] border px-4 py-4 sm:px-5 ${
        isDanger
          ? "border-[var(--color-border)] bg-[var(--color-danger-soft)]"
          : "border-[var(--color-border)] bg-[var(--color-warning-soft)]"
      }`}
    >
      <div className="flex gap-3">
        <TriangleAlert
          size={18}
          className={`mt-0.5 shrink-0 ${isDanger ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"}`}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-bold text-[var(--color-text)]">
              {getDeliveryStatusLabel(t, delivery.deliveryStatus)}
            </p>
            <DeliveryStatusBadge status={delivery.deliveryStatus} t={t} compact />
          </div>
          <p className="mt-1.5 text-[10.5px] leading-5 text-[var(--color-text-secondary)]">
            {delivery.deferredReason || latestDecision?.reason || t("storeManager.deliveryDetailsAttentionDescription")}
          </p>
          {latestDecision?.effectiveDispatchDate ? (
            <p className="mt-2 text-[10px] font-semibold text-[var(--color-text-secondary)]">
              {t("storeManager.ordersProcessingDate")}: {formatDeliveryDate(latestDecision.effectiveDispatchDate, language)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DeliveryProgress({ status, t }) {
  const currentIndex = getProgressIndex(status);
  const terminalAttention = isAttentionStatus(status);

  if (terminalAttention) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/45 px-4 py-4">
        <div className="flex items-center gap-2">
          <TriangleAlert size={16} className="text-[var(--color-warning)]" />
          <p className="text-[11px] font-bold text-[var(--color-text)]">
            {getDeliveryStatusLabel(t, status)}
          </p>
        </div>
        <p className="mt-1.5 text-[10px] leading-5 text-[var(--color-text-secondary)]">
          {t("storeManager.deliveryDetailsProgressAttention")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-7">
      {DELIVERY_PROGRESS_STEPS.map((step, index) => {
        const complete = index < currentIndex || status === "DELIVERED" || status === "COMPLETED";
        const active = index === currentIndex && status !== "DELIVERED" && status !== "COMPLETED";

        return (
          <div key={step} className="relative">
            {index < DELIVERY_PROGRESS_STEPS.length - 1 ? (
              <div className={`absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 hidden h-px sm:block ${index < currentIndex ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`} />
            ) : null}

            <div className="relative flex items-center gap-2.5 sm:flex-col sm:text-center">
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  complete
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[0_0_0_4px_rgba(15,169,104,0.08)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                }`}
              >
                {complete ? <CheckCircle2 size={14} /> : index + 1}
              </span>
              <p className={`text-[9.5px] font-semibold leading-4 ${active || complete ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                {getDeliveryStatusLabel(t, step)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeliveryItems({ items, t }) {
  if (!items.length) {
    return (
      <div className="px-5 py-8 text-center text-[11px] text-[var(--color-text-secondary)]">
        {t("storeManager.deliveryDetailsNoItems")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="bg-[var(--color-surface-soft)]/65">
          <tr className="border-b border-[var(--color-border)]">
            <ItemHeading>{t("storeManager.deliveryDetailsProduct")}</ItemHeading>
            <ItemHeading>{t("storeManager.deliveryDetailsSku")}</ItemHeading>
            <ItemHeading>{t("storeManager.deliveryDetailsHandling")}</ItemHeading>
            <ItemHeading>{t("storeManager.deliveryDetailsQuantity")}</ItemHeading>
            <ItemHeading>{t("storeManager.deliveryDetailsUnitWeight")}</ItemHeading>
            <ItemHeading>{t("storeManager.deliveryDetailsLineWeight")}</ItemHeading>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const quantity = Number(item.quantity || 0);
            const unitWeight = Number(item.product?.unitWeightKg || 0);
            const lineWeight = quantity * unitWeight;

            return (
              <tr key={item.id} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
                      <Box size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="max-w-[260px] truncate text-[11px] font-semibold text-[var(--color-text)]">
                        {item.product?.name || "—"}
                      </p>
                      <p className="mt-1 text-[9.5px] text-[var(--color-text-muted)]">
                        {item.product?.manufacturerBrand || item.product?.category || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[10.5px] font-medium text-[var(--color-text-secondary)]">{item.product?.sku || "—"}</td>
                <td className="px-5 py-4 text-[10.5px] text-[var(--color-text-secondary)]">{formatOperationalValue(item.product?.handlingType) || "—"}</td>
                <td className="px-5 py-4 text-[11px] font-bold text-[var(--color-text)]">{quantity}</td>
                <td className="px-5 py-4 text-[10.5px] text-[var(--color-text-secondary)]">{formatWeight(unitWeight)}</td>
                <td className="px-5 py-4 text-[10.5px] font-semibold text-[var(--color-text)]">{formatWeight(lineWeight)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, description, children, noPadding = false }) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_22px_rgba(15,23,42,0.025)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3.5 sm:px-5">
        <h2 className="text-[12px] font-bold text-[var(--color-text)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[9.5px] leading-4 text-[var(--color-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className={noPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

function OverviewCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1.5 truncate text-[13px] font-bold text-[var(--color-text)]">{value}</p>
          {detail ? <p className="mt-1 truncate text-[9.5px] text-[var(--color-text-secondary)]">{detail}</p> : null}
        </div>
      </div>
    </article>
  );
}

function ItemHeading({ children }) {
  return (
    <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
      {children}
    </th>
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
    <div className="flex min-h-[430px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]">
        <Icon size={20} className={iconClass} />
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

function getProgressIndex(status) {
  const normalized = status === "COMPLETED" ? "DELIVERED" : status;
  const index = DELIVERY_PROGRESS_STEPS.indexOf(normalized);

  if (index >= 0) return index;
  if (normalized === "PLANNING" || normalized === "AWAITING_DISPATCHER") return 0;
  if (normalized === "DELAYED") return 3;
  return 0;
}

function isAttentionStatus(status) {
  return ["DEFERRED", "PARTIAL", "EXCEPTION", "CANCELLED"].includes(status);
}

function getTypeLabel(t, value) {
  if (value === "CHILLED") return t("storeManager.orderTypeChilled");
  if (value === "AMBIENT_DRY") return t("storeManager.orderTypeAmbient");
  return value || t("storeManager.notSpecified");
}

function getCutoffLabel(t, value) {
  if (value === "AFTER_CUTOFF") return t("storeManager.ordersAfterCutoff");
  if (value === "ON_TIME") return t("storeManager.ordersBeforeCutoff");
  return t("storeManager.notSpecified");
}

function formatWindow(open, close, fallback) {
  if (!open || !close) return fallback;
  return `${open} – ${close}`;
}

export default StoreManagerDeliveryDetailsPage;
