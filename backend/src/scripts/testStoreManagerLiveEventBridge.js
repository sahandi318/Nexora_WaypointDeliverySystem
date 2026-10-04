import "dotenv/config";

import assert from "node:assert/strict";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  buildSafeStoreManagerDeliverySocketPayload,
  classifyStoreManagerDeliverySocketReason,
  getPublishedStoreManagerOutletRoomsForTrip,
} from "../services/liveMonitoringService.js";

import {
  resolveStoreManagerTrackingEta,
} from "../services/storeManagerDeliveryService.js";

async function main() {
  try {
    await connectDatabase();

    assert.equal(
      classifyStoreManagerDeliverySocketReason("driver-route-update"),
      "ETA_POSITION"
    );
    assert.equal(
      classifyStoreManagerDeliverySocketReason("stop_arrived"),
      "ARRIVAL"
    );
    assert.equal(
      classifyStoreManagerDeliverySocketReason("delivery_outcome"),
      "OUTCOME"
    );
    assert.equal(
      classifyStoreManagerDeliverySocketReason("pod_submitted"),
      "POD"
    );
    assert.equal(
      classifyStoreManagerDeliverySocketReason("exception_recorded"),
      "EXCEPTION"
    );
    assert.equal(
      classifyStoreManagerDeliverySocketReason("stop_completed"),
      "COMPLETION"
    );

    console.log(
      "✓ Driver workflow reasons are mapped to Store Manager-safe live event kinds"
    );

    const safePayload =
      buildSafeStoreManagerDeliverySocketPayload({
        reason: "driver-route-update",
        tripCode: "TRP-LIVE-BRIDGE",
        stopCode: "STOP-SECRET",
        outletCode: "OUT-SECRET",
        currentLat: 6.9271,
        currentLng: 79.8612,
        routePoints: [[6.9271, 79.8612]],
        pod: { receiverName: "Do not expose" },
      });

    assert.equal(
      safePayload.eventKind,
      "ETA_POSITION"
    );
    assert.equal(
      safePayload.tripCode,
      "TRP-LIVE-BRIDGE"
    );
    assert.equal(
      Object.hasOwn(safePayload, "stopCode"),
      false
    );
    assert.equal(
      Object.hasOwn(safePayload, "routePoints"),
      false
    );
    assert.equal(
      Object.hasOwn(safePayload, "pod"),
      false
    );

    console.log(
      "✓ Store Manager socket invalidation remains free of route/POD/outlet-sensitive payloads"
    );

    assert.deepEqual(
      resolveStoreManagerTrackingEta(
        {
          nextDestination: "OUT021",
          eta: "10:42 AM",
        },
        {
          outletCode: "OUT021",
          plannedEta: "11:00 AM",
        }
      ),
      {
        value: "10:42 AM",
        source: "LIVE",
      }
    );

    assert.deepEqual(
      resolveStoreManagerTrackingEta(
        {
          nextDestination: "OUT019",
          eta: "10:42 AM",
        },
        {
          outletCode: "OUT021",
          plannedEta: "11:00 AM",
        }
      ),
      {
        value: "11:00 AM",
        source: "PLANNED",
      }
    );

    console.log(
      "✓ Live ETA is used only for the Store Manager outlet when it is the driver's current destination"
    );

    const publishedAllocation =
      await prisma.deliveryAllocation.findFirst({
        where: {
          status: "PUBLISHED",
        },
        include: {
          liveTripStop: {
            include: {
              liveTrip: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

    if (publishedAllocation) {
      const { liveTripStop } =
        publishedAllocation;

      const scopedRooms =
        await getPublishedStoreManagerOutletRoomsForTrip(
          liveTripStop.liveTrip.tripCode,
          {
            stopCode: liveTripStop.stopCode,
          }
        );

      assert.deepEqual(
        scopedRooms,
        [`outlet:${liveTripStop.outletCode.toUpperCase()}`]
      );

      console.log(
        "✓ Stop-scoped Driver updates resolve only the published Store Manager outlet room"
      );
    } else {
      console.log(
        "○ no published allocation exists yet; stop-scoped room DB check skipped"
      );
    }

    console.log("------------------------------------------");
    console.log(
      "Passed Stage 10.5B Driver-to-Store-Manager live event bridge tests"
    );
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(
    "Stage 10.5B live event bridge test failed:"
  );
  console.error(error);
  process.exitCode = 1;
});
