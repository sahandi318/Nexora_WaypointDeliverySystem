import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import OfflineSyncManager from './components/OfflineSyncManager';

import DriverDashboard from './pages/driver/DriverDashboard';
import TripOverview from './pages/driver/TripOverview';
import StopDetails from './pages/driver/StopDetails';
import NavigationPage from './pages/driver/NavigationPage';
import DeliveryOutcome from './pages/driver/DeliveryOutcome';
import ProofOfDelivery from './pages/driver/ProofOfDelivery';
import DeliveryException from './pages/driver/DeliveryException';
import SyncCenter from './pages/driver/SyncCenter';
import TripComplete from './pages/driver/TripComplete';

/*
 * Protect Driver routes.
 *
 * The shared login created by your teammate should authenticate the user
 * before the Driver enters these pages.
 *
 * If the user is not authenticated, redirect to the shared /login route.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('nexora_driver_token');

  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <OfflineSyncManager />

      <Routes>

        {/* Root enters the Driver area.
            If there is no token, ProtectedRoute sends the user to /login. */}
        <Route
          path="/"
          element={<Navigate to="/driver" replace />}
        />

        {/* Driver Dashboard */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* Trip Overview */}
        <Route
          path="/driver/trips/:tripId"
          element={
            <ProtectedRoute>
              <TripOverview />
            </ProtectedRoute>
          }
        />

        {/* Stop Details */}
        <Route
          path="/driver/trips/:tripId/stops/:stopId"
          element={
            <ProtectedRoute>
              <StopDetails />
            </ProtectedRoute>
          }
        />

        {/* Navigation / En Route */}
        <Route
          path="/driver/trips/:tripId/stops/:stopId/navigation"
          element={
            <ProtectedRoute>
              <NavigationPage />
            </ProtectedRoute>
          }
        />

        {/* Delivery Outcome */}
        <Route
          path="/driver/trips/:tripId/stops/:stopId/outcome"
          element={
            <ProtectedRoute>
              <DeliveryOutcome />
            </ProtectedRoute>
          }
        />

        {/* Proof of Delivery */}
        <Route
          path="/driver/trips/:tripId/stops/:stopId/pod"
          element={
            <ProtectedRoute>
              <ProofOfDelivery />
            </ProtectedRoute>
          }
        />

        {/* Delivery Exception */}
        <Route
          path="/driver/trips/:tripId/stops/:stopId/exception"
          element={
            <ProtectedRoute>
              <DeliveryException />
            </ProtectedRoute>
          }
        />

        {/* Offline & Sync Center */}
        <Route
          path="/driver/sync"
          element={
            <ProtectedRoute>
              <SyncCenter />
            </ProtectedRoute>
          }
        />

        {/* Trip Complete */}
        <Route
          path="/driver/trips/:tripId/complete"
          element={
            <ProtectedRoute>
              <TripComplete />
            </ProtectedRoute>
          }
        />

        {/* Unknown Driver URL */}
        <Route
          path="*"
          element={<Navigate to="/driver" replace />}
        />

      </Routes>
    </>
  );
}