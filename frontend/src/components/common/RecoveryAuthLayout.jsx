import {
  ArrowLeft,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import useTranslations from "../../hooks/useTranslations";

import LanguageSelector from "./LanguageSelector";


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
        <div
          className="
            mb-2
            flex
            min-h-10
            items-center
            justify-end
            pr-12
            sm:pr-12
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
        </div>

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
