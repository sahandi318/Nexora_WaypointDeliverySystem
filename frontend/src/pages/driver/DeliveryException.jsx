import React, { useEffect, useMemo, useState } from 'react';
import { Camera, PackageX } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import OfflineBanner from '../../components/OfflineBanner';
import SecondaryActions from '../../components/SecondaryActions';
import useConnectivity from '../../hooks/useConnectivity';
import {
  completeStop,
  getDriverStop,
  recordException,
  recordOutcome,
} from '../../services/offlineService';

export default function DeliveryException() {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const online = useConnectivity();
  const initialMode = new URLSearchParams(location.search).get('mode') === 'unable' ? 'unable' : 'partial';
  const [stop, setStop] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [deliveredQuantity, setDeliveredQuantity] = useState(20);
  const [reason, setReason] = useState('Quantity shortfall');
  const [notes, setNotes] = useState('3 units unavailable at outlet.');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);

  useEffect(() => {
    getDriverStop(tripId, stopId)
      .then(({ stop: value }) => {
        setStop(value);
        if (mode === 'unable') setDeliveredQuantity(0);
      })
      .catch((err) => setError(err.message || 'Unable to load stop.'));
  }, [tripId, stopId]);

  if (!stop) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  async function submitException() {
    setBusy(true);
    try {
      const outcome = mode === 'partial' ? 'PARTIAL_DELIVERY' : 'UNABLE_TO_DELIVER';
      const qty = mode === 'partial' ? Number(deliveredQuantity) : 0;
      const outcomeResult = await recordOutcome({ tripId, stopId, outcome, deliveredQuantity: qty });
      const exceptionResult = await recordException({
        tripId,
        stopId,
        outcome,
        reason,
        notes,
        deliveredQuantity: qty,
        photo,
      });

      if (mode === 'partial') {
        navigate(`/driver/trips/${tripId}/stops/${stopId}/pod`);
      } else {
        const completion = await completeStop({ tripId, stopId });
        if (outcomeResult.offline || exceptionResult.offline || completion.offline) {
          const returnTo = completion.tripComplete
            ? `/driver/trips/${tripId}/complete`
            : `/driver/trips/${tripId}`;
          navigate(`/driver/sync?returnTo=${encodeURIComponent(returnTo)}`);
        } else if (completion.tripComplete) {
          navigate(`/driver/trips/${tripId}/complete`);
        } else {
          navigate(`/driver/trips/${tripId}/stops/${completion.nextStopId}`);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell>
      <DriverTopBar title="Delivery Exception" />
      <div className="screen-body">
        {!online && (
          <OfflineBanner
            title="Offline"
            message="This exception will be saved on this device and synchronized when the connection returns."
          />
        )}

        <section className="card exception-card">
          <div className="outlet-mini"><div className="store-thumb small"><PackageX size={24}/></div><div><h3>{stop.outletId}</h3><strong>{stop.orderId}</strong><p>Expected quantity<br/><b>{stop.expectedUnits} units</b></p></div><span className="pill pill-blue">{stop.tempRequirement}</span></div>

          <label>Outcome <em>*</em></label>
          <div className="segmented"><button className={mode === 'partial' ? 'active partial' : ''} onClick={() => {setMode('partial'); setDeliveredQuantity(Math.max(1, stop.expectedUnits - 3));}}>Partial Delivery</button><button className={mode === 'unable' ? 'active unable' : ''} onClick={() => {setMode('unable'); setDeliveredQuantity(0);}}>Unable to Deliver</button></div>

          {mode === 'partial' && <><label>Delivered quantity <em>*</em></label><div className="quantity-input"><input type="number" min="1" max={stop.expectedUnits - 1} value={deliveredQuantity} onChange={(e) => setDeliveredQuantity(e.target.value)} /><span>units</span></div></>}

          <label>Reason <em>*</em></label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}><option>Quantity shortfall</option><option>Damaged goods</option><option>Outlet unavailable</option><option>Access restriction</option><option>Other</option></select>

          <label>Notes <span>(optional)</span></label>
          <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <label>Photo <span>(optional)</span></label>
          <div className="photo-row"><div className="photo-preview small-photo">{preview ? <img src={preview} alt="Exception preview"/> : <div className="boxes-illustration"><PackageX size={36}/></div>}</div><label className="photo-button"><Camera size={18}/> Add Photo<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)}/></label></div>
        </section>
      </div>
      <div className="sticky-actions">
        <button className="btn btn-primary full" onClick={submitException} disabled={busy}>{busy ? 'Saving...' : 'Submit Exception'}</button>
        <SecondaryActions />
      </div>
    </MobileShell>
  );
}
