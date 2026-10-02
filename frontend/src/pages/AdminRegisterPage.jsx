import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import AdminShell from "../components/admin/AdminShell";
import LoginUtilityBar from "../components/common/LoginUtilityBar";
import useAuth from "../hooks/useAuth";
import api from "../services/api";


const INITIAL_FORM = {
  userId:
    "",

  fullName:
    "",

  email:
    "",

  phone:
    "",

  password:
    "",

  confirmPassword:
    "",

  adminSecretKey:
    "",
};


function AdminRegisterPage() {
  const {
    user,
  } = useAuth();

  const isAuthenticatedAdmin =
    user?.role ===
    "ADMIN";


  if (isAuthenticatedAdmin) {
    return (
      <AdminShell
        title="Register administrator"
        description="Create another administrator account using the private administrator registration key."
      >
        <div className="mx-auto max-w-3xl">
          <RegistrationCard
            authenticatedAdmin
          />
        </div>
      </AdminShell>
    );
  }


  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[var(--color-bg)]
        px-4
        py-8
        text-[var(--color-text)]
        sm:px-6
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-12
          h-96
          w-96
          rounded-full
          bg-[var(--color-primary)]
          opacity-[0.07]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          right-0
          h-[28rem]
          w-[28rem]
          rounded-full
          bg-[var(--color-accent)]
          opacity-[0.07]
          blur-3xl
        "
      />


      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <LoginUtilityBar />

        <div className="mt-6">
          <RegistrationCard />
        </div>
      </div>
    </main>
  );
}


function RegistrationCard({
  authenticatedAdmin = false,
}) {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showSecret,
    setShowSecret,
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


  function updateField(
    name,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    if (
      !form.userId.trim() ||
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword ||
      !form.adminSecretKey
    ) {
      setErrorMessage(
        "Complete all required fields before registering the administrator."
      );

      return;
    }


    if (
      form.password !==
      form.confirmPassword
    ) {
      setErrorMessage(
        "Password and confirmation do not match."
      );

      return;
    }


    try {
      setIsSubmitting(true);

      const response =
        await api.post(
          "/admin/register",
          {
            userId:
              form.userId.trim(),

            fullName:
              form.fullName.trim(),

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            password:
              form.password,

            confirmPassword:
              form.confirmPassword,

            adminSecretKey:
              form.adminSecretKey,
          }
        );


      const message =
        response.data?.message ||
        "Administrator account registered successfully.";


      if (authenticatedAdmin) {
        setForm(
          INITIAL_FORM
        );

        setSuccessMessage(
          message
        );

        return;
      }


      navigate(
        "/admin/login",
        {
          replace: true,

          state: {
            registrationSuccess:
              message,
          },
        }
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to register the administrator account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <section
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-[var(--color-border-strong)]
        bg-[var(--color-surface)]
        shadow-[var(--shadow-lg)]
      "
    >
      <div className="h-1 bg-[var(--color-primary)]" />

      <div className="p-5 sm:p-8">
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-[var(--color-border)]
            pb-6
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-[var(--color-primary-soft)]
                px-3
                py-1.5
                text-xs
                font-bold
                text-[var(--color-primary)]
              "
            >
              <ShieldCheck size={14} />
              Verified administrator registration
            </div>

            <h1
              className="
                mt-4
                text-2xl
                font-bold
                tracking-[-0.035em]
                sm:text-3xl
              "
            >
              Create administrator account
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-[var(--color-text-secondary)]
              "
            >
              Enter the administrator's personal details and the private admin key. The key is verified only by the backend and is never stored in the browser.
            </p>
          </div>

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-[var(--color-primary)]
              text-white
            "
          >
            <UserPlus size={22} />
          </div>
        </div>


        <form
          className="mt-6"
          onSubmit={
            handleSubmit
          }
        >
          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <TextField
              id="adminRegisterUserId"
              label="Administrator User ID"
              icon={UserRound}
              value={form.userId}
              onChange={(value) =>
                updateField(
                  "userId",
                  value
                )
              }
              placeholder="e.g. ADMIN002"
              autoComplete="username"
              required
            />

            <TextField
              id="adminRegisterName"
              label="Full name"
              icon={UserRound}
              value={form.fullName}
              onChange={(value) =>
                updateField(
                  "fullName",
                  value
                )
              }
              placeholder="Administrator full name"
              autoComplete="name"
              required
            />

            <TextField
              id="adminRegisterEmail"
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
              placeholder="name@example.com"
              autoComplete="email"
              required
            />

            <TextField
              id="adminRegisterPhone"
              label="Phone"
              icon={Phone}
              type="tel"
              value={form.phone}
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
              placeholder="Optional phone number"
              autoComplete="tel"
            />

            <SecretField
              id="adminRegisterPassword"
              label="Password"
              icon={LockKeyhole}
              value={form.password}
              onChange={(value) =>
                updateField(
                  "password",
                  value
                )
              }
              show={showPassword}
              onToggle={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }
              autoComplete="new-password"
              placeholder="Create a strong password"
              required
            />

            <SecretField
              id="adminRegisterConfirmPassword"
              label="Confirm password"
              icon={LockKeyhole}
              value={form.confirmPassword}
              onChange={(value) =>
                updateField(
                  "confirmPassword",
                  value
                )
              }
              show={showPassword}
              onToggle={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }
              autoComplete="new-password"
              placeholder="Re-enter the password"
              required
            />
          </div>


          <div className="mt-4">
            <SecretField
              id="adminSecretKey"
              label="Secret administrator key"
              icon={KeyRound}
              value={form.adminSecretKey}
              onChange={(value) =>
                updateField(
                  "adminSecretKey",
                  value
                )
              }
              show={showSecret}
              onToggle={() =>
                setShowSecret(
                  (current) =>
                    !current
                )
              }
              autoComplete="off"
              placeholder="Enter the private admin registration key"
              required
            />
          </div>


          <div
            className="
              mt-4
              rounded-xl
              border
              border-[var(--color-border)]
              bg-[var(--color-surface-soft)]
              px-4
              py-3
              text-xs
              leading-5
              text-[var(--color-text-secondary)]
            "
          >
            Passwords must contain at least 10 characters, including uppercase, lowercase, a number and a special character.
          </div>


          {errorMessage && (
            <FeedbackBox
              type="error"
              message={errorMessage}
            />
          )}

          {successMessage && (
            <FeedbackBox
              type="success"
              message={successMessage}
            />
          )}


          <button
            type="submit"
            disabled={isSubmitting}
            className="
              nexora-focus
              mt-5
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
            <UserPlus size={17} />
            {isSubmitting
              ? "Registering administrator..."
              : "Register administrator"}
          </button>
        </form>


        {!authenticatedAdmin && (
          <div
            className="
              mt-6
              border-t
              border-[var(--color-border)]
              pt-5
              text-center
            "
          >
            <Link
              to="/admin/login"
              className="
                nexora-focus
                inline-flex
                items-center
                gap-2
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
              <ArrowLeft size={15} />
              Back to administrator login
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}


function TextField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
        "
      >
        {label}
        {required && (
          <span className="text-[var(--color-danger)]">
            {" "}*
          </span>
        )}
      </span>

      <div className="relative">
        <Icon
          size={17}
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
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
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
            text-[var(--color-text)]
            outline-none
            transition
            placeholder:text-[var(--color-text-muted)]
            hover:border-[var(--color-border-strong)]
            focus:border-[var(--color-primary)]
          "
        />
      </div>
    </label>
  );
}


function SecretField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  placeholder,
  required = false,
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
        "
      >
        {label}
        {required && (
          <span className="text-[var(--color-danger)]">
            {" "}*
          </span>
        )}
      </span>

      <div className="relative">
        <Icon
          size={17}
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
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
            text-[var(--color-text)]
            outline-none
            transition
            placeholder:text-[var(--color-text-muted)]
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
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </label>
  );
}


function FeedbackBox({
  type,
  message,
}) {
  const success =
    type ===
    "success";

  const Icon =
    success
      ? CheckCircle2
      : AlertCircle;


  return (
    <div
      className={`
        mt-5
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
            ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
            : "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
        }
      `}
    >
      <Icon
        size={17}
        className="mt-0.5 shrink-0"
      />

      <span>
        {message}
      </span>
    </div>
  );
}


export default AdminRegisterPage;
