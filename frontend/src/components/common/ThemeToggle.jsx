import {
  Moon,
  Sun,
} from "lucide-react";

import {
  useLocation,
} from "react-router-dom";

import useTheme from "../../hooks/useTheme";

function ThemeToggle({
  inline = false,
}) {
  const {
    isDark,
    toggleTheme,
  } = useTheme();

  const location =
    useLocation();

  const usesInlineThemeControl =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/verify-reset-otp" ||
    location.pathname === "/reset-password" ||
    location.pathname.startsWith(
      "/store-manager"
    );

  if (
    !inline &&
    usesInlineThemeControl
  ) {
    return null;
  }

  const buttonClassName =
    inline
      ? `
          nexora-focus
          inline-flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
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
        `
      : `
          fixed
          right-3
          top-3
          z-[200]
          inline-flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          text-[var(--color-text-secondary)]
          shadow-sm
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
          sm:right-4
          sm:top-4
        `;

  return (
    <button
      type="button"
      onClick={
        toggleTheme
      }
      className={
        buttonClassName
      }
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {isDark ? (
        <Sun
          size={17}
          strokeWidth={1.9}
        />
      ) : (
        <Moon
          size={17}
          strokeWidth={1.9}
        />
      )}
    </button>
  );
}

export default ThemeToggle;
