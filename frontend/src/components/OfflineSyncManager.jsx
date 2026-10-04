import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getPendingActions, syncPendingActions } from '../services/offlineService';
import { ACCESS_TOKEN_KEY } from '../services/api';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

export default function OfflineSyncManager() {
  const location = useLocation();
  const [notice, setNotice] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let timer;

    const synchronize = async () => {
      const pending = await getPendingActions({ visibleOnly: true });
      if (!pending.length || !navigator.onLine) return;
      const session = await syncPendingActions();
      if (session?.visibleSyncedCount > 0 && location.pathname !== '/driver/sync') {
        setNotice(session);
        timer = window.setTimeout(() => setNotice(null), 6500);
      }
    };

    window.addEventListener('online', synchronize);
    synchronize().catch(() => {});

    return () => {
      window.removeEventListener('online', synchronize);
      if (timer) window.clearTimeout(timer);
    };
  }, [location.pathname]);

  useEffect(() => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const emitPresence = ({ online, message, latitude, longitude } = {}) => {
      socket.emit('driver:presence', {
        online,
        message,
        latitude,
        longitude,
      });
    };

    const emitCurrentLocation = (message = null) => {
      if (!navigator.geolocation || !navigator.onLine) {
        emitPresence({ online: navigator.onLine });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          emitPresence({
            online: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            message,
          });
        },
        () => {
          emitPresence({
            online: true,
            message: message || 'Driver is online, but location permission is unavailable.',
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 15000,
          timeout: 6000,
        }
      );
    };

    const handleOnline = () => {
      emitCurrentLocation('Driver connection restored. Live tracking resumed.');
    };

    const handleOffline = () => {
      emitPresence({
        online: false,
        message: 'Driver appears to be offline. Showing last synchronized progress.',
      });
    };

    const handleConnect = () => {
      emitCurrentLocation('Driver connected. Live tracking is available.');
    };

    socket.on('connect', handleConnect);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keep Dispatcher live tracking reasonably fresh without
    // continuously requesting GPS. Ten seconds is sufficient for
    // the challenge demo and keeps the last-synchronized time honest.
    const heartbeat = window.setInterval(() => {
      if (navigator.onLine && socket.connected) {
        emitCurrentLocation();
      }
    }, 10000);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('connect', handleConnect);
      socket.close();
      socketRef.current = null;
    };
  }, []);

  if (!notice) return null;

  return (
    <div className="global-sync-toast" role="status" aria-live="polite">
      <CheckCircle2 size={21} />
      <div>
        <strong>Connection restored</strong>
        <span>{notice.visibleSyncedCount} saved record{notice.visibleSyncedCount === 1 ? '' : 's'} synchronized successfully.</span>
      </div>
    </div>
  );
}
