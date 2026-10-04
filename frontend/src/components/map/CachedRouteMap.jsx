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
  const path = projected
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  if (projected.length < 2) {
    return (
      <div className="cached-route-map cached-route-map--unavailable">
        <div>Cached route geometry is unavailable offline.</div>
      </div>
    );
  }

  const start = projected[0];
  const end = projected[projected.length - 1];

  return (
    <div className="cached-route-map" aria-label={`Cached route to ${outletId}`}>
      <svg viewBox="0 0 1000 400" role="img">
        <rect width="1000" height="400" className="cached-map-bg" />
        <path d={path} className="cached-route-line" />
        <circle cx={start[0]} cy={start[1]} r="14" className="cached-driver-ring" />
        <circle cx={start[0]} cy={start[1]} r="7" className="cached-driver-dot" />
        <circle cx={end[0]} cy={end[1]} r="16" className="cached-destination-dot" />
        <text x={Math.min(930, end[0] + 20)} y={Math.max(28, end[1] - 15)} className="cached-destination-label">{outletId}</text>
      </svg>
      <div className="cached-route-map__label">Cached route geometry · schematic, not a map</div>
    </div>
  );
}
