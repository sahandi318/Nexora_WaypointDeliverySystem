import {
  getSupportedLanguages,
  getTranslationServiceStatus,
  translateUiTexts,
  TranslationServiceError,
} from "../services/translationService.js";


// ============================================================
// SUPPORTED LANGUAGES
// ============================================================

export function getTranslationLanguages(
  req,
  res
) {
  void req;


  return res
    .status(200)
    .json({
      success:
        true,

      data: {
        sourceLanguage:
          "en",

        languages:
          getSupportedLanguages(),
      },
    });
}


// ============================================================
// TRANSLATION SERVICE STATUS
// ============================================================

export function getTranslationStatus(
  req,
  res
) {
  void req;


  return res
    .status(200)
    .json({
      success:
        true,

      data:
        getTranslationServiceStatus(),
    });
}


// ============================================================
// TRANSLATE UI TEXT
// ============================================================

export async function translateTexts(
  req,
  res,
  next
) {
  try {
    const {
      texts,
      targetLanguage,
    } = req.body || {};


    const result =
      await translateUiTexts({
        texts,
        targetLanguage,
      });


    return res
      .status(200)
      .json({
        success:
          true,

        data:
          result,
      });
  } catch (error) {
    if (
      error instanceof
      TranslationServiceError
    ) {
      return res
        .status(
          error.status
        )
        .json({
          success:
            false,

          code:
            error.code,

          message:
            error.message,
        });
    }


    return next(
      error
    );
  }
}
