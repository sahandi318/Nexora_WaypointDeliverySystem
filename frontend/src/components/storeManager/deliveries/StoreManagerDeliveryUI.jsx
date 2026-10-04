import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Route,
  Truck,
} from "lucide-react";

const STATUS_META = {
  AWAITING_DISPATCHER: { tone: "neutral", icon: Clock3 },
  AWAITING_PLAN: { tone: "neutral", icon: Clock3 },
  PLANNING: { tone: "info", icon: Route },
  SCHEDULED: { tone: "warning", icon: Clock3 },
  READY_FOR_DISPATCH: { tone: "ready", icon: Truck },
  IN_TRANSIT: { tone: "transit", icon: Truck },
  ARRIVING: { tone: "transit", icon: Truck },
  ARRIVED: { tone: "ready", icon: CircleDot },
  DELIVERED: { tone: "success", icon: CheckCircle2 },
  COMPLETED: { tone: "success", icon: CheckCircle2 },
  DEFERRED: { tone: "danger", icon: AlertTriangle },
  DELAYED: { tone: "warning", icon: AlertTriangle },
  PARTIAL: { tone: "warning", icon: AlertTriangle },
  EXCEPTION: { tone: "danger", icon: AlertTriangle },
  CANCELLED: { tone: "danger", icon: AlertTriangle },
};

const STATUS_CLASSES = {
  neutral:
    "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]",
  info:
    "border-[var(--color-info)]/25 bg-[var(--color-info-soft)]/80 text-[var(--color-info)]",
  ready:
    "border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)]/70 text-[var(--color-primary-strong)]",
  transit:
    "border-[var(--color-info)]/25 bg-[var(--color-info-soft)]/85 text-[var(--color-info)]",
  success:
    "border-[var(--color-success)]/25 bg-[var(--color-success-soft)]/85 text-[var(--color-success)]",
  warning:
    "border-[var(--color-warning)]/28 bg-[var(--color-warning-soft)]/85 text-[var(--color-warning)]",
  danger:
    "border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)]/82 text-[var(--color-danger)]",
};

export const UPCOMING_STATUSES = new Set([
  "AWAITING_DISPATCHER",
  "AWAITING_PLAN",
  "PLANNING",
  "SCHEDULED",
  "READY_FOR_DISPATCH",
]);

export const ACTIVE_STATUSES = new Set([
  "IN_TRANSIT",
  "ARRIVING",
  "ARRIVED",
  "DELAYED",
]);

export const COMPLETED_STATUSES = new Set([
  "DELIVERED",
  "COMPLETED",
]);

export const ATTENTION_STATUSES = new Set([
  "DEFERRED",
  "PARTIAL",
  "EXCEPTION",
  "CANCELLED",
]);

export const DELIVERY_PROGRESS_STEPS = [
  "AWAITING_PLAN",
  "SCHEDULED",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "ARRIVING",
  "ARRIVED",
  "DELIVERED",
];

export function getDeliveryStatusLabel(t, status) {
  const key = `storeManager.deliveryStatus${toPascalCase(status)}`;
  return t(key, humanize(status));
}

export function DeliveryStatusBadge({ status, t, compact = false }) {
  const meta = STATUS_META[status] || {
    tone: "neutral",
    icon: CircleDot,
  };
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${
        compact ? "px-2 py-1 text-[9.5px]" : "px-2.5 py-1.5 text-[10.5px]"
      } ${STATUS_CLASSES[meta.tone]}`}
    >
      <Icon size={compact ? 11.5 : 12.5} />
      {getDeliveryStatusLabel(t, status)}
    </span>
  );
}

export function DeliveryMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}) {
  const cardTones = {
    default: "border-[var(--color-border)] bg-[var(--color-surface)]",
    upcoming: "border-[var(--color-warning)]/28 bg-[linear-gradient(135deg,var(--color-warning-soft)_0%,var(--color-surface)_120%)]",
    attention: "border-[var(--color-danger)]/25 bg-[linear-gradient(135deg,var(--color-danger-soft)_0%,var(--color-surface)_125%)]",
    success: "border-[var(--color-success)]/24 bg-[linear-gradient(135deg,var(--color-success-soft)_0%,var(--color-surface)_125%)]",
    transit: "border-[var(--color-info)]/24 bg-[linear-gradient(135deg,var(--color-info-soft)_0%,var(--color-surface)_125%)]",
  };

  const iconTones = {
    default: "border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)]/50 text-[var(--color-primary-strong)]",
    upcoming: "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    attention: "border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    success: "border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]",
    transit: "border-[var(--color-info)]/20 bg-[var(--color-info-soft)] text-[var(--color-info)]",
  };

  return (
    <article
      className={`relative overflow-hidden rounded-[18px] border px-4 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.035)] ${cardTones[tone] || cardTones.default}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-[1.45rem] font-bold tracking-[-0.04em] text-[var(--color-text)]">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 text-[10.5px] text-[var(--color-text-secondary)]">
              {detail}
            </p>
          ) : null}
        </div>

        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconTones[tone] || iconTones.default}`}>
          <Icon size={16} />
        </span>
      </div>
    </article>
  );
}

export function DeliveryField({
  icon: Icon,
  label,
  value,
  hint,
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)]/55 px-3.5 py-3">
      {Icon ? (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)]/55 text-[var(--color-primary)]">
          <Icon size={14.5} />
        </span>
      ) : null}

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="mt-1 break-words text-[12px] font-semibold text-[var(--color-text)]">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function getDeliveryGroup(status) {
  if (UPCOMING_STATUSES.has(status)) return "UPCOMING";
  if (ACTIVE_STATUSES.has(status)) return "ACTIVE";
  if (COMPLETED_STATUSES.has(status)) return "COMPLETED";
  if (ATTENTION_STATUSES.has(status)) return "ATTENTION";
  return "UPCOMING";
}

export function formatDeliveryDate(value, language = "en") {
  if (!value) return "—";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(resolveLocale(language), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDeliveryDateTime(value, language = "en") {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(resolveLocale(language), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatWeight(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(number >= 100 ? 0 : 2)} kg`;
}

export function formatVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(3)} m³`;
}

export function formatOperationalValue(value) {
  if (!value) return "";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function humanize(value) {
  if (!value) return "Unknown";
  return formatOperationalValue(value);
}

function toPascalCase(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function resolveLocale(language) {
  if (language === "si") return "si-LK";
  if (language === "ta") return "ta-LK";
  return "en-GB";
}
