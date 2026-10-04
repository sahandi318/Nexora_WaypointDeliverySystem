import {
  Check,
  Droplets,
  ImageOff,
  Minus,
  Plus,
  Snowflake,
  ThermometerSun,
  Weight,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

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

export function ProductImage({
  product,
  compact = false,
  large = false,
}) {
  const source = getProductImageSource(product);
  const sizeClass = compact
    ? "h-9 w-9 rounded-lg"
    : large
      ? "h-16 w-16 rounded-[14px]"
      : "h-11 w-11 rounded-xl";

  if (!source) {
    return (
      <div className={`flex shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] ${sizeClass}`}>
        <ImageOff size={compact ? 14 : 16} />
      </div>
    );
  }

  return (
    <div className={`shrink-0 overflow-hidden border border-[var(--color-border)] bg-white ${sizeClass}`}>
      <img
        src={source}
        alt={product?.name || ""}
        loading="lazy"
        className={`h-full w-full object-contain ${large ? "p-1" : "p-0.5"}`}
      />
    </div>
  );
}

export function HandlingBadge({
  orderType,
  t,
  compact = false,
}) {
  const chilled = orderType === "CHILLED";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${compact ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-1 text-[8px]"} ${chilled ? "border-sky-500/20 bg-sky-500/[0.08] text-sky-600" : "border-[#16A572]/20 bg-[#16A572]/[0.08] text-[#0F6B4F]"}`}
    >
      {chilled ? (
        <Snowflake size={compact ? 8 : 10} />
      ) : (
        <ThermometerSun size={compact ? 8 : 10} />
      )}
      {getOrderTypeLabel(orderType, t)}
    </span>
  );
}

export function QuantityControl({
  value,
  onChange,
  maxQuantity = 999,
}) {
  const [draftValue, setDraftValue] = useState(
    value > 0 ? String(value) : ""
  );

  useEffect(() => {
    setDraftValue(value > 0 ? String(value) : "");
  }, [value]);

  function normalizeInput(rawValue) {
    const digitsOnly = String(rawValue ?? "").replace(/\D/g, "");

    if (!digitsOnly) return "";

    const trimmedLeadingZeros = digitsOnly.replace(/^0+(?=\d)/, "");
    const normalizedDigits = trimmedLeadingZeros || "0";
    const boundedValue = Math.min(
      maxQuantity,
      Number(normalizedDigits)
    );

    return String(Number.isFinite(boundedValue) ? boundedValue : 0);
  }

  function commitNormalizedValue(rawValue) {
    const normalized = normalizeInput(rawValue);

    if (!normalized) {
      setDraftValue("");
      onChange(0);
      return;
    }

    setDraftValue(normalized);
    onChange(normalized);
  }

  return (
    <div className="flex h-10 shrink-0 overflow-hidden rounded-[14px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        onClick={() => commitNormalizedValue(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label="Decrease quantity"
        className="nexora-focus inline-flex h-full w-10 items-center justify-center border-r border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Minus size={12} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draftValue}
        onFocus={(event) => event.target.select()}
        onChange={(event) => {
          const normalized = normalizeInput(event.target.value);
          setDraftValue(normalized);
          onChange(normalized || 0);
        }}
        onBlur={() => commitNormalizedValue(draftValue)}
        placeholder="0"
        aria-label="Quantity"
        className="nexora-focus h-full w-14 border-0 bg-transparent px-2 text-center text-[13px] font-extrabold tracking-[0.01em] text-[var(--color-text)] outline-none placeholder:font-bold placeholder:text-[var(--color-text-muted)]"
      />

      <button
        type="button"
        onClick={() => commitNormalizedValue(Math.min(maxQuantity, value + 1))}
        disabled={value >= maxQuantity}
        aria-label="Increase quantity"
        className="nexora-focus inline-flex h-full w-10 items-center justify-center border-l border-[var(--color-border)] text-[var(--color-primary)] transition hover:bg-[var(--color-primary-soft)]/60 hover:text-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

export function CompactQuantityControl({
  value,
  onChange,
}) {
  return (
    <div className="flex h-7 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
        className="nexora-focus inline-flex h-full w-7 items-center justify-center border-r border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-soft)]"
      >
        <Minus size={10} />
      </button>

      <span className="inline-flex min-w-8 items-center justify-center px-1 text-center text-[9px] font-bold text-[var(--color-text)]">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
        className="nexora-focus inline-flex h-full w-7 items-center justify-center border-l border-[var(--color-border)] text-[var(--color-primary)] transition hover:bg-[#16A572]/[0.06]"
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

export function SetupField({
  icon: Icon,
  label,
  value,
  compact = false,
}) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] ${compact ? "px-3 py-2.5" : "px-3.5 py-3"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F8F0] text-[#0F6B4F]">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-0.5 break-words text-[11px] font-bold text-[var(--color-text)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2.5">
      <p className="text-[8px] font-semibold tracking-[0.01em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 break-words text-[12px] font-extrabold tracking-[0.01em] text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export function LogisticsTotal({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E9F8F0] text-[#0F6B4F]">
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-semibold tracking-[0.01em] text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-0.5 text-[11px] font-extrabold tracking-[0.01em] text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

export function MetaPill({ children }) {
  return (
    <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[7px] font-semibold text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

export function TableHeading({ children }) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-4 py-3 text-left text-[8.5px] font-extrabold uppercase tracking-[0.09em] text-[#315F50]"
    >
      {children}
    </th>
  );
}

export function OrderTypeCard({
  icon: Icon,
  selected,
  enabled,
  title,
  description,
  unavailableText,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={`nexora-focus relative min-h-[112px] rounded-[16px] border p-4 text-left transition ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/42 shadow-[0_10px_24px_rgba(15,169,104,0.08)]" : enabled ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)]" : "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-soft)] opacity-55"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-primary)]/15 bg-[var(--color-primary-soft)]/45 text-[var(--color-primary-strong)]"}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"}`}>
              {selected && <Check size={9} />}
            </span>
            <p className="text-[12px] font-bold text-[var(--color-text)]">{title}</p>
          </div>
          <p className="mt-1.5 text-[9.5px] leading-4 text-[var(--color-text-secondary)]">
            {enabled ? description : unavailableText}
          </p>
        </div>
      </div>
    </button>
  );
}

export function formatWeight(value) {
  const amount = Number(value || 0);
  if (amount < 1) {
    return `${Math.round(amount * 1000)} g`;
  }
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} kg`;
}

export function formatUnitVolume(value) {
  const litres = Number(value || 0) * 1000;
  if (litres < 1) {
    return `${Math.round(litres * 1000)} mL`;
  }
  return `${litres.toFixed(litres >= 10 ? 1 : 2)} L`;
}

export function formatTotalVolume(value) {
  const cubicMetres = Number(value || 0);
  const litres = cubicMetres * 1000;
  if (cubicMetres < 0.1) {
    return `${litres.toFixed(litres >= 10 ? 1 : 2)} L`;
  }
  return `${cubicMetres.toFixed(3)} m³`;
}

export function formatRemainingTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return String(value);
}

export function getOrderTypeLabel(orderType, t) {
  return orderType === "CHILLED"
    ? t("storeManager.orderTypeChilled")
    : t("storeManager.orderTypeAmbient");
}

export function getVisiblePages(currentPage, totalPages) {
  const maxButtons = 5;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function roundNumber(value, decimalPlaces) {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function WeightIcon() {
  return <Weight size={13} />;
}

export function VolumeIcon() {
  return <Droplets size={13} />;
}
