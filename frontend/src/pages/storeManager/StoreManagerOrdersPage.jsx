import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  FileText,
  PackagePlus,
  RefreshCw,
  Search,
  Snowflake,
  ThermometerSun,
  TriangleAlert,
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
} from "../../components/storeManager/deliveries/StoreManagerDeliveryUI";

import useStoreManagerContext from "../../hooks/useStoreManagerContext";
import useStoreManagerOrders from "../../hooks/useStoreManagerOrders";
import useTranslations from "../../hooks/useTranslations";

const STATUS_FILTERS = [
  "ALL",
  "SUBMITTED",
  "DEFERRED",
  "CONFIRMED",
  "CANCELLED",
];

const TYPE_FILTERS = [
  "ALL",
  "AMBIENT_DRY",
  "CHILLED",
];

function StoreManagerOrdersPage() {
  const navigate =
    useNavigate();

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
    orders,
    isLoading:
      isOrdersLoading,
    isRefreshing,
    errorMessage:
      ordersErrorMessage,
    refreshOrders,
  } = useStoreManagerOrders();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "ALL"
  );

  const [
    typeFilter,
    setTypeFilter,
  ] = useState(
    "ALL"
  );

  const summary =
    useMemo(
      () => ({
        total:
          orders.length,

        submitted:
          orders.filter(
            (order) =>
              order.status ===
              "SUBMITTED"
          ).length,

        deferred:
          orders.filter(
            (order) =>
              order.status ===
              "DEFERRED"
          ).length,

        confirmed:
          orders.filter(
            (order) =>
              order.status ===
              "CONFIRMED"
          ).length,
      }),
      [
        orders,
      ]
    );

  const filteredOrders =
    useMemo(
      () => {
        const normalizedQuery =
          searchQuery
            .trim()
            .toLowerCase();

        return orders.filter(
          (order) => {
            const matchesStatus =
              statusFilter ===
                "ALL" ||
              order.status ===
                statusFilter;

            const matchesType =
              typeFilter ===
                "ALL" ||
              order.orderType ===
                typeFilter;

            if (
              !matchesStatus ||
              !matchesType
            ) {
              return false;
            }

            if (
              !normalizedQuery
            ) {
              return true;
            }

            const searchableText =
              [
                order.orderCode,
                order.status,
                order.orderType,
                order.cutoffDecision,
                order.requestedDispatchDate,
                order.effectiveDispatchDate,
                order.storeManagerNote,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
              normalizedQuery
            );
          }
        );
      },
      [
        orders,
        searchQuery,
        statusFilter,
        typeFilter,
      ]
    );

  const hasFilters =
    Boolean(
      searchQuery.trim()
    ) ||
    statusFilter !==
      "ALL" ||
    typeFilter !==
      "ALL";

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

  function clearFilters() {
    setSearchQuery(
      ""
    );

    setStatusFilter(
      "ALL"
    );

    setTypeFilter(
      "ALL"
    );
  }

  function openOrder(
    orderCode
  ) {
    navigate(
      `/store-manager/orders/${encodeURIComponent(
        orderCode
      )}`
    );
  }

  return (
    <StoreManagerShell
      user={user}
      outlet={outlet}
      depot={depot}
    >
      <StoreManagerPageHeader
        eyebrow={t(
          "storeManager.workspaceEyebrow"
        )}
        title={t(
          "storeManager.ordersPageTitle"
        )}
        description={t(
          "storeManager.ordersPageDescription"
        )}
        actions={
          <button
            type="button"
            onClick={() =>
              navigate(
                "/store-manager/orders/new"
              )
            }
            className="
              nexora-focus
              inline-flex
              min-h-9
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--color-primary)]
              px-3.5
              text-[11.5px]
              font-bold
              text-white
              shadow-[0_8px_18px_rgba(15,169,104,0.14)]
              transition
              duration-150
              hover:-translate-y-[1px]
              hover:bg-[var(--color-primary-hover)]
            "
          >
            <PackagePlus
              size={14.5}
            />

            {t(
              "storeManager.ordersCreateOrder"
            )}
          </button>
        }
      />

      <section
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <DeliveryMetricCard
          icon={ClipboardList}
          label={t(
            "storeManager.ordersTotal"
          )}
          value={
            summary.total
          }
          tone="transit"
        />

        <DeliveryMetricCard
          icon={Clock3}
          label={t(
            "storeManager.ordersSubmitted"
          )}
          value={
            summary.submitted
          }
          tone="upcoming"
        />

        <DeliveryMetricCard
          icon={TriangleAlert}
          label={t(
            "storeManager.ordersDeferred"
          )}
          value={
            summary.deferred
          }
          tone="attention"
        />

        <DeliveryMetricCard
          icon={CheckCircle2}
          label={t(
            "storeManager.ordersConfirmed"
          )}
          value={
            summary.confirmed
          }
          tone="success"
        />
      </section>

      <section
        className="
          mt-5
          overflow-hidden
          rounded-[20px]
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          shadow-[0_10px_26px_rgba(15,23,42,0.035)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-[var(--color-border)]
            px-4
            py-4
            sm:px-5
            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          <div
            className="
              flex
              flex-1
              flex-col
              gap-2.5
              md:flex-row
            "
          >
            <label
              className="
                relative
                block
                w-full
                md:max-w-[360px]
              "
            >
              <span
                className="
                  sr-only
                "
              >
                {t(
                  "storeManager.ordersSearch"
                )}
              </span>

              <Search
                size={14}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-[var(--color-text-muted)]
                "
              />

              <input
                type="search"
                value={
                  searchQuery
                }
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event
                      .target
                      .value
                  )
                }
                placeholder={t(
                  "storeManager.ordersSearchPlaceholderAdvanced"
                )}
                className="
                  nexora-focus
                  h-9
                  w-full
                  rounded-xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface-soft)]
                  pl-9
                  pr-3
                  text-[11px]
                  font-medium
                  text-[var(--color-text)]
                  outline-none
                  transition
                  placeholder:text-[var(--color-text-muted)]
                  focus:border-[#8DE0B6]
                  focus:bg-[var(--color-surface)]
                "
              />
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event
                    .target
                    .value
                )
              }
              aria-label={t(
                "storeManager.ordersStatusFilter"
              )}
              className="
                nexora-focus
                h-9
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface-soft)]
                px-3
                text-[10.5px]
                font-semibold
                text-[var(--color-text-secondary)]
                outline-none
                focus:border-[#8DE0B6]
                focus:bg-[var(--color-surface)]
                md:w-[170px]
              "
            >
              {STATUS_FILTERS.map(
                (
                  status
                ) => (
                  <option
                    key={
                      status
                    }
                    value={
                      status
                    }
                  >
                    {getStatusFilterLabel(
                      status,
                      t
                    )}
                  </option>
                )
              )}
            </select>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event
                    .target
                    .value
                )
              }
              aria-label={t(
                "storeManager.ordersTypeFilter"
              )}
              className="
                nexora-focus
                h-9
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface-soft)]
                px-3
                text-[10.5px]
                font-semibold
                text-[var(--color-text-secondary)]
                outline-none
                focus:border-[#8DE0B6]
                focus:bg-[var(--color-surface)]
                md:w-[160px]
              "
            >
              {TYPE_FILTERS.map(
                (
                  type
                ) => (
                  <option
                    key={
                      type
                    }
                    value={
                      type
                    }
                  >
                    {getTypeFilterLabel(
                      type,
                      t
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              xl:justify-end
            "
          >
            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="
                  nexora-focus
                  text-[9.5px]
                  font-bold
                  text-[var(--color-primary)]
                  hover:underline
                "
              >
                {t(
                  "storeManager.ordersClearFilters"
                )}
              </button>
            )}

            <p
              className="
                text-[9.5px]
                font-medium
                text-[var(--color-text-muted)]
              "
            >
              {t(
                "storeManager.ordersShowing"
              )
                .replace(
                  "{shown}",
                  String(
                    filteredOrders.length
                  )
                )
                .replace(
                  "{total}",
                  String(
                    orders.length
                  )
                )}
            </p>

            <button
              type="button"
              onClick={
                refreshOrders
              }
              disabled={
                isRefreshing ||
                isOrdersLoading
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
                shrink-0
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
                disabled:cursor-not-allowed
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

        {ordersErrorMessage ? (
          <OrdersErrorState
            message={
              ordersErrorMessage
            }
            onRetry={
              refreshOrders
            }
            isRefreshing={
              isRefreshing
            }
            t={t}
          />
        ) : isOrdersLoading ? (
          <OrdersLoadingState
            t={t}
          />
        ) : filteredOrders.length ===
          0 ? (
          <OrdersEmptyState
            hasFilters={
              hasFilters
            }
            onClearFilters={
              clearFilters
            }
            onCreate={() =>
              navigate(
                "/store-manager/orders/new"
              )
            }
            t={t}
          />
        ) : (
          <>
            <div
              className="
                hidden
                overflow-x-auto
                lg:block
              "
            >
              <table
                className="
                  w-full
                  min-w-[1040px]
                  border-collapse
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-[#C7DFD3]
                      bg-[#EAF7F0]
                    "
                  >
                    <TableHeading>
                      {t(
                        "storeManager.ordersOrder"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.orderTypeLabel"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.ordersContents"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.ordersLogistics"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.ordersProcessingDate"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.ordersStatus"
                      )}
                    </TableHeading>

                    <TableHeading>
                      {t(
                        "storeManager.ordersAction"
                      )}
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (
                      order
                    ) => (
                      <OrderTableRow
                        key={
                          order.id ||
                          order.orderCode
                        }
                        order={
                          order
                        }
                        onOpen={() =>
                          openOrder(
                            order.orderCode
                          )
                        }
                        t={t}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="
                divide-y
                divide-[var(--color-border)]
                lg:hidden
              "
            >
              {filteredOrders.map(
                (
                  order
                ) => (
                  <OrderMobileCard
                    key={
                      order.id ||
                      order.orderCode
                    }
                    order={
                      order
                    }
                    onOpen={() =>
                      openOrder(
                        order.orderCode
                      )
                    }
                    t={t}
                  />
                )
              )}
            </div>
          </>
        )}
      </section>
    </StoreManagerShell>
  );
}

function TableHeading({
  children,
}) {
  return (
    <th
      scope="col"
      className="
        whitespace-nowrap
        px-4
        py-3
        text-left
        text-[8.5px]
        font-extrabold
        uppercase
        tracking-[0.11em]
        text-[#355D4D]
      "
    >
      {children}
    </th>
  );
}

function OrderTableRow({
  order,
  onOpen,
  t,
}) {
  return (
    <tr
      className={`
        border-b
        border-[var(--color-border)]
        transition
        last:border-b-0
        ${getOrderRowStyle(order.status)}
      `}
    >
      <td
        className="
          px-4
          py-4
        "
      >
        <p
          className="
            max-w-[240px]
            break-all
            text-[11px]
            font-extrabold
            text-[var(--color-text)]
          "
        >
          {order.orderCode}
        </p>

        <p
          className="
            mt-1
            text-[8.5px]
            font-medium
            text-[var(--color-text-muted)]
          "
        >
          {formatDateTime(
            order.submittedAt
          )}
        </p>


        {order.storeManagerNote && (
          <div
            className="
              mt-1.5
              inline-flex
              items-center
              gap-1
              text-[7.5px]
              font-semibold
              text-[#0F6B4F]
            "
          >
            <FileText
              size={9}
            />

            {t(
              "storeManager.ordersHasNote"
            )}
          </div>
        )}
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <HandlingBadge
          orderType={
            order.orderType
          }
          t={t}
        />
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <p
          className="
            text-[10px]
            font-bold
            text-[var(--color-text)]
          "
        >
          {t(
            "storeManager.ordersProductsCount"
          ).replace(
            "{count}",
            String(
              order.itemCount ??
              0
            )
          )}
        </p>

        <p
          className="
            mt-1
            text-[8.5px]
            font-medium
            text-[var(--color-text-muted)]
          "
        >
          {t(
            "storeManager.ordersUnitsCount"
          ).replace(
            "{count}",
            String(
              order.totalUnits ??
              0
            )
          )}
        </p>
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <div
          className="
            space-y-1.5
          "
        >
          <MetricLine
            icon={Weight}
            value={formatWeight(
              order.estimatedWeightKg
            )}
          />

          <MetricLine
            icon={Droplets}
            value={formatVolume(
              order.estimatedVolumeM3
            )}
          />
        </div>
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <p
          className="
            text-[10px]
            font-bold
            text-[var(--color-text)]
          "
        >
          {formatDate(
            order.effectiveDispatchDate
          )}
        </p>

        <p
          className="
            mt-1
            text-[8px]
            font-medium
            text-[var(--color-text-muted)]
          "
        >
          {getCutoffLabel(
            order.cutoffDecision,
            t
          )}
        </p>
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <StatusBadge
          status={
            order.status
          }
          t={t}
        />
      </td>

      <td
        className="
          px-4
          py-4
        "
      >
        <button
          type="button"
          onClick={
            onOpen
          }
          className="
            nexora-focus
            inline-flex
            min-h-8
            items-center
            justify-center
            gap-1.5
            rounded-lg
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-2.5
            text-[9px]
            font-bold
            text-[var(--color-text-secondary)]
            transition
            hover:border-[#8DE0B6]
            hover:bg-[#16A572]/[0.04]
            hover:text-[#0F6B4F]
          "
        >
          {t(
            "storeManager.ordersView"
          )}

          <ArrowRight
            size={11}
          />
        </button>
      </td>
    </tr>
  );
}

function OrderMobileCard({
  order,
  onOpen,
  t,
}) {
  return (
    <article
      className={`
        border-l-[3px]
        p-4
        ${getOrderMobileStyle(order.status)}
      `}
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              break-all
              text-[11px]
              font-extrabold
              text-[var(--color-text)]
            "
          >
            {order.orderCode}
          </p>

          <p
            className="
              mt-1
              text-[8.5px]
              text-[var(--color-text-muted)]
            "
          >
            {formatDateTime(
              order.submittedAt
            )}
          </p>
        </div>

        <StatusBadge
          status={
            order.status
          }
          t={t}
        />
      </div>


      <div
        className="
          mt-3
          flex
          flex-wrap
          items-center
          gap-2
        "
      >
        <HandlingBadge
          orderType={
            order.orderType
          }
          t={t}
        />

        {order.storeManagerNote && (
          <span
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              border
              border-[#C9F0DA]
              bg-[#16A572]/[0.04]
              px-2
              py-1
              text-[7.5px]
              font-bold
              text-[#0F6B4F]
            "
          >
            <FileText
              size={9}
            />

            {t(
              "storeManager.ordersHasNote"
            )}
          </span>
        )}
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
        "
      >
        <MobileField
          label={t(
            "storeManager.ordersItems"
          )}
          value={
            order.itemCount ??
            0
          }
        />

        <MobileField
          label={t(
            "storeManager.ordersUnits"
          )}
          value={
            order.totalUnits ??
            0
          }
        />

        <MobileField
          label={t(
            "storeManager.estimatedWeight"
          )}
          value={formatWeight(
            order.estimatedWeightKg
          )}
        />

        <MobileField
          label={t(
            "storeManager.estimatedVolume"
          )}
          value={formatVolume(
            order.estimatedVolumeM3
          )}
        />

        <MobileField
          label={t(
            "storeManager.ordersProcessingDate"
          )}
          value={formatDate(
            order.effectiveDispatchDate
          )}
        />

        <MobileField
          label={t(
            "storeManager.ordersCutoff"
          )}
          value={getCutoffLabel(
            order.cutoffDecision,
            t
          )}
        />
      </div>

      <button
        type="button"
        onClick={
          onOpen
        }
        className="
          nexora-focus
          mt-3
          inline-flex
          min-h-9
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          border
          border-[#C9F0DA]
          bg-[#16A572]/[0.045]
          text-[9.5px]
          font-bold
          text-[#0F6B4F]
        "
      >
        {t(
          "storeManager.ordersViewDetails"
        )}

        <ArrowRight
          size={12}
        />
      </button>
    </article>
  );
}



function MetricLine({
  icon: Icon,
  value,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-1.5
      "
    >
      <Icon
        size={11}
        className="
          shrink-0
          text-[#0F6B4F]
        "
      />

      <span
        className="
          text-[9px]
          font-semibold
          text-[var(--color-text-secondary)]
        "
      >
        {value}
      </span>
    </div>
  );
}

function MobileField({
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface-soft)]
        px-3
        py-2.5
      "
    >
      <p
        className="
          text-[7.5px]
          font-semibold
          uppercase
          tracking-[0.08em]
          text-[var(--color-text-muted)]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          break-words
          text-[10px]
          font-bold
          text-[var(--color-text)]
        "
      >
        {value}
      </p>
    </div>
  );
}

function HandlingBadge({
  orderType,
  t,
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
        px-2.5
        py-1
        text-[8px]
        font-bold
        ${
          chilled
            ? "border-sky-500/20 bg-sky-500/[0.08] text-sky-700"
            : "border-[#16A572]/20 bg-[#16A572]/[0.08] text-[#0F6B4F]"
        }
      `}
    >
      {chilled ? (
        <Snowflake
          size={9}
        />
      ) : (
        <ThermometerSun
          size={9}
        />
      )}

      {getTypeLabel(
        orderType,
        t
      )}
    </span>
  );
}

function StatusBadge({
  status,
  t,
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.065em] shadow-sm"
      style={getStatusBadgeStyle(status)}
    >
      {getStatusLabel(
        status,
        t
      )}
    </span>
  );
}

function OrdersLoadingState({
  t,
}) {
  return (
    <div
      className="
        flex
        min-h-[310px]
        items-center
        justify-center
        px-5
        py-12
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
            h-8
            w-8
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
            "storeManager.ordersLoading"
          )}
        </p>
      </div>
    </div>
  );
}

function OrdersErrorState({
  message,
  onRetry,
  isRefreshing,
  t,
}) {
  return (
    <div
      className="
        flex
        min-h-[310px]
        items-center
        justify-center
        px-5
        py-12
      "
    >
      <div
        className="
          max-w-md
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[var(--color-danger-soft)]
            text-[var(--color-danger)]
          "
        >
          <TriangleAlert
            size={18}
          />
        </div>

        <h2
          className="
            mt-4
            text-sm
            font-bold
            text-[var(--color-text)]
          "
        >
          {t(
            "storeManager.ordersLoadFailed"
          )}
        </h2>

        <p
          className="
            mt-2
            text-[11px]
            leading-5
            text-[var(--color-text-secondary)]
          "
        >
          {message}
        </p>

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
            mt-5
            inline-flex
            min-h-9
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[var(--color-primary)]
            px-3.5
            text-[11px]
            font-bold
            text-white
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

          {t(
            "storeManager.tryAgain"
          )}
        </button>
      </div>
    </div>
  );
}

function OrdersEmptyState({
  hasFilters,
  onClearFilters,
  onCreate,
  t,
}) {
  return (
    <div
      className="
        flex
        min-h-[310px]
        items-center
        justify-center
        px-5
        py-12
      "
    >
      <div
        className="
          max-w-md
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            border
            border-[#C9F0DA]
            bg-[#F2FBF6]
            text-[#0F6B4F]
          "
        >
          <Boxes
            size={19}
          />
        </div>

        <h2
          className="
            mt-4
            text-sm
            font-bold
            text-[var(--color-text)]
          "
        >
          {hasFilters
            ? t(
                "storeManager.ordersNoMatchesTitle"
              )
            : t(
                "storeManager.ordersEmptyTitle"
              )}
        </h2>

        <p
          className="
            mt-2
            text-[11px]
            leading-5
            text-[var(--color-text-secondary)]
          "
        >
          {hasFilters
            ? t(
                "storeManager.ordersNoMatchesDescriptionAdvanced"
              )
            : t(
                "storeManager.ordersEmptyDescription"
              )}
        </p>

        <button
          type="button"
          onClick={
            hasFilters
              ? onClearFilters
              : onCreate
          }
          className="
            nexora-focus
            mt-5
            inline-flex
            min-h-9
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[var(--color-primary)]
            px-3.5
            text-[11px]
            font-bold
            text-white
          "
        >
          {hasFilters ? (
            t(
              "storeManager.ordersClearFilters"
            )
          ) : (
            <>
              <PackagePlus
                size={14}
              />

              {t(
                "storeManager.ordersCreateOrder"
              )}
            </>
          )}
        </button>
      </div>
    </div>
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
          shadow-[var(--shadow-lg)]
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

function getStatusFilterLabel(
  status,
  t
) {
  if (
    status ===
    "ALL"
  ) {
    return t(
      "storeManager.ordersAllStatuses"
    );
  }

  return getStatusLabel(
    status,
    t
  );
}

function getTypeFilterLabel(
  type,
  t
) {
  if (
    type ===
    "ALL"
  ) {
    return t(
      "storeManager.ordersAllTypes"
    );
  }

  return getTypeLabel(
    type,
    t
  );
}

function getTypeLabel(
  type,
  t
) {
  return type ===
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
    keys[
      status
    ] ||
      "storeManager.ordersStatusUnknown"
  );
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return {
        color: "#047857",
        backgroundColor: "#D1FAE5",
        borderColor: "#34D399",
        boxShadow: "0 3px 10px rgba(16,185,129,0.16)",
      };

    case "DEFERRED":
      return {
        color: "#B42318",
        backgroundColor: "#FEE2E2",
        borderColor: "#F87171",
        boxShadow: "0 3px 10px rgba(239,68,68,0.16)",
      };

    case "CANCELLED":
      return {
        color: "#BE123C",
        backgroundColor: "#FFE4E6",
        borderColor: "#FB7185",
        boxShadow: "0 3px 10px rgba(244,63,94,0.16)",
      };

    default:
      return {
        color: "#92400E",
        backgroundColor: "#FEF3C7",
        borderColor: "#FBBF24",
        boxShadow: "0 3px 10px rgba(245,158,11,0.16)",
      };
  }
}

function getOrderRowStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return "hover:bg-emerald-50/55 dark:hover:bg-emerald-400/[0.045]";
    case "DEFERRED":
    case "CANCELLED":
      return "hover:bg-red-50/55 dark:hover:bg-red-400/[0.045]";
    default:
      return "hover:bg-amber-50/55 dark:hover:bg-amber-400/[0.045]";
  }
}

function getOrderMobileStyle(status) {
  switch (status) {
    case "CONFIRMED":
      return "border-l-emerald-400 bg-emerald-50/25 dark:bg-emerald-400/[0.025]";
    case "DEFERRED":
    case "CANCELLED":
      return "border-l-red-400 bg-red-50/25 dark:bg-red-400/[0.025]";
    default:
      return "border-l-amber-400 bg-amber-50/25 dark:bg-amber-400/[0.025]";
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

function formatVolume(
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

export default StoreManagerOrdersPage;
