import {
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import {
  getLoginPathForRole,
} from "../utils/authPortal";

import {
  getRoleHomePath,
} from "../utils/roleRoutes";

import waypointLogo from "../assets/waypoint-logo.png";


function ChangePasswordPage() {
  const {
    user,
    changePassword,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


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
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
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


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");


    if (!currentPassword) {
      setErrorMessage(
        "Enter your current password."
      );

      return;
    }


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


    if (
      currentPassword ===
      newPassword
    ) {
      setErrorMessage(
        "Your new password must be different from your current password."
      );

      return;
    }


    try {
      setIsSubmitting(true);


      const updatedUser =
        await changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });


      navigate(
        getRoleHomePath(
          updatedUser.role
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to change password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function handleSignOut() {
    logout();

    navigate(
      getLoginPathForRole(
        user?.role
      ),
      {
        replace: true,
      }
    );
  }


  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header
        className="
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
        "
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <img
              src={waypointLogo}
              alt="Waypoint"
              className="h-11 w-11 object-contain"
            />

            <div>
              <p className="font-extrabold tracking-[0.04em]">
                WAYPOINT
              </p>

              <p className="text-xs text-[var(--color-text-muted)]">
                Delivery Operations
              </p>
            </div>
          </div>


          <div className="flex items-center gap-2">
<button
              type="button"
              onClick={
                handleSignOut
              }
              className="
                nexora-focus
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                px-4
                text-sm
                font-semibold
                transition
                hover:bg-[var(--color-surface-soft)]
              "
            >
              <LogOut
                size={17}
              />

              Sign out
            </button>
          </div>
        </div>
      </header>


      <section className="mx-auto flex max-w-6xl justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-xl">
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
              <ShieldCheck
                size={23}
              />
            </div>


            <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
              First sign-in security
            </p>


            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
              Create your new password
            </h1>


            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Hello{" "}
              <strong>
                {user.fullName}
              </strong>
              . Your current password
              is temporary. Create a
              new password before
              entering your workspace.
            </p>


            <form
              onSubmit={
                handleSubmit
              }
              className="mt-8 space-y-5"
            >
              <PasswordField
                id="currentPassword"
                label="Current password"
                value={
                  currentPassword
                }
                onChange={
                  setCurrentPassword
                }
                visible={
                  showCurrentPassword
                }
                onToggle={() =>
                  setShowCurrentPassword(
                    (current) =>
                      !current
                  )
                }
                autoComplete="current-password"
                disabled={
                  isSubmitting
                }
              />


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
                autoComplete="new-password"
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
                autoComplete="new-password"
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

                    Updating password...
                  </>
                ) : (
                  <>
                    <KeyRound
                      size={18}
                    />

                    Set new password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}


function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
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
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          disabled={
            disabled
          }
          autoComplete={
            autoComplete
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
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
          onClick={
            onToggle
          }
          disabled={
            disabled
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
            hover:bg-[var(--color-surface-soft)]
          "
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


export default ChangePasswordPage;