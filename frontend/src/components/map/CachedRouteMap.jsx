import React, { useMemo } from 'react';

function projectPoints(points) {
  if (!points?.length) return [];
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;

  return points.map(([lat, lng]) => {
    const x = 60 + ((lng - minLng) / lngSpan) * 880;
    const y = 340 - ((lat - minLat) / latSpan) * 280;
    return [x, y];
  });
}

export default function CachedRouteMap({ routePoints = [], outletId }) {
  const projected = useMemo(() => projectPoints(routePoints), [routePoints]);
  const path = projected.length > 1
    ? projected.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    : 'M 120 315 C 230 280, 320 250, 395 205 S 575 150, 690 125 S 810 105, 900 70';
  const start = projected[0] || [120, 315];
  const end = projected[projected.length - 1] || [900, 70];

  return (
    <div className="cached-route-map" aria-label={`Cached route to ${outletId}`}>
      <svg viewBox="0 0 1000 400" role="img">
        <rect width="1000" height="400" className="cached-map-bg" />
        <path d="M 0 100 L 1000 45 M 0 290 L 1000 240 M 160 0 L 240 400 M 520 0 L 610 400 M 820 0 L 760 400" className="cached-map-road" />
        <path d={path} className="cached-route-line" />
        <circle cx={start[0]} cy={start[1]} r="14" className="cached-driver-ring" />
        <circle cx={start[0]} cy={start[1]} r="7" className="cached-driver-dot" />
        <circle cx={end[0]} cy={end[1]} r="16" className="cached-destination-dot" />
        <text x={Math.min(930, end[0] + 20)} y={Math.max(28, end[1] - 15)} className="cached-destination-label">{outletId}</text>
      </svg>
      <div className="cached-route-map__label">Cached route available offline</div>
    </div>
  );
}
