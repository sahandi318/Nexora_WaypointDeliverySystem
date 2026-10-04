import {
  ArrowLeft,
  ClipboardCheck,
  Droplets,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Snowflake,
  Store,
  ThermometerSun,
  Warehouse,
  Weight,
} from "lucide-react";

import {
  HandlingBadge,
  ProductImage,
  SetupField,
  formatDate,
  formatTotalVolume,
  formatUnitVolume,
  formatWeight,
  getOrderTypeLabel,
} from "./CreateOrderShared";

function CreateOrderReviewStep({
  setup,
  orderType,
  selectedItems,
  totals,
  storeManagerNote,
  isSubmitting,
  submitError,
  onStoreManagerNoteChange,
  onBack,
  onSubmit,
  t,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              {t("storeManager.createOrderStepThreeEyebrow")}
            </p>
            <HandlingBadge orderType={orderType} t={t} />
          </div>
          <h2 className="mt-1.5 text-[15.5px] font-extrabold text-[#10251D] dark:text-[var(--color-text)]">
            {t("storeManager.createOrderReviewTitle")}
          </h2>
          <p className="mt-1 text-[10.5px] font-medium text-[#52685F] dark:text-[var(--color-text-secondary)]">
            {t("storeManager.createOrderC2ReviewDescription")}
          </p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {selectedItems.map((item, index) => (
            <ReviewProductRow
              key={item.product.id}
              item={item}
              index={index}
              t={t}
            />
          ))}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="nexora-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[11px] font-bold text-[var(--color-text)] disabled:opacity-60"
          >
            <ArrowLeft size={14} />
            {t("common.previous")}
          </button>
        </div>
      </section>

      <aside className="h-fit overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)] xl:sticky xl:top-[86px]">
        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <h3 className="text-[13.5px] font-bold text-[var(--color-text)]">{t("storeManager.createOrderReviewContext")}</h3>
        </div>

        <div className="space-y-3 p-4">
          <SetupField
            compact
            icon={Store}
            label={t("storeManager.assignedOutlet")}
            value={`${setup?.outlet?.brand || "—"} · ${setup?.outlet?.outletCode || "—"}`}
          />
          <SetupField
            compact
            icon={Warehouse}
            label={t("common.assignedDepot")}
            value={setup?.depot?.name || "—"}
          />
          <SetupField
            compact
            icon={orderType === "CHILLED" ? Snowflake : ThermometerSun}
            label={t("storeManager.orderTypeLabel")}
            value={getOrderTypeLabel(orderType, t)}
          />
          <SetupField
            compact
            icon={PackageCheck}
            label={t("storeManager.createOrderProcessingDate")}
            value={formatDate(setup?.cutoff?.effectiveDispatchDate)}
          />

          <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-soft)]/55 p-2.5 shadow-[0_8px_18px_rgba(15,169,104,0.04)]">
            <div className="grid grid-cols-2 gap-2">
              <ReviewSummaryMetric
                label={t("storeManager.createOrderSelectedItems")}
                value={selectedItems.length}
              />

              <ReviewSummaryMetric
                label={t("storeManager.createOrderTotalUnits")}
                value={totals.totalUnits}
              />
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <ReviewLogisticsTotal
                icon={Weight}
                label={t("storeManager.estimatedWeight")}
                value={formatWeight(totals.estimatedWeightKg)}
              />

              <ReviewLogisticsTotal
                icon={Droplets}
                label={t("storeManager.estimatedVolume")}
                value={formatTotalVolume(totals.estimatedVolumeM3)}
              />
            </div>
          </div>

        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F8F0] text-[#0F6B4F]">
                <MessageSquareText size={14} />
              </div>

              <div>
                <p className="text-[10.5px] font-bold text-[var(--color-text)]">
                  {t("storeManager.orderNoteTitle")}
                </p>
              </div>
            </div>

            <span className="shrink-0 text-[8.5px] font-semibold text-[var(--color-text-muted)]">
              {storeManagerNote.length}/500
            </span>
          </div>

          <textarea
            value={storeManagerNote}
            onChange={(event) => onStoreManagerNoteChange(event.target.value)}
            maxLength={500}
            rows={5}
            disabled={isSubmitting}
            placeholder={t("storeManager.orderNotePlaceholder")}
            className="nexora-focus mt-3 min-h-[132px] w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3.5 py-3 text-[10.5px] leading-5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[#8DE0B6] focus:bg-[var(--color-surface)] disabled:opacity-60"
          />
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-4">
          {submitError && (
            <p className="mb-2.5 text-[9px] font-semibold text-[var(--color-danger)]">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="nexora-focus inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(15,169,104,0.14)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ClipboardCheck size={14} />
            )}

            {isSubmitting
              ? t("storeManager.createOrderSubmitting")
              : t("storeManager.createOrderSubmit")}
          </button>
        </div>
      </aside>
    </div>
  );
}


function ReviewProductRow({
  item,
  index,
  t,
}) {
  const product =
    item.product;

  const lineWeight =
    Number(
      product.unitWeightKg ||
      0
    ) *
    item.quantity;

  const lineVolume =
    Number(
      product.unitVolumeM3 ||
      0
    ) *
    item.quantity;

  return (
    <article className="px-4 py-4 transition hover:bg-[var(--color-surface-soft)]">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px_135px] lg:items-center">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="relative shrink-0">
            <ProductImage
              product={product}
              large
            />

            <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[#0F6B4F] px-1 text-[7px] font-bold text-white">
              {index + 1}
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[12px] font-extrabold leading-5 text-[#10251D] dark:text-[var(--color-text)]">
              {product.name}
            </p>

            <p className="mt-0.5 break-all text-[8.8px] font-semibold text-[#597067] dark:text-[var(--color-text-muted)]">
              {product.manufacturerBrand} · {product.sku}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <HandlingBadge
                orderType={product.handlingType}
                t={t}
                compact
              />

              {product.productType && (
                <ReviewDetailPill>
                  {product.productType}
                </ReviewDetailPill>
              )}

              {product.category && (
                <ReviewDetailPill>
                  {product.category}
                </ReviewDetailPill>
              )}

              {product.unitLabel && (
                <ReviewDetailPill>
                  {product.unitLabel}
                </ReviewDetailPill>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ReviewItemMetric
            label={t("storeManager.catalogUnitWeight")}
            value={formatWeight(product.unitWeightKg)}
          />

          <ReviewItemMetric
            label={t("storeManager.catalogUnitVolume")}
            value={formatUnitVolume(product.unitVolumeM3)}
          />
        </div>

        <div className="rounded-[15px] border border-[var(--color-border)] bg-[var(--color-surface-soft)]/65 px-3 py-2.5">
          <p className="text-[7.5px] font-semibold text-[var(--color-text-muted)]">
            {t("storeManager.createOrderQuantity")}
          </p>

          <p className="mt-0.5 text-[13px] font-extrabold text-[var(--color-primary-strong)]">
            {item.quantity}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-2">
            <div>
              <p className="text-[6.5px] font-semibold text-[var(--color-text-muted)]">
                {t("storeManager.orderDetailsLineWeight")}
              </p>
              <p className="mt-0.5 text-[8.5px] font-bold text-[var(--color-text)]">
                {formatWeight(lineWeight)}
              </p>
            </div>

            <div>
              <p className="text-[6.5px] font-semibold text-[var(--color-text-muted)]">
                {t("storeManager.orderDetailsLineVolume")}
              </p>
              <p className="mt-0.5 text-[8.5px] font-bold text-[var(--color-text)]">
                {formatTotalVolume(lineVolume)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReviewItemMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-soft)]/60 px-3 py-2.5">
      <p className="text-[7.5px] font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-[10.5px] font-extrabold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function ReviewDetailPill({
  children,
}) {
  return (
    <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-1.5 py-0.5 text-[7px] font-semibold text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function ReviewSummaryMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[0_4px_12px_rgba(15,169,104,0.03)]">
      <p className="text-[8.5px] font-bold text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-1 text-[16px] font-extrabold tracking-[-0.025em] text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

function ReviewLogisticsTotal({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[0_4px_12px_rgba(15,169,104,0.03)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)]/55 text-[var(--color-primary-strong)]">
        <Icon size={15} strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[8.5px] font-bold text-[var(--color-text-muted)]">
          {label}
        </p>

        <p className="mt-0.5 text-[14px] font-extrabold tracking-[-0.02em] text-[var(--color-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

export default CreateOrderReviewStep;
