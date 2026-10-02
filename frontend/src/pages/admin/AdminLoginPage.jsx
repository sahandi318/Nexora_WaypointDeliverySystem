import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  UserRound,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import LoginUtilityBar from "../../components/common/LoginUtilityBar";

import useAuth from "../../hooks/useAuth";

import {
  getRoleHomePath,
} from "../../utils/roleRoutes";

import waypointLogo from "../../assets/waypoint-logo.png";


function AdminLoginPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const registrationSuccess =
    location.state
      ?.registrationSuccess ||
    "";

  const auth =
    useAuth();

  const {
    login,
  } = auth;


  const [identifier, setIdentifier] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

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
        "Enter your administrator User ID or email."
      );

      return;
    }


    if (!password) {
      setErrorMessage(
        "Enter your administrator password."
      );

      return;
    }


    try {
      setIsSubmitting(true);
      setErrorMessage("");


      const authenticatedUser =
        await login({
          identifier:
            cleanedIdentifier,

          password,
        });


      if (
        authenticatedUser.role !==
        "ADMIN"
      ) {
        if (
          typeof auth.logout ===
          "function"
        ) {
          auth.logout();
        }

        setErrorMessage(
          "This portal is reserved for administrator accounts."
        );

        return;
      }


      if (
        authenticatedUser.mustChangePassword
      ) {
        navigate(
          "/change-password",
          {
            replace: true,
          }
        );

        return;
      }


      navigate(
        getRoleHomePath(
          authenticatedUser.role
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        error.message ||
        "Unable to sign in to the administrator portal.";


      setErrorMessage(
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[var(--color-bg)]
        text-[var(--color-text)]
        transition-colors
        duration-300
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -left-36
          -top-24
          h-96
          w-96
          rounded-full
          bg-[var(--color-primary)]
          opacity-[0.08]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          right-10
          h-[28rem]
          w-[28rem]
          rounded-full
          bg-[var(--color-accent)]
          opacity-[0.08]
          blur-3xl
        "
      />


      <div
        className="
          relative
          z-10
          grid
          min-h-screen
          lg:grid-cols-[0.9fr_1.1fr]
        "
      >
        {/* ADMIN LOGIN PANEL */}

        <section
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-4
            py-10
            sm:px-8
            sm:py-14
            lg:px-12
            lg:py-16
            xl:px-16
          "
        >
          <div className="w-full max-w-md">
            <LoginUtilityBar />


            <div className="mb-7 mt-6 lg:hidden">
              <AdminBrandLockup />
            </div>


            <div
              className="
                mt-6
                overflow-hidden
                rounded-[28px]
                border
                border-[var(--color-border-strong)]
                bg-[var(--color-surface)]
                shadow-[var(--shadow-lg)]
                transition-colors
                duration-300
              "
            >
              <div
                className="
                  h-1
                  w-full
                  bg-[var(--color-primary)]
                "
              />

              <div className="p-5 sm:p-8">
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div>
                    <div
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-[var(--color-border)]
                        bg-[var(--color-surface-soft)]
                        px-3
                        py-1.5
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        text-[var(--color-primary)]
                      "
                    >
                      <ShieldCheck size={14} />
                      Admin Portal
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
                      Administrator sign in
                    </h1>
                  </div>

                  <div
                    className="
                      hidden
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[var(--color-primary)]
                      text-white
                      shadow-md
                      sm:flex
                    "
                  >
                    <UserCog size={22} />
                  </div>
                </div>


                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-[var(--color-text-secondary)]
                  "
                >
                  Secure access for authorized
                  Waypoint administrators.
                </p>


                <form
                  className="mt-7 space-y-5 sm:mt-8"
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div>
                    <label
                      htmlFor="adminIdentifier"
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                      "
                    >
                      Administrator User ID or Email
                    </label>


                    <div className="relative">
                      <UserRound
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
                        id="adminIdentifier"
                        name="adminIdentifier"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        value={identifier}
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
                        placeholder="Enter administrator User ID or email"
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
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />
                    </div>
                  </div>


                  <div>
                    <label
                      htmlFor="adminPassword"
                      className="
                        mb-2
                        block
                        text-sm
                        font-semibold
                      "
                    >
                      Password
                    </label>


                    <div className="relative">
                      <KeyRound
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
                        id="adminPassword"
                        name="adminPassword"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="current-password"
                        value={password}
                        disabled={
                          isSubmitting
                        }
                        onChange={(
                          event
                        ) =>
                          setPassword(
                            event.target
                              .value
                          )
                        }
                        placeholder="Enter administrator password"
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
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />


                      <button
                        type="button"
                        disabled={
                          isSubmitting
                        }
                        onClick={() =>
                          setShowPassword(
                            (current) =>
                              !current
                          )
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
                          hover:text-[var(--color-text)]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[var(--color-primary)]
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
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


                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password?portal=admin"
                      className="
                        nexora-focus
                        rounded-md
                        text-sm
                        font-semibold
                        text-[var(--color-primary)]
                        transition
                        hover:text-[var(--color-primary-hover)]
                        hover:underline
                      "
                    >
                      Forgot password?
                    </Link>
                  </div>


                  {registrationSuccess && (
                    <div
                      role="status"
                      className="
                        flex
                        items-start
                        gap-3
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
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {registrationSuccess}
                      </span>
                    </div>
                  )}


                  {errorMessage && (
                    <div
                      role="alert"
                      aria-live="polite"
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
                      shadow-[var(--shadow-sm)]
                      transition
                      duration-200
                      hover:-translate-y-0.5
                      hover:bg-[var(--color-primary-hover)]
                      hover:shadow-[var(--shadow-md)]
                      disabled:translate-y-0
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

                        Verifying access...
                      </>
                    ) : (
                      <>
                        Enter Admin Portal

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
                    border-t
                    border-[var(--color-border)]
                    pt-5
                  "
                >
                  <div className="flex justify-center">
                    <Link
                      to="/admin/register"
                      className="
                        nexora-focus
                        inline-flex
                        min-h-11
                        items-center
                        justify-center
                        gap-2.5
                        rounded-xl
                        border
                        border-[var(--color-primary)]
                        bg-[var(--color-surface-soft)]
                        px-5
                        py-2.5
                        text-sm
                        font-bold
                        text-[var(--color-primary)]
                        transition
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-[var(--color-primary)]
                        hover:text-white
                        hover:shadow-[var(--shadow-sm)]
                      "
                    >
                      <UserCog size={17} />
                      Register Administrator
                    </Link>
                  </div>
                </div>
              </div>
            </div>


            <p
              className="
                mt-5
                text-center
                text-xs
                leading-5
                text-[var(--color-text-muted)]
              "
            >
              Administrator access is
              restricted and protected by
              role-based authorization.
            </p>
          </div>
        </section>


        {/* ADMIN BRAND PANEL */}

        <section
          className="
            relative
            hidden
            overflow-hidden
            border-l
            border-[var(--color-border)]
            bg-[var(--color-sidebar)]
            lg:flex
            lg:flex-col
            lg:justify-between
            lg:p-12
            xl:p-16
          "
        >
          <div
            className="
              absolute
              -right-24
              -top-20
              h-80
              w-80
              rounded-full
              border
              border-white/10
            "
          />

          <div
            className="
              absolute
              -right-8
              top-8
              h-44
              w-44
              rounded-full
              bg-white/5
            "
          />

          <div
            className="
              absolute
              -bottom-32
              -left-24
              h-96
              w-96
              rounded-full
              bg-white/5
            "
          />

          <div
            className="
              absolute
              left-0
              right-0
              top-[38%]
              h-px
              bg-white/5
            "
          />


          <div className="relative z-10">
            <AdminBrandLockup
              inverse
            />
          </div>


          <div className="relative z-10 max-w-xl">
            <div
              className="
                mb-7
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/10
                px-4
                py-2
                text-sm
                font-semibold
                text-white
              "
            >
              <ShieldCheck size={17} />
              Administrative Control
            </div>


            <h2
              className="
                max-w-lg
                text-5xl
                font-bold
                leading-[1.06]
                tracking-[-0.045em]
                text-white
                xl:text-6xl
              "
            >
              Manage with
              clarity, security
              and control.
            </h2>


            <p
              className="
                mt-6
                max-w-lg
                text-base
                leading-7
                text-[var(--color-sidebar-muted)]
                xl:text-lg
              "
            >
              A dedicated entry point for
              authorized administrators to
              manage system access and
              operational configuration.
            </p>


            <div
              className="
                mt-9
                grid
                max-w-lg
                gap-3
                sm:grid-cols-3
              "
            >
              <AdminFeature
                icon={ShieldCheck}
                text="Secure access"
              />

              <AdminFeature
                icon={LayoutDashboard}
                text="Clear oversight"
              />

              <AdminFeature
                icon={LockKeyhole}
                text="Role protected"
              />
            </div>
          </div>


          <div
            className="
              relative
              z-10
              flex
              items-center
              gap-2
              text-xs
              font-medium
              tracking-wide
              text-[var(--color-sidebar-muted)]
            "
          >
            <ShieldCheck size={14} />
            Waypoint Administration
          </div>
        </section>
      </div>
    </main>
  );
}


function AdminBrandLockup({
  inverse = false,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          overflow-hidden
          rounded-2xl
          bg-white
          p-1.5
          shadow-sm
        "
      >
        <img
          src={waypointLogo}
          alt="Waypoint"
          className="h-full w-full object-contain"
        />
      </div>


      <div>
        <p
          className={`
            text-base
            font-extrabold
            tracking-[0.04em]
            ${
              inverse
                ? "text-white"
                : "text-[var(--color-text)]"
            }
          `}
        >
          WAYPOINT
        </p>

        <p
          className={`
            mt-0.5
            text-[10px]
            font-bold
            uppercase
            tracking-[0.16em]
            ${
              inverse
                ? "text-[var(--color-sidebar-muted)]"
                : "text-[var(--color-text-muted)]"
            }
          `}
        >
          Administration
        </p>
      </div>
    </div>
  );
}


function AdminFeature({
  icon: Icon,
  text,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-white/15
        bg-white/10
        p-3
        text-white
      "
    >
      <Icon size={17} />

      <p
        className="
          mt-2
          text-xs
          font-semibold
          leading-5
        "
      >
        {text}
      </p>
    </div>
  );
}


export default AdminLoginPage;
