import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingState from '../../components/LoadingState';
import MobileShell from '../../components/MobileShell';
import api from '../../services/api';

export default function TripComplete() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  useEffect(() => { api.get(`/driver/trips/${tripId}`).then((r) => setTrip(r.data.trip)); }, [tripId]);
  if (!trip) return <MobileShell><LoadingState /></MobileShell>;
  const s = trip.summary;

  return (
    <MobileShell>
      <div className="status-bar completion-status"><span>12:09</span><span>5G ▰</span></div>
      <section className="complete-hero"><div className="complete-check"><Check size={34}/></div><h1>Trip {trip.tripNumber} Complete!</h1><strong>{trip.brand} · {trip.district}</strong><span>{trip.completedAt ? `Completed at ${trip.completedAt}` : 'Completed at 12:09 PM'}</span></section>
      <div className="screen-body">
        <section className="card summary-card"><h3>Summary</h3><div><span>Total stops</span><strong>{trip.totalStops}</strong></div><div><span><i className="dot green"/>Delivered</span><strong>{s.delivered}</strong></div><div><span><i className="dot orange"/>Partial delivery</span><strong>{s.partial}</strong></div><div><span><i className="dot red"/>Unable to deliver</span><strong>{s.unable}</strong></div><div><span><i className="dot navy"/>Proof records</span><strong>{s.proofRecords}</strong></div></section>
        <section className="sync-complete-strip"><CheckCircle2 size={24}/><div><strong>Sync status</strong><span>All records synchronized</span></div></section>
        <button className="btn btn-primary full" onClick={() => navigate('/driver/trips/TRIP002')}>View Trip 2</button>
        <button className="btn btn-outline full" onClick={() => navigate('/driver')}>Back to Home</button>
      </div>
    </MobileShell>
  );
}
