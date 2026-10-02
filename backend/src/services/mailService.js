import nodemailer from "nodemailer";


const EMAIL_DELIVERY_MODES = {
  CONSOLE:
    "console",

  SMTP:
    "smtp",
};


// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

function requireEnvironmentVariable(
  name
) {
  const value =
    process.env[name]
      ?.trim();


  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }


  return value;
}


export function getEmailDeliveryMode() {
  const configuredMode =
    process.env
      .EMAIL_DELIVERY_MODE
      ?.trim()
      .toLowerCase();


  const mode =
    configuredMode ||
    (
      process.env.NODE_ENV ===
      "production"
        ? EMAIL_DELIVERY_MODES.SMTP
        : EMAIL_DELIVERY_MODES.CONSOLE
    );


  if (
    !Object.values(
      EMAIL_DELIVERY_MODES
    ).includes(
      mode
    )
  ) {
    throw new Error(
      "EMAIL_DELIVERY_MODE must be either 'console' or 'smtp'."
    );
  }


  if (
    process.env.NODE_ENV ===
      "production" &&
    mode ===
      EMAIL_DELIVERY_MODES.CONSOLE
  ) {
    throw new Error(
      "Console email delivery is disabled in production."
    );
  }


  return mode;
}


// ============================================================
// SMTP TRANSPORT
// ============================================================

function createMailTransporter() {
  const host =
    requireEnvironmentVariable(
      "SMTP_HOST"
    );

  const port =
    Number(
      requireEnvironmentVariable(
        "SMTP_PORT"
      )
    );

  const secure =
    String(
      process.env.SMTP_SECURE
    ).toLowerCase() ===
    "true";

  const user =
    requireEnvironmentVariable(
      "SMTP_USER"
    );

  const password =
    requireEnvironmentVariable(
      "SMTP_PASSWORD"
    );


  if (
    !Number.isInteger(port) ||
    port <= 0
  ) {
    throw new Error(
      "SMTP_PORT must be a valid port number."
    );
  }


  return nodemailer.createTransport({
    host,
    port,
    secure,

    auth: {
      user,

      pass:
        password,
    },
  });
}


// ============================================================
// VERIFY EMAIL DELIVERY
// ============================================================

export async function verifyMailConnection() {
  const mode =
    getEmailDeliveryMode();


  if (
    mode ===
    EMAIL_DELIVERY_MODES.CONSOLE
  ) {
    return {
      mode,
    };
  }


  const transporter =
    createMailTransporter();


  await transporter.verify();


  return {
    mode,
  };
}


// ============================================================
// DEVELOPMENT CONSOLE DELIVERY
// ============================================================

function writeOtpToDevelopmentConsole({
  to,
  fullName,
  otp,
  expiresInMinutes,
}) {
  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    " Waypoint Demo Password Reset Email"
  );
  console.log(
    "=========================================="
  );
  console.log(
    `To       : ${to}`
  );
  console.log(
    `Name     : ${fullName}`
  );
  console.log(
    `OTP      : ${otp}`
  );
  console.log(
    `Expires  : ${expiresInMinutes} minute(s)`
  );
  console.log(
    "Mode     : console (no external email sent)"
  );
  console.log(
    "=========================================="
  );
  console.log("");
}


// ============================================================
// SEND PASSWORD RESET OTP
// ============================================================

export async function sendPasswordResetOtp({
  to,
  fullName,
  otp,
  expiresInMinutes,
}) {
  const mode =
    getEmailDeliveryMode();


  if (
    mode ===
    EMAIL_DELIVERY_MODES.CONSOLE
  ) {
    writeOtpToDevelopmentConsole({
      to,
      fullName,
      otp,
      expiresInMinutes,
    });


    return {
      messageId:
        `console-${Date.now()}`,

      mode,
    };
  }


  const transporter =
    createMailTransporter();

  const sender =
    process.env.SMTP_FROM?.trim() ||
    requireEnvironmentVariable(
      "SMTP_USER"
    );


  const result =
    await transporter.sendMail({
      from:
        sender,

      to,

      subject:
        "Waypoint password reset verification code",

      text: `
Hello ${fullName},

We received a request to reset your Waypoint Delivery Operations password.

Your verification code is:

${otp}

This code expires in ${expiresInMinutes} minutes.

If you did not request this password reset, you can ignore this email.

Waypoint Delivery Operations
      `.trim(),

      html: `
        <div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#12241d;">
          <h2 style="color:#0f6b4f;">
            Waypoint Delivery Operations
          </h2>

          <p>Hello ${fullName},</p>

          <p>
            We received a request to reset your Waypoint password.
          </p>

          <p>
            Use this verification code:
          </p>

          <div
            style="
              margin:24px 0;
              padding:20px;
              border-radius:12px;
              background:#effaf4;
              text-align:center;
              font-size:30px;
              font-weight:700;
              letter-spacing:8px;
              color:#0f6b4f;
            "
          >
            ${otp}
          </div>

          <p>
            This code expires in
            <strong>${expiresInMinutes} minutes</strong>.
          </p>

          <p style="color:#66756e;">
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

          <p>
            Waypoint Delivery Operations
          </p>
        </div>
      `,
    });


  return {
    messageId:
      result.messageId,

    mode,
  };
}
