import {
  authenticateUser,
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
      userId,
      password,
    } = req.body;


    // --------------------------------------------------------
    // Request validation
    // --------------------------------------------------------

    if (
      typeof userId !== "string" ||
      userId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }


    if (
      typeof password !== "string" ||
      password.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required.",
      });
    }


    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    const result =
      await authenticateUser({
        userId,
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
            "Invalid User ID or password.",
        });
    }


    // --------------------------------------------------------
    // Successful response
    // --------------------------------------------------------

    return res.status(200).json({
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
// CURRENT AUTHENTICATED USER
// ============================================================

export async function getCurrentUser(
  req,
  res,
  next
) {
  try {
    return res.status(200).json({
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