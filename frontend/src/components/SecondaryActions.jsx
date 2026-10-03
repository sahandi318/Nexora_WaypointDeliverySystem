import React from 'react';
import { Cloud, ListChecks } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function SecondaryActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();

  const reviewChanges = () => {
    if (tripId) {
      navigate(`/driver/trips/${tripId}`);
      return;
    }
    navigate('/driver');
  };

  const openSyncCenter = () => {
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/driver/sync?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="secondary-actions">
      <button
        type="button"
        className="btn btn-outline compact"
        onClick={reviewChanges}
      >
        <ListChecks size={16} /> Review Changes
      </button>

      <button
        type="button"
        className="btn btn-outline compact"
        onClick={openSyncCenter}
      >
        <Cloud size={16} /> Offline &amp; Sync
      </button>
    </div>
  );
}
