import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, MapPin, TriangleAlert, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import OfflineBanner from '../../components/OfflineBanner';
import SecondaryActions from '../../components/SecondaryActions';
import useConnectivity from '../../hooks/useConnectivity';
import { getDriverStop, recordOutcome } from '../../services/offlineService';

export default function DeliveryOutcome() {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const online = useConnectivity();
  const [stop, setStop] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDriverStop(tripId, stopId)
      .then(({ stop: value }) => setStop(value))
      .catch((err) => setError(err.message || 'Unable to load stop.'));
  }, [tripId, stopId]);

  if (!stop) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  async function fullDelivery() {
    setBusy(true);
    try {
      await recordOutcome({
        tripId,
        stopId,
        outcome: 'DELIVERED_FULL',
        deliveredQuantity: stop.expectedUnits,
      });
      navigate(`/driver/trips/${tripId}/stops/${stopId}/pod`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell>
      <DriverTopBar title="Arrived at Outlet" />
      <div className="screen-body">
        {!online && (
          <OfflineBanner
            title="Offline"
            message="Arrival recorded on this device. You can continue the delivery normally."
          />
        )}

        <section className="card arrived-card">
          <div className="outlet-mini"><div className="store-thumb small">▦</div><div><h3>{stop.outletId}</h3><strong>Waypoint Style</strong><p><MapPin size={12}/> {stop.district}</p></div></div>
          <div className="arrival-banner"><CheckCircle2 size={29}/><div><span>Arrived</span><strong>{stop.arrivalTime || '11:00 AM'}</strong><small>On time</small></div></div>
          <div className="order-line"><div><span>Order number</span><strong>{stop.orderId}</strong></div><span className="pill pill-blue">{stop.tempRequirement}</span></div>
          <div className="two-col info-grid"><div><span>Expected quantity</span><strong>{stop.expectedUnits} units</strong></div><div><span>Loaded quantity</span><strong>{stop.loadedUnits} units</strong></div></div>
        </section>

        <h3 className="section-title">How did this delivery go?</h3>
        <button className="outcome-choice full-delivery" onClick={fullDelivery} disabled={busy}><CheckCircle2/><span><strong>Delivered in Full</strong><small>All items delivered as planned</small></span><ChevronRight/></button>
        <button className="outcome-choice partial-delivery" onClick={() => navigate(`/driver/trips/${tripId}/stops/${stopId}/exception?mode=partial`)}><TriangleAlert/><span><strong>Partial Delivery</strong><small>Some items delivered</small></span><ChevronRight/></button>
        <button className="outcome-choice unable-delivery" onClick={() => navigate(`/driver/trips/${tripId}/stops/${stopId}/exception?mode=unable`)}><XCircle/><span><strong>Unable to Deliver</strong><small>Delivery could not be completed</small></span><ChevronRight/></button>
      </div>
      <div className="sticky-actions"><SecondaryActions /></div>
    </MobileShell>
  );
}
