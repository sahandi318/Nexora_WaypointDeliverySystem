import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import request from "supertest";
import prisma from "../config/database.js";
import app from "../app.js";
import { getEmailDeliveryMode, getSafeMailError } from "../services/mailService.js";

// Isolated in-memory persistence and SMTP boundary: no real mail or database writes.
const logs = [];
const originalConsole = { log: console.log, info: console.info, error: console.error };
for (const key of Object.keys(originalConsole)) {
  console[key] = (...values) => logs.push(JSON.stringify(values));
}
const originalTransport = nodemailer.createTransport;
const originals = [];
function replace(target, key, value) {
  originals.push(() => { target[key] = value; });
  target[key] = value;
}
const originalEnvironment = { ...process.env };
Object.assign(process.env, {
  NODE_ENV: "test", SMTP_HOST: "smtp.example.test", SMTP_PORT: "587",
  SMTP_SECURE: "false", SMTP_USER: "sender@example.test",
  SMTP_PASSWORD: randomBytes(32).toString("hex"),
  PASSWORD_RESET_OTP_SECRET: randomBytes(32).toString("hex"),
  PASSWORD_RESET_TOKEN_SECRET: randomBytes(32).toString("hex"),
  PASSWORD_RESET_OTP_EXPIRY_MINUTES: "10", PASSWORD_RESET_OTP_RESEND_SECONDS: "60",
  PASSWORD_RESET_OTP_MAX_ATTEMPTS: "5", PASSWORD_RESET_TOKEN_EXPIRES_IN: "10m",
});
delete process.env.EMAIL_DELIVERY_MODE;

const initialPassword = `Aa1!${randomBytes(20).toString("hex")}`;
const nextPassword = `Bb2!${randomBytes(20).toString("hex")}`;
const user = { id: 1, userId: "SM001", email: "manager@example.test",
  fullName: "Test <Manager>", isActive: true, role: "STORE_MANAGER",
  passwordHash: await bcrypt.hash(initialPassword, 4) };
let records = [];
let sent = [];
let smtpFailure = false;
let smtpRejected = false;
let nextId = 1;
const secretValues = [initialPassword, nextPassword, process.env.SMTP_PASSWORD,
  process.env.PASSWORD_RESET_OTP_SECRET, process.env.PASSWORD_RESET_TOKEN_SECRET];
const matches = (record, where) => Object.entries(where).every(([key, value]) =>
  value && typeof value === "object" && "not" in value
    ? record[key] !== value.not : record[key] === value);
replace(prisma.user, "findUnique", async ({ where }) =>
  where.userId === user.userId || where.email === user.email || where.id === user.id ? user : null);
replace(prisma.user, "update", async ({ data }) => Object.assign(user, data));
replace(prisma.passwordResetOtp, "findFirst", async ({ where }) =>
  records.filter((record) => matches(record, where)).sort((a, b) => b.id - a.id)[0] || null);
replace(prisma.passwordResetOtp, "findUnique", async ({ where }) => {
  const record = records.find((item) => item.id === where.id);
  return record ? { ...record, user } : null;
});
replace(prisma.passwordResetOtp, "create", async ({ data }) => {
  const record = { ...data, id: nextId++, createdAt: new Date() };
  records.push(record);
  return record;
});
replace(prisma.passwordResetOtp, "update", async ({ where, data }) =>
  Object.assign(records.find((record) => record.id === where.id), data));
replace(prisma.passwordResetOtp, "updateMany", async ({ where, data }) => {
  const selected = records.filter((record) => matches(record, where));
  selected.forEach((record) => Object.assign(record, data));
  return { count: selected.length };
});
replace(prisma.passwordResetOtp, "delete", async ({ where }) => {
  records = records.filter((record) => record.id !== where.id);
});
replace(prisma, "$transaction", async (callback) => callback(prisma));
nodemailer.createTransport = (options) => {
  assert.ok(options.requireTLS && !options.logger && !options.debug);
  return { sendMail: async (message) => {
    if (smtpFailure) {
      throw Object.assign(new Error(`Private provider data ${process.env.SMTP_PASSWORD}`),
        { code: "EAUTH", responseCode: 535 });
    }
    if (smtpRejected) return { accepted: [] };
    sent.push(message);
    return { accepted: [message.to], messageId: "test-message" };
  } };
};
const post = (path, body) => request(app).post(`/api/auth/${path}`).send(body);
const send = (identifier = "SM001") => post("forgot-password", { identifier });
const code = () => {
  const value = sent.at(-1).text.match(/\b\d{6}\b/)?.[0];
  assert.ok(value && /^\d{6}$/.test(value), "Six-digit code missing from email");
  secretValues.push(value);
  return value;
};
const verify = (otp) => post("verify-reset-otp", { identifier: "SM001", otp });
const reset = (resetToken, password = nextPassword) => post("reset-password",
  { resetToken, newPassword: password, confirmPassword: password });
const releaseCooldown = () => { records.forEach((record) => { record.createdAt = new Date(Date.now() - 61000); }); };

try {
  assert.equal(getEmailDeliveryMode(), "smtp");
  process.env.EMAIL_DELIVERY_MODE = "console";
  assert.throws(getEmailDeliveryMode);
  delete process.env.EMAIL_DELIVERY_MODE;
  const accepted = await send(" sm001 ");
  assert.equal(accepted.status, 200);
  const otp = code();
  assert.ok(!JSON.stringify(accepted.body).includes(otp));
  assert.ok(records[0].otpHash.length === 64 && records[0].otpHash !== otp);
  assert.ok(Math.abs(records[0].expiresAt - Date.now() - 600000) < 5000);
  assert.equal(sent[0].to, user.email);
  assert.ok(sent[0].html.includes("Test &lt;Manager&gt;"));
  assert.deepEqual((await send("unknown-account")).body, accepted.body);
  user.isActive = false;
  assert.deepEqual((await send()).body, accepted.body);
  user.isActive = true;
  const email = user.email;
  user.email = null;
  assert.deepEqual((await send()).body, accepted.body);
  user.email = email;
  await send(user.email.toUpperCase());
  assert.equal(sent.length, 1, "Cooldown must suppress a second email");
  assert.equal((await verify("123")).status, 400);
  assert.equal((await verify(otp === "100000" ? "100001" : "100000")).status, 400);
  assert.equal(records[0].attempts, 1);
  const verified = await verify(otp);
  assert.equal(verified.status, 200);
  const token = verified.body.resetToken;
  secretValues.push(token);
  assert.equal((await verify(otp)).status, 400);
  assert.equal((await reset(token, "weak")).status, 400);
  assert.equal((await reset(token, initialPassword)).status, 400);
  assert.equal((await reset(token)).status, 200);
  assert.ok(await bcrypt.compare(nextPassword, user.passwordHash));
  assert.ok(records[0].resetCompletedAt);
  assert.equal((await reset(token)).status, 401);
  assert.equal((await reset("invalid-token")).status, 401);
  assert.equal((await post("login", { identifier: "SM001", password: nextPassword })).status, 200);

  releaseCooldown();
  await send();
  const expiredCode = code();
  records.at(-1).expiresAt = new Date(Date.now() - 1);
  assert.equal((await verify(expiredCode)).status, 400);
  releaseCooldown();
  await send();
  const limitedCode = code();
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await verify(limitedCode === "100000" ? "100001" : "100000")).status, 400);
  }
  assert.equal(records.at(-1).attempts, 5);
  assert.equal((await verify(limitedCode)).status, 400);
  releaseCooldown();
  await send();
  const oldRecord = records.at(-1);
  releaseCooldown();
  await send();
  assert.ok(oldRecord.usedAt, "Resend must invalidate older OTPs");

  releaseCooldown();
  const count = records.length;
  smtpFailure = true;
  assert.deepEqual((await send()).body, accepted.body);
  assert.equal(records.length, count, "Failed delivery must remove the new OTP");
  smtpFailure = false;
  smtpRejected = true;
  assert.deepEqual((await send()).body, accepted.body);
  assert.equal(records.length, count);
  smtpRejected = false;
  const savedPassword = process.env.SMTP_PASSWORD;
  delete process.env.SMTP_PASSWORD;
  assert.deepEqual((await send()).body, accepted.body);
  assert.ok(logs.some((line) => line.includes("SMTP_PASSWORD") && line.includes("EMAIL_CONFIGURATION")));
  process.env.SMTP_PASSWORD = savedPassword;
  assert.deepEqual(getSafeMailError({ message: savedPassword, code: savedPassword }), { code: "EMAIL_DELIVERY_FAILED" });
  assert.ok(logs.some((line) => line.includes("EAUTH")));
  assert.ok(secretValues.every((value) => !logs.join("\n").includes(value)), "Sensitive value leaked into logs");
  originalConsole.log("PASS: recovery HTTP flow, SMTP routing/failures, HMAC, expiry, cooldown, attempts, token replay, password policy, bcrypt/login, safe logs.");
} catch {
  // Assertion details may contain generated OTPs or tokens; never print them.
  originalConsole.error("FAIL: password reset regression check (sensitive assertion details suppressed).");
  process.exitCode = 1;
} finally {
  originals.reverse().forEach((restore) => restore());
  nodemailer.createTransport = originalTransport;
  Object.assign(console, originalConsole);
  for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
  Object.assign(process.env, originalEnvironment);
  await prisma.$disconnect();
}
