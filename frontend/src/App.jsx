import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import useAuth from "./hooks/useAuth";

import AdminLoginPage from "./pages/AdminLoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RoleWorkspacePage from "./pages/RoleWorkspacePage";
import VerifyResetOtpPage from "./pages/VerifyResetOtpPage";
import StoreManagerDashboardPage from "./pages/storeManager/StoreManagerDashboardPage";

import {
  getPasswordResetToken,
} from "./services/passwordResetSession";

import {
  getRoleHomePath,
} from "./utils/roleRoutes";


function App() {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC LANDING PAGE
          ===================================================== */}

      <Route
        path="/"
        element={
          <LandingPage />
        }
      />


      {/* =====================================================
          STAFF LOGIN
          ===================================================== */}

      <Route
        path="/login"
        element={
          <LoginRoute />
        }
      />


      {/* =====================================================
          ADMIN LOGIN
          ===================================================== */}

      <Route
        path="/admin/login"
        element={
          <AdminLoginRoute />
        }
      />


      {/* =====================================================
          PASSWORD RECOVERY
          ===================================================== */}

      <Route
        path="/forgot-password"
        element={
          <RecoveryRoute>
            <ForgotPasswordPage />
          </RecoveryRoute>
        }
      />


      <Route
        path="/verify-reset-otp"
        element={
          <RecoveryRoute>
            <VerifyResetOtpPage />
          </RecoveryRoute>
        }
      />


      <Route
        path="/reset-password"
        element={
          <ResetPasswordRoute />
        }
      />


      {/* =====================================================
          FIRST LOGIN PASSWORD CHANGE
          ===================================================== */}

      <Route
        path="/change-password"
        element={
          <PasswordChangeRoute />
        }
      />


      {/* =====================================================
          STORE MANAGER
          ===================================================== */}

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


      {/* =====================================================
          ADMIN
          ===================================================== */}

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


      {/* =====================================================
          DISPATCHER
          ===================================================== */}

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


      {/* =====================================================
          LOADER
          ===================================================== */}

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


      {/* =====================================================
          DRIVER
          ===================================================== */}

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


// ============================================================
// STAFF LOGIN ROUTE
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


  return (
    <LoginPage />
  );
}


// ============================================================
// ADMIN LOGIN ROUTE
// ============================================================

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


  return (
    <AdminLoginPage />
  );
}


// ============================================================
// PUBLIC PASSWORD RECOVERY ROUTE
// ============================================================

function RecoveryRoute({
  children,
}) {
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


  return children;
}


// ============================================================
// RESET PASSWORD ROUTE
// ============================================================

function ResetPasswordRoute() {
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


  const resetToken =
    getPasswordResetToken();


  if (!resetToken) {
    return (
      <Navigate
        to="/forgot-password"
        replace
      />
    );
  }


  return (
    <ResetPasswordPage />
  );
}


// ============================================================
// FIRST-LOGIN PASSWORD CHANGE
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
// AUTHENTICATION LOADER
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