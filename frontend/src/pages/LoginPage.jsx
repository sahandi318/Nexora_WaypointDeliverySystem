import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import LoginUtilityBar from "../components/common/LoginUtilityBar";

import useAuth from "../hooks/useAuth";

import {
  getRoleHomePath,
} from "../utils/roleRoutes";

import waypointLogo from "../assets/waypoint-logo.png";
import waypointLoginHero from "../assets/login/waypoint-login-hero.png";


function LoginPage() {
  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();


  const [
    identifier,
    setIdentifier,
  ] = useState("");

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


  // ==========================================================
  // LOGIN
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    const cleanedIdentifier =
      identifier.trim();


    if (!cleanedIdentifier) {
      setErrorMessage(
        "Enter your User ID or email."
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
          identifier:
            cleanedIdentifier,

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
    <main
      className="
        min-h-dvh
        bg-[var(--color-bg)]
        font-sans
        text-[var(--color-text)]

        lg:h-dvh
        lg:min-h-0
        lg:overflow-hidden
      "
    >
      <div
        className="
          grid
          min-h-dvh

          lg:h-full
          lg:min-h-0
          lg:grid-cols-[minmax(0,1.08fr)_minmax(450px,0.92fr)]
        "
      >
        {/* ==================================================
            IMAGE / BRAND PANEL
            ================================================== */}

        <section
          className="
            relative
            hidden
            min-h-0
            overflow-hidden

            lg:block
            lg:h-full
          "
        >
          {/* BACKGROUND IMAGE */}

          <img
            src={
              waypointLoginHero
            }
            alt=""
            aria-hidden="true"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
            "
          />


          {/* IMAGE OVERLAYS */}

          <div
            className="
              absolute
              inset-0
              bg-[linear-gradient(180deg,rgba(3,38,29,0.11)_0%,rgba(3,46,35,0.22)_38%,rgba(3,42,32,0.72)_74%,rgba(2,33,25,0.95)_100%)]
            "
          />


          <div
            className="
              absolute
              inset-0
              bg-[linear-gradient(90deg,rgba(2,34,26,0.18)_0%,transparent_54%,rgba(2,34,26,0.05)_100%)]
            "
          />


          {/* LEFT CONTENT */}

          <div
            className="
              relative
              z-10
              flex
              h-full
              min-h-0
              flex-col
              px-[clamp(2.5rem,4vw,4rem)]
              py-[clamp(2rem,4vh,3.5rem)]
            "
          >
            {/* LOGO */}

            <BrandLockup
              inverse
            />


            {/* HERO */}

            <div
              className="
                mt-auto
                max-w-[650px]
                pb-[clamp(0.5rem,2vh,1.75rem)]
              "
            >
              <div
                className="
                  mb-[clamp(1rem,2.2vh,1.5rem)]
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/20
                  bg-black/15
                  px-4
                  py-2
                  text-[0.82rem]
                  font-semibold
                  text-white
                  backdrop-blur-md
                "
              >
                <Truck
                  size={16}
                  strokeWidth={1.9}
                />

                Delivery Operations
              </div>


              <h1
                className="
                  max-w-[620px]
                  font-[750]
                  leading-[1.03]
                  tracking-[-0.047em]
                  text-white
                "
                style={{
                  fontSize:
                    "clamp(2.75rem, 4vw, 4rem)",
                }}
              >
                Smarter delivery
                operations,

                <span
                  className="
                    block
                    text-[#8DE0B6]
                  "
                >
                  from depot to store.
                </span>
              </h1>


              <p
                className="
                  mt-[clamp(1rem,2.4vh,1.5rem)]
                  max-w-[590px]
                  text-[clamp(0.93rem,1vw,1.08rem)]
                  leading-[1.65]
                  text-white/88
                "
              >
                Coordinate store orders,
                dispatch, loading and
                deliveries through one
                connected Waypoint
                operations network.
              </p>


              {/* FEATURE BADGES */}

              <div
                className="
                  mt-[clamp(1rem,2.5vh,1.75rem)]
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <FeatureBadge
                  icon={
                    ShieldCheck
                  }
                  text="Role-based access"
                />

                <FeatureBadge
                  icon={
                    LockKeyhole
                  }
                  text="Secure operations"
                />

                <FeatureBadge
                  icon={
                    Truck
                  }
                  text="Connected delivery network"
                />
              </div>


              {/* NETWORK */}

              <div
                className="
                  mt-[clamp(1rem,2.4vh,1.75rem)]
                  flex
                  items-center
                  gap-2
                  text-[0.82rem]
                  font-semibold
                  text-white/78
                "
              >
                <MapPin
                  size={16}
                  strokeWidth={1.9}
                />

                Peliyagoda & Kandy
                distribution network
              </div>
            </div>
          </div>
        </section>


        {/* ==================================================
            LOGIN SIDE
            ================================================== */}

        <section
          className="
            relative
            min-h-dvh
            overflow-x-hidden
            bg-[var(--color-bg)]

            lg:h-full
            lg:min-h-0
            lg:overflow-y-auto
          "
        >
          {/* SUBTLE BACKGROUND */}

          <div
            className="
              pointer-events-none
              absolute
              -right-40
              -top-40
              h-[30rem]
              w-[30rem]
              rounded-full
              bg-[var(--color-primary)]
              opacity-[0.04]
              blur-3xl
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              -bottom-40
              -left-40
              h-[28rem]
              w-[28rem]
              rounded-full
              bg-[var(--color-accent)]
              opacity-[0.04]
              blur-3xl
            "
          />


          <div
            className="
              relative
              z-10
              mx-auto
              flex
              min-h-dvh
              w-full
              max-w-[610px]
              flex-col
              px-5
              py-[clamp(1rem,2.8vh,1.75rem)]

              sm:px-8

              lg:h-full
              lg:min-h-0
              lg:px-[clamp(2rem,3.2vw,3rem)]
            "
          >
            {/* TOP NAVIGATION */}

            <div className="shrink-0">
              <LoginUtilityBar />
            </div>


            {/* MOBILE BRAND */}

            <div
              className="
                mt-7
                shrink-0

                lg:hidden
              "
            >
              <BrandLockup />
            </div>


            {/* FORM AREA */}

            <div
              className="
                flex
                flex-1
                items-center
                justify-center
                py-[clamp(1rem,3vh,2.5rem)]
              "
            >
              <div
                className="
                  w-full
                  max-w-[470px]
                "
              >
                {/* LOGIN CARD */}

                <div
                  className="
                    rounded-[26px]
                    border
                    border-[var(--color-border)]
                    bg-[var(--color-surface)]
                    px-[clamp(1.5rem,2.5vw,2.25rem)]
                    py-[clamp(1.5rem,3vh,2.25rem)]
                    shadow-[var(--shadow-lg)]
                    transition-colors
                    duration-300
                  "
                >
                  {/* CARD HEADER */}

                  <div>
                    <div
                      className="
                        mb-[clamp(1rem,2vh,1.25rem)]
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        bg-[var(--color-surface-soft)]
                        px-3.5
                        py-1.5
                        text-xs
                        font-bold
                        tracking-[0.01em]
                        text-[var(--color-primary)]
                      "
                    >
                      <UserRound
                        size={14}
                        strokeWidth={2}
                      />

                      Secure staff access
                    </div>


                    <h2
                      className="
                        font-[750]
                        leading-[1.12]
                        tracking-[-0.04em]
                        text-[var(--color-text)]
                      "
                      style={{
                        fontSize:
                          "clamp(1.85rem, 2.2vw, 2.25rem)",
                      }}
                    >
                      Sign in to Waypoint
                    </h2>


                    <p
                      className="
                        mt-2.5
                        max-w-md
                        text-[0.92rem]
                        leading-6
                        text-[var(--color-text-secondary)]
                      "
                    >
                      Use your assigned
                      User ID or registered
                      email and password to
                      access your workspace.
                    </p>
                  </div>


                  {/* FORM */}

                  <form
                    className="
                      mt-[clamp(1.25rem,2.8vh,2rem)]
                      space-y-[clamp(0.9rem,2vh,1.25rem)]
                    "
                    onSubmit={
                      handleSubmit
                    }
                  >
                    {/* USER ID */}

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
                        User ID or Email
                      </label>


                      <div className="relative">
                        <UserRound
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
                          autoFocus
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
                          placeholder="Enter User ID or email"
                          className="
                            nexora-focus
                            h-[52px]
                            w-full
                            rounded-[14px]
                            border
                            border-[var(--color-border)]
                            bg-[var(--color-input)]
                            pl-11
                            pr-4
                            text-[0.95rem]
                            font-medium
                            text-[var(--color-text)]
                            outline-none
                            transition
                            duration-200
                            placeholder:font-normal
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
                          text-[var(--color-text)]
                        "
                      >
                        Password
                      </label>


                      <div className="relative">
                        <LockKeyhole
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
                          id="password"
                          name="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          value={
                            password
                          }
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
                            h-[52px]
                            w-full
                            rounded-[14px]
                            border
                            border-[var(--color-border)]
                            bg-[var(--color-input)]
                            pl-11
                            pr-12
                            text-[0.95rem]
                            font-medium
                            text-[var(--color-text)]
                            outline-none
                            transition
                            duration-200
                            placeholder:font-normal
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
                            nexora-focus
                            absolute
                            right-2.5
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
                            duration-200
                            hover:bg-[var(--color-surface-soft)]
                            hover:text-[var(--color-text)]
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
                              strokeWidth={1.8}
                            />
                          ) : (
                            <Eye
                              size={18}
                              strokeWidth={1.8}
                            />
                          )}
                        </button>
                      </div>
                    </div>


                    {/* FORGOT PASSWORD */}

                    <div
                      className="
                        flex
                        justify-end
                      "
                    >
                      <Link
                        to="/forgot-password"
                        className="
                          nexora-focus
                          rounded-md
                          text-sm
                          font-semibold
                          text-[var(--color-primary)]
                          transition
                          duration-200
                          hover:text-[var(--color-primary-hover)]
                          hover:underline
                          hover:underline-offset-4
                        "
                      >
                        Forgot password?
                      </Link>
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
                          rounded-[14px]
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


                    {/* LOGIN BUTTON */}

                    <button
                      type="submit"
                      disabled={
                        isSubmitting
                      }
                      className="
                        nexora-focus
                        flex
                        h-[52px]
                        w-full
                        items-center
                        justify-center
                        gap-2.5
                        rounded-[14px]
                        bg-[var(--color-primary)]
                        px-5
                        text-[0.95rem]
                        font-bold
                        text-white
                        shadow-[var(--shadow-sm)]
                        transition
                        duration-200
                        hover:-translate-y-px
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
                            size={18}
                            strokeWidth={2}
                          />
                        </>
                      )}
                    </button>
                  </form>


                  {/* ADMIN */}

                  <div
                    className="
                      mt-[clamp(1.25rem,2.5vh,1.75rem)]
                      border-t
                      border-[var(--color-border)]
                      pt-[clamp(1rem,2vh,1.25rem)]
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
                        px-2
                        py-1
                        text-xs
                        font-semibold
                        text-[var(--color-text-muted)]
                        transition
                        duration-200
                        hover:text-[var(--color-primary)]
                      "
                    >
                      <ShieldCheck
                        size={14}
                        strokeWidth={2}
                      />

                      Administrator access
                    </Link>
                  </div>
                </div>


                {/* SECURITY NOTE */}

                <p
                  className="
                    mt-[clamp(0.75rem,1.8vh,1.25rem)]
                    text-center
                    text-[0.72rem]
                    leading-5
                    text-[var(--color-text-muted)]
                  "
                >
                  Access is restricted to
                  authorized Waypoint
                  operations personnel.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


// ============================================================
// BRAND LOCKUP
// ============================================================

function BrandLockup({
  inverse = false,
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-3
      "
    >
      <div
        className={`
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-[14px]
          ${
            inverse
              ? "bg-white/10 p-1 backdrop-blur-sm"
              : "p-1"
          }
        `}
      >
        <img
          src={
            waypointLogo
          }
          alt="Waypoint"
          className="
            h-full
            w-full
            object-contain
          "
        />
      </div>


      <div>
        <p
          className={`
            text-[1.05rem]
            font-extrabold
            tracking-[0.045em]
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
            tracking-[0.18em]
            ${
              inverse
                ? "text-white/72"
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


// ============================================================
// FEATURE BADGE
// ============================================================

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
        rounded-full
        border
        border-white/18
        bg-black/15
        px-3
        py-1.5
        text-[0.76rem]
        font-semibold
        text-white/90
        backdrop-blur-md
      "
    >
      <Icon
        size={14}
        strokeWidth={1.9}
      />

      {text}
    </div>
  );
}


export default LoginPage;