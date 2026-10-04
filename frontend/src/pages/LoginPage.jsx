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
import useTranslations from "../hooks/useTranslations";

import {
  getRoleHomePath,
} from "../utils/roleRoutes";

import waypointLogo from "../assets/waypoint-logo.png";
import waypointLoginHero from "../assets/login/waypoint-login-hero.png";

// ============================================================
// LANGUAGE TYPOGRAPHY
// ============================================================

function getLanguageTypography(
  language
) {
  if (
    language === "si"
  ) {
    return {
      fontFamily:
        '"Nirmala UI", "Noto Sans Sinhala", "Segoe UI", Arial, sans-serif',

      heroFontSize:
        "clamp(2.15rem, 3.35vw, 3.45rem)",

      heroLineHeight:
        1.08,

      heroLetterSpacing:
        "-0.025em",

      cardTitleFontSize:
        "clamp(1.65rem, 1.85vw, 2rem)",

      cardTitleLineHeight:
        1.14,

      bodyLineHeight:
        1.72,
    };
  }

  if (
    language === "ta"
  ) {
    return {
      fontFamily:
        '"Nirmala UI", "Noto Sans Tamil", "Segoe UI", Arial, sans-serif',

      heroFontSize:
        "clamp(2.15rem, 3.35vw, 3.45rem)",

      heroLineHeight:
        1.08,

      heroLetterSpacing:
        "-0.02em",

      cardTitleFontSize:
        "clamp(1.65rem, 1.85vw, 2rem)",

      cardTitleLineHeight:
        1.14,

      bodyLineHeight:
        1.7,
    };
  }

  return {
    fontFamily:
      'Inter, "Segoe UI", Arial, sans-serif',

    heroFontSize:
      "clamp(2.55rem, 4vw, 4rem)",

    heroLineHeight:
      1.04,

    heroLetterSpacing:
      "-0.047em",

    cardTitleFontSize:
      "clamp(1.85rem, 2.2vw, 2.25rem)",

    cardTitleLineHeight:
      1.12,

    bodyLineHeight:
      1.65,
  };
}

function LoginPage() {
  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();

  const {
    t,
    language,
  } = useTranslations();

  const typography =
    getLanguageTypography(
      language
    );

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
        t(
          "auth.identifierRequired"
        )
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        t(
          "auth.passwordRequired"
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
        t(
          "auth.signInFailed"
        );

      setErrorMessage(
        message
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  return (
    <main
      className="
        min-h-dvh
        bg-[var(--color-bg)]
        text-[var(--color-text)]

        lg:h-dvh
        lg:min-h-0
        lg:overflow-hidden
      "
      style={{
        fontFamily:
          typography.fontFamily,
      }}
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
            <BrandLockup
              inverse
            />

            <div
              className="
                mt-auto
                max-w-[670px]
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

                {t(
                  "auth.heroEyebrow"
                )}
              </div>

              <h1
                className="
                  max-w-[660px]
                  font-[750]
                  text-white
                "
                style={{
                  fontSize:
                    typography.heroFontSize,

                  lineHeight:
                    typography.heroLineHeight,

                  letterSpacing:
                    typography.heroLetterSpacing,
                }}
              >
                {t(
                  "auth.heroTitleLine1"
                )}

                <span
                  className="
                    block
                  "
                >
                  {t(
                    "auth.heroTitleLine2"
                  )}
                </span>

                <span
                  className="
                    block
                    text-[#8DE0B6]
                  "
                >
                  {t(
                    "auth.heroTitleLine3"
                  )}
                </span>
              </h1>

              <p
                className="
                  mt-[clamp(1rem,2.4vh,1.5rem)]
                  max-w-[610px]
                  text-[clamp(0.9rem,1vw,1.05rem)]
                  text-white/88
                "
                style={{
                  lineHeight:
                    typography.bodyLineHeight,
                }}
              >
                {t(
                  "auth.heroDescription"
                )}
              </p>

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
                  text={t(
                    "auth.roleBasedAccess"
                  )}
                />

                <FeatureBadge
                  icon={
                    LockKeyhole
                  }
                  text={t(
                    "auth.secureOperations"
                  )}
                />

                <FeatureBadge
                  icon={
                    Truck
                  }
                  text={t(
                    "auth.connectedDeliveryNetwork"
                  )}
                />
              </div>

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

                {t(
                  "auth.distributionNetwork"
                )}
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
            <div
              className="
                shrink-0
              "
            >
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

            {/* FORM */}

            <div
              className="
                flex
                flex-1
                items-start
                justify-center
                pb-[clamp(1.5rem,4vh,3rem)]
                pt-[clamp(2rem,7vh,5rem)]
              "
            >
              <div
                className="
                  w-full
                  max-w-[470px]
                  shrink-0
                "
              >
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
                        text-[var(--color-primary)]
                      "
                    >
                      <UserRound
                        size={14}
                        strokeWidth={2}
                      />

                      {t(
                        "auth.secureStaffAccess"
                      )}
                    </div>

                    <h2
                      className="
                        font-[750]
                        text-[var(--color-text)]
                      "
                      style={{
                        fontSize:
                          typography.cardTitleFontSize,

                        lineHeight:
                          typography.cardTitleLineHeight,

                        letterSpacing:
                          language ===
                          "en"
                            ? "-0.04em"
                            : "-0.015em",
                      }}
                    >
                      {t(
                        "auth.signInTitle"
                      )}
                    </h2>

                    <p
                      className="
                        mt-2.5
                        max-w-md
                        text-[0.92rem]
                        text-[var(--color-text-secondary)]
                      "
                      style={{
                        lineHeight:
                          language ===
                          "en"
                            ? 1.5
                            : 1.65,
                      }}
                    >
                      {t(
                        "auth.signInDescription"
                      )}
                    </p>
                  </div>

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
                        {t(
                          "auth.userIdOrEmail"
                        )}
                      </label>

                      <div
                        className="
                          relative
                        "
                      >
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
                              event
                                .target
                                .value
                            )
                          }
                          placeholder={t(
                            "auth.userIdPlaceholder"
                          )}
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
                        {t(
                          "auth.password"
                        )}
                      </label>

                      <div
                        className="
                          relative
                        "
                      >
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
                              event
                                .target
                                .value
                            )
                          }
                          placeholder={t(
                            "auth.passwordPlaceholder"
                          )}
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
                              (
                                current
                              ) =>
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
                              ? t(
                                  "auth.hidePassword"
                                )
                              : t(
                                  "auth.showPassword"
                                )
                          }
                          title={
                            showPassword
                              ? t(
                                  "auth.hidePassword"
                                )
                              : t(
                                  "auth.showPassword"
                                )
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
                        {t(
                          "auth.forgotPassword"
                        )}
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
                          {
                            errorMessage
                          }
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

                          {t(
                            "auth.signingIn"
                          )}
                        </>
                      ) : (
                        <>
                          {t(
                            "auth.signIn"
                          )}

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

                      {t(
                        "auth.administratorAccess"
                      )}
                    </Link>
                  </div>
                </div>

                <p
                  className="
                    mt-[clamp(0.75rem,1.8vh,1.25rem)]
                    text-center
                    text-[0.72rem]
                    leading-5
                    text-[var(--color-text-muted)]
                  "
                >
                  {t(
                    "auth.restrictedNotice"
                  )}
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
          DELIVERY OPERATIONS
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