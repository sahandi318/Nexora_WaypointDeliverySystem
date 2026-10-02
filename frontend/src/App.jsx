import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import useAuth from "./hooks/useAuth";

import AdminChangePasswordPage from "./pages/AdminChangePasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import DispatcherRegisterPage from "./pages/admin/DispatcherRegisterPage";
import DriverRegisterPage from "./pages/admin/DriverRegisterPage";
import LoaderRegisterPage from "./pages/admin/LoaderRegisterPage";
import StoreManagerRegisterPage from "./pages/admin/StoreManagerRegisterPage";
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
          ADMIN AUTHENTICATION
          ===================================================== */}

      <Route
        path="/admin/login"
        element={
          <AdminLoginRoute />
        }
      />

      <Route
        path="/admin/register"
        element={
          <AdminRegisterRoute />
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
          ADMIN WORKSPACE
          ===================================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <Navigate
              to="/admin/dashboard"
              replace
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <AdminProfilePage />
          </ProtectedRoute>
        }
      />


      <Route
        path="/admin/change-password"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <AdminChangePasswordPage />
          </ProtectedRoute>
        }
      />


      <Route
        path="/admin/staff/store-managers/register"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <StoreManagerRegisterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff/dispatchers/register"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <DispatcherRegisterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff/loaders/register"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <LoaderRegisterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/staff/drivers/register"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <DriverRegisterPage />
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
            <Navigate
              to="/admin/dashboard"
              replace
            />
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
// ADMIN REGISTER ROUTE
// ============================================================

function AdminRegisterRoute() {
  const {
    user,
    isInitializing,
  } = useAuth();


  if (isInitializing) {
    return (
      <AuthenticationLoader />
    );
  }


  if (
    user?.mustChangePassword
  ) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }


  if (
    user &&
    user.role !==
      "ADMIN"
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
    <AdminRegisterPage />
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

  const location =
    useLocation();


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
        to={`/forgot-password${location.search}`}
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