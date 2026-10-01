import {
  Navigate,
  useLocation,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import {
  getRoleHomePath,
} from "../../utils/roleRoutes";


function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const {
    user,
    isInitializing,
  } = useAuth();

  const location =
    useLocation();


  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
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
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }


  // ==========================================================
  // MANDATORY PASSWORD CHANGE
  // ==========================================================

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


  if (
    Array.isArray(
      allowedRoles
    ) &&
    !allowedRoles.includes(
      user.role
    )
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


  return children;
}


export default ProtectedRoute;