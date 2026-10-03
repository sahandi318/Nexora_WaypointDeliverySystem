import nodemailer from "nodemailer";


// SMTP is the only delivery path. Never emit recovery codes to logs.
function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.code = "EMAIL_CONFIGURATION";
    error.variable = name;
    throw error;
  }
  return value;
}

export function getEmailDeliveryMode() {
  const mode = process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() || "smtp";
  if (mode !== "smtp") {
    const error = new Error("EMAIL_DELIVERY_MODE must be 'smtp'. Console delivery is disabled.");
    error.code = "EMAIL_CONFIGURATION";
    error.variable = "EMAIL_DELIVERY_MODE";
    throw error;
  }
  return mode;
}

// Only allow known diagnostic fields; provider messages can contain private data.
export function getSafeMailError(error) {
  const knownCodes = ["EMAIL_CONFIGURATION", "EAUTH", "ECONNECTION", "ETIMEDOUT",
    "EDNS", "ESOCKET", "ETLS", "EENVELOPE", "EMESSAGE", "SMTP_NOT_ACCEPTED"];
  const code = knownCodes.includes(error?.code) ? error.code : "EMAIL_DELIVERY_FAILED";
  const variables = ["EMAIL_DELIVERY_MODE", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE",
    "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  return {
    code,
    ...(variables.includes(error?.variable) ? { variable: error.variable } : {}),
    ...(Number.isInteger(error?.responseCode) ? { responseCode: error.responseCode } : {}),
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
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
    port <= 0 ||
    port > 65535
  ) {
    throw new Error(
      "SMTP_PORT must be a valid port number."
    );
  }


  return nodemailer.createTransport({
    host,
    port,
    secure,

    requireTLS: !secure,
    logger: false,
    debug: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,

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


  const transporter =
    createMailTransporter();


  await transporter.verify();


  return {
    mode,
  };
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

          <p>Hello ${escapeHtml(fullName)},</p>

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


  if (!result.accepted?.some((address) =>
    String(address).toLowerCase() === to.toLowerCase()
  )) {
    const error = new Error("SMTP did not accept the password reset recipient.");
    error.code = "SMTP_NOT_ACCEPTED";
    throw error;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("Password reset email accepted by SMTP");
  }


  return {
    messageId:
      result.messageId,

    mode,
  };
}
