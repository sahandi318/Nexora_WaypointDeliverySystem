import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DriverTopBar({ title, back = true }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G ▰</span></div>
      <div className="driver-topbar">
        {back ? (
          <button
            className="icon-button light"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span className="topbar-spacer" aria-hidden="true" />
        )}

        <strong>{title}</strong>

        {/* Intentionally left empty: the Designathon menu icon is not used in the Driver build. */}
        <span className="topbar-spacer" aria-hidden="true" />
      </div>
    </>
  );
}
