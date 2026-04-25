import nodemailer from "nodemailer";
import { env, hasSmtp } from "./env.js";
import { logger } from "./logger.js";

let transporter = null;

if (hasSmtp) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: (env.SMTP_PORT || 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.warn(
      { to, subject, text },
      "SMTP not configured — email logged instead of sent. Set SMTP_HOST/USER/PASS to enable real delivery."
    );
    return { skipped: true };
  }
  return transporter.sendMail({
    from: env.SMTP_FROM || `${env.APP_NAME} <no-reply@${(env.SMTP_HOST || "localhost").replace(/^smtp\./, "")}>`,
    to,
    subject,
    text,
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = `${env.APP_NAME} — reset your password`;
  const text =
    `You requested a password reset for ${env.APP_NAME}.\n\n` +
    `Open this link within 1 hour to set a new password:\n${resetUrl}\n\n` +
    `If you didn't request this, ignore this email.`;
  const html = `
    <p>You requested a password reset for <strong>${env.APP_NAME}</strong>.</p>
    <p>Open this link within 1 hour to set a new password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p style="color:#888">If you didn't request this, ignore this email.</p>
  `;
  return sendMail({ to, subject, text, html });
};
