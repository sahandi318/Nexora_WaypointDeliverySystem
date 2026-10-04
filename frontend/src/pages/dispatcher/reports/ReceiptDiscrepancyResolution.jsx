import React, { useState } from "react";

const ReceiptDiscrepancyResolution = () => {
  const [resolution, setResolution] = useState(
    "Arrange replacement delivery"
  );

  const [notes, setNotes] = useState(
    "Store confirmed receiving 18 crates. 2 crates missing. Arranging replacement delivery on next available run."
  );

  // Keeps the last saved frontend values until backend persistence is connected.
  const [savedResolution, setSavedResolution] = useState(
    "Arrange replacement delivery"
  );
  const [savedNotes, setSavedNotes] = useState(
    "Store confirmed receiving 18 crates. 2 crates missing. Arranging replacement delivery on next available run."
  );
  const [saveMessage, setSaveMessage] = useState("");

  // Temporary frontend data. Replace these values with backend data later.
  const discrepancyData = {
    driverReportedQuantity: 20,
    storeReceivedQuantity: 18,
    unit: "crates",
    reportedAt: "29 Sep 2026, 11:05 AM",
  };

  const quantityDifference =
    discrepancyData.driverReportedQuantity -
    discrepancyData.storeReceivedQuantity;

  const hasQuantityDiscrepancy = quantityDifference !== 0;

  const quantityDifferenceText =
    quantityDifference > 0
      ? `${quantityDifference} ${discrepancyData.unit} missing`
      : quantityDifference < 0
      ? `${Math.abs(quantityDifference)} ${discrepancyData.unit} extra`
      : "No quantity difference";

  const handleSaveDecision = () => {
    if (!notes.trim()) {
      setSaveMessage("Please enter resolution notes before saving.");
      return;
    }

    setSavedResolution(resolution);
    setSavedNotes(notes);
    setSaveMessage("Decision saved successfully.");
  };

  const handleCancel = () => {
    setResolution(savedResolution);
    setNotes(savedNotes);
    setSaveMessage("");
  };

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
        <button className="text-[9px] font-semibold text-emerald-600">
          ← Back to Delivery Reports
        </button>

        <div className="flex items-center gap-2 text-[9px]">
          <button className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-border)]
bg-[var(--color-surface)]
text-[var(--color-text-secondary)]">
            ‹
          </button>

          <span className="font-semibold text-slate-700">
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
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-4 py-3 md:grid-cols-4">
          <div>
            <p className="text-[7px] text-slate-400">TRIP DETAILS</p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-semibold text-slate-700">
                TRP005
              </span>

              {hasQuantityDiscrepancy && (
                <span className="rounded bg-red-50 px-2 py-0.5 text-[7px] font-semibold text-red-500">
                  1 ISSUE TO REVIEW
                </span>
              )}
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

              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[7px] font-semibold text-emerald-600">
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

              {hasQuantityDiscrepancy && (
                <span className="rounded bg-red-50 px-2 py-0.5 text-[7px] font-semibold text-red-500">
                  QUANTITY MISMATCH
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity discrepancy alert */}
      {hasQuantityDiscrepancy && (
        <div className="flex items-start justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3">
          <div className="flex gap-2">
            <div className="mt-0.5 text-red-500">⊙</div>

            <div>
              <p className="text-[9px] font-semibold text-red-600">
                Quantity discrepancy detected
              </p>

              <p className="mt-0.5 text-[8px] text-red-500">
                Driver reported delivering{" "}
                {discrepancyData.driverReportedQuantity}{" "}
                {discrepancyData.unit}, but the store manager confirmed
                receiving only {discrepancyData.storeReceivedQuantity}{" "}
                {discrepancyData.unit}.
              </p>
            </div>
          </div>

          <span className="text-[7px] text-slate-400">
            Reported on: {discrepancyData.reportedAt}
          </span>
        </div>
      )}

      {/* Main details and resolution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
        {/* Left column */}
        <div className="space-y-4">
          <EvidenceCard
            title="Driver's Proof of Delivery (POD)"
            badge="SUBMITTED"
            badgeType="green"
            values={[
              ["Reported Quantity", `${discrepancyData.driverReportedQuantity} ${discrepancyData.unit}`],
              ["Condition", "Good"],
              ["Submission Time", "29 Sep 2026, 9:52 AM"],
              ["Notes", "All items delivered as planned."],
            ]}
            files={[
              ["POD_Photo.jpg", "POD Photo"],
              ["POD_Doc_Scan.pdf", "POD Document"],
            ]}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-[10px] font-semibold text-slate-800">
              Discrepancy History
            </h3>

            <div className="mt-4 space-y-4">
              {hasQuantityDiscrepancy && (
                <>
                  <TimelineItem
                    color="bg-red-500"
                    title="Discrepancy reported"
                    date={discrepancyData.reportedAt}
                    text={`Quantity discrepancy detected (${discrepancyData.driverReportedQuantity} delivered vs ${discrepancyData.storeReceivedQuantity} received).`}
                  />

                  <TimelineItem
                    color="bg-slate-400"
                    title="Under Investigation"
                    date="29 Sep 2026, 11:10 AM"
                    text="Reviewing driver POD and store confirmation."
                  />
                </>
              )}
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
              ["Received Quantity", `${discrepancyData.storeReceivedQuantity} ${discrepancyData.unit}`],
              ["Missing / Damaged", quantityDifferenceText],
              ["Confirmation Time", "29 Sep 2026, 10:20 AM"],
              ["Notes", "Received 18 crates. 2 crates not received."],
            ]}
            files={[
              ["Receipt_Photo.jpg", "Receipt Photo"],
              ["Store_Receipt_Slip.pdf", "Store Receipt"],
            ]}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-[10px] font-semibold text-slate-800">
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
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-[11px] font-semibold text-slate-800">
            Resolution & Decision
          </h3>

          <p className="mt-4 text-[8px] font-medium text-slate-500">
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
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={active}
                    onChange={() => setResolution(option)}
                    className="accent-emerald-500"
                  />

                  <span className="text-slate-700">{option}</span>
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-[8px] font-medium text-slate-500">
            Resolution Notes *
          </p>

          <div className="mt-2">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={5}
              className="w-full resize-none rounded-md border border-emerald-400 px-3 py-2 text-[8px] text-slate-600 outline-none"
            />

            <p className="mt-1 text-right text-[7px] text-slate-400">
              {notes.length} / 500
            </p>
          </div>

          <p className="mt-4 text-[8px] font-medium text-slate-500">
            Notify Relevant Parties
          </p>

          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-[8px] text-slate-600">
              <input
                type="checkbox"
                defaultChecked
                className="accent-emerald-500"
              />
              Notify Driver (Tharindu Silva)
            </label>

            <label className="flex items-center gap-2 text-[8px] text-slate-600">
              <input
                type="checkbox"
                defaultChecked
                className="accent-emerald-500"
              />
              Notify Store Manager (Peradeniya Fresh B)
            </label>
          </div>

          {saveMessage && (
            <p
              className={`mt-4 text-[8px] font-medium ${
                saveMessage === "Decision saved successfully."
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {saveMessage}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-200 bg-white py-2 text-[9px] text-slate-500"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveDecision}
              className="rounded-md bg-emerald-500 py-2 text-[9px] font-medium text-white transition hover:bg-emerald-600"
            >
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
      icon: "bg-emerald-50 text-emerald-600",
      text: "text-emerald-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-500",
      text: "text-orange-500",
    },
    red: {
      icon: "bg-red-50 text-red-500",
      text: "text-red-500",
    },
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] ${styles[type].icon}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[8px] text-slate-500">{title}</p>

          <p className="text-[20px] font-bold leading-none text-slate-800">
            {value}
          </p>

          <p className={`mt-1 text-[7px] ${styles[type].text}`}>
            {change}
          </p>
        </div>

        <span className="ml-auto text-slate-400">›</span>
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => {
  return (
    <div>
      <p className="text-[7px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-[8px] font-semibold text-slate-700">
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-slate-800">
          {title}
        </h3>

        <span
          className={`rounded px-2 py-1 text-[7px] font-semibold ${
            badgeType === "green"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
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
            <span className="text-[7px] text-slate-400">{label}</span>

            <span className="max-w-[65%] text-right text-[8px] font-medium text-slate-700">
              {value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[7px] font-semibold text-slate-400">
        EVIDENCE FILES
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {files.map(([filename, title]) => (
          <div key={filename}>
            <div className="flex h-20 items-center justify-center rounded-md bg-slate-100 text-[8px] text-slate-400">
              {title}
            </div>

            <p className="mt-1 truncate text-[7px] text-slate-400">
              {filename}
            </p>
          </div>
        ))}
      </div>

      <button className="mt-3 w-full rounded-md border border-slate-200 bg-white py-2 text-[8px] font-medium text-emerald-600">
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
          <p className="text-[8px] font-semibold text-slate-700">
            {title}
          </p>

          <span className="text-[7px] text-slate-400">{date}</span>
        </div>

        <p className="mt-1 text-[7px] text-slate-400">{text}</p>
      </div>
    </div>
  );
};

export default ReceiptDiscrepancyResolution;