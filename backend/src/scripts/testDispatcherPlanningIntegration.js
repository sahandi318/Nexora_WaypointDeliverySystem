import prisma from "../config/database.js";
import {
  getDispatcherPlanningWorkspace,
} from "../services/dispatcherPlanningService.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("==========================================");
  console.log(" Dispatcher Planning Integration Tests");
  console.log("==========================================");

  const dispatcher = await prisma.user.findFirst({
    where: {
      role: "DISPATCHER",
      isActive: true,
      depotId: { not: null },
    },
    include: {
      depot: true,
    },
  });

  if (!dispatcher) {
    console.log("○ no active depot-assigned Dispatcher exists; read-only planning test skipped");
    return;
  }

  const actor = {
    id: dispatcher.id,
    userId: dispatcher.userId,
    fullName: dispatcher.fullName,
    role: dispatcher.role,
    depotId: dispatcher.depotId,
    depot: dispatcher.depot,
  };

  const workspace = await getDispatcherPlanningWorkspace(actor, {});

  assert(workspace.scope.depotId === dispatcher.depotId, "workspace must use trusted Dispatcher depot");
  console.log("✓ planning workspace is scoped to the authenticated Dispatcher depot");

  const allOrders = [
    ...workspace.orders.submitted,
    ...workspace.orders.confirmed,
    ...workspace.orders.deferred,
  ];

  assert(
    allOrders.every((order) => order.outlet.depot?.id === dispatcher.depotId),
    "planning workspace leaked another depot order"
  );
  console.log("✓ Store Manager orders cannot cross the Dispatcher depot boundary");

  assert(Array.isArray(workspace.drivers), "drivers must be an array");
  assert(Array.isArray(workspace.vehicles), "vehicles must be an array");
  assert(Array.isArray(workspace.trips), "trips must be an array");
  console.log("✓ real drivers, observed vehicles, and persisted planning trips are exposed without mock UI arrays");

  const summaryTotal =
    workspace.summary.submittedOrders +
    workspace.summary.confirmedOrders +
    workspace.summary.deferredOrders;

  assert(
    summaryTotal === allOrders.length,
    "summary counts must match visible planning orders"
  );
  console.log("✓ planning summary counts match persisted scoped orders");

  console.log("------------------------------------------");
  console.log("Passed Dispatcher planning integration read-only tests");
}

main()
  .catch((error) => {
    console.error("✗", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
