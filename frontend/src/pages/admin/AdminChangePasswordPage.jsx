import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AdminShell from "../../components/admin/AdminShell";
import PasswordRequirements, {
  isPasswordStrong,
} from "../../components/common/PasswordRequirements";
import useAuth from "../../hooks/useAuth";


function AdminChangePasswordPage() {
  const navigate =
    useNavigate();

  const {
    user,
    changePassword,
    logout,
  } = useAuth();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    if (!currentPassword) {
      setErrorMessage(
        "Enter your previous password."
      );

      return;
    }


    if (!newPassword) {
      setErrorMessage(
        "Enter a new password."
      );

      return;
    }


    if (
      !isPasswordStrong(
        newPassword
      )
    ) {
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

      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Your administrator password was changed successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to change your password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function handleForgotPassword() {
    const identifier =
      user?.email ||
      user?.userId ||
      "";


    logout();


    navigate(
      `/forgot-password?portal=admin&identifier=${encodeURIComponent(
        identifier
      )}`,
      {
        replace: false,
      }
    );
  }


  return (
    <AdminShell
      title="Change password"
      description="Update the password used to access your administrator account."
    >
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/profile"
            )
          }
          className="
            nexora-focus
            mb-4
            inline-flex
            items-center
            gap-2
            rounded-lg
            px-2
            py-1.5
            text-sm
            font-bold
            text-[var(--color-text-secondary)]
            transition
            hover:text-[var(--color-primary)]
          "
        >
          <ArrowLeft size={16} />
          Back to profile
        </button>


        <section
          className="
            rounded-2xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-5
            shadow-[var(--shadow-sm)]
            sm:p-7
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
              border-b
              border-[var(--color-border)]
              pb-5
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--color-primary-soft)]
                text-[var(--color-primary)]
              "
            >
              <KeyRound size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Password security
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[var(--color-text-secondary)]
                "
              >
                Confirm your previous password before creating a new one.
              </p>
            </div>
          </div>


          <form
            className="mt-6 space-y-5"
            onSubmit={handleSubmit}
          >
            <PasswordField
              id="adminCurrentPassword"
              label="Previous password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrentPassword}
              onToggle={() =>
                setShowCurrentPassword(
                  (current) =>
                    !current
                )
              }
              autoComplete="current-password"
            />

            <PasswordField
              id="adminNewPassword"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggle={() =>
                setShowNewPassword(
                  (current) =>
                    !current
                )
              }
              autoComplete="new-password"
            />

            <PasswordRequirements
              password={
                newPassword
              }
            />


            <PasswordField
              id="adminConfirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNewPassword}
              onToggle={() =>
                setShowNewPassword(
                  (current) =>
                    !current
                )
              }
              autoComplete="new-password"
            />


            {errorMessage && (
              <MessageBox
                type="error"
                message={errorMessage}
              />
            )}

            {successMessage && (
              <MessageBox
                type="success"
                message={successMessage}
              />
            )}


            <button
              type="submit"
              disabled={isSubmitting}
              className="
                nexora-focus
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSubmitting
                ? "Changing password..."
                : "Change password"}
            </button>
          </form>


          <div
            className="
              mt-6
              border-t
              border-[var(--color-border)]
              pt-5
              text-center
            "
          >
            <p
              className="
                text-xs
                text-[var(--color-text-muted)]
              "
            >
              Cannot remember your previous password?
            </p>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="
                nexora-focus
                mt-2
                inline-flex
                items-center
                justify-center
                rounded-lg
                px-3
                py-2
                text-sm
                font-bold
                text-[var(--color-primary)]
                transition
                hover:bg-[var(--color-surface-soft)]
              "
            >
              Verify email and reset password
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}


function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
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
        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={autoComplete}
          className="
            nexora-focus
            h-12
            w-full
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-input)]
            px-4
            pr-12
            text-sm
            text-[var(--color-text)]
            outline-none
            transition
            hover:border-[var(--color-border-strong)]
            focus:border-[var(--color-primary)]
          "
        />

        <button
          type="button"
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
            hover:text-[var(--color-text)]
          "
          aria-label={
            show
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {show ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}


function MessageBox({
  type,
  message,
}) {
  const success =
    type === "success";


  return (
    <div
      className={`
        flex
        items-start
        gap-3
        rounded-xl
        border
        px-4
        py-3
        text-sm
        ${
          success
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        }
      `}
      role={
        success
          ? "status"
          : "alert"
      }
    >
      {success ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />
      )}

      <span>{message}</span>
    </div>
  );
}


export default AdminChangePasswordPage;
