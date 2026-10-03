import useLanguage from "./useLanguage";

function useTranslations() {
  const {
    language,

    t,

    translateDynamicText,
    translateDynamicTexts,
    prefetchDynamicTranslations,
    getCachedDynamicTranslation,

    isTranslating,
    translationError,
  } = useLanguage();

  return {
    language,

    // Curated fixed application UI.
    t,

    // Dynamic content only.
    translateDynamicText,
    translateDynamicTexts,
    prefetchDynamicTranslations,
    getCachedDynamicTranslation,

    isTranslating,
    error:
      translationError,
  };
}

export default useTranslations;