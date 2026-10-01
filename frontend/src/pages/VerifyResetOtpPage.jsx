import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import ThemeToggle from "../components/common/ThemeToggle";

import useAuth from "../hooks/useAuth";

import {
  getPasswordResetIdentifier,
  getPasswordResetToken,
} from "../services/passwordResetSession";

import waypointLogo from "../assets/waypoint-logo.png";


const RESEND_SECONDS =
  60;


function VerifyResetOtpPage() {
  const navigate =
    useNavigate();


  const {
    requestPasswordReset,
    verifyPasswordResetOtp,
  } = useAuth();


  const identifier =
    getPasswordResetIdentifier();


  const existingResetToken =
    getPasswordResetToken();


  const [
    otp,
    setOtp,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isResending,
    setIsResending,
  ] = useState(false);

  const [
    resendSeconds,
    setResendSeconds,
  ] = useState(
    RESEND_SECONDS
  );


  // ==========================================================
  // RESEND TIMER
  // ==========================================================

  useEffect(() => {
    if (
      resendSeconds <= 0
    ) {
      return undefined;
    }


    const timer =
      window.setInterval(
        () => {
          setResendSeconds(
            (current) =>
              Math.max(
                current - 1,
                0
              )
          );
        },
        1000
      );


    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    resendSeconds,
  ]);


  if (
    existingResetToken
  ) {
    return (
      <Navigate
        to="/reset-password"
        replace
      />
    );
  }


  if (!identifier) {
    return (
      <Navigate
        to="/forgot-password"
        replace
      />
    );
  }


  // ==========================================================
  // OTP INPUT
  // ==========================================================

  function handleOtpChange(
    event
  ) {
    const digitsOnly =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);


    setOtp(
      digitsOnly
    );

    setErrorMessage("");
  }


  // ==========================================================
  // VERIFY
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (
      !/^\d{6}$/.test(
        otp
      )
    ) {
      setErrorMessage(
        "Enter the 6-digit verification code."
      );

      return;
    }


    try {
      setIsSubmitting(true);

      setErrorMessage("");

      setSuccessMessage("");


      await verifyPasswordResetOtp({
        identifier,
        otp,
      });


      navigate(
        "/reset-password",
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to verify the code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  // ==========================================================
  // RESEND
  // ==========================================================

  async function handleResend() {
    if (
      resendSeconds > 0 ||
      isResending
    ) {
      return;
    }


    try {
      setIsResending(true);

      setErrorMessage("");

      setSuccessMessage("");


      await requestPasswordReset({
        identifier,
      });


      setOtp("");


      setResendSeconds(
        RESEND_SECONDS
      );


      setSuccessMessage(
        "If the account is valid, a new verification code has been sent."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to resend the verification code."
      );
    } finally {
      setIsResending(false);
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
              <MailCheck
                size={23}
              />
            </div>


            <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
              Email verification
            </p>


            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
              Enter your 6-digit code
            </h1>


            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              If the account exists,
              Waypoint sent a code to
              its registered email.
              The code expires after
              10 minutes.
            </p>


            <div
              className="
                mt-5
                rounded-xl
                bg-[var(--color-surface-soft)]
                px-4
                py-3
                text-sm
              "
            >
              <span className="text-[var(--color-text-muted)]">
                Account:
              </span>{" "}

              <strong>
                {identifier}
              </strong>
            </div>


            <form
              className="mt-7 space-y-5"
              onSubmit={
                handleSubmit
              }
            >
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-semibold"
                >
                  Verification code
                </label>


                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={
                    otp
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    handleOtpChange
                  }
                  placeholder="000000"
                  className="
                    nexora-focus
                    h-14
                    w-full
                    rounded-xl
                    border
                    border-[var(--color-border)]
                    bg-[var(--color-input)]
                    px-4
                    text-center
                    text-2xl
                    font-bold
                    tracking-[0.35em]
                    outline-none
                    transition
                    focus:border-[var(--color-primary)]
                    disabled:opacity-60
                  "
                />
              </div>


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


              {successMessage && (
                <div
                  className="
                    rounded-xl
                    border
                    border-[var(--color-success)]
                    bg-[var(--color-success-soft)]
                    px-4
                    py-3
                    text-sm
                    text-[var(--color-success)]
                  "
                >
                  {successMessage}
                </div>
              )}


              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  otp.length !== 6
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
                  disabled:opacity-60
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

                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={18}
                    />

                    Verify code
                  </>
                )}
              </button>
            </form>


            <div
              className="
                mt-6
                flex
                items-center
                justify-between
                gap-4
                border-t
                border-[var(--color-border)]
                pt-5
              "
            >
              <Link
                to="/forgot-password"
                className="
                  nexora-focus
                  inline-flex
                  items-center
                  gap-1.5
                  text-sm
                  font-semibold
                  text-[var(--color-text-secondary)]
                  hover:text-[var(--color-primary)]
                "
              >
                <ArrowLeft
                  size={15}
                />

                Change account
              </Link>


              <button
                type="button"
                disabled={
                  resendSeconds > 0 ||
                  isResending
                }
                onClick={
                  handleResend
                }
                className="
                  nexora-focus
                  inline-flex
                  items-center
                  gap-1.5
                  text-sm
                  font-semibold
                  text-[var(--color-primary)]
                  disabled:cursor-not-allowed
                  disabled:text-[var(--color-text-muted)]
                "
              >
                <RefreshCw
                  size={15}
                  className={
                    isResending
                      ? "animate-spin"
                      : ""
                  }
                />

                {resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : isResending
                    ? "Sending..."
                    : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


export default VerifyResetOtpPage;