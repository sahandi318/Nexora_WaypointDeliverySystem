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
  useSearchParams,
} from "react-router-dom";

import RecoveryAuthLayout from "../components/common/RecoveryAuthLayout";

import useAuth from "../hooks/useAuth";
import useTranslations from "../hooks/useTranslations";

import {
  getPasswordResetIdentifier,
  getPasswordResetToken,
} from "../services/passwordResetSession";

import {
  getLoginPathForPortal,
  getPortalFromSearchParams,
  getRecoveryPath,
} from "../utils/authPortal";

const RESEND_SECONDS =
  60;

function VerifyResetOtpPage() {
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

  const {
    requestPasswordReset,
    verifyPasswordResetOtp,
  } = useAuth();

  const {
    t,
    language,
    translateDynamicText,
  } = useTranslations();

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
    resendSucceeded,
    setResendSucceeded,
  ] = useState(false);

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

  // ==========================================================
  // ROUTE GUARDS
  // ==========================================================

  if (
    existingResetToken
  ) {
    return (
      <Navigate
        to={getRecoveryPath(
          "/reset-password",
          portal
        )}
        replace
      />
    );
  }

  if (!identifier) {
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

  // ==========================================================
  // ERROR TRANSLATION
  // ==========================================================

  async function resolveError(
    error,
    fallbackKey
  ) {
    const backendMessage =
      error.response?.data
        ?.message ||
      error.message;

    if (!backendMessage) {
      return t(
        fallbackKey
      );
    }

    if (
      language === "en"
    ) {
      return backendMessage;
    }

    try {
      return await translateDynamicText(
        backendMessage
      );
    } catch {
      return t(
        fallbackKey
      );
    }
  }

  // ==========================================================
  // OTP INPUT
  // ==========================================================

  function handleOtpChange(
    event
  ) {
    const digitsOnly =
      event.target.value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    setOtp(
      digitsOnly
    );

    setErrorMessage(
      ""
    );
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
        t(
          "recovery.codeRequired"
        )
      );

      return;
    }

    try {
      setIsSubmitting(
        true
      );

      setErrorMessage(
        ""
      );

      setResendSucceeded(
        false
      );

      await verifyPasswordResetOtp({
        identifier,
        otp,
      });

      navigate(
        getRecoveryPath(
          "/reset-password",
          portal
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        await resolveError(
          error,
          "recovery.verifyFailed"
        )
      );
    } finally {
      setIsSubmitting(
        false
      );
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
      setIsResending(
        true
      );

      setErrorMessage(
        ""
      );

      setResendSucceeded(
        false
      );

      await requestPasswordReset({
        identifier,
      });

      setOtp(
        ""
      );

      setResendSeconds(
        RESEND_SECONDS
      );

      setResendSucceeded(
        true
      );
    } catch (error) {
      setErrorMessage(
        await resolveError(
          error,
          "recovery.resendFailed"
        )
      );
    } finally {
      setIsResending(
        false
      );
    }
  }

  const titleClass =
    language === "en"
      ? `
          text-[2rem]
          leading-[1.15]
          tracking-[-0.035em]
        `
      : `
          text-[1.65rem]
          leading-[1.32]
          tracking-[-0.015em]
        `;

  return (
    <RecoveryAuthLayout
      backTo={loginPath}
    >
      <section
        className="
          w-full
          rounded-2xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          p-6
          shadow-[var(--shadow-lg)]
          sm:p-8
        "
      >
        {/* ICON */}

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-[var(--color-primary-soft)]
            text-[var(--color-primary)]
          "
        >
          <MailCheck
            size={21}
            strokeWidth={1.9}
          />
        </div>

        {/* HEADER */}

        <p
          className="
            mt-5
            text-sm
            font-semibold
            text-[var(--color-primary)]
          "
        >
          {t(
            "recovery.emailVerification"
          )}
        </p>

        <h1
          className={`
            mt-2
            font-bold
            text-[var(--color-text)]
            ${titleClass}
          `}
        >
          {t(
            "recovery.enterCodeTitle"
          )}
        </h1>

        <p
          className="
            mt-3
            text-sm
            leading-6
            text-[var(--color-text-secondary)]
          "
        >
          {t(
            "recovery.codeDescription"
          )}
        </p>

        {/* ACCOUNT */}

        <div
          className="
            mt-5
            flex
            flex-wrap
            items-center
            gap-x-2
            gap-y-1
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface-soft)]
            px-4
            py-3
            text-sm
          "
        >
          <span
            className="
              text-[var(--color-text-muted)]
            "
          >
            {t(
              "recovery.account"
            )}
          </span>

          <strong
            className="
              text-[var(--color-text)]
            "
          >
            {identifier}
          </strong>
        </div>

        {/* FORM */}

        <form
          className="
            mt-6
            space-y-5
          "
          onSubmit={
            handleSubmit
          }
        >
          <div>
            <label
              htmlFor="otp"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[var(--color-text)]
              "
            >
              {t(
                "recovery.verificationCode"
              )}
            </label>

            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              disabled={
                isSubmitting
              }
              onChange={
                handleOtpChange
              }
              placeholder="000000"
              className="
                nexora-focus
                h-[56px]
                w-full
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-input)]
                px-4
                text-center
                text-xl
                font-bold
                tracking-[0.42em]
                text-[var(--color-text)]
                outline-none
                transition
                duration-200
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
                leading-5
                text-[var(--color-danger)]
              "
            >
              <AlertCircle
                size={18}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              {errorMessage}
            </div>
          )}

          {resendSucceeded && (
            <div
              className="
                rounded-xl
                border
                border-[var(--color-success)]
                bg-[var(--color-success-soft)]
                px-4
                py-3
                text-sm
                leading-5
                text-[var(--color-success)]
              "
            >
              {t(
                "recovery.resendSuccess"
              )}
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
              min-h-[50px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--color-primary)]
              px-5
              py-3
              text-sm
              font-bold
              text-white
              transition
              duration-200
              hover:bg-[var(--color-primary-hover)]
              disabled:cursor-not-allowed
              disabled:opacity-55
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

                {t(
                  "recovery.verifying"
                )}
              </>
            ) : (
              <>
                <ShieldCheck
                  size={17}
                />

                {t(
                  "recovery.verifyCode"
                )}
              </>
            )}
          </button>
        </form>

        {/* SECONDARY ACTIONS */}

        <div
          className="
            mt-6
            flex
            flex-col
            gap-3
            border-t
            border-[var(--color-border)]
            pt-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <Link
            to={getRecoveryPath(
              "/forgot-password",
              portal
            )}
            className="
              nexora-focus
              inline-flex
              min-h-9
              items-center
              gap-1.5
              text-sm
              font-semibold
              text-[var(--color-text-secondary)]
              transition
              hover:text-[var(--color-primary)]
            "
          >
            <ArrowLeft
              size={15}
            />

            {t(
              "recovery.changeAccount"
            )}
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
              min-h-9
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
              ? t(
                  "recovery.resendIn",
                  null,
                  {
                    seconds:
                      resendSeconds,
                  }
                )
              : isResending
                ? t(
                    "recovery.sending"
                  )
                : t(
                    "recovery.resendCode"
                  )}
          </button>
        </div>
      </section>
    </RecoveryAuthLayout>
  );
}

export default VerifyResetOtpPage;