import assert from "node:assert/strict";
import fs from "node:fs/promises";
import express from "express";
import request from "supertest";
import prisma from "../config/database.js";
import { getDispatcherPlanningSnapshot } from "../services/dispatcherPlanningService.js";
import dispatcherRoutes from "../routes/dispatcherRoutes.js";
import { createAccessToken } from "../utils/jwt.js";

const ids = rows => rows.map(row => row.id).sort((a, b) => a - b);
const day = value => value.toISOString().slice(0, 10);
const app = express();
app.use("/api/dispatcher", dispatcherRoutes);
const fixtureOrderIds = [];

// No publication or auth mocks. Cleanup deletes only this run's test orders.
async function main() {
  const dispatcher = await prisma.user.findFirst({
    where: { role: "DISPATCHER", isActive: true, mustChangePassword: false, depotId: { not: null } },
    include: { depot: true }, orderBy: { id: "asc" },
  });
  assert.ok(dispatcher?.depot, "Fixture required: active depot-assigned Dispatcher with completed password change");
  const ownOutlet = await prisma.outlet.findFirst({ where: { depotId: dispatcher.depotId, isActive: true } });
  const foreignOutlet = await prisma.outlet.findFirst({ where: { depotId: { not: dispatcher.depotId }, isActive: true } });
  const manager = await prisma.user.findFirst({ where: { role: "STORE_MANAGER", isActive: true } });
  assert.ok(ownOutlet && foreignOutlet && manager, "Fixtures require outlets in two depots and a Store Manager");
  const runId = Date.now();
  const fixtureDate = new Date(`${day(new Date())}T00:00:00.000Z`);
  for (const [index, outlet] of [ownOutlet, foreignOutlet].entries()) {
    const order = await prisma.storeOrder.create({ data: {
      orderCode: `TEST-PLAN-${runId}-${index}`,
      outletId: outlet.id, createdByUserId: manager.id,
      status: "CONFIRMED", orderType: "AMBIENT_DRY", cutoffDecision: "ON_TIME",
      requestedDispatchDate: fixtureDate, effectiveDispatchDate: fixtureDate,
      totalUnits: 1, estimatedWeightKg: 1, estimatedVolumeM3: 0.001,
    } });
    fixtureOrderIds.push(order.id);
  }
  const orders = await prisma.storeOrder.findMany({
    where: { status: { in: ["SUBMITTED", "CONFIRMED", "DEFERRED"] } },
    include: { outlet: { include: { depot: true } } },
  });
  const own = orders.filter(o => o.outlet.depotId === dispatcher.depotId);
  const foreign = orders.find(o => o.outlet.depotId && o.outlet.depotId !== dispatcher.depotId);
  assert.ok(own.length && foreign, "Fixtures required: planning orders in own and foreign depots");
  const drivers = await prisma.user.findMany({ where: { role: "DRIVER", isActive: true, depotId: dispatcher.depotId } });
  const trips = await prisma.liveTrip.findMany({ where: { depotId: dispatcher.depotId } });
  // Current fleet source is organizer CSV, not the Prisma Vehicle table.
  const csv = (await fs.readFile(new URL("../../../data/vehicles.csv", import.meta.url), "utf8")).trim().split(/\r?\n/);
  const parse = line => [...line.matchAll(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)].map(m => m[1].replace(/^"|"$/g, "").replaceAll('""', '"'));
  const headers = parse(csv.shift().replace(/^\uFEFF/, ""));
  const fleet = csv.map(line => Object.fromEntries(parse(line).map((v, i) => [headers[i], v]))).filter(v => v.depot === dispatcher.depot.name);
  assert.ok(drivers.length && fleet.length, "Fixtures required: real active drivers and organizer fleet");
  const dates = [...new Set([...own, foreign].map(o => day(o.effectiveDispatchDate)))];
  const snapshots = await Promise.all(dates.map(date => getDispatcherPlanningSnapshot({ date, depotName: dispatcher.depot.name }, dispatcher)));
  let passed = 0, failed = 0;
  async function check(name, run) {
    try { await run(); passed++; console.log(`PASS ${name}`); }
    catch (e) { failed++; console.error(`FAIL ${name}: ${e.message}`); }
  }
  await check("service filtering and summaries match persisted scoped orders", () => {
    for (const s of snapshots) {
      const expected = own.filter(o => day(o.effectiveDispatchDate) === s.date);
      const deferred = expected.filter(o => o.status === "DEFERRED");
      assert.deepEqual(ids(s.orders), ids(expected));
      assert.ok(s.orders.every(o => o.depotId === dispatcher.depotId));
      assert.deepEqual(ids(s.deferredOrders), ids(deferred));
      // Current projection labels both SUBMITTED and CONFIRMED as Confirmed.
      assert.equal(s.summary.confirmedOrders, expected.length - deferred.length);
      assert.equal(s.summary.deferredOrders, deferred.length);
      const allocated = s.suggestedTrips.reduce((n, t) => n + t.orderIds.length, 0);
      assert.equal(s.summary.allocatedOrders, allocated);
      assert.equal(s.summary.unallocatedOrders, expected.length - deferred.length - allocated);
      assert.equal(s.summary.plannedTrips, s.suggestedTrips.length);
    }
  });
  await check("drivers match active database users", () => {
    for (const s of snapshots) {
      assert.deepEqual(ids(s.drivers), ids(drivers));
      for (const d of s.drivers) {
        const row = drivers.find(r => r.id === d.id);
        assert.equal(d.name, row.fullName);
        assert.equal(d.userId, row.userId);
        assert.equal(d.depotId, row.depotId);
      }
    }
  });
  await check("real fleet availability reflects persisted live trips", () => {
    for (const s of snapshots) {
      assert.deepEqual(s.fleet.map(v => v.vehicleId).sort(), fleet.map(v => v.vehicle_id).sort());
      for (const v of s.fleet) {
        const row = fleet.find(r => r.vehicle_id === v.vehicleId);
        assert.equal(v.maxWeightKg, Number(row.weight_cap_kg));
        assert.equal(v.maxVolumeM3, Number(row.volume_cap_m3));
        const used = trips.filter(t => day(t.deliveryDate) === s.date && t.vehicleCode === v.vehicleId && t.status !== "COMPLETED").length;
        assert.equal(v.tripsLeft, Math.max(0, 2 - used));
        assert.equal(v.availability, used >= 2 ? "Unavailable" : "Available");
      }
    }
  });
  await check("suggestions reference persisted orders, real vehicles and drivers", () => {
    assert.ok(snapshots.some(s => s.suggestedTrips.length), "Fixture required: at least one suggested trip");
    // Suggestions are computed proposals, not persisted PlannedTrip records.
    for (const s of snapshots) for (const t of s.suggestedTrips) {
      assert.equal(t.depot, dispatcher.depot.name);
      assert.ok(fleet.some(v => v.vehicle_id === t.vehicleId));
      if (t.driverUserId) assert.ok(drivers.some(d => d.id === t.driverUserId));
      for (const id of t.orderIds) assert.ok(own.some(o => o.id === id && day(o.effectiveDispatchDate) === s.date && o.status !== "DEFERRED"));
      assert.deepEqual(t.stopsList.map(stop => stop.orderId).sort(), t.orderIds.map(id => own.find(o => o.id === id).orderCode).sort());
      assert.ok(Number.isFinite(t.estimatedDistanceKm));
      assert.ok(Number.isFinite(t.estimatedDurationMinutes));
      assert.ok(Number.isFinite(t.estimatedFuelL));
      assert.ok(t.stopsList.every(stop => Number.isFinite(stop.serviceAllowanceMinutes)));
      assert.equal(t.dataSource, "Waypoint organizer General Data");
    }
    for (const s of snapshots) {
      assert.equal(s.organizerDataset?.files?.outlets, 120);
      assert.equal(s.organizerDataset?.files?.vehicles, 60);
      assert.equal(s.organizerDataset?.files?.roadConditions, 10920);
    }
  });
  const token = createAccessToken(dispatcher);
  for (const depot of [undefined, "ALL", foreign.outlet.depot.name]) {
    await check(`authenticated depot isolation: ${depot ?? "omitted filter"}`, async () => {
      const query = { date: day(foreign.effectiveDispatchDate), ...(depot === undefined ? {} : { depot }) };
      const res = await request(app).get("/api/dispatcher/planning").query(query).set("Authorization", `Bearer ${token}`);
      if (depot && depot !== "ALL" && res.status === 403) return;
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.orders.every(o => o.depotId === dispatcher.depotId), "API exposed Store Manager orders outside authenticated Dispatcher depot");
      assert.deepEqual(ids(res.body.orders), ids(own.filter(o => day(o.effectiveDispatchDate) === query.date)));
      assert.ok(res.body.fleet.every(v => v.depot === dispatcher.depot.name), "API fleet is not scoped to authenticated depot");
      assert.deepEqual(ids(res.body.drivers), ids(drivers), "API drivers must match authenticated depot");
      assert.deepEqual(ids(res.body.depots), [dispatcher.depotId], "API depot choices must not broaden access");
      const expected = snapshots.find(s => s.date === query.date);
      assert.deepEqual(res.body.suggestedTrips, expected.suggestedTrips);
      assert.deepEqual(res.body.summary, expected.summary);
      assert.deepEqual(res.body.fleet, expected.fleet);
    });
  }
  await check("missing or inactive Dispatcher depot is rejected", async () => {
    await assert.rejects(() => getDispatcherPlanningSnapshot({}, { ...dispatcher, depotId: null }), { status: 403 });
    await assert.rejects(() => getDispatcherPlanningSnapshot({}, { ...dispatcher, depot: { ...dispatcher.depot, isActive: false } }), { status: 403 });
    await assert.rejects(() => getDispatcherPlanningSnapshot({}), { status: 401 });
  });
  await check("ADMIN retains all-depot and selected-depot access", async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true, mustChangePassword: false } });
    assert.ok(admin, "An active Admin is required to verify Admin access");
    for (const depot of [undefined, "ALL", foreign.outlet.depot.name]) {
      const query = { date: day(foreign.effectiveDispatchDate), ...(depot === undefined ? {} : { depot }) };
      const res = await request(app).get("/api/dispatcher/planning").query(query).set("Authorization", `Bearer ${createAccessToken(admin)}`);
      assert.equal(res.status, 200);
      const expected = orders.filter(o => day(o.effectiveDispatchDate) === query.date && (!depot || depot === "ALL" || o.outlet.depot?.name === depot));
      assert.deepEqual(ids(res.body.orders), ids(expected));
      assert.ok(res.body.orders.some(o => o.id === foreign.id));
    }
  });
  console.log(`Dispatcher planning: ${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}
main().catch(e => { console.error("Planning integration failed:", e.message); process.exitCode = 1; })
  .finally(async () => {
    try {
      if (fixtureOrderIds.length) {
        await prisma.storeOrder.deleteMany({ where: { id: { in: fixtureOrderIds } } });
      }
    } finally { await prisma.$disconnect(); }
  });
