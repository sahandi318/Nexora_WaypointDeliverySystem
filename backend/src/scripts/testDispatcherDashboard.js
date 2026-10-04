import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import prisma from "../config/database.js";
import dispatcherRoutes from "../routes/dispatcherRoutes.js";
import { createAccessToken } from "../utils/jwt.js";
import { getDispatcherDashboardData, validateDispatcherDate } from "../services/dispatcherDashboardService.js";

const app = express();
app.use(express.json());
app.use("/api/dispatcher", dispatcherRoutes);
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ success: false, message: error.message });
});

// Read-only integration checks: no seeds, user edits, or operational writes.
try {
  const actor = await prisma.user.findFirst({
    where: { role: "DISPATCHER", isActive: true, mustChangePassword: false, depot: { isActive: true } },
    include: { depot: true },
  });
  assert.ok(actor, "An active Dispatcher with an active depot is required for this read-only test.");
  const token = createAccessToken(actor);
  const get = (path) => request(app).get(`/api/dispatcher/${path}`).set("Authorization", `Bearer ${token}`);
  assert.equal((await request(app).get("/api/dispatcher/dashboard")).status, 401);
  const response = await get("dashboard");
  assert.equal(response.status, 200);
  const data = response.body.data;
  const base = { outlet: { depotId: actor.depotId } };
  const confirmed = await prisma.storeOrder.count({ where: { ...base, status: "CONFIRMED" } });
  const allocated = await prisma.storeOrder.count({ where: { ...base, status: "CONFIRMED", deliveryAllocations: { some: { status: { in: ["ALLOCATED", "PUBLISHED"] } } } } });
  const deferred = await prisma.storeOrder.count({ where: { ...base, status: "DEFERRED" } });
  assert.deepEqual(data.summary, { confirmedOrders: confirmed, allocatedOrders: allocated, unallocatedOrders: confirmed - allocated, deferredOrders: deferred });
  assert.equal(data.readiness.loadingNow, null, "Unavailable telemetry must not be fabricated as zero");
  const monitoring = await get("live-monitoring?status=ALL");
  assert.equal(monitoring.status, 200);
  assert.deepEqual(data.trips.map((trip) => trip.tripCode).sort(), monitoring.body.trips.map((trip) => trip.tripCode).sort());
  assert.ok(monitoring.body.trips.every((trip) => trip.depot.id === actor.depotId));
  assert.ok(monitoring.body.depots.every((depot) => depot.id === actor.depotId));
  const forged = await get("live-monitoring?depotId=2147483647&status=ALL");
  assert.equal(forged.status, 200);
  assert.ok(forged.body.trips.every((trip) => trip.depot.id === actor.depotId));
  assert.equal((await get("dashboard?depotCode=FOREIGN_DEPOT")).status, 403);
  assert.equal((await get("dashboard?date=2026-02-30")).status, 400);
  assert.equal((await get("live-monitoring?date=bad-date")).status, 400);
  assert.equal((await get("live-monitoring?status=unknown")).status, 400);
  const date = "2099-12-31";
  const dated = await get(`dashboard?date=${date}`);
  assert.equal(dated.status, 200);
  assert.equal(dated.body.data.summary.confirmedOrders, await prisma.storeOrder.count({ where: { ...base, status: "CONFIRMED", effectiveDispatchDate: new Date(`${date}T00:00:00Z`) } }));
  assert.ok(dated.body.data.trips.every((trip) => trip.deliveryDate.startsWith(date)));
  const datedMonitoring = await get(`live-monitoring?date=${date}`);
  assert.equal(datedMonitoring.status, 200);
  assert.ok(datedMonitoring.body.trips.every((trip) => trip.deliveryDate.startsWith(date)));
  const foreignTrip = await prisma.liveTrip.findFirst({ where: { depotId: { not: actor.depotId } } });
  if (foreignTrip) assert.equal((await get(`live-monitoring/${foreignTrip.tripCode}`)).status, 404);
  await assert.rejects(() => getDispatcherDashboardData({ ...actor, depotId: null }), { status: 403 });
  assert.throws(() => validateDispatcherDate("2026-13-01"));
  for (const status of ["ACTIVE", "DELAYED", "OFFLINE"]) {
    const filtered = await get(`live-monitoring?status=${status}`);
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.trips.every((trip) => status === "ACTIVE" ? trip.status !== "COMPLETED" : trip.status === status));
  }
  console.log("PASS: dashboard real database counts, monitoring parity, dates/status filters, depot isolation, missing context, and unauthenticated rejection.");
} catch (error) {
  console.error("Dispatcher dashboard checks failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
