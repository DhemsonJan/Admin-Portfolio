import nodemailer from 'nodemailer';
import config from '../config/env.js';

/**
 * Outbound contact-form email delivery.
 *
 * Deliberately small: compose a plain-text + simple-HTML message and hand it to
 * SMTP. Gmail is the supported account type (the app password goes in
 * SMTP_USER / SMTP_PASS). When mail is disabled the route still stores the
 * message and sending is skipped silently, so a deployment without credentials
 * keeps working.
 */

let transport = null;

function getTransport() {
  if (!config.mail.enabled) return null;
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });
  return transport;
}

function htmlMessage({ name, email, message }) {
  const line = (label, value) =>
    `<tr><td style="padding:6px 0;color:#9aa5b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;width:110px">${label}</td><td style="padding:6px 0;color:#e9edf7;font-size:14px">${value}</td></tr>`;
  return `<!doctype html>
<html>
  <body style="margin:0;background:#080b14;padding:40px 20px;font-family:Segoe UI,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#0b1020;border:1px solid #1e2737;border-radius:14px;overflow:hidden">
      <div style="background:linear-gradient(115deg,#67e8f9,#60a5fa 46%,#818cf8);padding:18px 24px">
        <h1 style="margin:0;color:#06080f;font-size:17px;letter-spacing:.01em">New message from your portfolio</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;padding:0 24px;margin-top:8px">
        ${line('Name', name)}
        ${line('Email', email)}
      </table>
      <div style="margin:14px 24px 24px;padding:16px 18px;background:#0d1526;border:1px solid #1e2737;border-radius:10px;color:#dde4f2;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</div>
    </div>
  </body>
</html>`;
}

/**
 * Send a contact message to the configured inbox.
 * Resolves true when queued successfully, false when disabled or failed.
 */
export async function sendContactEmail({ name, email, message }) {
  const smtp = getTransport();
  if (!smtp) return false;

  try {
    await smtp.sendMail({
      from: config.mail.from || config.mail.user,
      to: config.mail.to,
      replyTo: email,
      subject: `Portfolio contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: htmlMessage({ name, email, message }),
    });
    return true;
  } catch (error) {
    console.error('[mailer] sending contact email failed:', error.message);
    return false;
  }
}

export default { sendContactEmail };