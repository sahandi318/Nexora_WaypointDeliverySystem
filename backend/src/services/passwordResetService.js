import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../config/database.js";

import {
  validatePasswordPolicy,
} from "./authService.js";

import {
  sendPasswordResetOtp,
  getSafeMailError,
} from "./mailService.js";


const PASSWORD_HASH_ROUNDS =
  12;


// ============================================================
// CONFIGURATION
// ============================================================

function getOtpSecret() {
  const secret =
    process.env
      .PASSWORD_RESET_OTP_SECRET;


  if (!secret) {
    throw new Error(
      "PASSWORD_RESET_OTP_SECRET is missing."
    );
  }


  return secret;
}


function getResetTokenSecret() {
  const secret =
    process.env
      .PASSWORD_RESET_TOKEN_SECRET;


  if (!secret) {
    throw new Error(
      "PASSWORD_RESET_TOKEN_SECRET is missing."
    );
  }


  return secret;
}


function getExpiryMinutes() {
  const value =
    Number(
      process.env
        .PASSWORD_RESET_OTP_EXPIRY_MINUTES ||
      10
    );


  return (
    Number.isFinite(value) &&
    value > 0
  )
    ? value
    : 10;
}


function getResendSeconds() {
  const value =
    Number(
      process.env
        .PASSWORD_RESET_OTP_RESEND_SECONDS ||
      60
    );


  return (
    Number.isFinite(value) &&
    value >= 0
  )
    ? value
    : 60;
}


function getMaxAttempts() {
  const value =
    Number(
      process.env
        .PASSWORD_RESET_OTP_MAX_ATTEMPTS ||
      5
    );


  return (
    Number.isInteger(value) &&
    value > 0
  )
    ? value
    : 5;
}


function getResetTokenExpiry() {
  return (
    process.env
      .PASSWORD_RESET_TOKEN_EXPIRES_IN ||
    "10m"
  );
}


// ============================================================
// USER LOOKUP
// ============================================================

async function findUserByIdentifier(
  identifier
) {
  const cleanedIdentifier =
    identifier.trim();


  if (
    cleanedIdentifier.includes("@")
  ) {
    return prisma.user.findUnique({
      where: {
        email:
          cleanedIdentifier
            .toLowerCase(),
      },
    });
  }


  return prisma.user.findUnique({
    where: {
      userId:
        cleanedIdentifier
          .toUpperCase(),
    },
  });
}


// ============================================================
// OTP HELPERS
// ============================================================

function generateOtp() {
  return randomInt(
    100000,
    1000000
  ).toString();
}


function hashOtp({
  userDatabaseId,
  otp,
}) {
  return createHmac(
    "sha256",
    getOtpSecret()
  )
    .update(
      `${userDatabaseId}:${otp}`
    )
    .digest("hex");
}


function otpHashesMatch(
  storedHash,
  submittedHash
) {
  try {
    const storedBuffer =
      Buffer.from(
        storedHash,
        "hex"
      );


    const submittedBuffer =
      Buffer.from(
        submittedHash,
        "hex"
      );


    if (
      storedBuffer.length !==
      submittedBuffer.length
    ) {
      return false;
    }


    return timingSafeEqual(
      storedBuffer,
      submittedBuffer
    );
  } catch {
    return false;
  }
}


// ============================================================
// RESET TOKEN CREATION
// ============================================================

function createPasswordResetToken({
  userDatabaseId,
  otpRecordId,
}) {
  return jwt.sign(
    {
      purpose:
        "password_reset",

      otpId:
        otpRecordId,
    },

    getResetTokenSecret(),

    {
      subject:
        String(
          userDatabaseId
        ),

      expiresIn:
        getResetTokenExpiry(),

      issuer:
        "nexora-waypoint-backend",

      audience:
        "nexora-waypoint-password-reset",
    }
  );
}


// ============================================================
// RESET TOKEN VERIFICATION
// ============================================================

function verifyPasswordResetToken(
  resetToken
) {
  try {
    const decoded =
      jwt.verify(
        resetToken,
        getResetTokenSecret(),
        {
          issuer:
            "nexora-waypoint-backend",

          audience:
            "nexora-waypoint-password-reset",
        }
      );


    if (
      !decoded ||
      typeof decoded !== "object"
    ) {
      return null;
    }


    if (
      decoded.purpose !==
      "password_reset"
    ) {
      return null;
    }


    const userDatabaseId =
      Number(
        decoded.sub
      );


    const otpRecordId =
      Number(
        decoded.otpId
      );


    if (
      !Number.isInteger(
        userDatabaseId
      ) ||
      userDatabaseId <= 0 ||
      !Number.isInteger(
        otpRecordId
      ) ||
      otpRecordId <= 0
    ) {
      return null;
    }


    return {
      userDatabaseId,
      otpRecordId,
    };
  } catch {
    return null;
  }
}


// ============================================================
// REQUEST PASSWORD RESET
// ============================================================

export async function requestPasswordReset({
  identifier,
}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("Password reset email request received");
  }

  const user =
    await findUserByIdentifier(
      identifier
    );


  /*
   * Account enumeration protection.
   *
   * We intentionally return the same response when:
   * - user does not exist
   * - user is inactive
   * - user has no registered email
   */
  if (
    !user ||
    !user.isActive ||
    !user.email
  ) {
    return {
      accepted: true,
    };
  }


  if (process.env.NODE_ENV !== "production") {
    const [local, domain] = user.email.split("@");
    const maskedRecipient = domain && /^[a-zA-Z0-9.-]+$/.test(domain)
      ? `${/^[a-zA-Z0-9]$/.test(local[0]) ? local[0] : "*"}***@${domain}`
      : "[invalid email]";
    console.info(`Recipient resolved: ${maskedRecipient}`);
  }

  // ==========================================================
  // RESEND COOLDOWN
  // ==========================================================

  const latestOtp =
    await prisma
      .passwordResetOtp
      .findFirst({
        where: {
          userId:
            user.id,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });


  if (latestOtp) {
    const elapsedMilliseconds =
      Date.now() -
      latestOtp.createdAt.getTime();


    const cooldownMilliseconds =
      getResendSeconds() *
      1000;


    if (
      elapsedMilliseconds <
      cooldownMilliseconds
    ) {
      return {
        accepted: true,
      };
    }
  }


  // ==========================================================
  // GENERATE OTP
  // ==========================================================

  const otp =
    generateOtp();


  const otpHash =
    hashOtp({
      userDatabaseId:
        user.id,

      otp,
    });


  const expiryMinutes =
    getExpiryMinutes();


  const expiresAt =
    new Date(
      Date.now() +
      expiryMinutes *
        60 *
        1000
    );


  // ==========================================================
  // STORE OTP HASH
  // ==========================================================

  const createdOtp =
    await prisma
      .passwordResetOtp
      .create({
        data: {
          userId:
            user.id,

          otpHash,

          expiresAt,

          attempts:
            0,

          usedAt:
            null,

          resetCompletedAt:
            null,
        },
      });


  try {
    // ========================================================
    // SEND EMAIL
    // ========================================================

    await sendPasswordResetOtp({
      to:
        user.email,

      fullName:
        user.fullName,

      otp,

      expiresInMinutes:
        expiryMinutes,
    });


    // ========================================================
    // INVALIDATE OLDER OTPs
    // ========================================================

    await prisma
      .passwordResetOtp
      .updateMany({
        where: {
          userId:
            user.id,

          id: {
            not:
              createdOtp.id,
          },

          usedAt:
            null,
        },

        data: {
          usedAt:
            new Date(),
        },
      });


    return {
      accepted: true,
    };
  } catch (error) {
    await prisma
      .passwordResetOtp
      .delete({
        where: {
          id:
            createdOtp.id,
        },
      });


    console.error(
      "Password reset email delivery failed:",
      getSafeMailError(error)
    );

    // Keep the response identical for unknown accounts and delivery failures.
    return { accepted: true };
  }
}


// ============================================================
// VERIFY PASSWORD RESET OTP
// ============================================================

export async function verifyPasswordResetOtp({
  identifier,
  otp,
}) {
  const user =
    await findUserByIdentifier(
      identifier
    );


  if (
    !user ||
    !user.isActive ||
    !user.email
  ) {
    return {
      success: false,

      reason:
        "OTP_REJECTED",
    };
  }


  // ==========================================================
  // FIND LATEST UNUSED OTP
  // ==========================================================

  const otpRecord =
    await prisma
      .passwordResetOtp
      .findFirst({
        where: {
          userId:
            user.id,

          usedAt:
            null,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });


  if (!otpRecord) {
    return {
      success: false,

      reason:
        "OTP_REJECTED",
    };
  }


  // ==========================================================
  // EXPIRATION
  // ==========================================================

  if (
    otpRecord.expiresAt.getTime() <=
    Date.now()
  ) {
    await prisma
      .passwordResetOtp
      .update({
        where: {
          id:
            otpRecord.id,
        },

        data: {
          usedAt:
            new Date(),
        },
      });


    return {
      success: false,

      reason:
        "OTP_REJECTED",
    };
  }


  // ==========================================================
  // ATTEMPT LIMIT
  // ==========================================================

  const maxAttempts =
    getMaxAttempts();


  if (
    otpRecord.attempts >=
    maxAttempts
  ) {
    await prisma
      .passwordResetOtp
      .update({
        where: {
          id:
            otpRecord.id,
        },

        data: {
          usedAt:
            new Date(),
        },
      });


    return {
      success: false,

      reason:
        "OTP_REJECTED",
    };
  }


  // ==========================================================
  // HASH SUBMITTED OTP
  // ==========================================================

  const submittedHash =
    hashOtp({
      userDatabaseId:
        user.id,

      otp,
    });


  const matches =
    otpHashesMatch(
      otpRecord.otpHash,
      submittedHash
    );


  // ==========================================================
  // INCORRECT OTP
  // ==========================================================

  if (!matches) {
    const nextAttemptCount =
      otpRecord.attempts +
      1;


    await prisma
      .passwordResetOtp
      .update({
        where: {
          id:
            otpRecord.id,
        },

        data: {
          attempts:
            nextAttemptCount,

          usedAt:
            nextAttemptCount >=
            maxAttempts
              ? new Date()
              : null,
        },
      });


    return {
      success: false,

      reason:
        "OTP_REJECTED",
    };
  }


  // ==========================================================
  // CORRECT OTP
  // ==========================================================

  await prisma
    .passwordResetOtp
    .update({
      where: {
        id:
          otpRecord.id,
      },

      data: {
        usedAt:
          new Date(),
      },
    });


  const resetToken =
    createPasswordResetToken({
      userDatabaseId:
        user.id,

      otpRecordId:
        otpRecord.id,
    });


  console.log(
    `✓ Password reset OTP verified for ${user.userId}`
  );


  return {
    success: true,

    resetToken,
  };
}


// ============================================================
// RESET PASSWORD WITH VERIFIED TOKEN
// ============================================================

export async function resetPasswordWithToken({
  resetToken,
  newPassword,
}) {
  // ==========================================================
  // VERIFY RESET TOKEN
  // ==========================================================

  const resetAuthorization =
    verifyPasswordResetToken(
      resetToken
    );


  if (!resetAuthorization) {
    return {
      success: false,

      reason:
        "INVALID_RESET_TOKEN",
    };
  }


  const {
    userDatabaseId,
    otpRecordId,
  } = resetAuthorization;


  // ==========================================================
  // LOAD OTP AUTHORIZATION
  // ==========================================================

  const otpRecord =
    await prisma
      .passwordResetOtp
      .findUnique({
        where: {
          id:
            otpRecordId,
        },

        include: {
          user:
            true,
        },
      });


  if (
    !otpRecord ||
    otpRecord.userId !==
      userDatabaseId ||
    !otpRecord.usedAt ||
    otpRecord.resetCompletedAt
  ) {
    return {
      success: false,

      reason:
        "INVALID_RESET_TOKEN",
    };
  }


  const user =
    otpRecord.user;


  if (
    !user ||
    !user.isActive
  ) {
    return {
      success: false,

      reason:
        "ACCOUNT_INACTIVE",
    };
  }


  // ==========================================================
  // PASSWORD POLICY
  // ==========================================================

  const passwordPolicy =
    validatePasswordPolicy(
      newPassword
    );


  if (!passwordPolicy.valid) {
    return {
      success: false,

      reason:
        "WEAK_PASSWORD",

      message:
        passwordPolicy.message,
    };
  }


  // ==========================================================
  // PREVENT PASSWORD REUSE
  // ==========================================================

  const sameAsCurrentPassword =
    await bcrypt.compare(
      newPassword,
      user.passwordHash
    );


  if (sameAsCurrentPassword) {
    return {
      success: false,

      reason:
        "PASSWORD_REUSE",
    };
  }


  // ==========================================================
  // HASH NEW PASSWORD
  // ==========================================================

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      PASSWORD_HASH_ROUNDS
    );


  const completedAt =
    new Date();


  // ==========================================================
  // ATOMIC PASSWORD RESET
  // ==========================================================

  try {
    await prisma.$transaction(
      async (transaction) => {
        /*
         * Claim this reset authorization.
         *
         * updateMany is used so a replayed token cannot
         * successfully complete a second reset.
         */
        const claimResult =
          await transaction
            .passwordResetOtp
            .updateMany({
              where: {
                id:
                  otpRecordId,

                userId:
                  userDatabaseId,

                usedAt: {
                  not:
                    null,
                },

                resetCompletedAt:
                  null,
              },

              data: {
                resetCompletedAt:
                  completedAt,
              },
            });


        if (
          claimResult.count !==
          1
        ) {
          throw new Error(
            "RESET_AUTHORIZATION_ALREADY_USED"
          );
        }


        // ----------------------------------------------------
        // CHANGE USER PASSWORD
        // ----------------------------------------------------

        await transaction
          .user
          .update({
            where: {
              id:
                userDatabaseId,
            },

            data: {
              passwordHash,

              mustChangePassword:
                false,
            },
          });


        // ----------------------------------------------------
        // INVALIDATE ANY OTHER ACTIVE OTPs
        // ----------------------------------------------------

        await transaction
          .passwordResetOtp
          .updateMany({
            where: {
              userId:
                userDatabaseId,

              usedAt:
                null,
            },

            data: {
              usedAt:
                completedAt,
            },
          });
      }
    );
  } catch (error) {
    if (
      error.message ===
      "RESET_AUTHORIZATION_ALREADY_USED"
    ) {
      return {
        success: false,

        reason:
          "INVALID_RESET_TOKEN",
      };
    }


    throw error;
  }


  console.log(
    `✓ Password reset completed for ${user.userId}`
  );


  return {
    success: true,
  };
}