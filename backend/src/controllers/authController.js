import {
  authenticateUser,
  changeAuthenticatedUserPassword,
  serializeAuthenticatedUser,
} from "../services/authService.js";


// ============================================================
// LOGIN
// ============================================================

export async function login(
  req,
  res,
  next
) {
  try {
    const {
      identifier,
      password,
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
      typeof password !==
        "string" ||
      password.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Password is required.",
        });
    }


    const result =
      await authenticateUser({
        identifier,
        password,
      });


    if (!result.success) {
      if (
        result.reason ===
        "ACCOUNT_INACTIVE"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "This account is inactive. Contact an administrator.",
          });
      }


      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid User ID, email, or password.",
        });
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Login successful.",

        token:
          result.token,

        user:
          result.user,
      });
  } catch (error) {
    next(error);
  }
}


// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser(
  req,
  res,
  next
) {
  try {
    return res
      .status(200)
      .json({
        success: true,

        user:
          serializeAuthenticatedUser(
            req.user
          ),
      });
  } catch (error) {
    next(error);
  }
}


// ============================================================
// CHANGE PASSWORD
// ============================================================

export async function changePassword(
  req,
  res,
  next
) {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;


    if (
      typeof currentPassword !==
        "string" ||
      currentPassword.length ===
        0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Current password is required.",
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
      confirmPassword.length ===
        0
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
      await changeAuthenticatedUserPassword(
        {
          userDatabaseId:
            req.user.id,

          currentPassword,

          newPassword,
        }
      );


    if (!result.success) {
      switch (result.reason) {
        case "CURRENT_PASSWORD_INCORRECT":
          return res
            .status(401)
            .json({
              success: false,

              message:
                "Current password is incorrect.",
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
            .status(401)
            .json({
              success: false,

              message:
                "Unable to change password.",
            });
      }
    }


    return res
      .status(200)
      .json({
        success: true,

        message:
          "Password changed successfully.",

        user:
          result.user,
      });
  } catch (error) {
    next(error);
  }
}