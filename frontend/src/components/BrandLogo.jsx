import React from 'react';
import logo from '../assets/waypoint-logo.png';

export default function BrandLogo({ inverse = false }) {
  return (
    <div className={`brand-logo ${inverse ? 'brand-logo--inverse' : ''}`}>
      <img className="brand-logo__image" src={logo} alt="Waypoint Group logo" />
      <span>Waypoint Group</span>
    </div>
  );
}
