import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

import useTranslations from "../../hooks/useTranslations";

function LoginUtilityBar() {
  const {
    t,
  } = useTranslations();

  return (
    <div
      className="
        flex
        min-h-10
        w-full
        items-center
        justify-between
        gap-4
      "
    >
      <Link
        to="/"
        className="
          nexora-focus
          inline-flex
          h-10
          shrink-0
          items-center
          gap-2
          rounded-lg
          px-2
          text-sm
          font-semibold
          text-[var(--color-text-secondary)]
          transition
          duration-200
          hover:bg-[var(--color-surface-soft)]
          hover:text-[var(--color-text)]
        "
      >
        <ArrowLeft
          size={17}
          strokeWidth={1.9}
        />

        <span
          className="
            hidden
            sm:inline
          "
        >
          {t(
            "common.backHome"
          )}
        </span>

        <span
          className="
            sm:hidden
          "
        >
          {t(
            "common.back"
          )}
        </span>
      </Link>

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
  );
}

export default LoginUtilityBar;