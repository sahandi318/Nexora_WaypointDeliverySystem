import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LanguageContext,
  SUPPORTED_LANGUAGES,
  TRANSLATION_CACHE_STORAGE_KEY,
} from "./LanguageContextCore";

import {
  fetchTranslationLanguages,
  requestTranslations,
} from "../services/translationService";

import {
  getStaticTranslation,
} from "../i18n/staticTranslations";

// ============================================================
// SETTINGS
// ============================================================

const MAX_DYNAMIC_CACHE_ENTRIES =
  1000;

// ============================================================
// HELPERS
// ============================================================

function isSupportedLanguage(
  languageCode
) {
  return SUPPORTED_LANGUAGES.some(
    (language) =>
      language.code ===
      languageCode
  );
}

function readStoredLanguage() {
  try {
    const storedLanguage =
      localStorage.getItem(
        LANGUAGE_STORAGE_KEY
      );

    if (
      storedLanguage &&
      isSupportedLanguage(
        storedLanguage
      )
    ) {
      return storedLanguage;
    }
  } catch {
    // Browser storage can be unavailable in restricted modes.
  }

  return DEFAULT_LANGUAGE;
}

function readDynamicTranslationCache() {
  try {
    const rawCache =
      localStorage.getItem(
        TRANSLATION_CACHE_STORAGE_KEY
      );

    if (!rawCache) {
      return {};
    }

    const parsedCache =
      JSON.parse(
        rawCache
      );

    if (
      parsedCache &&
      typeof parsedCache ===
        "object" &&
      !Array.isArray(
        parsedCache
      )
    ) {
      return parsedCache;
    }
  } catch {
    // Invalid browser cache must never prevent app startup.
  }

  return {};
}

function persistDynamicTranslationCache(
  cache
) {
  try {
    const entries =
      Object.entries(
        cache
      );

    const trimmedEntries =
      entries.length >
      MAX_DYNAMIC_CACHE_ENTRIES
        ? entries.slice(
            entries.length -
              MAX_DYNAMIC_CACHE_ENTRIES
          )
        : entries;

    localStorage.setItem(
      TRANSLATION_CACHE_STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(
          trimmedEntries
        )
      )
    );
  } catch {
    // Backend translation can still work without localStorage.
  }
}

function makeDynamicCacheKey(
  language,
  text
) {
  return `${language}::${text}`;
}

function normalizeTexts(
  texts
) {
  if (
    !Array.isArray(
      texts
    )
  ) {
    return [];
  }

  return texts.map(
    (text) =>
      typeof text ===
        "string"
        ? text
        : String(
            text ?? ""
          )
  );
}

// ============================================================
// PROVIDER
// ============================================================

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(
    readStoredLanguage
  );

  const [
    availableLanguages,
    setAvailableLanguages,
  ] = useState(
    SUPPORTED_LANGUAGES
  );

  const [
    activeDynamicTranslations,
    setActiveDynamicTranslations,
  ] = useState(0);

  const [
    translationError,
    setTranslationError,
  ] = useState(null);

  const dynamicCacheRef =
    useRef(
      readDynamicTranslationCache()
    );

  const pendingRequestsRef =
    useRef(
      new Map()
    );

  const isTranslating =
    activeDynamicTranslations >
    0;

  // ==========================================================
  // LOAD LANGUAGE METADATA
  // ==========================================================

  useEffect(() => {
    let active =
      true;

    async function loadLanguages() {
      try {
        const data =
          await fetchTranslationLanguages();

        if (!active) {
          return;
        }

        const backendLanguages =
          data?.languages;

        if (
          Array.isArray(
            backendLanguages
          ) &&
          backendLanguages.length >
            0
        ) {
          setAvailableLanguages(
            backendLanguages
          );
        }
      } catch {
        // Built-in metadata remains available.
      }
    }

    loadLanguages();

    return () => {
      active =
        false;
    };
  }, []);

  // ==========================================================
  // LANGUAGE SELECTION
  // ==========================================================

  const setLanguage =
    useCallback(
      (
        nextLanguage
      ) => {
        if (
          !isSupportedLanguage(
            nextLanguage
          )
        ) {
          return;
        }

        setLanguageState(
          nextLanguage
        );

        setTranslationError(
          null
        );

        try {
          localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            nextLanguage
          );
        } catch {
          // Current session still works without persistence.
        }

        document.documentElement.lang =
          nextLanguage;
      },
      []
    );

  useEffect(() => {
    document.documentElement.lang =
      language;
  }, [
    language,
  ]);

  // ==========================================================
  // STATIC / CURATED UI TRANSLATION
  // ==========================================================

  const t =
    useCallback(
      (
        key,
        fallback,
        variables
      ) =>
        getStaticTranslation({
          language,
          key,
          fallback,
          variables,
        }),
      [
        language,
      ]
    );

  // ==========================================================
  // DYNAMIC CACHE READER
  // ==========================================================

  const getCachedDynamicTranslation =
    useCallback(
      (
        text,
        targetLanguage =
          language
      ) => {
        if (
          !text ||
          targetLanguage ===
            DEFAULT_LANGUAGE
        ) {
          return text;
        }

        const cacheKey =
          makeDynamicCacheKey(
            targetLanguage,
            text
          );

        return (
          dynamicCacheRef.current[
            cacheKey
          ] ??
          text
        );
      },
      [
        language,
      ]
    );

  // ==========================================================
  // DYNAMIC TRANSLATION
  // ==========================================================

  const translateDynamicTexts =
    useCallback(
      async (
        texts,
        targetLanguage =
          language
      ) => {
        const normalizedTexts =
          normalizeTexts(
            texts
          );

        if (
          normalizedTexts.length ===
          0
        ) {
          return [];
        }

        if (
          targetLanguage ===
          DEFAULT_LANGUAGE
        ) {
          return normalizedTexts;
        }

        if (
          !isSupportedLanguage(
            targetLanguage
          )
        ) {
          return normalizedTexts;
        }

        const result =
          new Array(
            normalizedTexts.length
          );

        const missingTexts =
          [];

        const missingIndexes =
          [];

        normalizedTexts.forEach(
          (
            text,
            index
          ) => {
            if (
              !text.trim()
            ) {
              result[index] =
                text;

              return;
            }

            const cacheKey =
              makeDynamicCacheKey(
                targetLanguage,
                text
              );

            const cached =
              dynamicCacheRef.current[
                cacheKey
              ];

            if (
              typeof cached ===
                "string"
            ) {
              result[index] =
                cached;

              return;
            }

            missingTexts.push(
              text
            );

            missingIndexes.push(
              index
            );
          }
        );

        if (
          missingTexts.length ===
          0
        ) {
          return result;
        }

        const uniqueMissingTexts =
          [
            ...new Set(
              missingTexts
            ),
          ];

        const requestKey =
          `${targetLanguage}::${JSON.stringify(
            uniqueMissingTexts
          )}`;

        let pendingRequest =
          pendingRequestsRef.current.get(
            requestKey
          );

        let ownsRequest =
          false;

        if (!pendingRequest) {
          ownsRequest =
            true;

          setActiveDynamicTranslations(
            (current) =>
              current + 1
          );

          pendingRequest =
            requestTranslations({
              texts:
                uniqueMissingTexts,

              targetLanguage,
            });

          pendingRequestsRef.current.set(
            requestKey,
            pendingRequest
          );
        }

        setTranslationError(
          null
        );

        try {
          const response =
            await pendingRequest;

          const translatedTexts =
            response?.translations;

          if (
            !Array.isArray(
              translatedTexts
            ) ||
            translatedTexts.length !==
              uniqueMissingTexts.length
          ) {
            throw new Error(
              "The translation service returned an invalid response."
            );
          }

          const translatedBySource =
            new Map();

          uniqueMissingTexts.forEach(
            (
              sourceText,
              index
            ) => {
              const translatedText =
                translatedTexts[
                  index
                ];

              const safeTranslation =
                typeof translatedText ===
                  "string" &&
                translatedText.trim()
                  .length > 0
                  ? translatedText
                  : sourceText;

              translatedBySource.set(
                sourceText,
                safeTranslation
              );

              const cacheKey =
                makeDynamicCacheKey(
                  targetLanguage,
                  sourceText
                );

              dynamicCacheRef.current[
                cacheKey
              ] =
                safeTranslation;
            }
          );

          persistDynamicTranslationCache(
            dynamicCacheRef.current
          );

          missingTexts.forEach(
            (
              sourceText,
              position
            ) => {
              const originalIndex =
                missingIndexes[
                  position
                ];

              result[
                originalIndex
              ] =
                translatedBySource.get(
                  sourceText
                ) ??
                sourceText;
            }
          );

          return result;
        } catch (error) {
          setTranslationError(
            error.response?.data
              ?.message ||
              error.message ||
              "Translation is temporarily unavailable."
          );

          missingIndexes.forEach(
            (
              originalIndex
            ) => {
              result[
                originalIndex
              ] =
                normalizedTexts[
                  originalIndex
                ];
            }
          );

          return result;
        } finally {
          if (
            ownsRequest
          ) {
            pendingRequestsRef.current.delete(
              requestKey
            );

            setActiveDynamicTranslations(
              (current) =>
                Math.max(
                  0,
                  current - 1
                )
            );
          }
        }
      },
      [
        language,
      ]
    );

  const translateDynamicText =
    useCallback(
      async (
        text,
        targetLanguage =
          language
      ) => {
        const translations =
          await translateDynamicTexts(
            [
              text,
            ],
            targetLanguage
          );

        return (
          translations[0] ??
          text
        );
      },
      [
        language,
        translateDynamicTexts,
      ]
    );

  // ==========================================================
  // DYNAMIC PREFETCH
  // ==========================================================

  const prefetchDynamicTranslations =
    useCallback(
      async (
        texts,
        targetLanguages = [
          "si",
          "ta",
        ]
      ) => {
        for (
          const targetLanguage
          of targetLanguages
        ) {
          if (
            targetLanguage ===
              DEFAULT_LANGUAGE ||
            !isSupportedLanguage(
              targetLanguage
            )
          ) {
            continue;
          }

          try {
            await translateDynamicTexts(
              texts,
              targetLanguage
            );
          } catch {
            // Prefetch must never interrupt the visible UI.
          }
        }
      },
      [
        translateDynamicTexts,
      ]
    );

  // ==========================================================
  // CLEAR DYNAMIC CACHE
  // ==========================================================

  const clearTranslationCache =
    useCallback(
      () => {
        dynamicCacheRef.current =
          {};

        try {
          localStorage.removeItem(
            TRANSLATION_CACHE_STORAGE_KEY
          );
        } catch {
          // Ignore unavailable browser storage.
        }
      },
      []
    );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value =
    useMemo(
      () => ({
        language,

        setLanguage,

        languages:
          availableLanguages,

        // Instant curated UI translation.
        t,

        // NLLB dynamic translation.
        translateDynamicText,
        translateDynamicTexts,
        prefetchDynamicTranslations,
        getCachedDynamicTranslation,

        isTranslating,
        translationError,

        clearTranslationCache,
      }),
      [
        language,
        setLanguage,
        availableLanguages,
        t,
        translateDynamicText,
        translateDynamicTexts,
        prefetchDynamicTranslations,
        getCachedDynamicTranslation,
        isTranslating,
        translationError,
        clearTranslationCache,
      ]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;