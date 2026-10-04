import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import useTranslations from "../../hooks/useTranslations";

import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";


function LoginUtilityBar({
  showBackHome = false,
  showTheme = false,
}) {
  const {
    t,
  } = useTranslations();

  return (
    <div
      className={`
        flex
        min-h-10
        w-full
        items-center
        gap-3

        ${
          showBackHome
            ? "justify-between"
            : "justify-end"
        }

        ${
          !showTheme && !showBackHome
            ? "pr-12 sm:pr-12"
            : ""
        }
      `}
    >
      {showBackHome ? (
        <Link
          to="/"
          className="
            nexora-focus
            inline-flex
            h-10
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            px-3
            text-sm
            font-semibold
            text-[var(--color-text-secondary)]
            transition
            duration-200
            hover:border-[var(--color-border-strong)]
            hover:bg-[var(--color-surface-soft)]
            hover:text-[var(--color-text)]
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--color-primary)]
            focus:ring-offset-2
            focus:ring-offset-[var(--color-bg)]
          "
          aria-label="Back to home"
          title="Back to home"
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.9}
          />

          <span className="hidden sm:inline">
            {t(
              "landing.home"
            )}
          </span>
        </Link>
      ) : null}

      <div
        className="
          flex
          shrink-0
          items-center
          gap-2
        "
      >
        <div className="hidden sm:block">
          <LanguageSelector />
        </div>

        <div className="sm:hidden">
          <LanguageSelector compact />
        </div>

        {showTheme ? (
          <ThemeToggle inline />
        ) : null}
      </div>
    </div>
  );
}


export default LoginUtilityBar;
