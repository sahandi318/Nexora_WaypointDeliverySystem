import {
  requestPasswordReset,
  resetPasswordWithToken,
  verifyPasswordResetOtp,
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


// ============================================================
// VERIFY RESET OTP
// ============================================================

export async function verifyResetOtp(
  req,
  res,
  next
) {
  try {
    const {
      identifier,
      otp,
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


    if (
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Enter a valid 6-digit verification code.",
        });
    }


    const result =
      await verifyPasswordResetOtp({
        identifier,
        otp,
      });


    if (!result.success) {
      return res
        .status(400)
        .json({
          success: false,

          code:
            "OTP_REJECTED",

          message:
            "The verification code is invalid, expired, or no longer available. Request a new code if necessary.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Verification successful.",

        resetToken:
          result.resetToken,
      });
  } catch (error) {
    next(error);
  }
}


// ============================================================
// RESET PASSWORD
// ============================================================

export async function resetPassword(
  req,
  res,
  next
) {
  try {
    const {
      resetToken,
      newPassword,
      confirmPassword,
    } = req.body;


    if (
      typeof resetToken !==
        "string" ||
      resetToken.trim().length ===
        0
    ) {
      return res
        .status(401)
        .json({
          success: false,

          code:
            "INVALID_RESET_TOKEN",

          message:
            "Your password-reset session is invalid or expired. Request a new verification code.",
        });
    }


    if (
      typeof newPassword !==
        "string" ||
      newPassword.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New password is required.",
        });
    }


    if (
      typeof confirmPassword !==
        "string" ||
      confirmPassword.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Confirm your new password.",
        });
    }


    if (
      newPassword !==
      confirmPassword
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "New password and confirmation do not match.",
        });
    }


    const result =
      await resetPasswordWithToken({
        resetToken:
          resetToken.trim(),

        newPassword,
      });


    if (!result.success) {
      switch (
        result.reason
      ) {
        case "INVALID_RESET_TOKEN":
          return res
            .status(401)
            .json({
              success: false,

              code:
                "INVALID_RESET_TOKEN",

              message:
                "Your password-reset session is invalid, expired, or has already been used. Request a new verification code.",
            });


        case "PASSWORD_REUSE":
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Your new password must be different from your current password.",
            });


        case "WEAK_PASSWORD":
          return res
            .status(400)
            .json({
              success: false,

              message:
                result.message,
            });


        case "ACCOUNT_INACTIVE":
          return res
            .status(403)
            .json({
              success: false,

              message:
                "This account is inactive.",
            });


        default:
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Unable to reset password.",
            });
      }
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Password reset successfully. You can now sign in with your new password.",
      });
  } catch (error) {
    next(error);
  }
}