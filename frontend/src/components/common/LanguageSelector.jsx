import {
  Check,
  ChevronDown,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useLanguage from "../../hooks/useLanguage";

const FALLBACK_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
  {
    code: "si",
    name: "Sinhala",
    nativeName: "සිංහල",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
  },
];

function normalizeLanguage(
  language
) {
  if (!language) {
    return null;
  }

  const code =
    language.code ||
    language.value ||
    language.languageCode;

  if (!code) {
    return null;
  }

  const fallback =
    FALLBACK_LANGUAGES.find(
      (item) =>
        item.code === code
    );

  return {
    code,

    name:
      language.name ||
      language.label ||
      language.englishName ||
      fallback?.name ||
      code,

    nativeName:
      language.nativeName ||
      language.nativeLabel ||
      fallback?.nativeName ||
      language.name ||
      language.label ||
      code,
  };
}

function LanguageSelector({
  compact = false,
}) {
  const {
    language,
    languages,
    setLanguage,
    isTranslating,
  } = useLanguage();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const containerRef =
    useRef(null);

  const supportedLanguages =
    useMemo(() => {
      if (
        !Array.isArray(
          languages
        ) ||
        languages.length === 0
      ) {
        return FALLBACK_LANGUAGES;
      }

      const normalized =
        languages
          .map(
            normalizeLanguage
          )
          .filter(Boolean);

      return normalized.length > 0
        ? normalized
        : FALLBACK_LANGUAGES;
    }, [
      languages,
    ]);

  const currentLanguage =
    supportedLanguages.find(
      (item) =>
        item.code === language
    ) ||
    FALLBACK_LANGUAGES[0];

  // ==========================================================
  // CLOSE DROPDOWN
  // ==========================================================

  useEffect(() => {
    function handleOutsideClick(
      event
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ==========================================================
  // LANGUAGE CHANGE
  // ==========================================================

  function handleLanguageChange(
    nextLanguage
  ) {
    if (
      nextLanguage ===
      language
    ) {
      setIsOpen(false);

      return;
    }

    setLanguage(
      nextLanguage
    );

    setIsOpen(false);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      ref={containerRef}
      className="
        relative
        z-[90]
        shrink-0
      "
    >
      {/* TRIGGER */}

      <button
        type="button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={
          isOpen
        }
        disabled={
          isTranslating
        }
        onClick={() =>
          setIsOpen(
            (current) =>
              !current
          )
        }
        className={`
          nexora-focus
          inline-flex
          h-10
          items-center
          justify-center
          rounded-xl
          border
          border-[var(--color-border)]
          bg-[var(--color-surface)]
          text-[var(--color-text)]
          transition
          duration-200

          hover:border-[var(--color-border-strong)]
          hover:bg-[var(--color-surface-soft)]

          focus:outline-none
          focus:ring-2
          focus:ring-[var(--color-primary)]
          focus:ring-offset-2
          focus:ring-offset-[var(--color-bg)]

          disabled:cursor-wait
          disabled:opacity-60

          ${
            compact
              ? "gap-1.5 px-2.5"
              : "gap-2.5 px-3.5"
          }
        `}
      >
        <span
          className={`
            whitespace-nowrap
            font-semibold
            ${
              compact
                ? "text-xs"
                : "text-sm"
            }
          `}
        >
          {
            currentLanguage
              .nativeName
          }
        </span>

        <ChevronDown
          size={14}
          strokeWidth={1.9}
          className={`
            shrink-0
            text-[var(--color-text-muted)]
            transition-transform
            duration-200

            ${
              isOpen
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {/* DROPDOWN */}

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          className="
            absolute
            right-0
            top-[calc(100%+0.5rem)]
            w-[176px]
            overflow-hidden
            rounded-xl
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            p-1.5

            shadow-[0_12px_32px_rgba(0,0,0,0.12)]
          "
        >
          {supportedLanguages.map(
            (item) => {
              const isSelected =
                item.code ===
                language;

              return (
                <button
                  key={
                    item.code
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    isSelected
                  }
                  onClick={() =>
                    handleLanguageChange(
                      item.code
                    )
                  }
                  className={`
                    nexora-focus
                    flex
                    min-h-10
                    w-full
                    items-center
                    justify-between
                    gap-3
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    transition
                    duration-150

                    ${
                      isSelected
                        ? `
                            bg-[var(--color-surface-soft)]
                            text-[var(--color-text)]
                          `
                        : `
                            text-[var(--color-text-secondary)]
                            hover:bg-[var(--color-surface-soft)]
                            hover:text-[var(--color-text)]
                          `
                    }
                  `}
                >
                  <span
                    className={`
                      truncate
                      text-sm
                      ${
                        isSelected
                          ? "font-semibold"
                          : "font-medium"
                      }
                    `}
                  >
                    {
                      item.nativeName
                    }
                  </span>

                  <span
                    className="
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                    "
                  >
                    {isSelected && (
                      <Check
                        size={15}
                        strokeWidth={2}
                        className="
                          text-[var(--color-primary)]
                        "
                      />
                    )}
                  </span>
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;