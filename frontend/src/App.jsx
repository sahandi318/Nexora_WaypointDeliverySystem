import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import useAuth from "./hooks/useAuth";

import ChangePasswordPage from "./pages/ChangePasswordPage";
import LoginPage from "./pages/LoginPage";
import RoleWorkspacePage from "./pages/RoleWorkspacePage";
import StoreManagerDashboardPage from "./pages/storeManager/StoreManagerDashboardPage";

import {
  getRoleHomePath,
} from "./utils/roleRoutes";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RootRedirect />
        }
      />


      <Route
        path="/login"
        element={
          <LoginRoute />
        }
      />


      <Route
        path="/change-password"
        element={
          <PasswordChangeRoute />
        }
      />


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


// ============================================================
// ROOT REDIRECT
// ============================================================

function RootRedirect() {
  const {
    user,
    isInitializing,
  } = useAuth();


  if (isInitializing) {
    return (
      <AuthenticationLoader />
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    user.mustChangePassword
  ) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }


  return (
    <Navigate
      to={getRoleHomePath(
        user.role
      )}
      replace
    />
  );
}


// ============================================================
// LOGIN ROUTE
// ============================================================

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
    if (
      user.mustChangePassword
    ) {
      return (
        <Navigate
          to="/change-password"
          replace
        />
      );
    }


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


// ============================================================
// PASSWORD CHANGE ROUTE
// ============================================================

function PasswordChangeRoute() {
  const {
    user,
    isInitializing,
  } = useAuth();


  if (isInitializing) {
    return (
      <AuthenticationLoader />
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    !user.mustChangePassword
  ) {
    return (
      <Navigate
        to={getRoleHomePath(
          user.role
        )}
        replace
      />
    );
  }


  return (
    <ChangePasswordPage />
  );
}


// ============================================================
// LOADER
// ============================================================

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