import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Info, MapPin, Navigation, Store, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DriverTopBar from '../../components/DriverTopBar';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import SecondaryActions from '../../components/SecondaryActions';
import { getDriverStop } from '../../services/offlineService';

export default function StopDetails() {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDriverStop(tripId, stopId)
      .then(({ stop: value }) => setStop(value))
      .catch((err) => setError(err.message || 'Unable to load stop.'));
  }, [tripId, stopId]);

  if (!stop) {
    return <MobileShell>{error ? <div className="error-page">{error}</div> : <LoadingState />}</MobileShell>;
  }

  const expectedUnits = Number(stop.expectedUnits);
  const loadedUnits = Number(stop.loadedUnits);
  const hasLoadingIssue = expectedUnits !== loadedUnits;

  return (
    <MobileShell>
      <DriverTopBar title={`Stop ${stop.position} of ${stop.totalStops}`} />
      <div className="screen-body">
        <section className="card outlet-card">
          <div className="store-thumb"><Store size={30}/></div>
          <div className="outlet-title"><h3>{stop.outletId}</h3><strong>Waypoint Style</strong><p><MapPin size={13}/> {stop.district}</p></div>
          <button className="link-button map-link" onClick={() => window.open(stop.mapsUrl, '_blank')}>View on Map</button>

          <div className="two-col info-grid"><div><span>Planned arrival</span><strong>{stop.plannedArrival}</strong></div><div><span>Delivery window</span><strong>{stop.windowOpen} – {stop.windowClose}</strong><small>✓ On schedule</small></div></div>

          {stop.mallWindow && <div className="mall-alert"><Truck size={18}/><div><span>Mall Access Window</span><strong>{stop.mallWindow}</strong></div><Info size={18}/></div>}
        </section>

        <h3 className="section-title">Access &amp; Unloading</h3>
        <section className="card two-col access-card"><div><span>Unloading point</span><strong>{stop.unloadingPoint}</strong></div><div><span>Vehicle access</span><strong>{stop.vehicleAccess}</strong></div></section>

        {stop.planningReference && (
          <>
            <h3 className="section-title">Operational Planning</h3>
            <section className="card two-col access-card">
              <div><span>Planned road</span><strong>{stop.planningReference.districtTravel?.roadClass || 'Standard'}</strong></div>
              <div><span>Service allowance</span><strong>{stop.serviceAllowanceMinutes ?? stop.planningReference.service?.allowanceMinutes ?? '—'} min</strong></div>
              <div><span>Traffic speed index</span><strong>{stop.planningReference.traffic?.speedIndex ?? '—'}</strong></div>
              <div><span>Road condition index</span><strong>{stop.planningReference.road?.disruptionIndex ?? '—'}</strong></div>
            </section>
          </>
        )}

        <h3 className="section-title">Order Information</h3>
        <section className="card order-card">
          <div className="order-line"><div><span>Order number</span><strong>{stop.orderId}</strong></div><span className="pill pill-blue">{stop.tempRequirement}</span></div>
          <div className="two-col info-grid"><div><span>Expected quantity</span><strong>{stop.expectedUnits} units</strong></div><div><span>Loaded quantity</span><strong>{stop.loadedUnits} units</strong></div></div>
          <div className={hasLoadingIssue ? 'loading-issue-note' : 'success-note'}>
            {hasLoadingIssue ? <AlertTriangle size={15}/> : <Check size={15}/>} 
            {hasLoadingIssue ? 'Loading issues reported' : 'No loading issues reported'}
          </div>
        </section>
      </div>

      <div className="sticky-actions">
        <button className="btn btn-primary full" onClick={() => navigate(`/driver/trips/${tripId}/stops/${stopId}/navigation`)}><Navigation size={16}/> Start Navigation</button>
        <SecondaryActions />
      </div>
    </MobileShell>
  );
}
