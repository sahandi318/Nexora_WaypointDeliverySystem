import React, { useState } from "react";

const ReceiptDiscrepancyResolution = () => {
  const [resolution, setResolution] = useState(
    "Arrange replacement delivery"
  );

  const [notes, setNotes] = useState(
    "Store confirmed receiving 18 crates. 2 crates missing. Arranging replacement delivery on next available run."
  );

  const resolutionOptions = [
    "Arrange replacement delivery",
    "Confirm quantity adjustment",
    "Request additional evidence",
    "Escalate for further investigation",
    "Mark as resolved (no further action)",
  ];

  return (
    <div className="space-y-4">
      

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Completed Trips"
          value="18"
          change="↑ 12% vs previous period"
          type="green"
          icon="✓"
        />

        <SummaryCard
          title="Delivered Orders"
          value="286"
          change="↑ 8% vs previous period"
          type="green"
          icon="◇"
        />

        <SummaryCard
          title="Partial / Failed Deliveries"
          value="17"
          change="↓ 15% vs previous period"
          type="amber"
          icon="△"
        />

        <SummaryCard
          title="Unresolved Issues"
          value="5"
          change="↑ 25% vs previous period"
          type="red"
          icon="!"
        />
      </div>

      {/* Back and trip navigation */}
      <div className="flex items-center justify-between">
        <button className="text-[9px] font-semibold text-[var(--color-success)]">
          ← Back to Delivery Reports
        </button>

        <div className="flex items-center gap-2 text-[9px]">
          <button className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-border)]
bg-[var(--color-surface)]
text-[var(--color-text-secondary)]">
            ‹
          </button>

          <span className="font-semibold text-[var(--color-text)]">
            TRP005 - MS-010
          </span>

          <button className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-border)]
bg-[var(--color-surface)]
text-[var(--color-text-secondary)]">
            ›
          </button>
        </div>
      </div>

      {/* Trip details */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="grid grid-cols-2 gap-4 border-b border-[var(--color-border)] px-4 py-3 md:grid-cols-4">
          <div>
            <p className="text-[7px] text-[var(--color-text-muted)]">TRIP DETAILS</p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-semibold text-[var(--color-text)]">
                TRP005
              </span>

              <span className="rounded bg-[var(--color-danger-soft)] px-2 py-0.5 text-[7px] font-semibold text-[var(--color-danger)]">
                1 ISSUE TO REVIEW
              </span>
            </div>
          </div>

          <Detail label="VEHICLE" value="VEH010" />
          <Detail label="DRIVER" value="Tharindu Silva" />

          <div>
            <div className="flex items-start justify-between">
              <Detail
                label="COMPLETION TIME"
                value="29 Sep 2026, 9:50 AM"
              />

              <span className="rounded bg-[var(--color-success-soft)] px-2 py-0.5 text-[7px] font-semibold text-[var(--color-success)]">
                COMPLETED
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 py-3 md:grid-cols-4">
          <Detail label="STEP 3" value="Peradeniya Fresh B" />
          <Detail label="ORDER ID" value="ORD0075" />
          <Detail label="BRAND" value="Fresh" />

          <div>
            <div className="flex items-start justify-between">
              <Detail
                label="SCHEDULED TIME"
                value="9:30 AM - 10:15 AM"
              />

              <span className="rounded bg-[var(--color-danger-soft)] px-2 py-0.5 text-[7px] font-semibold text-[var(--color-danger)]">
                QUANTITY MISMATCH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity discrepancy alert */}
      <div className="flex items-start justify-between rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3">
        <div className="flex gap-2">
          <div className="mt-0.5 text-[var(--color-danger)]">⊙</div>

          <div>
            <p className="text-[9px] font-semibold text-[var(--color-danger)]">
              Quantity discrepancy detected
            </p>

            <p className="mt-0.5 text-[8px] text-[var(--color-danger)]">
              Driver reported delivering 20 crates, but the store manager
              confirmed receiving only 18 crates.
            </p>
          </div>
        </div>

        <span className="text-[7px] text-[var(--color-text-muted)]">
          Reported on: 29 Sep 2026, 11:05 AM
        </span>
      </div>

      {/* Main details and resolution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
        {/* Left column */}
        <div className="space-y-4">
          <EvidenceCard
            title="Driver's Proof of Delivery (POD)"
            badge="SUBMITTED"
            badgeType="green"
            values={[
              ["Reported Quantity", "20 crates"],
              ["Condition", "Good"],
              ["Submission Time", "29 Sep 2026, 9:52 AM"],
              ["Notes", "All items delivered as planned."],
            ]}
            files={[
              ["POD_Photo.jpg", "POD Photo"],
              ["POD_Doc_Scan.pdf", "POD Document"],
            ]}
          />

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="text-[10px] font-semibold text-[var(--color-text)]">
              Discrepancy History
            </h3>

            <div className="mt-4 space-y-4">
              <TimelineItem
                color="bg-[var(--color-danger-soft)]0"
                title="Discrepancy reported"
                date="29 Sep 2026, 11:05 AM"
                text="Quantity discrepancy detected (20 delivered vs 18 received)."
              />

              <TimelineItem
                color="bg-slate-400"
                title="Under Investigation"
                date="29 Sep 2026, 11:10 AM"
                text="Reviewing driver POD and store confirmation."
              />
            </div>
          </div>
        </div>

        {/* Middle column */}
        <div className="space-y-4">
          <EvidenceCard
            title="Store Manager's Receipt Confirmation"
            badge="CONFIRMED"
            badgeType="amber"
            values={[
              ["Received Quantity", "18 crates"],
              ["Missing / Damaged", "2 crates missing"],
              ["Confirmation Time", "29 Sep 2026, 10:20 AM"],
              ["Notes", "Received 18 crates. 2 crates not received."],
            ]}
            files={[
              ["Receipt_Photo.jpg", "Receipt Photo"],
              ["Store_Receipt_Slip.pdf", "Store Receipt"],
            ]}
          />

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="text-[10px] font-semibold text-[var(--color-text)]">
              Related Information
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              <Detail label="OUTLET" value="Peradeniya Fresh B" />
              <Detail label="ADDRESS" value="Peradeniya, Kandy" />
              <Detail label="CONTACT" value="072 445 6789" />
              <Detail label="BRAND" value="Fresh" />
            </div>
          </div>
        </div>

        {/* Resolution panel */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-[11px] font-semibold text-[var(--color-text)]">
            Resolution & Decision
          </h3>

          <p className="mt-4 text-[8px] font-medium text-[var(--color-text-secondary)]">
            Select Resolution *
          </p>

          <div className="mt-2 space-y-2">
            {resolutionOptions.map((option) => {
              const active = resolution === option;

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[8px] ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-success-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={active}
                    onChange={() => setResolution(option)}
                    className="accent-[var(--color-primary)]"
                  />

                  <span className="text-[var(--color-text)]">{option}</span>
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-[8px] font-medium text-[var(--color-text-secondary)]">
            Resolution Notes *
          </p>

          <div className="mt-2">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={5}
              className="w-full resize-none rounded-md border border-[var(--color-primary)] px-3 py-2 text-[8px] text-[var(--color-text-secondary)] outline-none"
            />

            <p className="mt-1 text-right text-[7px] text-[var(--color-text-muted)]">
              {notes.length} / 500
            </p>
          </div>

          <p className="mt-4 text-[8px] font-medium text-[var(--color-text-secondary)]">
            Notify Relevant Parties
          </p>

          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-[8px] text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                defaultChecked
                className="accent-[var(--color-primary)]"
              />
              Notify Driver (Tharindu Silva)
            </label>

            <label className="flex items-center gap-2 text-[8px] text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                defaultChecked
                className="accent-[var(--color-primary)]"
              />
              Notify Store Manager (Peradeniya Fresh B)
            </label>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[9px] text-[var(--color-text-secondary)]">
              Cancel
            </button>

            <button className="rounded-md bg-[var(--color-success-soft)]0 py-2 text-[9px] font-medium text-white transition hover:bg-[var(--color-primary-hover)]">
              Save Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, change, type, icon }) => {
  const styles = {
    green: {
      icon: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      text: "text-[var(--color-success)]",
    },
    amber: {
      icon: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      text: "text-[var(--color-warning)]",
    },
    red: {
      icon: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
      text: "text-[var(--color-danger)]",
    },
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] ${styles[type].icon}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[8px] text-[var(--color-text-secondary)]">{title}</p>

          <p className="text-[20px] font-bold leading-none text-[var(--color-text)]">
            {value}
          </p>

          <p className={`mt-1 text-[7px] ${styles[type].text}`}>
            {change}
          </p>
        </div>

        <span className="ml-auto text-[var(--color-text-muted)]">›</span>
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => {
  return (
    <div>
      <p className="text-[7px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-[8px] font-semibold text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
};

const EvidenceCard = ({
  title,
  badge,
  badgeType,
  values,
  files,
}) => {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-[var(--color-text)]">
          {title}
        </h3>

        <span
          className={`rounded px-2 py-1 text-[7px] font-semibold ${
            badgeType === "green"
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {values.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4"
          >
            <span className="text-[7px] text-[var(--color-text-muted)]">{label}</span>

            <span className="max-w-[65%] text-right text-[8px] font-medium text-[var(--color-text)]">
              {value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[7px] font-semibold text-[var(--color-text-muted)]">
        EVIDENCE FILES
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {files.map(([filename, title]) => (
          <div key={filename}>
            <div className="flex h-20 items-center justify-center rounded-md bg-[var(--color-surface-soft)] text-[8px] text-[var(--color-text-muted)]">
              {title}
            </div>

            <p className="mt-1 truncate text-[7px] text-[var(--color-text-muted)]">
              {filename}
            </p>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[8px] font-medium text-[var(--color-success)]">
        ◉ View All Evidence
      </button>
    </div>
  );
};

const TimelineItem = ({ color, title, date, text }) => {
  return (
    <div className="flex gap-3">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />

      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[8px] font-semibold text-[var(--color-text)]">
            {title}
          </p>

          <span className="text-[7px] text-[var(--color-text-muted)]">{date}</span>
        </div>

        <p className="mt-1 text-[7px] text-[var(--color-text-muted)]">{text}</p>
      </div>
    </div>
  );
};

export default ReceiptDiscrepancyResolution;