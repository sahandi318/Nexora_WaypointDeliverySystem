import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DispatcherLayout from "../DispatcherLayout";
import "../../../pages/dispatcher/planning/dispatcherPlanning.css";

const tabs = [
  {
    path: "/dispatcher/planning",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    path: "/dispatcher/planning/fleet",
    label: "Fleet Availability",
    icon: Truck,
  },
  {
    path: "/dispatcher/planning/planner",
    label: "Delivery Planner",
    icon: MapPin,
  },
  {
    path: "/dispatcher/planning/deferred",
    label: "Deferred Orders",
    icon: Clock3,
  },
  {
    path: "/dispatcher/planning/review",
    label: "Review & Publish",
    icon: ChevronRight,
  },
];

function valueOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function SummaryCard({ label, value, tone, icon: Icon }) {
  return (
    <div className={`dp-summary-card dp-tone-${tone}`}>
      <div className="dp-summary-icon">
        <Icon size={19} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{valueOrZero(value)}</strong>
      </div>
    </div>
  );
}

export function PlanningNotice({ tone = "info", children }) {
  return <div className={`dp-notice dp-notice-${tone}`}>{children}</div>;
}

export function PlanningEmpty({ title, message, icon: Icon = ClipboardList }) {
  return (
    <div className="dp-empty">
      <span className="dp-empty-icon"><Icon size={24} /></span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function PlanningBadge({ children, tone = "neutral" }) {
  return <span className={`dp-badge dp-badge-${tone}`}>{children}</span>;
}

export function planningStatusTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (["PUBLISHED", "CONFIRMED", "DELIVERED", "COMPLETED"].includes(normalized)) return "success";
  if (["SUBMITTED", "ALLOCATED", "PLANNED"].includes(normalized)) return "info";
  if (["DEFERRED", "DELAYED"].includes(normalized)) return "warning";
  if (["CANCELLED", "EXCEPTION", "FAILED"].includes(normalized)) return "danger";
  return "neutral";
}

export default function DispatcherPlanningShell({
  activePath,
  title,
  subtitle,
  workspace,
  loading,
  error,
  date,
  onDateChange,
  onRetry,
  children,
}) {
  const navigate = useNavigate();
  const summary = workspace?.summary || {};
  const scope = workspace?.scope;

  return (
    <DispatcherLayout>
      <div className="dp-page">
        <div className="dp-header">
          <div>
            <div className="dp-eyebrow">DISPATCH OPERATIONS</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="dp-header-actions">
            <div className="dp-scope-chip">
              <MapPin size={15} />
              <span>{scope?.depotName || "Assigned depot"}</span>
            </div>

            <label className="dp-date-control">
              <CalendarDays size={15} />
              <input
                type="date"
                value={date || ""}
                onChange={(event) => onDateChange?.(event.target.value)}
                aria-label="Filter by effective delivery date"
              />
              {date ? (
                <button type="button" onClick={() => onDateChange?.("")}>All dates</button>
              ) : null}
            </label>
          </div>
        </div>

        <div className="dp-summary-grid">
          <SummaryCard
            icon={ClipboardList}
            label="Awaiting decision"
            value={summary.submittedOrders}
            tone="amber"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Confirmed orders"
            value={summary.confirmedOrders}
            tone="green"
          />
          <SummaryCard
            icon={PackageCheck}
            label="Allocated orders"
            value={summary.allocatedOrders}
            tone="teal"
          />
          <SummaryCard
            icon={Clock3}
            label="Deferred orders"
            value={summary.deferredOrders}
            tone="rose"
          />
        </div>

        <nav className="dp-tabs" aria-label="Delivery planning sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activePath === tab.path;
            return (
              <button
                key={tab.path}
                type="button"
                className={active ? "active" : ""}
                onClick={() => navigate(tab.path)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {error ? (
          <PlanningNotice tone="danger">
            <div>
              <strong>Planning data could not be loaded.</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={onRetry}>Retry</button>
          </PlanningNotice>
        ) : null}

        {loading && !workspace ? (
          <div className="dp-loading">Loading real planning data…</div>
        ) : children}
      </div>
    </DispatcherLayout>
  );
}
