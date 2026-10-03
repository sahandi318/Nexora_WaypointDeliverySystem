import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import OfflineSyncManager from "./components/OfflineSyncManager";

import ThemeToggle from "./components/common/ThemeToggle";
import Footer from "./components/landing/Footer";
import LandingNavbar from "./components/landing/LandingNavbar";

import useAuth from "./hooks/useAuth";

import AdminChangePasswordPage from "./pages/admin/AdminChangePasswordPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
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
import ReportsCapacity from "./pages/dispatcher/reports/ReportsCapacity";


// ============================================================
// DRIVER PAGES
// ============================================================

import DriverDashboard from "./pages/driver/DriverDashboard";
import TripOverview from "./pages/driver/TripOverview";
import StopDetails from "./pages/driver/StopDetails";
import NavigationPage from "./pages/driver/NavigationPage";
import DeliveryOutcome from "./pages/driver/DeliveryOutcome";
import ProofOfDelivery from "./pages/driver/ProofOfDelivery";
import DeliveryException from "./pages/driver/DeliveryException";
import SyncCenter from "./pages/driver/SyncCenter";
import TripComplete from "./pages/driver/TripComplete";

import {
  getPasswordResetToken,
} from "./services/passwordResetSession";

import {
  getRoleHomePath,
} from "./utils/roleRoutes";

// ============================================================
// APP ROUTES
// ============================================================

function App() {
  const {
    user,
    isInitializing,
  } = useAuth();


  const showPublicNavbar =
    !isInitializing &&
    !user;


  return (
    <div
      className="
        flex
        min-h-screen
        flex-col
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
    >
      <ThemeToggle />

      {showPublicNavbar && (
        <LandingNavbar />
      )}

      <div
        className={`
          flex-1
          ${
            showPublicNavbar
              ? "pt-16 sm:pt-20"
              : ""
          }
        `}
      >
        <Routes>
      {/* =====================================================
          PUBLIC LANDING PAGE
          ===================================================== */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      {/* =====================================================
          SHARED STAFF LOGIN
          ===================================================== */}

      <Route
        path="/login"
        element={<LoginRoute />}
      />

      {/* =====================================================
          ADMIN AUTHENTICATION
          ===================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLoginRoute />}
      />

      <Route
        path="/admin/register"
        element={<AdminRegisterRoute />}
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
        element={<ResetPasswordRoute />}
      />

      {/* =====================================================
          FIRST LOGIN PASSWORD CHANGE
          ===================================================== */}

      <Route
        path="/change-password"
        element={<PasswordChangeRoute />}
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
        path="/dispatcher/reports"
        element={
          <ProtectedRoute allowedRoles={["DISPATCHER"]}>
            <ReportsCapacity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dispatcher/*"
        element={
          <ProtectedRoute allowedRoles={["DISPATCHER"]}>
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
        path="/driver"
        element={
          <DriverProtectedPage>
            <DriverDashboard />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId"
        element={
          <DriverProtectedPage>
            <TripOverview />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/stops/:stopId"
        element={
          <DriverProtectedPage>
            <StopDetails />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/stops/:stopId/navigation"
        element={
          <DriverProtectedPage>
            <NavigationPage />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/stops/:stopId/outcome"
        element={
          <DriverProtectedPage>
            <DeliveryOutcome />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/stops/:stopId/pod"
        element={
          <DriverProtectedPage>
            <ProofOfDelivery />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/stops/:stopId/exception"
        element={
          <DriverProtectedPage>
            <DeliveryException />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/sync"
        element={
          <DriverProtectedPage>
            <SyncCenter />
          </DriverProtectedPage>
        }
      />

      <Route
        path="/driver/trips/:tripId/complete"
        element={
          <DriverProtectedPage>
            <TripComplete />
          </DriverProtectedPage>
        }
      />

      {/* Unknown Driver URL */}
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute
            allowedRoles={[
              "DRIVER",
            ]}
          >
            <Navigate
              to="/driver"
              replace
            />
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          UNKNOWN FRONTEND ROUTE
          ===================================================== */}

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
      </div>

      <Footer />
    </div>
  );
}

// ============================================================
// DRIVER PROTECTED PAGE
// ============================================================

/**
 * Uses the TEAM'S shared authentication system.
 *
 * The Driver does not have a separate login or a separate
 * localStorage token check.
 *
 * OfflineSyncManager is mounted only while the Driver is
 * inside the Driver workspace.
 */
function DriverProtectedPage({
  children,
}) {
  return (
    <ProtectedRoute
      allowedRoles={[
        "DRIVER",
      ]}
    >
      <OfflineSyncManager />

      {children}
    </ProtectedRoute>
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