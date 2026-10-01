import {
  createHmac,
  randomInt,
} from "node:crypto";

import prisma from "../config/database.js";

import {
  sendPasswordResetOtp,
} from "./mailService.js";


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


// ============================================================
// REQUEST PASSWORD RESET
// ============================================================

export async function requestPasswordReset({
  identifier,
}) {
  const user =
    await findUserByIdentifier(
      identifier
    );


  /*
   * Account-enumeration protection:
   *
   * Always behave like the request was accepted.
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
    // INVALIDATE OLDER UNUSED OTPs
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


    console.log(
      `✓ Password reset email sent for ${user.userId}`
    );


    return {
      accepted: true,
    };
  } catch (error) {
    /*
     * Email failed, so delete the OTP that
     * the user never received.
     */

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
      error.message
    );


    throw new Error(
      "Password reset email could not be sent."
    );
  }
}