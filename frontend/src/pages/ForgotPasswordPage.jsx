import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import RecoveryAuthLayout from "../components/common/RecoveryAuthLayout";

import useAuth from "../hooks/useAuth";
import useTranslations from "../hooks/useTranslations";

import {
  getLoginPathForPortal,
  getPortalFromSearchParams,
  getRecoveryPath,
} from "../utils/authPortal";

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
    portal === "admin";

  const {
    requestPasswordReset,
  } = useAuth();

  const {
    t,
    language,
    translateDynamicText,
  } = useTranslations();

  const [
    identifier,
    setIdentifier,
  ] = useState(
    searchParams
      .get(
        "identifier"
      )
      ?.trim() ||
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

  // ==========================================================
  // BACKEND ERROR
  // ==========================================================

  async function resolveError(
    error
  ) {
    const backendMessage =
      error.response?.data
        ?.message ||
      error.message;

    if (!backendMessage) {
      return t(
        "recovery.requestFailed"
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
        "recovery.requestFailed"
      );
    }
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const cleanedIdentifier =
      identifier.trim();

    if (!cleanedIdentifier) {
      setErrorMessage(
        isAdminRecovery
          ? t(
              "recovery.adminEmailRequired"
            )
          : t(
              "recovery.identifierRequired"
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

      await requestPasswordReset({
        identifier:
          cleanedIdentifier,
      });

      navigate(
        getRecoveryPath(
          "/verify-reset-otp",
          portal
        )
      );
    } catch (error) {
      setErrorMessage(
        await resolveError(
          error
        )
      );
    } finally {
      setIsSubmitting(
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
          text-[1.7rem]
          leading-[1.3]
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
          <KeyRound
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
          {isAdminRecovery
            ? t(
                "recovery.adminRecovery"
              )
            : t(
                "recovery.accountRecovery"
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
          {isAdminRecovery
            ? t(
                "recovery.adminEmailTitle"
              )
            : t(
                "recovery.forgotTitle"
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
          {isAdminRecovery
            ? t(
                "recovery.adminEmailDescription"
              )
            : t(
                "recovery.forgotDescription"
              )}
        </p>

        {/* FORM */}

        <form
          className="
            mt-7
            space-y-5
          "
          onSubmit={
            handleSubmit
          }
        >
          <div>
            <label
              htmlFor="identifier"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[var(--color-text)]
              "
            >
              {isAdminRecovery
                ? t(
                    "recovery.adminEmail"
                  )
                : t(
                    "recovery.userIdOrEmail"
                  )}
            </label>

            <div
              className="
                relative
              "
            >
              <Mail
                size={18}
                strokeWidth={1.8}
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
                value={identifier}
                disabled={
                  isSubmitting
                }
                onChange={(
                  event
                ) =>
                  setIdentifier(
                    event
                      .target
                      .value
                  )
                }
                placeholder={
                  isAdminRecovery
                    ? t(
                        "recovery.adminEmailPlaceholder"
                      )
                    : t(
                        "recovery.userIdPlaceholder"
                      )
                }
                className="
                  nexora-focus
                  h-[52px]
                  w-full
                  rounded-xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-input)]
                  pl-11
                  pr-4
                  text-sm
                  text-[var(--color-text)]
                  outline-none
                  transition
                  duration-200
                  placeholder:text-[var(--color-text-muted)]
                  hover:border-[var(--color-border-strong)]
                  focus:border-[var(--color-primary)]
                  disabled:cursor-not-allowed
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

              <span>
                {errorMessage}
              </span>
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
              min-h-[50px]
              w-full
              items-center
              justify-center
              gap-2.5
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
              disabled:opacity-65
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
                  "recovery.sendingCode"
                )}
              </>
            ) : (
              <>
                {t(
                  "recovery.sendCode"
                )}

                <ArrowRight
                  size={17}
                />
              </>
            )}
          </button>
        </form>

        {/* SECURITY NOTICE */}

        <div
          className="
            mt-6
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface-soft)]
            p-4
          "
        >
          <ShieldCheck
            size={18}
            strokeWidth={1.9}
            className="
              mt-0.5
              shrink-0
              text-[var(--color-primary)]
            "
          />

          <p
            className="
              text-xs
              leading-5
              text-[var(--color-text-secondary)]
            "
          >
            {t(
              "recovery.securityNotice"
            )}
          </p>
        </div>
      </section>
    </RecoveryAuthLayout>
  );
}

export default ForgotPasswordPage;