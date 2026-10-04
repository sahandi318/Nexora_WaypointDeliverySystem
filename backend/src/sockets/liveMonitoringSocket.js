import { Server } from "socket.io";

import {
  getAuthenticatedUserById,
} from "../services/authService.js";

import { verifyAccessToken } from "../utils/jwt.js";

import {
  setMonitoringIo,
  updateDriverPresence,
} from "../services/liveMonitoringService.js";

export const DISPATCHER_MONITORING_ROOM = "dispatchers";
export const STORE_MANAGER_OUTLET_ROOM_PREFIX = "outlet:";

function normalizeOutletCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function getStoreManagerOutletRoom(outletCode) {
  const normalizedOutletCode = normalizeOutletCode(outletCode);

  if (!normalizedOutletCode) {
    throw new Error("Store Manager outlet room cannot be resolved.");
  }

  return `${STORE_MANAGER_OUTLET_ROOM_PREFIX}${normalizedOutletCode}`;
}

/**
 * Resolve every monitoring room from the current database-backed user.
 *
 * No room name is accepted from socket.handshake.auth, query parameters,
 * localStorage, or any other browser-controlled value.
 */
export function getAuthorizedMonitoringRooms(user) {
  const rooms = [];

  if (!user) return rooms;

  if (
    user.role === "DISPATCHER" ||
    user.role === "ADMIN"
  ) {
    rooms.push(DISPATCHER_MONITORING_ROOM);
  }

  if (user.role === "DRIVER") {
    rooms.push(`driver:${user.id}`);
  }

  if (user.role === "STORE_MANAGER") {
    if (
      !user.outletId ||
      !user.outlet ||
      !user.outlet.isActive
    ) {
      throw new Error(
        "A valid active outlet assignment is required for Store Manager live monitoring."
      );
    }

    rooms.push(
      getStoreManagerOutletRoom(
        user.outlet.outletCode
      )
    );
  }

  return rooms;
}

/**
 * Socket authentication mirrors the HTTP security model:
 *
 * JWT -> current database user -> active account -> completed temporary
 * password change -> current role/outlet/depot assignment.
 *
 * Role/outlet claims inside an old token are never trusted for authorization.
 */
export async function authenticateLiveMonitoringSocket(
  socket,
  next
) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required.")
      );
    }

    const decoded = verifyAccessToken(token);
    const userId = Number(decoded.sub);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return next(
        new Error("Invalid authentication token.")
      );
    }

    const user = await getAuthenticatedUserById(
      userId
    );

    if (!user) {
      return next(
        new Error("Authenticated user no longer exists.")
      );
    }

    if (!user.isActive) {
      return next(
        new Error("This account is inactive.")
      );
    }

    if (user.mustChangePassword) {
      return next(
        new Error(
          "Password change is required before live monitoring can be used."
        )
      );
    }

    // Validate Store Manager outlet assignment before the connection succeeds.
    // This also guarantees the room is resolved from current DB state only.
    getAuthorizedMonitoringRooms(user);

    socket.data.user = user;

    return next();
  } catch (error) {
    return next(
      new Error(
        error?.message === "jwt expired"
          ? "Authentication token has expired."
          : error?.message ||
              "Invalid or expired authentication token."
      )
    );
  }
}

export function joinAuthorizedMonitoringRooms(
  socket
) {
  const user = socket.data.user;
  const rooms = getAuthorizedMonitoringRooms(
    user
  );

  for (const room of rooms) {
    socket.join(room);
  }

  return rooms;
}

export function initializeLiveMonitoringSocket(
  httpServer
) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        process.env.FRONTEND_ORIGIN ||
        "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(authenticateLiveMonitoringSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    try {
      joinAuthorizedMonitoringRooms(socket);
    } catch (error) {
      console.error(
        "Unable to join authorized live-monitoring room:",
        error
      );
      socket.disconnect(true);
      return;
    }

    if (user.role === "DRIVER") {
      updateDriverPresence({
        userId: user.id,
        online: true,
        message:
          "Driver connected. Live tracking is available.",
      }).catch(() => {});

      socket.on(
        "driver:presence",
        (payload = {}) => {
          updateDriverPresence({
            userId: user.id,
            online:
              payload.online !== false,
            latitude:
              payload.latitude,
            longitude:
              payload.longitude,
            message:
              payload.message || null,
          }).catch((error) => {
            console.error(
              "Driver presence update failed:",
              error
            );
          });
        }
      );

      socket.on("disconnect", () => {
        updateDriverPresence({
          userId: user.id,
          online: false,
          message:
            "Driver appears to be offline. Showing last synchronized progress.",
        }).catch(() => {});
      });
    }
  });

  setMonitoringIo(io);
  return io;
}
