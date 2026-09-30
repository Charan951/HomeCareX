import nodemailer, { type Transporter } from 'nodemailer';

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

export const mailService = {
  async sendPartnerCredentials(to: { name: string; email: string; designation: string }, password: string) {
    const loginUrl = process.env.APP_LOGIN_URL || 'http://localhost:5173/login';
    const name = escapeHtml(to.name);

    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: to.email,
      subject: 'Your HomeCareX partner account',
      text:
        `Hi ${to.name},\n\nYour HomeCareX partner account (${to.designation}) is ready.\n\n` +
        `Login: ${loginUrl}\nEmail: ${to.email}\nPassword: ${password}\n\n` +
        `Please change your password after your first login.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px">
          <h2 style="color:#4338ca">Welcome to HomeCareX, ${name}!</h2>
          <p>Your partner account (<b>${escapeHtml(to.designation)}</b>) is ready.</p>
          <table style="border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0"><b>Email</b></td><td>${escapeHtml(to.email)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0"><b>Password</b></td><td>${escapeHtml(password)}</td></tr>
          </table>
          <p><a href="${loginUrl}" style="background:#4338ca;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Log in</a></p>
          <p style="color:#64748b;font-size:13px">Please change your password after your first login.</p>
        </div>`,
    });
  },
};

export default mailService;
