import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  getLoginPathForPortal,
  getPortalFromSearchParams,
  getRecoveryPath,
} from "../utils/authPortal";

import waypointLogo from "../assets/waypoint-logo.png";


function ForgotPasswordPage() {
  const navigate =
    useNavigate();

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

  const isAdminRecovery =
    portal ===
    "admin";

  const {
    requestPasswordReset,
  } = useAuth();


  const [
    identifier,
    setIdentifier,
  ] = useState(
    searchParams.get(
      "identifier"
    )?.trim() ||
    ""
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    const cleanedIdentifier =
      identifier.trim();


    if (!cleanedIdentifier) {
      setErrorMessage(
        isAdminRecovery
          ? "Enter your registered administrator email."
          : "Enter your User ID or registered email."
      );

      return;
    }


    try {
      setIsSubmitting(true);

      setErrorMessage("");


      await requestPasswordReset({
        identifier:
          cleanedIdentifier,
      });


      navigate(
        getRecoveryPath(
          "/verify-reset-otp",
          portal
        ),
        {
          replace: false,
        }
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to request a verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
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
          {/* BRAND */}

          <div className="mb-8 flex items-center justify-center gap-3">
            <img
              src={waypointLogo}
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
              <KeyRound
                size={23}
              />
            </div>


            <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
              {isAdminRecovery
                ? "Administrator recovery"
                : "Account recovery"}
            </p>


            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
              {isAdminRecovery
                ? "Verify your administrator email"
                : "Forgot your password?"}
            </h1>


            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              {isAdminRecovery
                ? "Confirm the administrator email below, then send a verification code to continue securely."
                : "Enter your User ID or registered email. If a matching account exists, we will send a verification code to its registered email address."}
            </p>


            <form
              className="mt-8 space-y-5"
              onSubmit={
                handleSubmit
              }
            >
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold"
                >
                  {isAdminRecovery
                    ? "Administrator Email"
                    : "User ID or Email"}
                </label>


                <div className="relative">
                  <Mail
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
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={
                      identifier
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(
                      event
                    ) =>
                      setIdentifier(
                        event.target
                          .value
                      )
                    }
                    placeholder={
                      isAdminRecovery
                        ? "Enter administrator email"
                        : "Enter User ID or email"
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
                      pr-4
                      text-sm
                      outline-none
                      transition
                      hover:border-[var(--color-border-strong)]
                      focus:border-[var(--color-primary)]
                      disabled:opacity-60
                    "
                  />
                </div>
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

                    Sending code...
                  </>
                ) : (
                  <>
                    Send verification code

                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>
            </form>


            <div
              className="
                mt-6
                flex
                items-start
                gap-3
                rounded-xl
                bg-[var(--color-surface-soft)]
                p-4
              "
            >
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              />

              <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                For security, Waypoint
                does not reveal whether
                the entered account
                exists.
              </p>
            </div>


            <Link
              to={loginPath}
              className="
                nexora-focus
                mt-6
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[var(--color-primary)]
                hover:underline
              "
            >
              <ArrowLeft
                size={16}
              />

              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


export default ForgotPasswordPage;