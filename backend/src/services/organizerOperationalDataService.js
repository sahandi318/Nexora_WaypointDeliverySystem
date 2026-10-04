import fs from "node:fs/promises";

const FILES = Object.freeze({
  calendar: "calendar.csv",
  districtTravel: "district_travel.csv",
  outlets: "outlets.csv",
  roadConditions: "road_conditions.csv",
  serviceAllowance: "service_allowance.csv",
  trafficSpeed: "traffic_speed.csv",
  vehicles: "vehicles.csv",
});

let cachePromise = null;

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

async function readCsv(fileName) {
  const url = new URL(`../../../data/${fileName}`, import.meta.url);
  const raw = await fs.readFile(url, "utf8");
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolean01(value) {
  return String(value) === "1";
}

function requestedDateText(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthDay(dateText) {
  return String(dateText).slice(5, 10);
}

function selectDateRow(rows, dateText, { district = null } = {}) {
  const scoped = district
    ? rows.filter((row) => normalized(row.district) === normalized(district))
    : rows;

  if (!scoped.length) {
    return { row: null, source: "UNAVAILABLE", sourceDate: null };
  }

  const exact = scoped.find((row) => row.date === dateText);
  if (exact) {
    return { row: exact, source: "EXACT_DATE", sourceDate: exact.date };
  }

  const seasonal = scoped
    .filter((row) => monthDay(row.date) === monthDay(dateText))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (seasonal) {
    return {
      row: seasonal,
      source: "SEASONAL_FALLBACK",
      sourceDate: seasonal.date,
    };
  }

  const latest = [...scoped].sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    row: latest,
    source: "LATEST_AVAILABLE_FALLBACK",
    sourceDate: latest.date,
  };
}


function dayOfYear(dateText) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / 86400000) + 1;
}

function isoDow(dateText) {
  const day = new Date(`${dateText}T00:00:00.000Z`).getUTCDay();
  return (day + 6) % 7;
}

function selectCalendarRow(rows, dateText) {
  const exact = rows.find((row) => row.date === dateText);
  if (exact) {
    return { row: exact, source: "EXACT_DATE", sourceDate: exact.date };
  }

  const targetDow = isoDow(dateText);
  const targetDay = dayOfYear(dateText);
  const sameWeekday = rows
    .filter((row) => Number(row.dow) === targetDow)
    .map((row) => {
      const rowDay = dayOfYear(row.date);
      const direct = Math.abs(rowDay - targetDay);
      const seasonalDistance = Math.min(direct, 366 - direct);
      return { row, seasonalDistance };
    })
    .sort((left, right) =>
      left.seasonalDistance - right.seasonalDistance ||
      right.row.date.localeCompare(left.row.date)
    )[0];

  if (sameWeekday) {
    return {
      row: sameWeekday.row,
      source: "SEASONAL_WEEKDAY_FALLBACK",
      sourceDate: sameWeekday.row.date,
    };
  }

  return selectDateRow(rows, dateText);
}

function buildIndexes(data) {
  const districtTravel = new Map();
  for (const row of data.districtTravel) {
    districtTravel.set(
      `${normalized(row.depot)}|${normalized(row.district)}`,
      row
    );
  }

  const serviceAllowance = new Map();
  for (const row of data.serviceAllowance) {
    serviceAllowance.set(
      `${normalized(row.brand)}|${normalized(row.dock_type)}`,
      row
    );
  }

  const trafficSpeed = new Map();
  for (const row of data.trafficSpeed) {
    trafficSpeed.set(
      `${normalized(row.district)}|${Number(row.hour)}|${Number(row.monsoon)}`,
      row
    );
  }

  const outlets = new Map(
    data.outlets.map((row) => [normalized(row.outlet_id), row])
  );
  const vehicles = new Map(
    data.vehicles.map((row) => [normalized(row.vehicle_id), row])
  );

  return { districtTravel, serviceAllowance, trafficSpeed, outlets, vehicles };
}

async function loadOrganizerData() {
  if (!cachePromise) {
    cachePromise = Promise.all(
      Object.entries(FILES).map(async ([key, fileName]) => [key, await readCsv(fileName)])
    ).then((entries) => {
      const data = Object.fromEntries(entries);
      return { ...data, indexes: buildIndexes(data) };
    });
  }
  return cachePromise;
}

export function clearOrganizerOperationalDataCache() {
  cachePromise = null;
}

export async function getOrganizerVehicleRows() {
  const data = await loadOrganizerData();
  return data.vehicles;
}

export async function getOrganizerVehicleRow(vehicleId) {
  const data = await loadOrganizerData();
  return data.indexes.vehicles.get(normalized(vehicleId)) ?? null;
}

export async function getOrganizerOutletRow(outletCode) {
  const data = await loadOrganizerData();
  return data.indexes.outlets.get(normalized(outletCode)) ?? null;
}

export async function getOrganizerDatasetSummary() {
  const data = await loadOrganizerData();
  const calendarDates = data.calendar.map((row) => row.date).sort();
  const districts = [...new Set(data.districtTravel.map((row) => row.district))].sort();

  return {
    source: "WAYPOINT_ORGANIZER_GENERAL_DATA",
    files: {
      outlets: data.outlets.length,
      vehicles: data.vehicles.length,
      calendar: data.calendar.length,
      districtTravel: data.districtTravel.length,
      roadConditions: data.roadConditions.length,
      trafficSpeed: data.trafficSpeed.length,
      serviceAllowance: data.serviceAllowance.length,
    },
    calendarRange: {
      from: calendarDates[0] ?? null,
      to: calendarDates.at(-1) ?? null,
    },
    districts,
  };
}

export async function getOrganizerPlanningContext({
  date,
  district,
  depot,
  brand,
  dockType,
  hour = 6,
  isFirstStop = true,
} = {}) {
  const data = await loadOrganizerData();
  const dateText = requestedDateText(date);

  const calendarSelection = selectCalendarRow(data.calendar, dateText);
  const calendar = calendarSelection.row;
  const monsoon = Number(calendar?.monsoon || 0);

  const roadSelection = selectDateRow(data.roadConditions, dateText, {
    district,
  });
  const road = roadSelection.row;

  const travel = data.indexes.districtTravel.get(
    `${normalized(depot)}|${normalized(district)}`
  );

  const normalizedHour = Math.max(0, Math.min(23, Math.floor(numberOr(hour, 6))));
  const traffic =
    data.indexes.trafficSpeed.get(
      `${normalized(district)}|${normalizedHour}|${monsoon}`
    ) ??
    data.indexes.trafficSpeed.get(
      `${normalized(district)}|${normalizedHour}|0`
    ) ??
    null;

  const service = data.indexes.serviceAllowance.get(
    `${normalized(brand)}|${normalized(dockType)}`
  );

  const baseDistanceKm = travel
    ? numberOr(
        isFirstStop ? travel.depot_to_district_km : travel.inter_stop_km,
        0
      )
    : 0;
  const baseTravelMinutes = travel
    ? numberOr(
        isFirstStop
          ? travel.depot_to_district_freeflow_min
          : travel.inter_stop_freeflow_min,
        0
      )
    : 0;

  const speedIndex = Math.max(25, Math.min(100, numberOr(traffic?.speed_index, 100)));
  const disruptionIndex = Math.max(
    40,
    Math.min(100, numberOr(road?.disruption_index, 100))
  );

  const trafficFactor = 100 / speedIndex;
  const disruptionFactor = 100 / disruptionIndex;
  const adjustedTravelMinutes = Math.max(
    baseTravelMinutes,
    Math.ceil(baseTravelMinutes * trafficFactor * disruptionFactor)
  );
  const serviceAllowanceMinutes = numberOr(service?.service_allowance_min, 20);

  return {
    requestedDate: dateText,
    calendar: calendar
      ? {
          source: calendarSelection.source,
          sourceDate: calendarSelection.sourceDate,
          dayName: calendar.dow_name,
          isWeekend: boolean01(calendar.is_weekend),
          isPayday: boolean01(calendar.is_payday),
          festival: calendar.festival || null,
          festivalRamp: numberOr(calendar.festival_ramp, 0),
          isHoliday: boolean01(calendar.is_holiday),
          monsoon: boolean01(calendar.monsoon),
          isOperating: boolean01(calendar.is_operating),
        }
      : null,
    road: {
      source: roadSelection.source,
      sourceDate: roadSelection.sourceDate,
      disruptionIndex: numberOr(road?.disruption_index, 100),
    },
    traffic: {
      hour: normalizedHour,
      monsoon,
      speedIndex: numberOr(traffic?.speed_index, 100),
    },
    districtTravel: travel
      ? {
          roadClass: travel.road_class,
          freeFlowKmh: numberOr(travel.free_flow_kmh, 0),
          distanceKm: baseDistanceKm,
          freeFlowMinutes: baseTravelMinutes,
          source: isFirstStop ? "DEPOT_TO_DISTRICT" : "INTER_STOP",
        }
      : null,
    service: {
      allowanceMinutes: serviceAllowanceMinutes,
      brand: brand || null,
      dockType: dockType || null,
      matched: Boolean(service),
    },
    adjustedTravelMinutes,
  };
}

function parseClock(value, fallback = 6 * 60) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Math.max(0, Math.min(23, Number(match[1])));
  const minutes = Math.max(0, Math.min(59, Number(match[2])));
  return hours * 60 + minutes;
}

function clockLabel(totalMinutes) {
  const normalizedMinutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function buildOrganizerTripEstimate({
  date,
  depot,
  vehicle,
  orders,
} = {}) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const vehicleRow = vehicle?.vehicleId
    ? (await loadOrganizerData()).indexes.vehicles.get(normalized(vehicle.vehicleId))
    : null;

  if (!safeOrders.length) {
    return {
      departure: null,
      totalDistanceKm: 0,
      totalTravelMinutes: 0,
      totalServiceMinutes: 0,
      totalDurationMinutes: 0,
      estimatedFuelL: 0,
      weeklyFuelQuotaL: numberOr(vehicleRow?.weekly_fuel_quota_l, 0),
      fuelQuotaPercent: 0,
      stops: [],
      warnings: [],
    };
  }

  const departureMinutes = Math.min(
    ...safeOrders.map((order) => parseClock(order.windowOpen, 6 * 60))
  );
  let currentMinutes = departureMinutes;
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  let totalServiceMinutes = 0;
  const warnings = [];
  const stops = [];
  let previousDistrict = null;

  for (const [index, order] of safeOrders.entries()) {
    const sameDistrict =
      index > 0 && normalized(previousDistrict) === normalized(order.district);
    const planning = await getOrganizerPlanningContext({
      date,
      district: order.district,
      depot,
      brand: order.brand,
      dockType: order.dockType,
      hour: Math.floor(currentMinutes / 60) % 24,
      isFirstStop: index === 0 || !sameDistrict,
    });

    let arrivalMinutes = currentMinutes + planning.adjustedTravelMinutes;
    const windowOpen = parseClock(order.windowOpen, arrivalMinutes);
    const windowClose = parseClock(order.windowClose, 23 * 60 + 59);

    if (arrivalMinutes < windowOpen) arrivalMinutes = windowOpen;

    const lateByMinutes = Math.max(0, arrivalMinutes - windowClose);
    const serviceMinutes = planning.service.allowanceMinutes;

    totalDistanceKm += planning.districtTravel?.distanceKm || 0;
    totalTravelMinutes += planning.adjustedTravelMinutes;
    totalServiceMinutes += serviceMinutes;

    if (lateByMinutes > 0) {
      warnings.push(`${order.outletId} is estimated ${lateByMinutes} min after its delivery window.`);
    }
    if (planning.calendar && !planning.calendar.isOperating) {
      warnings.push(`${order.outletId} falls on a non-operating organizer calendar day.`);
    }
    if (!planning.districtTravel) {
      warnings.push(`No district travel reference exists for ${depot} → ${order.district}.`);
    }

    stops.push({
      orderId: order.orderId,
      outletId: order.outletId,
      district: order.district,
      plannedArrival: clockLabel(arrivalMinutes),
      distanceKm: Number((planning.districtTravel?.distanceKm || 0).toFixed(1)),
      travelMinutes: planning.adjustedTravelMinutes,
      serviceAllowanceMinutes: serviceMinutes,
      lateByMinutes,
      planningContext: planning,
    });

    currentMinutes = arrivalMinutes + serviceMinutes;
    previousDistrict = order.district;
  }

  const kmPerL = numberOr(vehicleRow?.km_per_l, vehicle?.kmPerL || 0);
  const weeklyFuelQuotaL = numberOr(
    vehicleRow?.weekly_fuel_quota_l,
    vehicle?.weeklyFuelQuotaL || 0
  );
  const estimatedFuelL = kmPerL > 0 ? totalDistanceKm / kmPerL : 0;
  const fuelQuotaPercent = weeklyFuelQuotaL > 0
    ? (estimatedFuelL / weeklyFuelQuotaL) * 100
    : 0;

  if (weeklyFuelQuotaL > 0 && estimatedFuelL > weeklyFuelQuotaL) {
    warnings.push("Estimated trip fuel exceeds the vehicle weekly fuel quota.");
  }

  return {
    departure: clockLabel(departureMinutes),
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalTravelMinutes,
    totalServiceMinutes,
    totalDurationMinutes: Math.max(0, currentMinutes - departureMinutes),
    estimatedFuelL: Number(estimatedFuelL.toFixed(1)),
    kmPerL,
    weeklyFuelQuotaL,
    fuelQuotaPercent: Number(fuelQuotaPercent.toFixed(1)),
    stops,
    warnings: [...new Set(warnings)],
  };
}
