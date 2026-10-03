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

import RecoveryAuthLayout from "../components/common/RecoveryAuthLayout";

import useAuth from "../hooks/useAuth";
import useTranslations from "../hooks/useTranslations";

import {
  getPasswordResetToken,
} from "../services/passwordResetSession";

import {
  getLoginPathForPortal,
  getPortalFromSearchParams,
  getRecoveryPath,
} from "../utils/authPortal";

function ResetPasswordPage() {
  const {
    resetForgottenPassword,
  } = useAuth();

  const {
    t,
    language,
    translateDynamicText,
  } = useTranslations();

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

  // ==========================================================
  // PASSWORD RULES
  // ==========================================================

  const requirements = {
    length:
      newPassword.length >=
      10,

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

  // ==========================================================
  // ROUTE GUARD
  // ==========================================================

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

  // ==========================================================
  // ERROR
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
        "recovery.resetFailed"
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
        "recovery.resetFailed"
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

    setErrorMessage(
      ""
    );

    if (!passwordIsStrong) {
      setErrorMessage(
        t(
          "recovery.passwordWeak"
        )
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setErrorMessage(
        t(
          "recovery.passwordMismatch"
        )
      );

      return;
    }

    try {
      setIsSubmitting(
        true
      );

      await resetForgottenPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setResetComplete(
        true
      );

      setNewPassword(
        ""
      );

      setConfirmPassword(
        ""
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
        {resetComplete ? (
          <ResetSuccess
            loginPath={
              loginPath
            }
            t={t}
            titleClass={
              titleClass
            }
          />
        ) : (
          <>
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
              />
            </div>

            <p
              className="
                mt-5
                text-sm
                font-semibold
                text-[var(--color-primary)]
              "
            >
              {t(
                "recovery.secureReset"
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
                "recovery.createPasswordTitle"
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
                "recovery.createPasswordDescription"
              )}
            </p>

            <form
              className="
                mt-7
                space-y-5
              "
              onSubmit={
                handleSubmit
              }
            >
              <PasswordField
                id="newPassword"
                label={t(
                  "recovery.newPassword"
                )}
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
                showLabel={t(
                  "recovery.showPassword"
                )}
                hideLabel={t(
                  "recovery.hidePassword"
                )}
              />

              <div
                className="
                  rounded-xl
                  border
                  border-[var(--color-border)]
                  bg-[var(--color-surface-soft)]
                  p-4
                "
              >
                <p
                  className="
                    mb-3
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-[var(--color-text-muted)]
                  "
                >
                  {t(
                    "recovery.passwordRequirements"
                  )}
                </p>

                <div
                  className="
                    grid
                    gap-2
                    sm:grid-cols-2
                  "
                >
                  <Requirement
                    passed={
                      requirements.length
                    }
                    text={t(
                      "recovery.requirementLength"
                    )}
                  />

                  <Requirement
                    passed={
                      requirements.uppercase
                    }
                    text={t(
                      "recovery.requirementUppercase"
                    )}
                  />

                  <Requirement
                    passed={
                      requirements.lowercase
                    }
                    text={t(
                      "recovery.requirementLowercase"
                    )}
                  />

                  <Requirement
                    passed={
                      requirements.number
                    }
                    text={t(
                      "recovery.requirementNumber"
                    )}
                  />

                  <Requirement
                    passed={
                      requirements.special
                    }
                    text={t(
                      "recovery.requirementSpecial"
                    )}
                  />
                </div>
              </div>

              <PasswordField
                id="confirmPassword"
                label={t(
                  "recovery.confirmPassword"
                )}
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
                showLabel={t(
                  "recovery.showPassword"
                )}
                hideLabel={t(
                  "recovery.hidePassword"
                )}
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

                    {t(
                      "recovery.resettingPassword"
                    )}
                  </>
                ) : (
                  <>
                    <KeyRound
                      size={18}
                    />

                    {t(
                      "recovery.resetPassword"
                    )}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </RecoveryAuthLayout>
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
  showLabel,
  hideLabel,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-[var(--color-text)]
        "
      >
        {label}
      </label>

      <div
        className="
          relative
        "
      >
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
          value={value}
          disabled={disabled}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          placeholder={label}
          className="
            nexora-focus
            h-[52px]
            w-full
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-input)]
            pl-11
            pr-12
            text-sm
            text-[var(--color-text)]
            outline-none
            transition
            focus:border-[var(--color-primary)]
            disabled:opacity-60
          "
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className="
            nexora-focus
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
              ? hideLabel
              : showLabel
          }
          title={
            visible
              ? hideLabel
              : showLabel
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
// PASSWORD REQUIREMENT
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
          shrink-0
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
// SUCCESS STATE
// ============================================================

function ResetSuccess({
  loginPath,
  t,
  titleClass,
}) {
  return (
    <div
      className="
        text-center
      "
    >
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
          size={27}
        />
      </div>

      <p
        className="
          mt-5
          text-sm
          font-semibold
          text-[var(--color-success)]
        "
      >
        {t(
          "recovery.passwordUpdated"
        )}
      </p>

      <h1
        className={`
          mt-2
          font-bold
          ${titleClass}
        `}
      >
        {t(
          "recovery.resetSuccessful"
        )}
      </h1>

      <p
        className="
          mt-4
          text-sm
          leading-6
          text-[var(--color-text-secondary)]
        "
      >
        {t(
          "recovery.resetSuccessDescription"
        )}
      </p>

      <Link
        to={loginPath}
        replace
        className="
          nexora-focus
          mt-7
          flex
          min-h-[50px]
          w-full
          items-center
          justify-center
          rounded-xl
          bg-[var(--color-primary)]
          px-5
          py-3
          text-sm
          font-bold
          text-white
          transition
          hover:bg-[var(--color-primary-hover)]
        "
      >
        {t(
          "recovery.backToSignIn"
        )}
      </Link>
    </div>
  );
}

export default ResetPasswordPage;