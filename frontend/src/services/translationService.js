import api from "./api";

const TRANSLATION_REQUEST_TIMEOUT =
  60000;

// ============================================================
// GET SUPPORTED LANGUAGES
// ============================================================

export async function fetchTranslationLanguages() {
  const response =
    await api.get(
      "/translations/languages"
    );

  return (
    response.data?.data ??
    response.data
  );
}

// ============================================================
// TRANSLATE TEXT
// ============================================================

export async function requestTranslations({
  texts,
  targetLanguage,
}) {
  if (!Array.isArray(texts)) {
    throw new Error(
      "Translation texts must be an array."
    );
  }

  if (
    !targetLanguage ||
    typeof targetLanguage !==
      "string"
  ) {
    throw new Error(
      "A target language is required."
    );
  }

  const response =
    await api.post(
      "/translations",
      {
        texts,
        targetLanguage,
      },
      {
        // The first request can take longer while the
        // local NLLB model is loaded into memory.
        timeout:
          TRANSLATION_REQUEST_TIMEOUT,
      }
    );

  return (
    response.data?.data ??
    response.data
  );
}

// ============================================================
// TRANSLATION STATUS
// ============================================================
//
// Protected endpoint.
// Mainly useful for development/diagnostics.
// ============================================================

export async function fetchTranslationStatus() {
  const response =
    await api.get(
      "/translations/status"
    );

  return (
    response.data?.data ??
    response.data
  );
}