import {
  ArrowRight,
  Building2,
  Clock3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Store,
  ThermometerSun,
  Warehouse,
} from "lucide-react";

import {
  OrderTypeCard,
  SetupField,
  formatDate,
  formatRemainingTime,
} from "./CreateOrderShared";

function CreateOrderSetupStep({
  setup,
  orderType,
  availableOrderTypes,
  remainingSeconds,
  isLoading,
  isRefreshing,
  errorMessage,
  submitError,
  onSelectOrderType,
  onRefresh,
  onContinue,
  t,
}) {
  if (isLoading) {
    return <PanelLoading message={t("storeManager.createOrderLoadingSetup")} />;
  }

  if (errorMessage || !setup) {
    return (
      <PanelError
        title={t("storeManager.createOrderSetupFailed")}
        message={errorMessage}
        onRetry={onRefresh}
        isRefreshing={isRefreshing}
        t={t}
      />
    );
  }

  return (
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3.5 sm:px-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            {t("storeManager.createOrderStepOneEyebrow")}
          </p>
          <h2 className="mt-1 text-[16px] font-bold text-[var(--color-text)]">
            {t("storeManager.createOrderSetupTitle")}
          </h2>
          <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-secondary)]">
            {t("storeManager.createOrderC2SetupDescription")}
          </p>
        </div>

        <div className="p-3.5">
          <div className="grid gap-3 md:grid-cols-3">
            <SetupField
              compact
              icon={Store}
              label={t("storeManager.assignedOutlet")}
              value={`${setup.outlet?.brand || "—"} · ${setup.outlet?.outletCode || "—"}`}
            />

            <SetupField
              compact
              icon={Warehouse}
              label={t("common.assignedDepot")}
              value={setup.depot?.name || t("storeManager.notAssigned")}
            />

            <SetupField
              compact
              icon={PackageCheck}
              label={t("storeManager.createOrderProcessingDate")}
              value={formatDate(setup.cutoff?.effectiveDispatchDate)}
            />
          </div>

          <div className="mt-2.5">
            <div className={`grid gap-2.5 ${setup.outlet?.mallWindow ? "md:grid-cols-2" : "grid-cols-1"}`}>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E9F8F0] text-[#0F6B4F]">
                    <Clock3 size={13} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold text-[var(--color-text-muted)]">
                      {t("common.deliveryWindow")}
                    </p>

                    <p className="mt-0.5 text-[12px] font-bold text-[var(--color-text)]">
                      {setup.outlet?.deliveryWindow
                        ? `${setup.outlet.deliveryWindow.open} – ${setup.outlet.deliveryWindow.close}`
                        : t("storeManager.notSpecified")}
                    </p>
                  </div>
                </div>
              </div>

              {setup.outlet?.mallWindow && (
                <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.045] px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
                      <Building2 size={14} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[8.5px] font-semibold text-[var(--color-text-muted)]">
                        {t("storeManager.mallWindow")}
                      </p>

                      <p className="mt-0.5 text-[10.5px] font-bold text-amber-700">
                        {setup.outlet.mallWindow}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3.5">
          <p className="text-[11px] font-bold text-[var(--color-text)]">
            {t("storeManager.createOrderTypeTitle")}
          </p>
          <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
            {t("storeManager.createOrderTypeDescription")}
          </p>

          <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
            <OrderTypeCard
              icon={ThermometerSun}
              selected={orderType === "AMBIENT_DRY"}
              enabled={availableOrderTypes.includes("AMBIENT_DRY")}
              title={t("storeManager.orderTypeAmbient")}
              description={t("storeManager.orderTypeAmbientDescription")}
              unavailableText={t("storeManager.orderTypeUnavailable")}
              onClick={() => onSelectOrderType("AMBIENT_DRY")}
            />
            <OrderTypeCard
              icon={Snowflake}
              selected={orderType === "CHILLED"}
              enabled={availableOrderTypes.includes("CHILLED")}
              title={t("storeManager.orderTypeChilled")}
              description={t("storeManager.orderTypeChilledDescription")}
              unavailableText={t("storeManager.orderTypeUnavailable")}
              onClick={() => onSelectOrderType("CHILLED")}
            />
          </div>

          {submitError && (
            <p className="mt-3 text-[9.5px] font-semibold text-[var(--color-danger)]">
              {submitError}
            </p>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3">
<button
            type="button"
            onClick={onContinue}
            className="nexora-focus ml-auto inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(15,169,104,0.12)] transition hover:bg-[var(--color-primary-hover)]"
          >
            {t("storeManager.createOrderBrowseItems")}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <CutoffCard
        setup={setup}
        remainingSeconds={remainingSeconds}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        t={t}
      />
    </div>
  );
}

function CutoffCard({ setup, remainingSeconds, isRefreshing, onRefresh, t }) {
  const cutoffPassed = Boolean(setup.cutoff?.cutoffPassed);
  const urgent = !cutoffPassed && remainingSeconds <= 30 * 60;

  return (
    <aside className={`relative h-fit self-start overflow-hidden rounded-[18px] border p-4 shadow-[0_10px_26px_rgba(15,23,42,0.035)] ${cutoffPassed || urgent ? "border-amber-500/20 bg-amber-500/[0.055]" : "border-[#C9F0DA] bg-[var(--color-surface)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${cutoffPassed || urgent ? "text-amber-600" : "text-[var(--color-primary)]"}`}>
            {t("storeManager.createOrderCutoffTitle")}
          </p>
          <p className="mt-1.5 text-[28px] font-extrabold tracking-[-0.045em] text-[var(--color-text)]">
            {setup.cutoff?.cutoffTime || "16:00"}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t("common.refresh")}
          className="nexora-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-60"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className={`mt-3 rounded-xl border px-3.5 py-2.5 ${cutoffPassed || urgent ? "border-amber-500/15 bg-amber-500/[0.07]" : "border-[#C9F0DA] bg-[#16A572]/[0.045]"}`}>
        <p className={`text-[15.5px] font-extrabold tracking-[-0.02em] ${cutoffPassed || urgent ? "text-amber-700" : "text-[#0F6B4F]"}`}>
          {cutoffPassed
            ? t("storeManager.createOrderCutoffPassed")
            : t("storeManager.createOrderRemaining").replace("{time}", formatRemainingTime(remainingSeconds))}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-secondary)]">
          {cutoffPassed
            ? t("storeManager.createOrderFollowingRunMessage")
            : t("storeManager.createOrderNextRunMessage")}
        </p>
      </div>

      <div className="mt-3 flex items-start gap-2.5">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#0F6B4F]" />
        <p className="text-[9.5px] leading-4 text-[var(--color-text-secondary)]">
          {t("storeManager.createOrderServerVerified")}
        </p>
      </div>
    </aside>
  );
}

function PanelLoading({ message }) {
  return (
    <section className="mt-5 flex min-h-[320px] items-center justify-center rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
        <p className="mt-4 text-[11px] font-semibold text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </section>
  );
}

function PanelError({ title, message, onRetry, isRefreshing, t }) {
  return (
    <section className="mt-5 flex min-h-[320px] items-center justify-center rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10">
      <div className="max-w-md text-center">
        <p className="text-[12px] font-bold text-[var(--color-text)]">{title}</p>
        <p className="mt-2 text-[9.5px] leading-4 text-[var(--color-text-secondary)]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRefreshing}
          className="nexora-focus mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-3.5 text-[11px] font-bold text-white disabled:opacity-60"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {t("storeManager.tryAgain")}
        </button>
      </div>
    </section>
  );
}

export default CreateOrderSetupStep;
