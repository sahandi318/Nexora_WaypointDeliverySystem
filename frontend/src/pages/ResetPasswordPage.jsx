import {
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from "lucide-react";

import {
  Link,
  Navigate,
  useSearchParams,
} from "react-router-dom";

import ThemeToggle from "../components/common/ThemeToggle";

import useAuth from "../hooks/useAuth";

import {
  getPasswordResetToken,
} from "../services/passwordResetSession";

import {
  getLoginPathForPortal,
  getPortalFromSearchParams,
  getRecoveryPath,
} from "../utils/authPortal";

import waypointLogo from "../assets/waypoint-logo.png";


function ResetPasswordPage() {
  const {
    resetForgottenPassword,
  } = useAuth();

  const [
    searchParams,
  ] = useSearchParams();

  const portal =
    getPortalFromSearchParams(
      searchParams
    );

  const loginPath =
    getLoginPathForPortal(
      portal
    );


  const resetToken =
    getPasswordResetToken();


  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    resetComplete,
    setResetComplete,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const requirements = {
    length:
      newPassword.length >= 10,

    uppercase:
      /[A-Z]/.test(
        newPassword
      ),

    lowercase:
      /[a-z]/.test(
        newPassword
      ),

    number:
      /[0-9]/.test(
        newPassword
      ),

    special:
      /[^A-Za-z0-9]/.test(
        newPassword
      ),
  };


  const passwordIsStrong =
    Object.values(
      requirements
    ).every(Boolean);


  if (
    !resetToken &&
    !resetComplete
  ) {
    return (
      <Navigate
        to={getRecoveryPath(
          "/forgot-password",
          portal
        )}
        replace
      />
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    setErrorMessage("");


    if (!passwordIsStrong) {
      setErrorMessage(
        "Your new password does not meet all security requirements."
      );

      return;
    }


    if (
      newPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        "New password and confirmation do not match."
      );

      return;
    }


    try {
      setIsSubmitting(true);


      await resetForgottenPassword({
        resetToken,

        newPassword,

        confirmPassword,
      });


      setResetComplete(
        true
      );


      setNewPassword("");

      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to reset your password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>


      <div
        className="
          mx-auto
          flex
          min-h-screen
          max-w-6xl
          items-center
          justify-center
          px-5
          py-20
          sm:px-8
        "
      >
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3">
            <img
              src={
                waypointLogo
              }
              alt="Waypoint"
              className="h-12 w-12 object-contain"
            />

            <div>
              <p className="font-extrabold tracking-[0.04em]">
                WAYPOINT
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Delivery Operations
              </p>
            </div>
          </div>


          <div
            className="
              rounded-[26px]
              border
              border-[var(--color-border)]
              bg-[var(--color-surface)]
              p-6
              shadow-[var(--shadow-lg)]
              sm:p-8
            "
          >
            {resetComplete ? (
              <ResetSuccess
                loginPath={loginPath}
              />
            ) : (
              <>
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[var(--color-primary-soft)]
                    text-[var(--color-primary)]
                  "
                >
                  <KeyRound
                    size={23}
                  />
                </div>


                <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
                  Secure password reset
                </p>


                <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
                  Create a new password
                </h1>


                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Your identity has been
                  verified. Create a new
                  password for your
                  Waypoint account.
                </p>


                <form
                  className="mt-8 space-y-5"
                  onSubmit={
                    handleSubmit
                  }
                >
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    value={
                      newPassword
                    }
                    onChange={
                      setNewPassword
                    }
                    visible={
                      showNewPassword
                    }
                    onToggle={() =>
                      setShowNewPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  />


                  <div
                    className="
                      rounded-2xl
                      border
                      border-[var(--color-border)]
                      bg-[var(--color-surface-soft)]
                      p-4
                    "
                  >
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      Password requirements
                    </p>


                    <div className="grid gap-2 sm:grid-cols-2">
                      <Requirement
                        passed={
                          requirements.length
                        }
                        text="10+ characters"
                      />

                      <Requirement
                        passed={
                          requirements.uppercase
                        }
                        text="Uppercase letter"
                      />

                      <Requirement
                        passed={
                          requirements.lowercase
                        }
                        text="Lowercase letter"
                      />

                      <Requirement
                        passed={
                          requirements.number
                        }
                        text="Number"
                      />

                      <Requirement
                        passed={
                          requirements.special
                        }
                        text="Special character"
                      />
                    </div>
                  </div>


                  <PasswordField
                    id="confirmPassword"
                    label="Confirm new password"
                    value={
                      confirmPassword
                    }
                    onChange={
                      setConfirmPassword
                    }
                    visible={
                      showConfirmPassword
                    }
                    onToggle={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  />


                  {errorMessage && (
                    <div
                      role="alert"
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-[var(--color-danger)]
                        bg-[var(--color-danger-soft)]
                        px-4
                        py-3
                        text-sm
                        text-[var(--color-danger)]
                      "
                    >
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      {errorMessage}
                    </div>
                  )}


                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="
                      nexora-focus
                      flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[var(--color-primary)]
                      px-5
                      text-sm
                      font-bold
                      text-white
                      transition
                      hover:bg-[var(--color-primary-hover)]
                      disabled:cursor-not-allowed
                      disabled:opacity-70
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="
                            h-4
                            w-4
                            animate-spin
                            rounded-full
                            border-2
                            border-white/40
                            border-t-white
                          "
                        />

                        Resetting password...
                      </>
                    ) : (
                      <>
                        <KeyRound
                          size={18}
                        />

                        Reset password
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>


      <div className="relative">
        <LockKeyhole
          size={18}
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-[var(--color-text-muted)]
          "
        />


        <input
          id={id}
          name={id}
          type={
            visible
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            label
          }
          className="
            nexora-focus
            h-12
            w-full
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-input)]
            pl-11
            pr-12
            text-sm
            outline-none
            transition
            focus:border-[var(--color-primary)]
            disabled:opacity-60
          "
        />


        <button
          type="button"
          disabled={
            disabled
          }
          onClick={
            onToggle
          }
          className="
            absolute
            right-2
            top-1/2
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            text-[var(--color-text-muted)]
            transition
            hover:bg-[var(--color-surface-soft)]
            disabled:opacity-60
          "
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff
              size={18}
            />
          ) : (
            <Eye
              size={18}
            />
          )}
        </button>
      </div>
    </div>
  );
}


// ============================================================
// REQUIREMENT
// ============================================================

function Requirement({
  passed,
  text,
}) {
  return (
    <div
      className={`
        flex
        items-center
        gap-2
        text-xs
        font-medium
        ${
          passed
            ? "text-[var(--color-success)]"
            : "text-[var(--color-text)]"
        }
      `}
    >
      <span
        className={`
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          ${
            passed
              ? "bg-[var(--color-success-soft)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)]"
          }
        `}
      >
        <Check
          size={12}
        />
      </span>


      {text}
    </div>
  );
}


// ============================================================
// SUCCESS
// ============================================================

function ResetSuccess({
  loginPath,
}) {
  return (
    <div className="text-center">
      <div
        className="
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[var(--color-success-soft)]
          text-[var(--color-success)]
        "
      >
        <CheckCircle2
          size={28}
        />
      </div>


      <p className="mt-6 text-sm font-semibold text-[var(--color-success)]">
        Password updated
      </p>


      <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
        Reset successful
      </h1>


      <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
        Your Waypoint password has
        been changed successfully.
        You can now sign in using
        your new password.
      </p>


      <Link
        to={loginPath}
        replace
        className="
          nexora-focus
          mt-7
          flex
          h-12
          w-full
          items-center
          justify-center
          rounded-xl
          bg-[var(--color-primary)]
          px-5
          text-sm
          font-bold
          text-white
          transition
          hover:bg-[var(--color-primary-hover)]
        "
      >
        Back to sign in
      </Link>
    </div>
  );
}


export default ResetPasswordPage;