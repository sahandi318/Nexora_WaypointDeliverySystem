import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cloud,
  MapPin,
  PackageCheck,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import OfflineBanner from '../../components/OfflineBanner';
import useConnectivity from '../../hooks/useConnectivity';
import api from '../../services/api';
import {
  getPendingActions,
  syncPendingActions,
} from '../../services/offlineService';

function actionIcon(type) {
  switch (type) {
    case 'ARRIVAL': return <MapPin size={16} />;
    case 'POD': return <Camera size={16} />;
    case 'EXCEPTION': return <AlertTriangle size={16} />;
    case 'DELIVERY_OUTCOME': return <PackageCheck size={16} />;
    default: return <Cloud size={16} />;
  }
}

function PendingRow({ action, synced = false }) {
  return (
    <div className="sync-record-row">
      <span className={`sync-record-icon ${synced ? 'sync-record-icon--synced' : `sync-record-icon--${action.display?.icon || 'update'}`} `}>
        {synced ? <CheckCircle2 size={16} /> : actionIcon(action.actionType)}
      </span>
      <div className="sync-record-copy">
        <strong>{action.display?.title || 'Saved Driver update'}</strong>
        <span>{synced ? 'Synchronized successfully' : action.display?.detail || 'Saved locally'}</span>
      </div>
      {!synced && <span className="sync-record-chevron">›</span>}
    </div>
  );
}

export default function SyncCenter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const online = useConnectivity();
  const returnTo = searchParams.get('returnTo') || '/driver';
  const [serverSync, setServerSync] = useState(null);
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [recoverySession, setRecoverySession] = useState(null);
  const [retryMessage, setRetryMessage] = useState('');
  const autoSyncAttemptedRef = useRef(false);

  const loadPending = useCallback(async () => {
    const rows = await getPendingActions({ visibleOnly: true });
    setPending(rows);
    return rows;
  }, []);

  const loadServerStatus = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const response = await api.get('/driver/sync-status');
      setServerSync(response.data);
      if (response.data.lastSuccessfulSync) {
        localStorage.setItem('nexora_last_sync', response.data.lastSuccessfulSync);
      }
    } catch {
      // Sync Center remains usable from IndexedDB even if the API cannot be reached.
    }
  }, []);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine) {
      setRetryMessage('No connection yet. Your records are safely stored on this device.');
      return;
    }
    setRetryMessage('');
    setSyncing(true);
    try {
      const session = await syncPendingActions();
      if (session?.visibleSyncedCount > 0) {
        setRecoverySession(session);
        localStorage.setItem('nexora_last_sync', session.completedAtLabel);
      }
      await loadPending();
      await loadServerStatus();
    } finally {
      setSyncing(false);
    }
  }, [loadPending, loadServerStatus]);

  useEffect(() => {
    loadPending();
    loadServerStatus();
  }, [loadPending, loadServerStatus]);

  useEffect(() => {
    const onQueueChange = () => loadPending();
    const onSyncComplete = (event) => {
      if (event.detail?.visibleSyncedCount > 0) {
        setRecoverySession(event.detail);
        localStorage.setItem('nexora_last_sync', event.detail.completedAtLabel);
      }
      loadPending();
      loadServerStatus();
    };
    window.addEventListener('nexora:offline-queue-changed', onQueueChange);
    window.addEventListener('nexora:sync-complete', onSyncComplete);
    return () => {
      window.removeEventListener('nexora:offline-queue-changed', onQueueChange);
      window.removeEventListener('nexora:sync-complete', onSyncComplete);
    };
  }, [loadPending, loadServerStatus]);

  useEffect(() => {
    if (!online) {
      autoSyncAttemptedRef.current = false;
      return;
    }
    if (pending.length > 0 && !syncing && !recoverySession && !autoSyncAttemptedRef.current) {
      autoSyncAttemptedRef.current = true;
      synchronize();
    }
  }, [online, pending.length, syncing, recoverySession, synchronize]);

  const lastSuccessfulSync = useMemo(
    () => recoverySession?.completedAtLabel
      || serverSync?.lastSuccessfulSync
      || localStorage.getItem('nexora_last_sync')
      || '10:52 AM',
    [recoverySession, serverSync],
  );

  // DS5 — connection restored and offline records have synchronized.
  if (online && recoverySession?.visibleSyncedCount > 0) {
    return (
      <MobileShell>
        <DriverTopBar title="Offline & Sync Center" />
        <div className="screen-body">
          <OfflineBanner
            restored
            title="Connection restored"
            message="All saved offline records have synchronized successfully."
          />

          <section className="card sync-status-card degradation-sync-card">
            <div>
              <span>Sync Status</span>
              <strong><CheckCircle2 size={18}/> {recoverySession.visibleSyncedCount} of {recoverySession.visibleSyncedCount} synchronized</strong>
              <small>All records synchronized</small>
            </div>
          </section>

          <h3 className="section-title">Synchronized Records</h3>
          <section className="card sync-record-list">
            {recoverySession.actions.map((action, index) => (
              <PendingRow key={`${action.stopId}-${action.actionType}-${index}`} action={action} synced />
            ))}
          </section>

          <div className="last-sync"><span>Last sync</span><strong>{lastSuccessfulSync}</strong></div>
        </div>

        <div className="sticky-actions">
          <button className="btn btn-outline full" onClick={() => navigate(returnTo)}>Continue Route</button>
        </div>
      </MobileShell>
    );
  }

  // DS4 — offline queue with records safely waiting on the device.
  if (!online || pending.length > 0 || syncing) {
    return (
      <MobileShell>
        <DriverTopBar title="Offline & Sync Center" />
        <div className="screen-body">
          {!online ? (
            <OfflineBanner
              title="Offline"
              message="Your work is being saved on this device."
            />
          ) : (
            <OfflineBanner
              restored
              title="Connection restored"
              message={syncing ? 'Synchronizing saved records…' : 'Ready to synchronize saved records.'}
            />
          )}

          <section className="card sync-status-card degradation-sync-card">
            <div>
              <span>Sync Status</span>
              <strong className={online ? '' : 'sync-pending-text'}>
                {online ? <RefreshCw size={18} className={syncing ? 'spin-icon' : ''}/> : <CheckCircle2 size={18}/>} {pending.length} update{pending.length === 1 ? '' : 's'} waiting to sync
              </strong>
            </div>
            <button className="btn btn-outline compact" onClick={synchronize} disabled={syncing}>
              <RefreshCw size={15} className={syncing ? 'spin-icon' : ''}/> {syncing ? 'Syncing...' : 'Retry Sync'}
            </button>
          </section>

          {retryMessage && <div className="offline-retry-message">{retryMessage}</div>}

          <h3 className="section-title">Pending Records</h3>
          <section className="card sync-record-list">
            {pending.length ? pending.map((action) => <PendingRow key={action.clientActionId} action={action} />) : (
              <div className="empty-sync compact-empty"><Cloud size={30}/><strong>Preparing synchronization</strong><p>Please keep this screen open while the saved records are checked.</p></div>
            )}
          </section>

          <div className="last-sync"><span>Last successful sync</span><strong>{lastSuccessfulSync}</strong></div>
          <div className="info-banner">Delivery work remains available offline. Records will synchronize automatically when the connection returns.</div>
        </div>

        <div className="sticky-actions">
          <button className="btn btn-primary full" onClick={() => navigate(returnTo)}>Continue Route</button>
        </div>
      </MobileShell>
    );
  }

  // Normal online Sync Center — unchanged from the normal scenario.
  if (!serverSync) return <MobileShell><LoadingState /></MobileShell>;

  return (
    <MobileShell>
      <DriverTopBar title="Offline & Sync Center" />
      <div className="screen-body">
        <div className="online-banner"><Wifi size={20}/><div><strong>Online</strong><span>Your records are connected to the server.</span></div></div>
        <section className="card sync-status-card"><div><span>Sync Status</span><strong><CheckCircle2 size={18}/> {serverSync.pendingCount} updates waiting to sync</strong></div><button className="btn btn-outline compact" onClick={loadServerStatus}><RefreshCw size={15}/> Retry Sync</button></section>
        <h3 className="section-title">Pending Records</h3>
        <section className="card empty-sync"><Cloud size={38}/><strong>All records synchronized</strong><p>No pending Driver records. Normal online operation is active.</p></section>
        <div className="last-sync">Last successful sync <strong>{serverSync.lastSuccessfulSync}</strong></div>
        <div className="info-banner">All delivery features remain available. If connectivity drops, Driver records will be saved locally and synchronized automatically after recovery.</div>
      </div>
      <div className="sticky-actions"><button className="btn btn-primary full" onClick={() => navigate(returnTo)}>Continue Route</button></div>
    </MobileShell>
  );
}
