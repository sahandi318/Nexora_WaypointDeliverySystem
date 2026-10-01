import { Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="
        inline-flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        text-[var(--color-text)]
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:bg-[var(--color-surface-soft)]
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary)]
        focus:ring-offset-2
        focus:ring-offset-[var(--color-bg)]
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
        <Sun size={19} />
      ) : (
        <Moon size={19} />
      )}
    </button>
  );
}

export default ThemeToggle;