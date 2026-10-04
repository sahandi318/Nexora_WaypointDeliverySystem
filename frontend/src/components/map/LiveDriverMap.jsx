import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitRoute({ driverLocation, destination, routePoints }) {
  const map = useMap();

  useEffect(() => {
    if (!driverLocation || !destination) return;

    const bounds = L.latLngBounds([
      [driverLocation.lat, driverLocation.lng],
      [destination.lat, destination.lng],
      ...(routePoints || []),
    ]);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16 });
    }
  }, [driverLocation, destination, routePoints, map]);

  return null;
}

export default function LiveDriverMap({ driverLocation, destination, routePoints, outletId }) {
  const driverIcon = useMemo(
    () =>
      L.divIcon({
        className: 'driver-location-marker-wrap',
        html: '<span class="driver-location-marker"><span></span></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [],
  );

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: 'destination-marker-wrap',
        html: `<span class="destination-marker">${outletId}</span>`,
        iconSize: [70, 34],
        iconAnchor: [35, 34],
      }),
    [outletId],
  );

  const firstRoutePoint = routePoints?.[0];
  const center =
    driverLocation ||
    destination ||
    (firstRoutePoint
      ? { lat: firstRoutePoint[0], lng: firstRoutePoint[1] }
      : null);

  if (!center) {
    return (
      <div className="driver-leaflet-map grid place-items-center p-6 text-center">
        <p>Location unavailable: no verified vehicle or destination coordinates are available.</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="driver-leaflet-map"
      zoomControl
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
          <Popup>Your current location</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>{outletId} destination</Popup>
        </Marker>
      )}

      {routePoints?.length > 1 && (
        <Polyline positions={routePoints} pathOptions={{ color: '#008a6b', weight: 7, opacity: 0.9 }} />
      )}

      <FitRoute
        driverLocation={driverLocation}
        destination={destination}
        routePoints={routePoints}
      />
    </MapContainer>
  );
}
