import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getPendingActions, syncPendingActions } from '../services/offlineService';

export default function OfflineSyncManager() {
  const location = useLocation();
  const [notice, setNotice] = useState(null);

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
