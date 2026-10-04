import assert from "node:assert/strict";

import {
  buildOrganizerTripEstimate,
  getOrganizerDatasetSummary,
  getOrganizerOutletRow,
  getOrganizerPlanningContext,
  getOrganizerVehicleRows,
} from "../services/organizerOperationalDataService.js";

async function main() {
  console.log("\n==========================================");
  console.log(" Waypoint Organizer General Data Tests");
  console.log("==========================================");

  const summary = await getOrganizerDatasetSummary();
  assert.deepEqual(summary.files, {
    outlets: 120,
    vehicles: 60,
    calendar: 910,
    districtTravel: 12,
    roadConditions: 10920,
    trafficSpeed: 576,
    serviceAllowance: 9,
  });
  assert.equal(summary.calendarRange.from, "2024-01-01");
  assert.equal(summary.calendarRange.to, "2026-06-28");
  console.log("PASS all seven organizer datasets are loaded with expected row counts");

  const [outlet, vehicles] = await Promise.all([
    getOrganizerOutletRow("OUT001"),
    getOrganizerVehicleRows(),
  ]);
  assert.equal(outlet?.brand, "Fresh");
  assert.equal(outlet?.district, "Colombo");
  assert.equal(outlet?.depot, "Peliyagoda");
  assert.equal(vehicles.length, 60);
  assert.equal(vehicles[0].vehicle_id, "VEH001");
  console.log("PASS outlet and vehicle organizer sources resolve correctly");

  const exact = await getOrganizerPlanningContext({
    date: "2024-01-01",
    district: "Colombo",
    depot: "Peliyagoda",
    brand: "Fresh",
    dockType: "street",
    hour: 0,
    isFirstStop: true,
  });

  assert.equal(exact.calendar?.source, "EXACT_DATE");
  assert.equal(exact.districtTravel?.distanceKm, 12);
  assert.equal(exact.districtTravel?.freeFlowMinutes, 24);
  assert.equal(exact.traffic.speedIndex, 94);
  assert.equal(exact.road.disruptionIndex, 100);
  assert.equal(exact.service.allowanceMinutes, 16);
  assert.equal(exact.adjustedTravelMinutes, 26);
  console.log("PASS travel, traffic, road and service allowance data drive the planning context");

  const future = await getOrganizerPlanningContext({
    date: "2026-10-04",
    district: "Colombo",
    depot: "Peliyagoda",
    brand: "Fresh",
    dockType: "rear_dock",
    hour: 5,
    isFirstStop: true,
  });
  assert.equal(future.calendar?.source, "SEASONAL_WEEKDAY_FALLBACK");
  assert.equal(future.calendar?.dayName, "Sun");
  assert.equal(future.calendar?.isOperating, false);
  assert.equal(future.road?.source, "SEASONAL_FALLBACK");
  assert.equal(future.road?.sourceDate?.slice(5), "10-04");
  console.log("PASS dates beyond the organizer range preserve seasonal/weekday operating context safely");

  const estimate = await buildOrganizerTripEstimate({
    date: "2024-01-01",
    depot: "Peliyagoda",
    vehicle: { vehicleId: "VEH001" },
    orders: [
      {
        orderId: "ORD-A",
        outletId: "OUT001",
        district: "Colombo",
        brand: "Fresh",
        dockType: "street",
        windowOpen: "05:00",
        windowClose: "07:30",
      },
      {
        orderId: "ORD-B",
        outletId: "OUT005",
        district: "Colombo",
        brand: "Fresh",
        dockType: "rear_dock",
        windowOpen: "04:00",
        windowClose: "07:45",
      },
    ],
  });

  assert.equal(estimate.stops.length, 2);
  assert.equal(estimate.totalDistanceKm, 16);
  assert.ok(estimate.totalDurationMinutes > 0);
  assert.ok(estimate.estimatedFuelL > 0);
  assert.equal(estimate.kmPerL, 4.7);
  assert.equal(estimate.weeklyFuelQuotaL, 340);
  assert.equal(estimate.stops[0].serviceAllowanceMinutes, 16);
  assert.equal(estimate.stops[1].serviceAllowanceMinutes, 15);
  console.log("PASS trip estimates use distance, traffic, disruption, service time and vehicle fuel data");

  console.log("------------------------------------------");
  console.log("Passed Waypoint organizer General Data regression tests");
}

main().catch((error) => {
  console.error("FAIL organizer General Data integration:", error);
  process.exitCode = 1;
});
