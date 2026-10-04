import {
  ArrowLeft,
  Box,
  CalendarDays,
  Clock3,
  Droplets,
  ImageOff,
  MessageSquareText,
  Package,
  RefreshCw,
  Snowflake,
  Store,
  ThermometerSun,
  TriangleAlert,
  Warehouse,
  Weight,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import StoreManagerShell from "../../components/storeManager/StoreManagerShell";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerOrder from "../../hooks/useStoreManagerOrder";
import useTranslations from "../../hooks/useTranslations";

function StoreManagerOrderDetailsPage() {
  const navigate =
    useNavigate();

  const {
    orderCode,
  } = useParams();

  const {
    t,
  } = useTranslations();

  const {
    user,
    outlet,
    depot,
    isLoading:
      isContextLoading,
    errorMessage:
      contextErrorMessage,
  } = useStoreManagerContext();

  const {
    order,
    isLoading:
      isOrderLoading,
    isRefreshing,
    errorMessage:
      orderErrorMessage,
    errorCode,
    refreshOrder,
  } = useStoreManagerOrder(
    orderCode
  );

  if (
    isContextLoading
  ) {
    return (
      <FullPageLoading
        message={t(
          "storeManager.loadingWorkspace"
        )}
      />
    );
  }

  if (
    contextErrorMessage ||
    !user ||
    !outlet
  ) {
    return (
      <FullPageError
        title={t(
          "storeManager.unableToLoadWorkspace"
        )}
        message={
          contextErrorMessage ||
          t(
            "storeManager.workspaceUnavailable"
          )
        }
      />
    );
  }

  return (
    <StoreManagerShell
      user={user}
      outlet={outlet}
      depot={depot}
    >
      {isOrderLoading ? (
        <OrderLoadingState
          t={t}
        />
      ) : orderErrorMessage ? (
        <OrderErrorState
          code={
            errorCode
          }
          message={
            orderErrorMessage
          }
          onRetry={
            refreshOrder
          }
          isRefreshing={
            isRefreshing
          }
          onBack={() =>
            navigate(
              "/store-manager/orders"
            )
          }
          t={t}
        />
      ) : order ? (
        <OrderDetailsContent
          order={order}
          outlet={outlet}
          depot={depot}
          onBack={() =>
            navigate(
              "/store-manager/orders"
            )
          }
          onRefresh={
            refreshOrder
          }
          isRefreshing={
            isRefreshing
          }
          t={t}
        />
      ) : null}
    </StoreManagerShell>
  );
}

function OrderDetailsContent({
  order,
  outlet,
  depot,
  onBack,
  onRefresh,
  isRefreshing,
  t,
}) {
  const isDeferred =
    order.status ===
      "DEFERRED" ||
    order.cutoffDecision ===
      "AFTER_CUTOFF";

  return (
    <section
      className="
        mt-5
        overflow-hidden
        rounded-[22px]
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        shadow-[0_12px_32px_rgba(15,23,42,0.04)]
      "
    >
      <div
        className="
          relative
          overflow-hidden
          border-b
          border-[var(--color-border)]
          px-5
          py-5
          sm:px-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-[#8DE0B6]/10
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                text-[8.5px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-[var(--color-primary)]
              "
            >
              {t(
                "storeManager.orderDetailsOrder"
              )}
            </p>

            <div
              className="
                mt-1.5
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <h1
                className="
                  break-all
                  text-[21px]
                  font-extrabold
                  tracking-[-0.03em]
                  text-[var(--color-text)]
                  sm:text-[23px]
                "
              >
                {order.orderCode}
              </h1>

              <StatusBadge
                status={
                  order.status
                }
                t={t}
              />

              <HandlingBadge
                orderType={
                  order.orderType
                }
                t={t}
              />
            </div>

            <p
              className="
                mt-2
                text-[10.5px]
                text-[var(--color-text-secondary)]
              "
            >
              {t(
                "storeManager.orderDetailsSubmitted"
              )}{" "}
              {formatDateTime(
                order.submittedAt
              )}
            </p>
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={
                onBack
              }
              className="
                nexora-focus
                inline-flex
                min-h-9
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                px-3.5
                text-[10.5px]
                font-semibold
                text-[var(--color-text-secondary)]
                shadow-sm
                transition
                hover:bg-[var(--color-surface-soft)]
                hover:text-[var(--color-text)]
              "
            >
              <ArrowLeft
                size={14}
              />

              {t(
                "storeManager.orderDetailsBack"
              )}
            </button>

            <button
              type="button"
              onClick={
                onRefresh
              }
              disabled={
                isRefreshing
              }
              aria-label={t(
                "common.refresh"
              )}
              title={t(
                "common.refresh"
              )}
              className="
                nexora-focus
                inline-flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                text-[var(--color-text-secondary)]
                transition
                hover:bg-[var(--color-surface-soft)]
                hover:text-[var(--color-text)]
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={14}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        <div
          className="
            relative
            mt-5
            grid
            gap-3
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <SummaryCard
            icon={Box}
            tone="primary"
            label={t(
              "storeManager.orderDetailsProductLines"
            )}
            value={
              order.itemCount ??
              order.items?.length ??
              0
            }
          />

          <SummaryCard
            icon={Package}
            tone="success"
            label={t(
              "storeManager.orderDetailsUnits"
            )}
            value={
              order.totalUnits ??
              0
            }
          />

          <SummaryCard
            icon={Weight}
            tone="warning"
            label={t(
              "storeManager.estimatedWeight"
            )}
            value={formatWeight(
              order.estimatedWeightKg
            )}
          />

          <SummaryCard
            icon={Droplets}
            tone="info"
            label={t(
              "storeManager.estimatedVolume"
            )}
            value={formatTotalVolume(
              order.estimatedVolumeM3
            )}
          />
        </div>
      </div>

      <div
        className="
          grid
          gap-5
          bg-[var(--color-bg)]/45
          p-4
          sm:p-5
          xl:grid-cols-[minmax(0,1fr)_330px]
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[18px]
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
            "
          >
            <div
              className="
                flex
                flex-col
                gap-2
                border-b
                border-[var(--color-border)]
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <h2
                  className="
                    text-[14px]
                    font-bold
                    text-[var(--color-text)]
                  "
                >
                  {t(
                    "storeManager.orderDetailsItemsTitle"
                  )}
                </h2>

                <p
                  className="
                    mt-1
                    text-[9.5px]
                    text-[var(--color-text-secondary)]
                  "
                >
                  {t(
                    "storeManager.orderDetailsProductCount"
                  )
                    .replace(
                      "{items}",
                      String(
                        order.itemCount ??
                        order.items?.length ??
                        0
                      )
                    )
                    .replace(
                      "{units}",
                      String(
                        order.totalUnits ??
                        0
                      )
                    )}
                </p>
              </div>

              <HandlingBadge
                orderType={
                  order.orderType
                }
                t={t}
              />
            </div>

            <div
              className="
                divide-y
                divide-[var(--color-border)]
              "
            >
              {order.items.map(
                (
                  item,
                  index
                ) => (
                  <OrderItemRow
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    index={
                      index
                    }
                    t={t}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <aside
          className="
            h-fit
            space-y-4
            xl:sticky
            xl:top-[86px]
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[18px]
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
            "
          >
            <div
              className="
                border-b
                border-[var(--color-border)]
                px-4
                py-3.5
              "
            >
              <h3
                className="
                  text-[13px]
                  font-bold
                  text-[var(--color-text)]
                "
              >
                {t(
                  "storeManager.orderDetailsOverviewTitle"
                )}
              </h3>
            </div>

            <div
              className="
                space-y-2.5
                p-3.5
              "
            >
              <InfoRow
                icon={Store}
                label={t(
                  "storeManager.assignedOutlet"
                )}
                value={`${outlet.brand || "—"}${
                  outlet.outletCode
                    ? ` · ${outlet.outletCode}`
                    : ""
                }`}
              />

              <InfoRow
                icon={Warehouse}
                label={t(
                  "common.assignedDepot"
                )}
                value={
                  depot?.name ||
                  t(
                    "storeManager.notAssigned"
                  )
                }
              />

              <InfoRow
                icon={
                  order.orderType ===
                    "CHILLED"
                    ? Snowflake
                    : ThermometerSun
                }
                label={t(
                  "storeManager.orderTypeLabel"
                )}
                value={getOrderTypeLabel(
                  order.orderType,
                  t
                )}
              />

              <InfoRow
                icon={Clock3}
                label={t(
                  "storeManager.orderDetailsCutoffDecision"
                )}
                value={getCutoffLabel(
                  order.cutoffDecision,
                  t
                )}
              />
            </div>
          </div>

          <div
            className="
              overflow-hidden
              rounded-[18px]
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
            "
          >
            <div
              className="
                border-b
                border-[var(--color-border)]
                px-4
                py-3.5
              "
            >
              <h3
                className="
                  text-[13px]
                  font-bold
                  text-[var(--color-text)]
                "
              >
                {t(
                  "storeManager.orderDetailsScheduleTitle"
                )}
              </h3>
            </div>

            <div
              className="
                space-y-2.5
                p-3.5
              "
            >
              <InfoRow
                icon={CalendarDays}
                label={t(
                  "storeManager.orderDetailsRequestedDate"
                )}
                value={formatDate(
                  order.requestedDispatchDate
                )}
              />

              <InfoRow
                icon={CalendarDays}
                label={t(
                  "storeManager.orderDetailsEffectiveDate"
                )}
                value={formatDate(
                  order.effectiveDispatchDate
                )}
                highlighted={
                  isDeferred
                }
              />
            </div>
          </div>

          {order.storeManagerNote && (
            <div
              className="
                overflow-hidden
                rounded-[18px]
                border
                border-[#C9F0DA]
                bg-[var(--color-surface)]
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  border-b
                  border-[#C9F0DA]
                  px-4
                  py-3.5
                "
              >
                <MessageSquareText
                  size={14}
                  className="
                    text-[#0F6B4F]
                  "
                />

                <h3
                  className="
                    text-[13px]
                    font-bold
                    text-[var(--color-text)]
                  "
                >
                  {t(
                    "storeManager.orderNoteTitle"
                  )}
                </h3>
              </div>

              <p
                className="
                  whitespace-pre-wrap
                  break-words
                  px-4
                  py-3.5
                  text-[10.5px]
                  leading-5
                  text-[var(--color-text-secondary)]
                "
              >
                {order.storeManagerNote}
              </p>
            </div>
          )}

          {order.deferredReason && (
            <div
              className="
                rounded-[18px]
                border
                border-amber-500/20
                bg-amber-500/[0.055]
                px-4
                py-3.5
              "
            >
              <p
                className="
                  text-[8.5px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-amber-700
                "
              >
                {t(
                  "storeManager.orderDetailsDeferredReason"
                )}
              </p>

              <p
                className="
                  mt-1.5
                  text-[10px]
                  leading-4
                  text-[var(--color-text-secondary)]
                "
              >
                {order.deferredReason}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function OrderItemRow({
  item,
  index,
  t,
}) {
  const product =
    item.product ||
    {};

  const lineWeight =
    Number(
      product.unitWeightKg ||
      0
    ) *
    Number(
      item.quantity ||
      0
    );

  const lineVolume =
    Number(
      product.unitVolumeM3 ||
      0
    ) *
    Number(
      item.quantity ||
      0
    );

  return (
    <article
      className="
        px-4
        py-4
        transition
        hover:bg-[var(--color-surface-soft)]
      "
    >
      <div
        className="
          grid
          gap-4
          lg:grid-cols-[minmax(0,1fr)_185px_120px]
          lg:items-center
        "
      >
        <div
          className="
            flex
            min-w-0
            items-start
            gap-3
          "
        >
          <div
            className="
              relative
              shrink-0
            "
          >
            <ProductImage
              product={
                product
              }
            />

            <span
              className="
                absolute
                -left-1.5
                -top-1.5
                flex
                h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                border-2
                border-[var(--color-surface)]
                bg-[#0F6B4F]
                px-1
                text-[7px]
                font-bold
                text-white
              "
            >
              {index +
                1}
            </span>
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                text-[11.5px]
                font-extrabold
                leading-5
                text-[var(--color-text)]
              "
            >
              {product.name ||
                "—"}
            </p>

            <p
              className="
                mt-0.5
                break-all
                text-[8.5px]
                font-semibold
                text-[var(--color-text-muted)]
              "
            >
              {product.manufacturerBrand ||
                "—"}
              {" · "}
              {product.sku ||
                "—"}
            </p>

            <div
              className="
                mt-2
                flex
                flex-wrap
                gap-1.5
              "
            >
              <HandlingBadge
                orderType={
                  product.handlingType ||
                  "AMBIENT_DRY"
                }
                t={t}
                compact
              />

              {product.productType && (
                <DetailPill>
                  {product.productType}
                </DetailPill>
              )}

              {product.category && (
                <DetailPill>
                  {product.category}
                </DetailPill>
              )}

              {product.unitLabel && (
                <DetailPill>
                  {product.unitLabel}
                </DetailPill>
              )}
            </div>
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-2
            gap-2
          "
        >
          <ItemMetric
            label={t(
              "storeManager.catalogUnitWeight"
            )}
            value={formatWeight(
              product.unitWeightKg
            )}
          />

          <ItemMetric
            label={t(
              "storeManager.catalogUnitVolume"
            )}
            value={formatUnitVolume(
              product.unitVolumeM3
            )}
          />
        </div>

        <div
          className="
            grid
            grid-cols-3
            gap-2
            lg:grid-cols-1
          "
        >
          <ItemMetric
            strong
            label={t(
              "storeManager.orderDetailsQuantity"
            )}
            value={
              item.quantity
            }
          />

          <div
            className="
              col-span-2
              grid
              grid-cols-2
              gap-2
              lg:col-span-1
            "
          >
            <MiniTotal
              label={t(
                "storeManager.orderDetailsLineWeight"
              )}
              value={formatWeight(
                lineWeight
              )}
            />

            <MiniTotal
              label={t(
                "storeManager.orderDetailsLineVolume"
              )}
              value={formatTotalVolume(
                lineVolume
              )}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductImage({
  product,
}) {
  const source =
    getProductImageSource(
      product
    );

  if (!source) {
    return (
      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[14px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface-soft)]
          text-[var(--color-text-muted)]
        "
      >
        <ImageOff
          size={18}
        />
      </div>
    );
  }

  return (
    <div
      className="
        h-16
        w-16
        overflow-hidden
        rounded-[14px]
        border
        border-[var(--color-border)]
        bg-white
        shadow-[0_6px_16px_rgba(15,23,42,0.04)]
      "
    >
      <img
        src={
          source
        }
        alt={
          product.name ||
          ""
        }
        loading="lazy"
        className="
          h-full
          w-full
          object-contain
          p-1
        "
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}) {
  const tones = {
    primary: "border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)]/45 text-[var(--color-primary-strong)]",
    success: "border-[var(--color-success)]/18 bg-[var(--color-success-soft)]/55 text-[var(--color-success)]",
    warning: "border-[var(--color-warning)]/18 bg-[var(--color-warning-soft)]/55 text-[var(--color-warning)]",
    info: "border-[var(--color-info)]/18 bg-[var(--color-info-soft)]/55 text-[var(--color-info)]",
  };

  return (
    <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-[0_7px_18px_rgba(15,23,42,0.025)]">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone] || tones.primary}`}>
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-semibold text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-0.5 truncate text-[13px] font-extrabold text-[var(--color-text)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlighted = false,
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        px-3.5
        py-3
        ${
          highlighted
            ? "border-amber-500/20 bg-amber-500/[0.055]"
            : "border-[var(--color-border)] bg-[var(--color-surface-soft)]"
        }
      `}
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${
              highlighted
                ? "bg-amber-500/10 text-amber-700"
                : "bg-[#E9F8F0] text-[#0F6B4F]"
            }
          `}
        >
          <Icon
            size={13}
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-[8px]
              font-semibold
              text-[var(--color-text-muted)]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-0.5
              break-words
              text-[10.5px]
              font-bold
              text-[var(--color-text)]
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ItemMetric({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        px-2.5
        py-2
        ${
          strong
            ? "border-[#C9F0DA] bg-[#16A572]/[0.05]"
            : "border-[var(--color-border)] bg-[var(--color-surface-soft)]"
        }
      `}
    >
      <p
        className="
          text-[7px]
          font-semibold
          text-[var(--color-text-muted)]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-0.5
          font-bold
          ${
            strong
              ? "text-[12px] text-[#0F6B4F]"
              : "text-[9.5px] text-[var(--color-text)]"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

function MiniTotal({
  label,
  value,
}) {
  return (
    <div
      className="
        min-w-0
      "
    >
      <p
        className="
          truncate
          text-[6.5px]
          font-semibold
          text-[var(--color-text-muted)]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5
          truncate
          text-[8.5px]
          font-bold
          text-[var(--color-text-secondary)]
        "
      >
        {value}
      </p>
    </div>
  );
}

function DetailPill({
  children,
}) {
  return (
    <span
      className="
        rounded-md
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        px-1.5
        py-0.5
        text-[7px]
        font-semibold
        text-[var(--color-text-secondary)]
      "
    >
      {children}
    </span>
  );
}

function StatusBadge({
  status,
  t,
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-[8px]
        font-bold
        uppercase
        tracking-[0.08em]
        ${getStatusStyle(
          status
        )}
      `}
    >
      {getStatusLabel(
        status,
        t
      )}
    </span>
  );
}

function HandlingBadge({
  orderType,
  t,
  compact = false,
}) {
  const chilled =
    orderType ===
    "CHILLED";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        rounded-full
        border
        font-bold
        ${
          compact
            ? "px-1.5 py-0.5 text-[7px]"
            : "px-2.5 py-1 text-[8px]"
        }
        ${
          chilled
            ? "border-sky-500/20 bg-sky-500/[0.08] text-sky-600"
            : "border-[#16A572]/20 bg-[#16A572]/[0.08] text-[#0F6B4F]"
        }
      `}
    >
      {chilled ? (
        <Snowflake
          size={
            compact
              ? 8
              : 9
          }
        />
      ) : (
        <ThermometerSun
          size={
            compact
              ? 8
              : 9
          }
        />
      )}

      {getOrderTypeLabel(
        orderType,
        t
      )}
    </span>
  );
}

function OrderLoadingState({
  t,
}) {
  return (
    <section
      className="
        mt-5
        flex
        min-h-[420px]
        items-center
        justify-center
        rounded-[22px]
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        px-5
      "
    >
      <div
        className="
          text-center
        "
      >
        <div
          className="
            mx-auto
            h-9
            w-9
            animate-spin
            rounded-full
            border-[3px]
            border-[var(--color-primary-soft)]
            border-t-[var(--color-primary)]
          "
        />

        <p
          className="
            mt-4
            text-[11px]
            font-semibold
            text-[var(--color-text-secondary)]
          "
        >
          {t(
            "storeManager.orderDetailsLoading"
          )}
        </p>
      </div>
    </section>
  );
}

function OrderErrorState({
  code,
  message,
  onRetry,
  isRefreshing,
  onBack,
  t,
}) {
  const notFound =
    code ===
    "STORE_ORDER_NOT_FOUND";

  return (
    <section
      className="
        mt-5
        flex
        min-h-[420px]
        items-center
        justify-center
        rounded-[22px]
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        px-5
        py-10
      "
    >
      <div
        className="
          max-w-md
          text-center
        "
      >
        <TriangleAlert
          size={20}
          className="
            mx-auto
            text-[var(--color-danger)]
          "
        />

        <h2
          className="
            mt-4
            text-[14px]
            font-bold
            text-[var(--color-text)]
          "
        >
          {notFound
            ? t(
                "storeManager.orderDetailsNotFoundTitle"
              )
            : t(
                "storeManager.orderDetailsLoadFailed"
              )}
        </h2>

        <p
          className="
            mt-2
            text-[10.5px]
            leading-5
            text-[var(--color-text-secondary)]
          "
        >
          {notFound
            ? t(
                "storeManager.orderDetailsNotFoundDescription"
              )
            : message}
        </p>

        <div
          className="
            mt-5
            flex
            flex-wrap
            justify-center
            gap-2
          "
        >
          {!notFound && (
            <button
              type="button"
              onClick={
                onRetry
              }
              disabled={
                isRefreshing
              }
              className="
                nexora-focus
                rounded-xl
                bg-[var(--color-primary)]
                px-3.5
                py-2
                text-[10px]
                font-bold
                text-white
              "
            >
              {t(
                "storeManager.tryAgain"
              )}
            </button>
          )}

          <button
            type="button"
            onClick={
              onBack
            }
            className="
              nexora-focus
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              px-3.5
              py-2
              text-[10px]
              font-bold
              text-[var(--color-text)]
            "
          >
            {t(
              "storeManager.orderDetailsBack"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function FullPageLoading({
  message,
}) {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        px-5
      "
    >
      <div
        className="
          text-center
        "
      >
        <div
          className="
            mx-auto
            h-9
            w-9
            animate-spin
            rounded-full
            border-[3px]
            border-[var(--color-primary-soft)]
            border-t-[var(--color-primary)]
          "
        />

        <p
          className="
            mt-4
            text-sm
            font-semibold
            text-[var(--color-text-secondary)]
          "
        >
          {message}
        </p>
      </div>
    </div>
  );
}

function FullPageError({
  title,
  message,
}) {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        px-5
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-6
          text-center
        "
      >
        <TriangleAlert
          size={22}
          className="
            mx-auto
            text-[var(--color-danger)]
          "
        />

        <h1
          className="
            mt-4
            text-lg
            font-bold
            text-[var(--color-text)]
          "
        >
          {title}
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          {message}
        </p>
      </div>
    </div>
  );
}

function getProductImageSource(
  product
) {
  if (
    !product?.imageBase64 ||
    !product?.imageMimeType
  ) {
    return "";
  }

  return `data:${product.imageMimeType};base64,${product.imageBase64}`;
}

function getOrderTypeLabel(
  orderType,
  t
) {
  return orderType ===
    "CHILLED"
    ? t(
        "storeManager.orderTypeChilled"
      )
    : t(
        "storeManager.orderTypeAmbient"
      );
}

function getStatusLabel(
  status,
  t
) {
  const keys = {
    SUBMITTED:
      "storeManager.ordersStatusSubmitted",

    DEFERRED:
      "storeManager.ordersStatusDeferred",

    CONFIRMED:
      "storeManager.ordersStatusConfirmed",

    CANCELLED:
      "storeManager.ordersStatusCancelled",
  };

  return t(
    keys[status] ||
      "storeManager.ordersStatusUnknown"
  );
}

function getStatusStyle(
  status
) {
  switch (
    status
  ) {
    case "CONFIRMED":
      return "border-[var(--color-success)]/25 bg-[var(--color-success-soft)]/85 text-[var(--color-success)]";

    case "DEFERRED":
      return "border-[var(--color-danger)]/22 bg-[var(--color-danger-soft)]/78 text-[var(--color-danger)]";

    case "CANCELLED":
      return "border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)]/90 text-[var(--color-danger)]";

    default:
      return "border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)]/85 text-[var(--color-warning)]";
  }
}

function getCutoffLabel(
  decision,
  t
) {
  return decision ===
    "AFTER_CUTOFF"
    ? t(
        "storeManager.ordersAfterCutoff"
      )
    : t(
        "storeManager.ordersBeforeCutoff"
      );
}

function formatWeight(
  value
) {
  const amount =
    Number(
      value ||
      0
    );

  if (
    amount <
    1
  ) {
    return `${Math.round(
      amount *
        1000
    )} g`;
  }

  return `${amount.toFixed(
    amount >=
      10
      ? 1
      : 2
  )} kg`;
}

function formatUnitVolume(
  value
) {
  const cubicMetres =
    Number(
      value ||
      0
    );

  const litres =
    cubicMetres *
    1000;

  if (
    litres <
    1
  ) {
    return `${Math.round(
      litres *
        1000
    )} mL`;
  }

  return `${litres.toFixed(
    litres >=
      10
      ? 1
      : 2
  )} L`;
}

function formatTotalVolume(
  value
) {
  const cubicMetres =
    Number(
      value ||
      0
    );

  const litres =
    cubicMetres *
    1000;

  if (
    cubicMetres <
    0.1
  ) {
    return `${litres.toFixed(
      litres >=
        10
        ? 1
        : 2
    )} L`;
  }

  return `${cubicMetres.toFixed(
    3
  )} m³`;
}

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const [
    year,
    month,
    day,
  ] =
    String(
      value
    ).split("-");

  if (
    year &&
    month &&
    day
  ) {
    return `${day}/${month}/${year}`;
  }

  return String(
    value
  );
}

function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return date.toLocaleString(
    [],
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

export default StoreManagerOrderDetailsPage;
