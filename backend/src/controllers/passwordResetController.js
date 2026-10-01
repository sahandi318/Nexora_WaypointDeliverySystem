import {
  requestPasswordReset,
} from "../services/passwordResetService.js";


// ============================================================
// FORGOT PASSWORD
// ============================================================

export async function forgotPassword(
  req,
  res,
  next
) {
  try {
    const {
      identifier,
    } = req.body;


    if (
      typeof identifier !==
        "string" ||
      identifier.trim().length ===
        0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "User ID or email is required.",
        });
    }


    await requestPasswordReset({
      identifier,
    });


    return res
      .status(200)
      .json({
        success: true,

        message:
          "If a matching account exists, a verification code has been sent to its registered email.",
      });
  } catch (error) {
    next(error);
  }
}