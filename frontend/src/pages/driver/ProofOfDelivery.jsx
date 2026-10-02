import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Check, PackageCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import OfflineBanner from '../../components/OfflineBanner';
import SecondaryActions from '../../components/SecondaryActions';
import useConnectivity from '../../hooks/useConnectivity';
import { completeStop, getDriverStop, recordPod } from '../../services/offlineService';

export default function ProofOfDelivery() {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const online = useConnectivity();
  const [stop, setStop] = useState(null);
  const [error, setError] = useState('');
  const [receiverName, setReceiverName] = useState('Nimal Perera');
  const [deliveryNote, setDeliveryNote] = useState('Delivered and received in good condition.');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);

  useEffect(() => {
    getDriverStop(tripId, stopId)
      .then(({ stop: value }) => setStop(value))
      .catch((err) => setError(err.message || 'Unable to load stop.'));
  }, [tripId, stopId]);

  if (!stop) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  async function completeDelivery() {
    if (!receiverName.trim()) return window.alert('Receiver name is required.');
    setBusy(true);
    try {
      const podResult = await recordPod({ tripId, stopId, receiverName, deliveryNote, photo });
      const completion = await completeStop({ tripId, stopId });

      if (podResult.offline || completion.offline) {
        setSavedLocally(true);
        window.setTimeout(() => {
          const returnTo = completion.tripComplete
            ? `/driver/trips/${tripId}/complete`
            : `/driver/trips/${tripId}`;
          navigate(`/driver/sync?returnTo=${encodeURIComponent(returnTo)}`);
        }, 650);
        return;
      }

      if (completion.tripComplete) navigate(`/driver/trips/${tripId}/complete`);
      else navigate(`/driver/trips/${tripId}/stops/${completion.nextStopId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell>
      <DriverTopBar title="Proof of Delivery" />
      <div className="screen-body">
        {!online && (
          <OfflineBanner
            title={savedLocally ? 'Delivery saved locally' : 'Offline'}
            message={savedLocally
              ? 'Receiver details and proof photo are saved on this device.'
              : 'Receiver details and proof photo will be saved on this device until the connection returns.'}
          />
        )}

        <section className="card pod-card">
          <div className="outlet-mini"><div className="store-thumb small">▦</div><div><h3>{stop.outletId}</h3><strong>{stop.orderId}</strong><p>Delivered quantity<br/><b>{stop.deliveredQuantity ?? stop.expectedUnits} units</b></p></div><span className="pill pill-blue">{stop.tempRequirement}</span></div>

          <label>Receiver Name <em>*</em></label>
          <input className="plain-input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />

          <label>Photo <em>*</em></label>
          <div className="photo-row">
            <div className="photo-preview">{preview ? <img src={preview} alt="POD preview"/> : <div className="boxes-illustration"><PackageCheck size={40}/><span>Proof photo</span></div>}</div>
            <label className="photo-button"><Camera size={18}/> Add Photo<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)}/></label>
          </div>

          <label>Delivery note <span>(optional)</span></label>
          <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows="3" />
        </section>
      </div>
      <div className="sticky-actions">
        <button className="btn btn-primary full" onClick={completeDelivery} disabled={busy}><Check size={16}/> {busy ? 'Saving...' : 'Complete Delivery'}</button>
        <SecondaryActions />
      </div>
    </MobileShell>
  );
}
