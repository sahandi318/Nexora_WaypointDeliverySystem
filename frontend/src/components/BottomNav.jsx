import React from 'react';
import { History, Home, MoreHorizontal, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav({ activeTripId, lastCompletedTripId }) {
  const navigate = useNavigate();

  const item = (Icon, label, onClick, active = false) => (
    <button className={`bottom-nav__item ${active ? 'active' : ''}`} onClick={onClick} type="button">
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="bottom-nav" aria-label="Driver navigation">
      {item(Home, 'Home', () => navigate('/driver'), true)}
      {item(Route, 'Trips', () => {
        if (activeTripId) navigate(`/driver/trips/${activeTripId}`);
      })}
      {item(History, 'History', () => {
        if (lastCompletedTripId) navigate(`/driver/trips/${lastCompletedTripId}/complete`);
      })}
      {item(MoreHorizontal, 'More', () => window.alert('More driver options.'))}
    </nav>
  );
}
