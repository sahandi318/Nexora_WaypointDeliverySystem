import {
  ArrowLeft,
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  Weight,
  Droplets,
} from "lucide-react";

import {
  CompactQuantityControl,
  HandlingBadge,
  LogisticsTotal,
  MetaPill,
  ProductImage,
  QuantityControl,
  SummaryMetric,
  formatTotalVolume,
  formatUnitVolume,
  formatWeight,
  getVisiblePages,
} from "./CreateOrderShared";

function CreateOrderBrowseStep({
  orderType,
  products,
  suggestions,
  categories,
  pagination,
  selectedById,
  selectedItems,
  totals,
  searchInput,
  category,
  isSuggestionOpen,
  activeSuggestionIndex,
  searchBoxRef,
  isLoading,
  isRefreshing,
  errorMessage,
  submitError,
  onSearchInput,
  onSearchKeyDown,
  onSearchFocus,
  onSuggestion,
  onClearSearch,
  onCategory,
  onPage,
  onRefresh,
  onQuantity,
  onClearSelected,
  onBack,
  onReview,
  t,
}) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                {t("storeManager.createOrderStepTwoEyebrow")}
              </p>
              <HandlingBadge orderType={orderType} t={t} />
            </div>
            <h2 className="mt-1.5 text-[15.5px] font-extrabold text-[#10251D] dark:text-[var(--color-text)]">
              {t("storeManager.createOrderBrowseTitle")}
            </h2>
            <p className="mt-1 text-[10.5px] font-medium text-[#52685F] dark:text-[var(--color-text-secondary)]">
              {t("storeManager.createOrderC2BrowseDescription")}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="nexora-focus inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-60 lg:self-auto"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="border-b border-[var(--color-border)] p-4">
          <div ref={searchBoxRef} className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-[18px] -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInput(event.target.value)}
              onKeyDown={onSearchKeyDown}
              onFocus={onSearchFocus}
              placeholder={t("storeManager.createOrderAdvancedSearchPlaceholder")}
              autoComplete="off"
              className="nexora-focus h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] pl-9 pr-10 text-[11.5px] font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[#8DE0B6] focus:bg-[var(--color-surface)]"
            />

            {searchInput && (
              <button
                type="button"
                onClick={onClearSearch}
                className="nexora-focus absolute right-2 top-[18px] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
              >
                <X size={12} />
              </button>
            )}

            {isSuggestionOpen && suggestions.length > 0 && (
              <SearchSuggestionPanel
                suggestions={suggestions}
                activeIndex={activeSuggestionIndex}
                onSelect={onSuggestion}
                t={t}
              />
            )}
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            <CategoryChip
              label={t("storeManager.createOrderAllProducts")}
              active={category === "ALL"}
              onClick={() => onCategory("ALL")}
            />
            {categories.map((categoryName) => (
              <CategoryChip
                key={categoryName}
                label={categoryName}
                active={category === categoryName}
                onClick={() => onCategory(categoryName)}
              />
            ))}
          </div>
        </div>

        {errorMessage ? (
          <PanelError
            title={t("storeManager.createOrderCatalogFailed")}
            message={errorMessage}
            onRetry={onRefresh}
            isRefreshing={isRefreshing}
            t={t}
          />
        ) : isLoading ? (
          <PanelLoading message={t("storeManager.createOrderLoadingCatalog")} />
        ) : products.length === 0 ? (
          <NoMatches t={t} />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)]">
              {products.map((product) => (
                <ProductCatalogRow
                  key={product.id}
                  product={product}
                  quantity={selectedById[product.id]?.quantity || 0}
                  onQuantity={(value) => onQuantity(product, value)}
                  t={t}
                />
              ))}
            </div>

            <CatalogPagination
              pagination={pagination}
              onPage={onPage}
              t={t}
            />
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-4">
          <button
            type="button"
            onClick={onBack}
            className="nexora-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[11px] font-bold text-[var(--color-text)]"
          >
            <ArrowLeft size={14} />
            {t("common.previous")}
          </button>
        </div>
      </section>

      <SelectedOrderSummary
        selectedItems={selectedItems}
        totals={totals}
        submitError={submitError}
        onQuantity={onQuantity}
        onClearSelected={onClearSelected}
        onReview={onReview}
        t={t}
      />
    </div>
  );
}

function ProductCatalogRow({ product, quantity, onQuantity, t }) {
  const selected = quantity > 0;

  return (
    <article
      className={`px-4 py-4 transition ${
        selected
          ? "bg-[#16A572]/[0.04]"
          : "hover:bg-[var(--color-surface-soft)]"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px_150px] lg:items-center">
        <div className="flex min-w-0 items-start gap-3.5">
          <ProductImage product={product} large />

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
                <MetaPill>{product.productType}</MetaPill>
              )}

              {product.category && (
                <MetaPill>{product.category}</MetaPill>
              )}

              {product.unitLabel && (
                <MetaPill>{product.unitLabel}</MetaPill>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ProductMetric
            label={t("storeManager.catalogUnitWeight")}
            value={formatWeight(product.unitWeightKg)}
          />

          <ProductMetric
            label={t("storeManager.catalogUnitVolume")}
            value={formatUnitVolume(product.unitVolumeM3)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-[#48665B] lg:hidden">
            {t("storeManager.catalogQuantity")}
          </span>

          <QuantityControl
            value={quantity}
            onChange={onQuantity}
          />
        </div>
      </div>
    </article>
  );
}

function ProductMetric({ label, value }) {
  return (
    <div className="rounded-[14px] border border-[#C9E5D6] bg-[#F1FAF5] px-3 py-2.5">
      <p className="text-[7.5px] font-semibold text-[#59756A]">
        {label}
      </p>

      <p className="mt-1 text-[10.5px] font-extrabold text-[#10251D]">
        {value}
      </p>
    </div>
  );
}

function SearchSuggestionPanel({ suggestions, activeIndex, onSelect, t }) {
  return (
    <div className="absolute left-0 right-0 top-[42px] z-40 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_18px_46px_rgba(15,23,42,0.15)]">
      <div className="border-b border-[var(--color-border)] px-3 py-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{t("storeManager.catalogSuggestions")}</p>
      </div>
      <div className="max-h-[330px] overflow-y-auto p-1.5">
        {suggestions.map((product, index) => (
          <button
            type="button"
            key={product.id}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(product);
            }}
            className={`nexora-focus flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition ${index === activeIndex ? "bg-[#16A572]/[0.07]" : "hover:bg-[var(--color-surface-soft)]"}`}
          >
            <ProductImage product={product} compact />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold text-[var(--color-text)]">{product.name}</p>
              <p className="mt-0.5 truncate text-[8px] text-[var(--color-text-muted)]">
                {product.manufacturerBrand} · {product.sku} · {product.productType}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nexora-focus shrink-0 rounded-full border px-2 py-[3px] text-[7.5px] font-bold transition ${active ? "border-[#16A572] bg-[#16A572] text-white" : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)] hover:border-[#8DE0B6]"}`}
    >
      {label}
    </button>
  );
}

function CatalogPagination({ pagination, onPage, t }) {
  const pages = getVisiblePages(pagination.page, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[8.5px] font-semibold text-[var(--color-text-muted)]">
        {t("storeManager.catalogShowing")
          .replace("{from}", String(pagination.from))
          .replace("{to}", String(pagination.to))
          .replace("{total}", String(pagination.totalItems))}
      </p>

      <div className="flex items-center gap-1.5">
        <PaginationButton
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
          ariaLabel={t("storeManager.catalogPreviousPage")}
        >
          <ChevronLeft size={12} />
        </PaginationButton>

        {pages.map((pageNumber) => (
          <PaginationButton
            key={pageNumber}
            active={pageNumber === pagination.page}
            onClick={() => onPage(pageNumber)}
            ariaLabel={`${pageNumber}`}
          >
            {pageNumber}
          </PaginationButton>
        ))}

        <PaginationButton
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
          ariaLabel={t("storeManager.catalogNextPage")}
        >
          <ChevronRight size={12} />
        </PaginationButton>
      </div>
    </div>
  );
}

function PaginationButton({ children, active = false, disabled = false, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`nexora-focus inline-flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 text-[8.5px] font-bold transition ${active ? "border-[#16A572] bg-[#16A572] text-white" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"} disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  );
}

function SelectedOrderSummary({ selectedItems, totals, submitError, onQuantity, onClearSelected, onReview, t }) {
  return (
    <aside className="h-fit overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_26px_rgba(15,23,42,0.035)] 2xl:sticky 2xl:top-[86px]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <div>
          <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">{t("storeManager.createOrderSelectedSummaryEyebrow")}</p>
          <h3 className="mt-1.5 text-[13.5px] font-bold text-[var(--color-text)]">{t("storeManager.createOrderSelectedSummaryTitle")}</h3>
        </div>

        {selectedItems.length > 0 && (
          <button
            type="button"
            onClick={onClearSelected}
            className="nexora-focus inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-2.5 text-[8.5px] font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedItems.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Box size={20} className="mx-auto text-[var(--color-text-muted)]" />
          <p className="mt-3 text-[10px] font-semibold text-[var(--color-text-secondary)]">{t("storeManager.createOrderNothingSelected")}</p>
        </div>
      ) : (
        <div className="max-h-[390px] overflow-y-auto">
          <div className="divide-y divide-[var(--color-border)]">
            {selectedItems.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 px-3.5 py-3">
                <ProductImage product={item.product} compact />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-bold text-[var(--color-text)]">{item.product.name}</p>
                  <p className="mt-0.5 truncate text-[7.5px] text-[var(--color-text-muted)]">{item.product.manufacturerBrand} · {item.product.sku}</p>
                </div>

                <CompactQuantityControl
                  value={item.quantity}
                  onChange={(value) => onQuantity(item.product, value)}
                />

                <button
                  type="button"
                  onClick={() => onQuantity(item.product, 0)}
                  aria-label={`Remove ${item.product.name}`}
                  title="Remove item"
                  className="nexora-focus inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--color-danger)] transition hover:border-red-500/15 hover:bg-red-500/[0.07]"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
        <div className="grid grid-cols-2 gap-2">
          <SummaryMetric label={t("storeManager.createOrderSelectedItems")} value={selectedItems.length} />
          <SummaryMetric label={t("storeManager.createOrderTotalUnits")} value={totals.totalUnits} />
        </div>
        <div className="mt-2 space-y-2">
          <LogisticsTotal icon={Weight} label={t("storeManager.estimatedWeight")} value={formatWeight(totals.estimatedWeightKg)} />
          <LogisticsTotal icon={Droplets} label={t("storeManager.estimatedVolume")} value={formatTotalVolume(totals.estimatedVolumeM3)} />
        </div>
        {submitError && (
          <p className="mt-3 text-[9px] font-semibold text-[var(--color-danger)]">
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={onReview}
          disabled={selectedItems.length === 0}
          className="nexora-focus mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(15,169,104,0.14)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t("storeManager.createOrderReview")}
          <ArrowRight size={14} />
        </button>
      </div>
    </aside>
  );
}

function PanelLoading({ message }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center px-5">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
        <p className="mt-4 text-[11px] font-semibold text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

function PanelError({ title, message, onRetry, isRefreshing, t }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center px-5 py-10 text-center">
      <div className="max-w-md">
        <h3 className="text-[12px] font-bold text-[var(--color-text)]">{title}</h3>
        <p className="mt-2 text-[10.5px] leading-5 text-[var(--color-text-secondary)]">{message}</p>
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
    </div>
  );
}

function NoMatches({ t }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-5 text-center">
      <div>
        <Search size={20} className="mx-auto text-[var(--color-text-muted)]" />
        <p className="mt-3 text-[11px] font-bold text-[var(--color-text)]">{t("storeManager.createOrderNoMatches")}</p>
        <p className="mt-1 text-[9px] text-[var(--color-text-secondary)]">{t("storeManager.catalogTryDifferentSearch")}</p>
      </div>
    </div>
  );
}

export default CreateOrderBrowseStep;
