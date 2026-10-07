import fs from 'fs';
import path from 'path';
import nodemailer, { type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { accountCreatedEmail, accountCreatedUrls, partnerCredentialsEmail, passwordResetEmail, type AccountCreatedEmailData } from './mail.templates';

let transporter: Transporter | null = null;

/** Created lazily so env vars are read after dotenv.config() has run. */
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/** backend/assets/email/logo.png. Same relative path from src/services and dist/services. */
const LOGO_PATH = path.resolve(__dirname, '../../assets/email/logo.png');
const LOGO_CID = 'homecarex-logo';

/**
 * Logo for the email header. MAIL_LOGO_URL (a public https image) wins if set;
 * otherwise the PNG is attached inline (cid:) so it shows without any hosting.
 */
function logo(): { src?: string; attachments: Mail.Attachment[] } {
  const url = process.env.MAIL_LOGO_URL;
  if (url) return { src: url, attachments: [] };
  if (fs.existsSync(LOGO_PATH)) {
    return { src: `cid:${LOGO_CID}`, attachments: [{ filename: 'homecarex-logo.png', path: LOGO_PATH, cid: LOGO_CID }] };
  }
  return { attachments: [] }; // falls back to a text wordmark
}

export const mailService = {
  async sendAccountCreatedEmail(data: Omit<AccountCreatedEmailData, 'loginUrl' | 'profileUrl' | 'logoSrc' | 'supportEmail'>) {
    const frontendUrl = process.env.FRONTEND_URL
      || (process.env.APP_LOGIN_URL ? new URL(process.env.APP_LOGIN_URL).origin : 'http://localhost:3000');
    const urls = accountCreatedUrls(data.role, frontendUrl);
    const { src, attachments } = logo();
    const { subject, html, text } = accountCreatedEmail({
      ...data,
      ...urls,
      logoSrc: src,
      supportEmail: process.env.SUPPORT_EMAIL,
    });

    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: data.email,
      subject,
      text,
      html,
      attachments,
    });
  },

  async sendPartnerCredentials(to: { name: string; email: string; designation: string }, password: string) {
    const { src, attachments } = logo();
    const { subject, html, text } = partnerCredentialsEmail({
      ...to,
      password,
      loginUrl: process.env.APP_LOGIN_URL || 'http://localhost:5173/login',
      logoSrc: src,
      supportEmail: process.env.SUPPORT_EMAIL,
    });

    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: to.email,
      subject,
      text,
      html,
      attachments,
    });
  },

  async sendPasswordResetEmail(data: { name: string; email: string; resetUrl: string }) {
    const { src, attachments } = logo();
    const { subject, html, text } = passwordResetEmail({
      ...data,
      logoSrc: src,
      supportEmail: process.env.SUPPORT_EMAIL,
    });

    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: data.email,
      subject,
      text,
      html,
      attachments,
    });
  },
};

export default mailService;
