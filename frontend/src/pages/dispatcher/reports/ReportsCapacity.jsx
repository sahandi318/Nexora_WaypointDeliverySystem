import { useState } from "react";

import DeliveryReports from "./DeliveryReports";
import ReceiptDiscrepancyResolution from "./ReceiptDiscrepancyResolution";
import FutureCapacityPlanning from "./FutureCapacityPlanning";

function ReportsCapacity() {
  const [activeTab, setActiveTab] = useState("delivery");

  return (
    <div>
      <h1>Reports & Capacity</h1>

      {/* Report tabs */}
      <div>
        <button onClick={() => setActiveTab("delivery")}>
          Delivery Reports
        </button>

        <button onClick={() => setActiveTab("discrepancy")}>
          Receipt Discrepancy Resolution
        </button>

        <button onClick={() => setActiveTab("capacity")}>
          Future Capacity Planning
        </button>
      </div>

      {/* Display the selected tab */}
      {activeTab === "delivery" && <DeliveryReports />}

      {activeTab === "discrepancy" && (
        <ReceiptDiscrepancyResolution />
      )}

      {activeTab === "capacity" && <FutureCapacityPlanning />}
    </div>
  );
}

export default ReportsCapacity;