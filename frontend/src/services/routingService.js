const ROUTING_API_BASE =
  import.meta.env.VITE_ROUTING_API_BASE || 'https://router.project-osrm.org';

export function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const earthRadius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function maneuverText(step) {
  if (!step) return 'Continue toward the outlet';

  const modifier = step.maneuver?.modifier ? `${step.maneuver.modifier} ` : '';
  const road = step.name ? ` onto ${step.name}` : '';
  const type = step.maneuver?.type;

  if (type === 'depart') return `Start ${modifier}${step.name ? `on ${step.name}` : 'toward the route'}`.trim();
  if (type === 'arrive') return 'Arrive at the outlet';
  if (type === 'turn') return `Turn ${modifier}${road}`.replace(/\s+/g, ' ').trim();
  if (type === 'continue') return `Continue ${modifier}${road}`.replace(/\s+/g, ' ').trim();
  if (type === 'merge') return `Merge ${modifier}${road}`.replace(/\s+/g, ' ').trim();
  if (type === 'fork') return `Keep ${modifier}${road}`.replace(/\s+/g, ' ').trim();
  if (type === 'roundabout' || type === 'rotary') return `Enter the roundabout${road}`;

  return `${type ? `${type} ` : 'Continue '}${modifier}${road}`.replace(/\s+/g, ' ').trim();
}

export async function fetchDrivingRoute(origin, destination, signal) {
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${ROUTING_API_BASE}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=false`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing request failed (${response.status})`);

  const payload = await response.json();
  const route = payload.routes?.[0];
  if (!route) throw new Error('No driving route was returned.');

  const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const steps = (route.legs || []).flatMap((leg) => leg.steps || []);
  const nextStep = steps.find((step) => step.distance > 5) || steps[0] || null;

  return {
    points,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    nextInstruction: maneuverText(nextStep),
    nextInstructionDistanceM: nextStep?.distance ?? null,
  };
}
