import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import useAuth from "./hooks/useAuth";

import AdminLoginPage from "./pages/AdminLoginPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RoleWorkspacePage from "./pages/RoleWorkspacePage";

import StoreManagerDashboardPage from "./pages/storeManager/StoreManagerDashboardPage";

import {
  getRoleHomePath,
} from "./utils/roleRoutes";


function App() {
  return (
    <Routes>
      {/* PUBLIC LANDING PAGE */}

      <Route
        path="/"
        element={
          <LandingPage />
        }
      />


      {/* STAFF LOGIN */}

      <Route
        path="/login"
        element={
          <LoginRoute />
        }
      />


      {/* ADMIN LOGIN */}

      <Route
        path="/admin/login"
        element={
          <AdminLoginRoute />
        }
      />


      {/* STORE MANAGER */}

      <Route
        path="/store-manager/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "STORE_MANAGER",
            ]}
          >
            <StoreManagerDashboardPage />
          </ProtectedRoute>
        }
      />


      {/* ADMIN */}

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <RoleWorkspacePage />
          </ProtectedRoute>
        }
      />


      {/* DISPATCHER */}

      <Route
        path="/dispatcher/*"
        element={
          <ProtectedRoute
            allowedRoles={[
              "DISPATCHER",
            ]}
          >
            <RoleWorkspacePage />
          </ProtectedRoute>
        }
      />


      {/* LOADER */}

      <Route
        path="/loader/*"
        element={
          <ProtectedRoute
            allowedRoles={[
              "LOADER",
            ]}
          >
            <RoleWorkspacePage />
          </ProtectedRoute>
        }
      />


      {/* DRIVER */}

      <Route
        path="/driver/*"
        element={
          <ProtectedRoute
            allowedRoles={[
              "DRIVER",
            ]}
          >
            <RoleWorkspacePage />
          </ProtectedRoute>
        }
      />


      {/* UNKNOWN FRONTEND ROUTE */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}


function LoginRoute() {
  const {
    user,
    isInitializing,
  } = useAuth();


  if (isInitializing) {
    return (
      <AuthenticationLoader />
    );
  }


  if (user) {
    return (
      <Navigate
        to={getRoleHomePath(
          user.role
        )}
        replace
      />
    );
  }


  return <LoginPage />;
}


function AdminLoginRoute() {
  const {
    user,
    isInitializing,
  } = useAuth();


  if (isInitializing) {
    return (
      <AuthenticationLoader />
    );
  }


  if (user) {
    return (
      <Navigate
        to={getRoleHomePath(
          user.role
        )}
        replace
      />
    );
  }


  return <AdminLoginPage />;
}


function AuthenticationLoader() {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="
            h-10
            w-10
            animate-spin
            rounded-full
            border-4
            border-[var(--color-primary-soft)]
            border-t-[var(--color-primary)]
          "
        />

        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Loading Waypoint...
        </p>
      </div>
    </div>
  );
}


export default App;
