import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import ThemeToggle from "./ThemeToggle";


function LoginUtilityBar() {
  return (
    <div
      className="
        flex
        w-full
        items-center
        justify-between
        gap-3
      "
    >
      <Link
        to="/"
        aria-label="Return to home"
        title="Return to home"
        className="
          group
          inline-flex
          h-10
          items-center
          gap-2
          rounded-full
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          py-1
          pl-1.5
          pr-3
          text-[var(--color-text-secondary)]
          shadow-[var(--shadow-xs)]
          transition
          duration-200
          hover:-translate-y-0.5
          hover:border-[var(--color-primary)]
          hover:bg-[var(--color-surface-soft)]
          hover:text-[var(--color-primary)]
          hover:shadow-[var(--shadow-sm)]
          focus:outline-none
          focus:ring-2
          focus:ring-[var(--color-primary)]
          focus:ring-offset-2
          focus:ring-offset-[var(--color-bg)]
        "
      >
        <span
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[var(--color-surface-soft)]
            text-[var(--color-primary)]
            transition
            duration-200
            group-hover:bg-[var(--color-primary)]
            group-hover:text-white
          "
        >
          <ArrowLeft
            size={14}
            className="
              transition-transform
              duration-200
              group-hover:-translate-x-0.5
            "
          />
        </span>

        <span
          className="
            text-xs
            font-bold
            tracking-[0.01em]
          "
        >
          Home
        </span>
      </Link>


      <ThemeToggle />
    </div>
  );
}


export default LoginUtilityBar;
