import { Server } from "socket.io";

import prisma from "../config/database.js";
import { verifyAccessToken } from "../utils/jwt.js";
import {
  setMonitoringIo,
  updateDriverPresence,
} from "../services/liveMonitoringService.js";

export function initializeLiveMonitoringSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        process.env.FRONTEND_ORIGIN ||
        "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));

      const decoded = verifyAccessToken(token);
      const userId = Number(decoded.sub);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { depot: true },
      });

      if (!user || !user.isActive) {
        return next(new Error("User is unavailable."));
      }

      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (user.role === "DISPATCHER" || user.role === "ADMIN") {
      socket.join("dispatchers");
    }

    if (user.role === "DRIVER") {
      socket.join(`driver:${user.id}`);

      updateDriverPresence({
        userId: user.id,
        online: true,
        message: "Driver connected. Live tracking is available.",
      }).catch(() => {});

      socket.on("driver:presence", (payload = {}) => {
        updateDriverPresence({
          userId: user.id,
          online: payload.online !== false,
          latitude: payload.latitude,
          longitude: payload.longitude,
          message: payload.message || null,
        }).catch((error) => {
          console.error("Driver presence update failed:", error);
        });
      });

      socket.on("disconnect", () => {
        updateDriverPresence({
          userId: user.id,
          online: false,
          message: "Driver appears to be offline. Showing last synchronized progress.",
        }).catch(() => {});
      });
    }
  });

  setMonitoringIo(io);
  return io;
}
