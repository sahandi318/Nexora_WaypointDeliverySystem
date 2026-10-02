import {
  Moon,
  Sun,
} from "lucide-react";

import useTheme from "../../hooks/useTheme";


function ThemeToggle() {
  const {
    isDark,
    toggleTheme,
  } = useTheme();


  return (
    <button
      type="button"
      onClick={
        toggleTheme
      }
      className="
        fixed
        right-3
        top-3
        z-[200]
        inline-flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        text-[var(--color-text)]
        shadow-md
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-[var(--color-primary)]
        hover:bg-[var(--color-surface-soft)]
        hover:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary)]
        focus:ring-offset-2
        focus:ring-offset-[var(--color-bg)]
        sm:right-4
        sm:top-4
      "
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
        />
      ) : (
        <Moon
          size={17}
        />
      )}
    </button>
  );
}


export default ThemeToggle;
