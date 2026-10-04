import "dotenv/config";

import assert from "node:assert/strict";

import prisma, {
  connectDatabase,
  disconnectDatabase,
} from "../config/database.js";

import {
  createAccessToken,
} from "../utils/jwt.js";

import {
  authenticateLiveMonitoringSocket,
  getAuthorizedMonitoringRooms,
  getStoreManagerOutletRoom,
  joinAuthorizedMonitoringRooms,
} from "../sockets/liveMonitoringSocket.js";

import {
  buildSafeStoreManagerDeliverySocketPayload,
  getPublishedStoreManagerOutletRoomsForTrip,
} from "../services/liveMonitoringService.js";

function middlewareResult(socket) {
  return new Promise((resolve) => {
    authenticateLiveMonitoringSocket(
      socket,
      (error) => resolve(error || null)
    );
  });
}

function fakeSocket(token) {
  const joinedRooms = [];

  return {
    handshake: {
      auth: {
        token,
        // These forged values must never influence authorization.
        outletCode: "OUT-FORGED",
        room: "outlet:OUT-FORGED",
      },
      query: {
        outletCode: "OUT-FORGED",
      },
    },
    data: {},
    join(room) {
      joinedRooms.push(room);
    },
    joinedRooms,
  };
}

async function main() {
  try {
    await connectDatabase();

    const storeManager =
      await prisma.user.findFirst({
        where: {
          role: "STORE_MANAGER",
          isActive: true,
          mustChangePassword: false,
          outlet: {
            is: {
              isActive: true,
            },
          },
        },
        include: {
          outlet: {
            include: {
              depot: true,
            },
          },
          depot: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    assert.ok(
      storeManager?.outlet,
      "An active Store Manager with an active outlet and completed password change is required."
    );

    const token =
      createAccessToken(storeManager);
    const socket =
      fakeSocket(token);

    const authenticationError =
      await middlewareResult(socket);

    assert.equal(
      authenticationError,
      null,
      authenticationError?.message
    );

    assert.equal(
      socket.data.user.id,
      storeManager.id
    );

    const expectedOutletRoom =
      getStoreManagerOutletRoom(
        storeManager.outlet.outletCode
      );

    const joinedRooms =
      joinAuthorizedMonitoringRooms(socket);

    assert.deepEqual(
      joinedRooms,
      [expectedOutletRoom]
    );

    assert.deepEqual(
      socket.joinedRooms,
      [expectedOutletRoom]
    );

    assert.ok(
      !joinedRooms.includes(
        "outlet:OUT-FORGED"
      )
    );

    console.log(
      "✓ Store Manager socket room is derived only from the current DB outlet assignment"
    );

    const invalidSocket =
      fakeSocket("not-a-valid-token");
    const invalidError =
      await middlewareResult(
        invalidSocket
      );

    assert.ok(invalidError);
    assert.equal(
      invalidSocket.data.user,
      undefined
    );

    console.log(
      "✓ invalid/unauthenticated socket token is rejected"
    );

    assert.throws(
      () =>
        getAuthorizedMonitoringRooms({
          id: 999901,
          role: "STORE_MANAGER",
          outletId: null,
          outlet: null,
        }),
      /active outlet assignment/i
    );

    assert.throws(
      () =>
        getAuthorizedMonitoringRooms({
          id: 999902,
          role: "STORE_MANAGER",
          outletId: 99,
          outlet: {
            outletCode: "OUT099",
            isActive: false,
          },
        }),
      /active outlet assignment/i
    );

    console.log(
      "✓ Store Manager without a valid active outlet cannot join live-monitoring rooms"
    );

    assert.deepEqual(
      getAuthorizedMonitoringRooms({
        id: 501,
        role: "DISPATCHER",
      }),
      ["dispatchers"]
    );

    assert.deepEqual(
      getAuthorizedMonitoringRooms({
        id: 502,
        role: "DRIVER",
      }),
      ["driver:502"]
    );

    console.log(
      "✓ existing Dispatcher and Driver room behavior is preserved"
    );

    const safePayload =
      buildSafeStoreManagerDeliverySocketPayload({
        reason: "driver-route-update",
        tripCode: "TRP-SECURITY-TEST",
        stopCode: "STOP-OTHER-OUTLET",
        outletCode: "OUT-OTHER",
        currentLat: 6.9271,
        currentLng: 79.8612,
        routePoints: [
          [6.9271, 79.8612],
        ],
        pod: {
          receiverName: "Must Not Leak",
        },
      });

    assert.equal(
      safePayload.reason,
      "driver-route-update"
    );
    assert.equal(
      safePayload.tripCode,
      "TRP-SECURITY-TEST"
    );
    assert.ok(safePayload.at);
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        safePayload,
        "stopCode"
      ),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        safePayload,
        "routePoints"
      ),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        safePayload,
        "pod"
      ),
      false
    );

    console.log(
      "✓ Store Manager socket payload cannot leak stop, route, coordinate, or POD details"
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
      const rooms =
        await getPublishedStoreManagerOutletRoomsForTrip(
          publishedAllocation.liveTripStop
            .liveTrip.tripCode
        );

      assert.ok(
        rooms.includes(
          getStoreManagerOutletRoom(
            publishedAllocation.liveTripStop
              .outletCode
          )
        )
      );

      console.log(
        "✓ published delivery allocation resolves only server-side outlet room targets"
      );
    } else {
      console.log(
        "○ no published allocation exists yet; published-room DB check skipped"
      );
    }

    console.log("------------------------------------------");
    console.log(
      "Passed Stage 10.5A Store Manager live socket security tests"
    );
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(
    "Stage 10.5A live socket security test failed:"
  );
  console.error(error);
  process.exitCode = 1;
});
