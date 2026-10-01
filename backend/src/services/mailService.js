import nodemailer from "nodemailer";


// ============================================================
// ENVIRONMENT HELPERS
// ============================================================

function requireEnvironmentVariable(
  name
) {
  const value =
    process.env[name];


  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }


  return value;
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
// VERIFY SMTP
// ============================================================

export async function verifyMailConnection() {
  const transporter =
    createMailTransporter();


  await transporter.verify();
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
  const transporter =
    createMailTransporter();

  const sender =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;


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
  };
}