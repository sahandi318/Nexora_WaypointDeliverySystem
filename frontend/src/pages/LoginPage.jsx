import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import ThemeToggle from "../components/common/ThemeToggle";

import useAuth from "../hooks/useAuth";

import {
  getRoleHomePath,
} from "../utils/roleRoutes";

import waypointLogo from "../assets/nexora-logo.jpeg";


function LoginPage() {
  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();


  const [userId, setUserId] =
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


    const cleanedUserId =
      userId.trim();


    if (!cleanedUserId) {
      setErrorMessage(
        "Enter your User ID."
      );

      return;
    }


    if (!password) {
      setErrorMessage(
        "Enter your password."
      );

      return;
    }


    try {
      setIsSubmitting(true);
      setErrorMessage("");


      const authenticatedUser =
        await login({
          userId:
            cleanedUserId,

          password,
        });


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
        "Unable to sign in. Please try again.";


      setErrorMessage(
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Theme control */}
      <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>


      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* ==================================================
            BRAND PANEL
            ================================================== */}

        <section
          className="
            relative
            hidden
            overflow-hidden
            border-r
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
              -left-24
              -top-24
              h-80
              w-80
              rounded-full
              bg-white/5
            "
          />

          <div
            className="
              absolute
              -bottom-32
              -right-28
              h-96
              w-96
              rounded-full
              bg-white/5
            "
          />


          <div className="relative z-10">
            <BrandLockup
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
              <Truck
                size={17}
              />

              Delivery Operations
            </div>


            <h1
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
              One platform for
              smarter delivery
              operations.
            </h1>


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
              Secure access for
              store managers,
              dispatchers, loaders,
              drivers and
              administrators.
            </p>


            <div className="mt-9 flex flex-wrap gap-3">
              <FeatureBadge
                icon={ShieldCheck}
                text="Role-based access"
              />

              <FeatureBadge
                icon={LockKeyhole}
                text="Secure operations"
              />
            </div>
          </div>


          <p
            className="
              relative
              z-10
              text-xs
              font-medium
              tracking-wide
              text-[var(--color-sidebar-muted)]
            "
          >
            Tech-Triathlon 2026
          </p>
        </section>


        {/* ==================================================
            LOGIN PANEL
            ================================================== */}

        <section
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-5
            py-20
            sm:px-8
            lg:px-12
          "
        >
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <BrandLockup />
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
              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-[var(--color-primary)]
                  "
                >
                  Welcome back
                </p>

                <h2
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    tracking-[-0.035em]
                  "
                >
                  Sign in to Waypoint
                </h2>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-[var(--color-text-secondary)]
                  "
                >
                  Use the User ID and
                  password assigned to
                  your account.
                </p>
              </div>


              <form
                className="mt-8 space-y-5"
                onSubmit={
                  handleSubmit
                }
              >
                {/* USER ID */}

                <div>
                  <label
                    htmlFor="userId"
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                    "
                  >
                    User ID
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
                      id="userId"
                      name="userId"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="characters"
                      value={userId}
                      disabled={
                        isSubmitting
                      }
                      onChange={(
                        event
                      ) =>
                        setUserId(
                          event.target
                            .value
                        )
                      }
                      placeholder="Enter your User ID"
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


                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="password"
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
                      id="password"
                      name="password"
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
                      placeholder="Enter your password"
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


                {/* ERROR */}

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


                {/* SUBMIT */}

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

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in

                      <ArrowRight
                        size={17}
                      />
                    </>
                  )}
                </button>
              </form>
            </div>


            <p
              className="
                mt-6
                text-center
                text-xs
                leading-5
                text-[var(--color-text-muted)]
              "
            >
              Access is restricted to
              authorized Waypoint
              operations personnel.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


function BrandLockup({
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
          Delivery Operations
        </p>
      </div>
    </div>
  );
}


function FeatureBadge({
  icon: Icon,
  text,
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-white/15
        bg-white/10
        px-3.5
        py-2.5
        text-sm
        font-medium
        text-white
      "
    >
      <Icon size={17} />

      {text}
    </div>
  );
}


export default LoginPage;