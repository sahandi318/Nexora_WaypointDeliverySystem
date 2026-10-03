import path from "node:path";

import {
  env,
  pipeline,
} from "@huggingface/transformers";


// ============================================================
// LOCAL NLLB MODEL CONFIGURATION
// ============================================================

const DEFAULT_MODEL_ID =
  "Xenova/nllb-200-distilled-600M";

const DEFAULT_MODEL_DTYPE =
  "q8";

const MODEL_ID =
  process.env.TRANSLATION_MODEL_ID ||
  DEFAULT_MODEL_ID;

const MODEL_DTYPE =
  process.env.TRANSLATION_MODEL_DTYPE ||
  DEFAULT_MODEL_DTYPE;

const MODEL_CACHE_DIR =
  process.env.TRANSLATION_MODEL_CACHE_DIR ||
  path.resolve(
    process.cwd(),
    "node_modules",
    ".cache",
    "nexora-translation"
  );


// ============================================================
// NLLB LANGUAGE CODES
// ============================================================

const NLLB_LANGUAGE_CODES =
  Object.freeze({
    en:
      "eng_Latn",

    si:
      "sin_Sinh",

    ta:
      "tam_Taml",
  });


// ============================================================
// TRANSFORMERS.JS ENVIRONMENT
// ============================================================

env.cacheDir =
  MODEL_CACHE_DIR;

env.allowRemoteModels =
  true;

env.allowLocalModels =
  true;


// ============================================================
// SINGLETON MODEL STATE
// ============================================================

let translatorPromise =
  null;

let isModelLoaded =
  false;

let lastModelError =
  null;


/**
 * Local CPU inference is serialized.
 *
 * This prevents several translation requests from running the
 * large NLLB model simultaneously and consuming too much RAM.
 */
let inferenceQueue =
  Promise.resolve();


// ============================================================
// LANGUAGE HELPERS
// ============================================================

function getNllbLanguageCode(
  language
) {
  const languageCode =
    NLLB_LANGUAGE_CODES[
      language
    ];


  if (!languageCode) {
    throw new Error(
      `Unsupported local translation language: ${language}`
    );
  }


  return languageCode;
}


// ============================================================
// MODEL LOADING
// ============================================================

async function createTranslator() {
  console.log(
    `Loading local translation model: ${MODEL_ID} (${MODEL_DTYPE})`
  );


  try {
    const translator =
      await pipeline(
        "translation",
        MODEL_ID,
        {
          dtype:
            MODEL_DTYPE,
        }
      );


    isModelLoaded =
      true;

    lastModelError =
      null;


    console.log(
      "✓ Local NLLB translation model ready"
    );


    return translator;
  } catch (error) {
    isModelLoaded =
      false;

    lastModelError =
      error;


    console.error(
      "Local translation model failed to load:",
      error.message
    );


    throw error;
  }
}


export async function getLocalTranslator() {
  if (!translatorPromise) {
    translatorPromise =
      createTranslator()
        .catch(
          (error) => {
            translatorPromise =
              null;

            throw error;
          }
        );
  }


  return translatorPromise;
}


// ============================================================
// OUTPUT EXTRACTION
// ============================================================

function extractTranslationText(
  output
) {
  if (!output) {
    return null;
  }


  if (
    Array.isArray(output)
  ) {
    if (
      output.length === 0
    ) {
      return null;
    }


    return extractTranslationText(
      output[0]
    );
  }


  if (
    typeof output.translation_text ===
    "string"
  ) {
    return output.translation_text;
  }


  if (
    typeof output.generated_text ===
    "string"
  ) {
    return output.generated_text;
  }


  return null;
}


// ============================================================
// RESULT NORMALIZATION
// ============================================================

function normalizeTranslationText(
  translatedText
) {
  if (
    typeof translatedText !==
    "string"
  ) {
    return "";
  }


  return translatedText
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


// ============================================================
// GENERATION LIMIT
// ============================================================

/**
 * Waypoint translation is primarily for short UI phrases.
 *
 * NLLB can continue generating unnecessary multilingual tokens
 * when an excessively large generation limit is supplied.
 *
 * Therefore we use a small dynamic limit based on the size of
 * the English phrase.
 *
 * This is NOT a translation dictionary and does not hard-code
 * Sinhala or Tamil words.
 */
function calculateMaxNewTokens(
  text
) {
  const wordCount =
    text
      .trim()
      .split(
        /\s+/
      )
      .filter(Boolean)
      .length;


  /**
   * Examples:
   *
   * "Welcome"
   * -> 10 tokens maximum
   *
   * "Assigned depot"
   * -> 12 tokens maximum
   *
   * Longer dashboard sentences
   * -> progressively more room
   */
  return Math.min(
    48,
    Math.max(
      10,
      wordCount * 4 + 4
    )
  );
}


// ============================================================
// SINGLE TEXT TRANSLATION
// ============================================================

async function translateSingleText({
  translator,
  text,
  sourceCode,
  targetCode,
}) {
  if (
    !text ||
    text.trim().length === 0
  ) {
    return text;
  }


  const output =
    await translator(
      text,
      {
        src_lang:
          sourceCode,

        tgt_lang:
          targetCode,

        /**
         * Deterministic generation.
         */
        do_sample:
          false,

        /**
         * Small beam search improves short UI-label quality
         * without making inference excessively expensive.
         */
        num_beams:
          3,

        early_stopping:
          true,

        /**
         * Prevent the model from filling 100+ tokens after a
         * short translation has already been produced.
         */
        max_new_tokens:
          calculateMaxNewTokens(
            text
          ),

        /**
         * Additional protection against repeated multilingual
         * fragments.
         */
        repetition_penalty:
          1.15,

        no_repeat_ngram_size:
          3,
      }
    );


  const translatedText =
    normalizeTranslationText(
      extractTranslationText(
        output
      )
    );


  if (!translatedText) {
    throw new Error(
      "Local translation model returned an empty translation."
    );
  }


  return translatedText;
}


// ============================================================
// INFERENCE QUEUE
// ============================================================

function enqueueInference(
  operation
) {
  const run =
    inferenceQueue.then(
      operation,
      operation
    );


  inferenceQueue =
    run.catch(
      () => undefined
    );


  return run;
}


// ============================================================
// LOCAL TRANSLATION
// ============================================================

export async function translateLocally({
  texts,
  sourceLanguage = "en",
  targetLanguage,
}) {
  if (
    sourceLanguage ===
    targetLanguage
  ) {
    return texts;
  }


  const sourceCode =
    getNllbLanguageCode(
      sourceLanguage
    );


  const targetCode =
    getNllbLanguageCode(
      targetLanguage
    );


  return enqueueInference(
    async () => {
      const translator =
        await getLocalTranslator();


      const translations =
        [];


      /**
       * Translate UI phrases one at a time.
       *
       * This is slightly slower on a cache miss than a raw
       * batch, but it gives much more predictable generation
       * lengths for short UI strings.
       *
       * Since successful results are permanently cached in
       * MySQL, this cost normally occurs only once per phrase
       * and language.
       */
      for (
        const text
        of texts
      ) {
        const translatedText =
          await translateSingleText({
            translator,

            text,

            sourceCode,

            targetCode,
          });


        translations.push(
          translatedText
        );
      }


      return translations;
    }
  );
}


// ============================================================
// MODEL WARMUP
// ============================================================

export async function warmLocalTranslationModel() {
  await getLocalTranslator();


  return getLocalTranslationModelStatus();
}


// ============================================================
// MODEL STATUS
// ============================================================

export function getLocalTranslationModelStatus() {
  return {
    provider:
      "nllb-local",

    modelId:
      MODEL_ID,

    dtype:
      MODEL_DTYPE,

    cacheDirectory:
      MODEL_CACHE_DIR,

    loaded:
      isModelLoaded,

    lastError:
      lastModelError
        ? lastModelError.message
        : null,
  };
}