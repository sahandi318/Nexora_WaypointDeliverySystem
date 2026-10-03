import {
  createHash,
} from "node:crypto";

import prisma from "../config/database.js";

import {
  getLocalTranslationModelStatus,
  translateLocally,
} from "./localTranslationModel.js";


// ============================================================
// CONSTANTS
// ============================================================

const SOURCE_LANGUAGE =
  "en";

const LOCAL_PROVIDER =
  "nllb-local";


export const SUPPORTED_UI_LANGUAGES =
  Object.freeze([
    {
      code:
        "en",

      name:
        "English",

      nativeName:
        "English",
    },

    {
      code:
        "si",

      name:
        "Sinhala",

      nativeName:
        "සිංහල",
    },

    {
      code:
        "ta",

      name:
        "Tamil",

      nativeName:
        "தமிழ்",
    },
  ]);


// ============================================================
// SERVICE ERROR
// ============================================================

export class TranslationServiceError
  extends Error {
  constructor(
    message,
    {
      status = 500,
      code =
        "TRANSLATION_SERVICE_ERROR",
    } = {}
  ) {
    super(message);


    this.name =
      "TranslationServiceError";

    this.status =
      status;

    this.code =
      code;
  }
}


// ============================================================
// CONFIGURATION
// ============================================================

function getPositiveIntegerEnvironmentValue(
  variableName,
  fallback
) {
  const rawValue =
    process.env[
      variableName
    ];


  if (!rawValue) {
    return fallback;
  }


  const value =
    Number(rawValue);


  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return fallback;
  }


  return value;
}


function isTranslationCacheEnabled() {
  return (
    String(
      process.env
        .TRANSLATION_CACHE_ENABLED ??
      "true"
    )
      .trim()
      .toLowerCase() !==
    "false"
  );
}


function getTranslationProvider() {
  return (
    process.env
      .TRANSLATION_PROVIDER ||
    LOCAL_PROVIDER
  )
    .trim()
    .toLowerCase();
}


// ============================================================
// LANGUAGE HELPERS
// ============================================================

export function getSupportedLanguages() {
  return SUPPORTED_UI_LANGUAGES.map(
    (language) => ({
      ...language,
    })
  );
}


function normalizeLanguageCode(
  language
) {
  return String(
    language || ""
  )
    .trim()
    .toLowerCase();
}


function isSupportedLanguage(
  language
) {
  return SUPPORTED_UI_LANGUAGES.some(
    (supportedLanguage) =>
      supportedLanguage.code ===
      language
  );
}


// ============================================================
// CACHE KEY
// ============================================================

function createTranslationCacheKey({
  sourceLanguage,
  targetLanguage,
  sourceText,
}) {
  return createHash(
    "sha256"
  )
    .update(
      [
        sourceLanguage,
        targetLanguage,
        sourceText,
      ].join("\u0000"),
      "utf8"
    )
    .digest(
      "hex"
    );
}


// ============================================================
// INPUT VALIDATION
// ============================================================

function validateTranslationRequest({
  texts,
  targetLanguage,
}) {
  const maxBatchSize =
    getPositiveIntegerEnvironmentValue(
      "TRANSLATION_MAX_BATCH_SIZE",
      50
    );


  const maxTextLength =
    getPositiveIntegerEnvironmentValue(
      "TRANSLATION_MAX_TEXT_LENGTH",
      2000
    );


  const maxTotalCharacters =
    getPositiveIntegerEnvironmentValue(
      "TRANSLATION_MAX_TOTAL_CHARACTERS",
      20000
    );


  if (
    !Array.isArray(texts) ||
    texts.length === 0
  ) {
    throw new TranslationServiceError(
      "texts must be a non-empty array.",
      {
        status:
          400,

        code:
          "INVALID_TRANSLATION_TEXTS",
      }
    );
  }


  if (
    texts.length >
    maxBatchSize
  ) {
    throw new TranslationServiceError(
      `A maximum of ${maxBatchSize} texts can be translated in one request.`,
      {
        status:
          400,

        code:
          "TRANSLATION_BATCH_TOO_LARGE",
      }
    );
  }


  let totalCharacters =
    0;


  const normalizedTexts =
    texts.map(
      (
        text,
        index
      ) => {
        if (
          typeof text !==
          "string"
        ) {
          throw new TranslationServiceError(
            `Translation text at index ${index} must be a string.`,
            {
              status:
                400,

              code:
                "INVALID_TRANSLATION_TEXT",
            }
          );
        }


        if (
          text.length >
          maxTextLength
        ) {
          throw new TranslationServiceError(
            `Translation text at index ${index} exceeds the ${maxTextLength} character limit.`,
            {
              status:
                400,

              code:
                "TRANSLATION_TEXT_TOO_LONG",
            }
          );
        }


        totalCharacters +=
          text.length;


        return text;
      }
    );


  if (
    totalCharacters >
    maxTotalCharacters
  ) {
    throw new TranslationServiceError(
      `The translation request exceeds the ${maxTotalCharacters} total character limit.`,
      {
        status:
          400,

        code:
          "TRANSLATION_REQUEST_TOO_LARGE",
      }
    );
  }


  const normalizedTargetLanguage =
    normalizeLanguageCode(
      targetLanguage
    );


  if (
    !isSupportedLanguage(
      normalizedTargetLanguage
    )
  ) {
    throw new TranslationServiceError(
      "Unsupported target language. Supported languages are en, si and ta.",
      {
        status:
          400,

        code:
          "UNSUPPORTED_LANGUAGE",
      }
    );
  }


  return {
    texts:
      normalizedTexts,

    targetLanguage:
      normalizedTargetLanguage,
  };
}


// ============================================================
// CACHE LOOKUP
// ============================================================

async function loadCachedTranslations({
  sourceTexts,
  targetLanguage,
}) {
  if (
    !isTranslationCacheEnabled() ||
    sourceTexts.length === 0
  ) {
    return new Map();
  }


  const entries =
    sourceTexts.map(
      (sourceText) => ({
        sourceText,

        cacheKey:
          createTranslationCacheKey({
            sourceLanguage:
              SOURCE_LANGUAGE,

            targetLanguage,

            sourceText,
          }),
      })
    );


  const cacheKeys =
    entries.map(
      (entry) =>
        entry.cacheKey
    );


  try {
    const records =
      await prisma
        .translationCache
        .findMany({
          where: {
            cacheKey: {
              in:
                cacheKeys,
            },
          },
        });


    const recordsByKey =
      new Map(
        records.map(
          (record) => [
            record.cacheKey,
            record,
          ]
        )
      );


    const translationsBySource =
      new Map();


    for (
      const entry
      of entries
    ) {
      const record =
        recordsByKey.get(
          entry.cacheKey
        );


      if (!record) {
        continue;
      }


      if (
        record.sourceLanguage !==
          SOURCE_LANGUAGE ||
        record.targetLanguage !==
          targetLanguage ||
        record.sourceText !==
          entry.sourceText
      ) {
        continue;
      }


      translationsBySource.set(
        entry.sourceText,
        record.translatedText
      );
    }


    return translationsBySource;
  } catch (error) {
    /**
     * Cache lookup failure should not stop the translation model
     * from providing a result.
     */
    console.warn(
      "Translation cache lookup failed:",
      error.message
    );


    return new Map();
  }
}


// ============================================================
// CACHE WRITE
// ============================================================

async function saveTranslationsToCache({
  sourceTexts,
  translatedTexts,
  targetLanguage,
}) {
  if (
    !isTranslationCacheEnabled() ||
    sourceTexts.length === 0
  ) {
    return;
  }


  const records =
    sourceTexts.map(
      (
        sourceText,
        index
      ) => ({
        cacheKey:
          createTranslationCacheKey({
            sourceLanguage:
              SOURCE_LANGUAGE,

            targetLanguage,

            sourceText,
          }),

        sourceLanguage:
          SOURCE_LANGUAGE,

        targetLanguage,

        sourceText,

        translatedText:
          translatedTexts[
            index
          ],

        provider:
          LOCAL_PROVIDER,
      })
    );


  try {
    await prisma
      .translationCache
      .createMany({
        data:
          records,

        skipDuplicates:
          true,
      });
  } catch (error) {
    console.warn(
      "Translation cache write failed:",
      error.message
    );
  }
}


// ============================================================
// TRANSLATE UI TEXT
// ============================================================

export async function translateUiTexts({
  texts,
  targetLanguage,
}) {
  const validated =
    validateTranslationRequest({
      texts,
      targetLanguage,
    });


  const sourceTexts =
    validated.texts;

  const normalizedTargetLanguage =
    validated.targetLanguage;


  // ----------------------------------------------------------
  // ENGLISH IS THE SOURCE LANGUAGE
  // ----------------------------------------------------------

  if (
    normalizedTargetLanguage ===
    SOURCE_LANGUAGE
  ) {
    return {
      sourceLanguage:
        SOURCE_LANGUAGE,

      targetLanguage:
        SOURCE_LANGUAGE,

      translations:
        sourceTexts,

      provider:
        "source",

      cache: {
        enabled:
          isTranslationCacheEnabled(),

        hits:
          0,

        misses:
          0,
      },
    };
  }


  // ----------------------------------------------------------
  // ONLY TRANSLATE UNIQUE NON-EMPTY STRINGS
  // ----------------------------------------------------------

  const uniqueSourceTexts =
    [
      ...new Set(
        sourceTexts.filter(
          (text) =>
            text.trim().length >
            0
        )
      ),
    ];


  if (
    uniqueSourceTexts.length ===
    0
  ) {
    return {
      sourceLanguage:
        SOURCE_LANGUAGE,

      targetLanguage:
        normalizedTargetLanguage,

      translations:
        sourceTexts,

      provider:
        LOCAL_PROVIDER,

      cache: {
        enabled:
          isTranslationCacheEnabled(),

        hits:
          0,

        misses:
          0,
      },
    };
  }


  // ----------------------------------------------------------
  // DATABASE CACHE FIRST
  // ----------------------------------------------------------

  const translationsBySource =
    await loadCachedTranslations({
      sourceTexts:
        uniqueSourceTexts,

      targetLanguage:
        normalizedTargetLanguage,
    });


  const cacheHits =
    translationsBySource.size;


  const missingSourceTexts =
    uniqueSourceTexts.filter(
      (sourceText) =>
        !translationsBySource
          .has(
            sourceText
          )
    );


  // ----------------------------------------------------------
  // LOCAL MODEL FOR CACHE MISSES
  // ----------------------------------------------------------

  if (
    missingSourceTexts.length >
    0
  ) {
    const provider =
      getTranslationProvider();


    if (
      provider !==
      LOCAL_PROVIDER
    ) {
      throw new TranslationServiceError(
        `Unsupported translation provider: ${provider}`,
        {
          status:
            503,

          code:
            "UNSUPPORTED_TRANSLATION_PROVIDER",
        }
      );
    }


    let translatedMissingTexts;


    try {
      translatedMissingTexts =
        await translateLocally({
          texts:
            missingSourceTexts,

          sourceLanguage:
            SOURCE_LANGUAGE,

          targetLanguage:
            normalizedTargetLanguage,
        });
    } catch (error) {
      console.error(
        "Local translation failed:",
        error
      );


      throw new TranslationServiceError(
        "The local translation model is currently unavailable.",
        {
          status:
            503,

          code:
            "LOCAL_TRANSLATION_UNAVAILABLE",
        }
      );
    }


    if (
      !Array.isArray(
        translatedMissingTexts
      ) ||
      translatedMissingTexts.length !==
        missingSourceTexts.length
    ) {
      throw new TranslationServiceError(
        "The local translation model returned an invalid response.",
        {
          status:
            500,

          code:
            "INVALID_LOCAL_TRANSLATION_RESPONSE",
        }
      );
    }


    for (
      let index = 0;
      index <
      missingSourceTexts.length;
      index += 1
    ) {
      translationsBySource.set(
        missingSourceTexts[
          index
        ],
        translatedMissingTexts[
          index
        ]
      );
    }


    await saveTranslationsToCache({
      sourceTexts:
        missingSourceTexts,

      translatedTexts:
        translatedMissingTexts,

      targetLanguage:
        normalizedTargetLanguage,
    });
  }


  // ----------------------------------------------------------
  // RESTORE ORIGINAL REQUEST ORDER
  // ----------------------------------------------------------

  const translations =
    sourceTexts.map(
      (sourceText) => {
        if (
          sourceText.trim()
            .length === 0
        ) {
          return sourceText;
        }


        const translatedText =
          translationsBySource.get(
            sourceText
          );


        if (
          typeof translatedText !==
          "string"
        ) {
          throw new TranslationServiceError(
            "A translation result is missing.",
            {
              status:
                500,

              code:
                "TRANSLATION_RESULT_MISSING",
            }
          );
        }


        return translatedText;
      }
    );


  return {
    sourceLanguage:
      SOURCE_LANGUAGE,

    targetLanguage:
      normalizedTargetLanguage,

    translations,

    provider:
      LOCAL_PROVIDER,

    cache: {
      enabled:
        isTranslationCacheEnabled(),

      hits:
        cacheHits,

      misses:
        missingSourceTexts.length,
    },
  };
}


// ============================================================
// STATUS
// ============================================================

export function getTranslationServiceStatus() {
  return {
    provider:
      getTranslationProvider(),

    sourceLanguage:
      SOURCE_LANGUAGE,

    cacheEnabled:
      isTranslationCacheEnabled(),

    model:
      getLocalTranslationModelStatus(),
  };
}
