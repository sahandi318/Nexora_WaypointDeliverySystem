import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import waypointLogo from "../../assets/waypoint-logo.png";

import useTranslations from "../../hooks/useTranslations";

import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

function RecoveryAuthLayout({
  backTo,
  children,
}) {
  const {
    t,
  } = useTranslations();

  return (
    <main
      className="
        min-h-dvh
        bg-[var(--color-bg)]
        text-[var(--color-text)]
      "
    >
      {/* =====================================================
          TOP APPLICATION HEADER
          ===================================================== */}

      <header
        className="
          border-b
          border-[var(--color-border)]
          bg-[var(--color-surface)]
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[72px]
            w-full
            max-w-7xl
            items-center
            justify-between
            gap-4
            px-5
            sm:px-8
            lg:px-10
          "
        >
          {/* BRAND */}

          <Link
            to="/"
            aria-label="Waypoint home"
            className="
              nexora-focus
              inline-flex
              min-w-0
              items-center
              gap-3
              rounded-xl
            "
          >
            <img
              src={waypointLogo}
              alt="Waypoint"
              className="
                h-11
                w-11
                shrink-0
                object-contain
                sm:h-12
                sm:w-12
              "
            />

            <div
              className="
                min-w-0
                leading-tight
              "
            >
              <p
                className="
                  truncate
                  text-[15px]
                  font-extrabold
                  tracking-[0.05em]
                  text-[var(--color-text)]
                  sm:text-base
                "
              >
                WAYPOINT
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-[var(--color-text-muted)]
                  sm:text-[10px]
                "
              >
                DELIVERY OPERATIONS
              </p>
            </div>
          </Link>

          {/* CONTROLS */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <div
              className="
                hidden
                sm:block
              "
            >
              <LanguageSelector />
            </div>

            <div
              className="
                sm:hidden
              "
            >
              <LanguageSelector
                compact
              />
            </div>

            <ThemeToggle
              inline
            />
          </div>
        </div>
      </header>

      {/* =====================================================
          RECOVERY WORKSPACE
          ===================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-[500px]
          px-5
          pb-12
          pt-8
          sm:px-6
          sm:pt-10
        "
      >
        <Link
          to={backTo}
          className="
            nexora-focus
            inline-flex
            min-h-10
            items-center
            gap-2
            rounded-lg
            px-1
            text-sm
            font-semibold
            text-[var(--color-text-secondary)]
            transition
            duration-200
            hover:text-[var(--color-primary)]
          "
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.9}
          />

          {t(
            "recovery.backToSignIn"
          )}
        </Link>

        <div
          className="
            mt-5
            w-full
          "
        >
          {children}
        </div>
      </div>
    </main>
  );
}

export default RecoveryAuthLayout;