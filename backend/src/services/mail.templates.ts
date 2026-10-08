import type { UserRole } from '../models/User';

/**
 * HTML + plain-text email templates. Layout uses nested tables and inline styles only,
 * because Outlook/Gmail strip <style> blocks and ignore flexbox/grid.
 */

export const BRAND = {
  name: 'HomeCareX',
  indigo: '#4338ca',
  indigoDark: '#312e81',
  orange: '#ff8a3d',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  page: '#f8fafc',
} as const;

export const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

interface LayoutOptions {
  /** Hidden inbox preview line. */
  preheader: string;
  /** `cid:...` for an attached logo, or an https URL. Omit to show the brand name as text. */
  logoSrc?: string;
  bodyHtml: string;
  footerNote: string;
  supportEmail?: string;
}

function layout({ preheader, logoSrc, bodyHtml, footerNote, supportEmail }: LayoutOptions): string {
  const logo = logoSrc
    ? `<img src="${esc(logoSrc)}" width="180" alt="${BRAND.name}" style="display:block;margin:0 auto;border:0;outline:none;height:auto;max-width:180px" />`
    : `<span style="font:800 26px ${FONT};color:${BRAND.indigo}">Home<span style="color:${BRAND.orange}">CareX</span></span>`;
  const support = supportEmail
    ? `Have questions or need assistance? Reach out anytime at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.indigo};text-decoration:none;font-weight:600">${esc(supportEmail)}</a>.<br />`
    : `We're here for you whenever you need a helping hand.<br />`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${BRAND.name}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8199;&zwnj;&#8199;&zwnj;&#8199;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page}">
  <tr><td align="center" style="padding:36px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};box-shadow:0 4px 16px rgba(0,0,0,0.04)">
      <tr><td style="height:5px;line-height:5px;font-size:0;background:${BRAND.indigo};border-bottom:3px solid ${BRAND.orange}">&nbsp;</td></tr>
      <tr><td align="center" style="padding:32px 32px 10px">${logo}</td></tr>
      <tr><td style="padding:10px 40px 36px;font-family:${FONT};color:${BRAND.text};font-size:15px;line-height:1.7">${bodyHtml}</td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid ${BRAND.border};padding:24px 40px;font-family:${FONT};font-size:12px;line-height:1.7;color:${BRAND.muted};text-align:center">
        ${support}${esc(footerNote)}<br />
        &copy; ${new Date().getFullYear()} ${BRAND.name}. Dedicated to exceptional home services.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 10px">
  <tr><td align="center" bgcolor="${BRAND.indigo}" style="border-radius:10px;box-shadow:0 2px 8px rgba(67,56,202,0.25)">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 34px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:10px;background:${BRAND.indigo}">${esc(label)} &rarr;</a>
  </td></tr>
</table>`;

const row = (label: string, valueHtml: string, last = false) => `
<tr>
  <td style="padding:12px 18px;${last ? '' : `border-bottom:1px solid ${BRAND.border};`}font:600 12px ${FONT};letter-spacing:.05em;text-transform:uppercase;color:${BRAND.muted};width:130px;vertical-align:middle">${label}</td>
  <td style="padding:12px 18px;${last ? '' : `border-bottom:1px solid ${BRAND.border};`}font:15px ${FONT};color:${BRAND.text};vertical-align:middle">${valueHtml}</td>
</tr>`;

export interface PartnerCredentialsData {
  name: string;
  email: string;
  designation: string;
  password: string;
  loginUrl: string;
  logoSrc?: string;
  supportEmail?: string;
}

export interface AccountCreatedEmailData {
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  loginUrl: string;
  profileUrl: string;
  logoSrc?: string;
  supportEmail?: string;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  customer: 'Customer',
  partner: 'Partner',
};

const PROFILE_PATHS: Record<UserRole, string> = {
  admin: '/admin/profile',
  customer: '/customer/profile',
  partner: '/partner/profile',
};

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role];
}

export function getProfilePath(role: UserRole): string {
  return PROFILE_PATHS[role];
}

export function accountCreatedUrls(role: UserRole, frontendUrl: string) {
  const baseUrl = frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`;
  return {
    loginUrl: new URL('login', baseUrl).toString(),
    profileUrl: new URL(getProfilePath(role).slice(1), baseUrl).toString(),
  };
}

export function accountCreatedEmail(d: AccountCreatedEmailData) {
  const role = getRoleDisplayName(d.role);
  const createdAt = d.createdAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const bodyHtml = `
<h1 style="margin:8px 0 6px;font:700 24px ${FONT};color:${BRAND.indigoDark};text-align:center">Welcome to the HomeCareX family!</h1>
<p style="margin:0 0 22px;text-align:center;color:${BRAND.muted}">Your home deserves exceptional care — and we're so glad you're here.</p>

<p style="margin:0 0 16px">Hi ${esc(d.name)},</p>
<p style="margin:0 0 18px">Taking care of your home should bring peace of mind, not hassle. Whether it is deep home cleaning, electrical or plumbing work, or routine maintenance, you are now connected with verified specialists who treat your space with genuine pride and respect.</p>
<p style="margin:0 0 20px">Here is a quick summary of your account details for your reference:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;background:#f8fafc;margin-bottom:20px">
  ${row('Name', esc(d.name))}
  ${row('Email', esc(d.email))}
  ${row('Role', esc(role))}
  ${row('Account created', esc(createdAt), true)}
</table>

${button(d.loginUrl, 'Explore & Book Services')}
<p style="margin:0 0 22px;text-align:center;font-size:12px;color:${BRAND.muted}">Button not working? Copy this link directly into your browser:<br /><a href="${esc(d.loginUrl)}" style="color:${BRAND.indigo};word-break:break-all">${esc(d.loginUrl)}</a></p>

<p style="margin:0 0 8px;text-align:center">Feel free to review and customize your profile so we can tailor every visit to your needs:</p>
${button(d.profileUrl, 'View My Profile')}
<p style="margin:0 0 24px;text-align:center;font-size:12px;color:${BRAND.muted}">Profile link: <a href="${esc(d.profileUrl)}" style="color:${BRAND.indigo};word-break:break-all">${esc(d.profileUrl)}</a></p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border-left:4px solid ${BRAND.orange};border-radius:6px">
  <tr><td style="padding:14px 18px;font:14px/1.6 ${FONT};color:#7c2d12">
    <strong>Need peace of mind?</strong> If you did not create this account, please let our friendly support team know right away and we will secure your email immediately.
  </td></tr>
</table>

<p style="margin:26px 0 0">Warmly,<br /><strong>The ${BRAND.name} Team</strong></p>`;

  const html = layout({
    preheader: `Welcome to ${BRAND.name}! Your home care journey starts here.`,
    logoSrc: d.logoSrc,
    bodyHtml,
    footerNote: `You are receiving this email because an account was created using ${d.email}.`,
    supportEmail: d.supportEmail,
  });

  const text = [
    `Hi ${d.name},`,
    '',
    `Welcome to the ${BRAND.name} family!`,
    '',
    'Your home deserves exceptional care — and we are so glad you are here.',
    'Taking care of your home should bring peace of mind, not hassle.',
    'Whether it is deep cleaning, electrical or plumbing repairs, or regular maintenance,',
    'you are now connected with verified specialists who treat your space with genuine care.',
    '',
    'Your account details:',
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    `Role: ${role}`,
    `Account created: ${createdAt}`,
    '',
    `Explore & Book Services: ${d.loginUrl}`,
    `View Your Profile: ${d.profileUrl}`,
    '',
    `If you did not create this account, please contact ${BRAND.name} support immediately.`,
    '',
    'Warmly,',
    `The ${BRAND.name} Team`,
  ].join('\n');

  return { subject: 'Welcome to HomeCareX — Your account has been created', html, text };
}

export function partnerCredentialsEmail(d: PartnerCredentialsData) {
  const firstName = d.name.trim().split(/\s+/)[0] || d.name;

  const bodyHtml = `
<h1 style="margin:8px 0 6px;font:700 24px ${FONT};color:${BRAND.indigoDark};text-align:center">Welcome to the partner team, ${esc(firstName)}!</h1>
<p style="margin:0 0 22px;text-align:center;color:${BRAND.muted}">We're thrilled to have a skilled professional like you representing ${BRAND.name}.</p>

<p style="margin:0 0 16px">Hi ${esc(d.name)},</p>
<p style="margin:0 0 18px">Homeowners choose ${BRAND.name} because of trusted, expert partners who take genuine pride in their craft. You have been registered as a <strong style="color:${BRAND.indigo}">${esc(d.designation)}</strong> on our verified partner network.</p>
<p style="margin:0 0 20px">Here are your temporary sign-in details to access your partner portal and start receiving job requests:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;background:#f8fafc;margin-bottom:20px">
  ${row('Login email', `<span style="color:${BRAND.text}">${esc(d.email)}</span>`)}
  ${row('Temporary password', `<span style="display:inline-block;padding:5px 12px;background:#ffffff;border:1px dashed ${BRAND.indigo};border-radius:6px;font:600 15px 'Courier New',Courier,monospace;letter-spacing:.04em;color:${BRAND.indigoDark}">${esc(d.password)}</span>`)}
  ${row('Role', esc(d.designation), true)}
</table>

${button(d.loginUrl, 'Sign In to Partner Portal')}
<p style="margin:0 0 24px;text-align:center;font-size:12px;color:${BRAND.muted}">Direct portal link:<br /><a href="${esc(d.loginUrl)}" style="color:${BRAND.indigo};word-break:break-all">${esc(d.loginUrl)}</a></p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border-left:4px solid ${BRAND.orange};border-radius:6px;margin-bottom:24px">
  <tr><td style="padding:14px 18px;font:14px/1.6 ${FONT};color:#7c2d12">
    <strong>Security reminder:</strong> Please change your temporary password immediately upon your first sign-in. For your protection, never share this password with anyone — our staff will never ask for your password.
  </td></tr>
</table>

<p style="margin:0 0 10px;font-weight:700;color:${BRAND.indigoDark}">Quick steps to get you ready for your first booking:</p>
<ol style="margin:0 0 24px;padding-left:20px;color:${BRAND.text};line-height:1.75">
  <li style="margin-bottom:6px">Sign in and set your personal, permanent password.</li>
  <li style="margin-bottom:6px">Review your profile details and upload any required verification documents.</li>
  <li>Set your service areas and availability to start receiving customer bookings.</li>
</ol>

<p style="margin:26px 0 0">We're fully invested in your success and look forward to doing great work together.<br /><br />Proud to partner with you,<br /><strong>The ${BRAND.name} Team</strong></p>`;

  const html = layout({
    preheader: `Welcome to the ${BRAND.name} Partner Community! Your workspace is ready.`,
    logoSrc: d.logoSrc,
    bodyHtml,
    footerNote: `You are receiving this email because a ${BRAND.name} partner account was created for ${d.email}. If this was unexpected, please reach out to us.`,
    supportEmail: d.supportEmail,
  });

  const text = [
    `Welcome to ${BRAND.name}, ${d.name}!`,
    '',
    `We are thrilled to welcome you as a ${d.designation} on our partner platform.`,
    'Homeowners trust us because of skilled, dependable partners who take real pride in their craft.',
    '',
    'Your sign-in details:',
    `Portal:   ${d.loginUrl}`,
    `Email:    ${d.email}`,
    `Password: ${d.password}`,
    '',
    'Important: Please change your password immediately after your first sign-in.',
    'Our team will never ask for your password.',
    '',
    'Next steps:',
    '1. Sign in and set your personal password.',
    '2. Complete your profile and verification documents.',
    '3. Set your service areas and availability to start receiving jobs.',
    '',
    'Proud to partner with you,',
    `The ${BRAND.name} Team`,
  ].join('\n');

  return { subject: `Welcome to ${BRAND.name}: your partner account is ready`, html, text };
}

export interface PasswordResetEmailData {
  name: string;
  email: string;
  resetUrl: string;
  logoSrc?: string;
  supportEmail?: string;
}

export function passwordResetEmail(d: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const firstName = d.name.trim().split(/\s+/)[0] || d.name;

  const bodyHtml = `
<h1 style="margin:8px 0 6px;font:700 24px ${FONT};color:${BRAND.indigoDark};text-align:center">Let's get you back in</h1>
<p style="margin:0 0 22px;text-align:center;color:${BRAND.muted}">Reset your password and regain access to your account.</p>

<p style="margin:0 0 16px">Hi ${esc(firstName)},</p>
<p style="margin:0 0 16px">We received a request to reset the password for your ${BRAND.name} account. No worries at all — it happens to the best of us!</p>
<p style="margin:0 0 20px">Simply tap the button below to choose a fresh, secure password:</p>

${button(d.resetUrl, 'Reset My Password')}

<p style="margin:20px 0 22px;text-align:center;font-size:12px;color:${BRAND.muted}">Button not working? Copy and paste this link into your browser:<br /><a href="${esc(d.resetUrl)}" style="color:${BRAND.indigo};word-break:break-all">${esc(d.resetUrl)}</a></p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid ${BRAND.border};border-radius:10px;margin-bottom:20px">
  <tr><td style="padding:16px 20px;font:13px/1.7 ${FONT};color:${BRAND.muted}">
    <strong style="color:${BRAND.text}">A quick note on account security:</strong><br />
    &bull; This link is valid for <strong>30 minutes</strong> and can only be used once.<br />
    &bull; If you didn't request a password reset, you can safely disregard this email — your account remains completely safe and untouched.<br />
    &bull; For your safety, never forward or share this link with anyone.
  </td></tr>
</table>

<p style="margin:26px 0 0">Warmly,<br /><strong>The ${BRAND.name} Team</strong></p>`;

  const html = layout({
    preheader: `Reset your ${BRAND.name} password quickly and securely.`,
    logoSrc: d.logoSrc,
    bodyHtml,
    footerNote: `You are receiving this email because a password reset was requested for ${d.email}.`,
    supportEmail: d.supportEmail,
  });

  const text = [
    `Hi ${firstName},`,
    '',
    `We received a request to reset the password for your ${BRAND.name} account.`,
    'No worries at all — it happens to the best of us!',
    '',
    'Click the link below to choose a fresh password:',
    d.resetUrl,
    '',
    'Quick security notes:',
    '- This link is valid for 30 minutes and can only be used once.',
    '- If you did not request this, you can safely ignore this email; your account remains secure.',
    '- Never share this link with anyone. The HomeCareX team will never ask for your password.',
    '',
    'Warmly,',
    `The ${BRAND.name} Team`,
  ].join('\n');

  return { subject: `Reset your ${BRAND.name} password`, html, text };
}

export interface PasswordResetOtpEmailData {
  name: string;
  email: string;
  otp: string;
  logoSrc?: string;
  supportEmail?: string;
}

export function passwordResetOtpEmail(d: PasswordResetOtpEmailData): { subject: string; html: string; text: string } {
  const firstName = d.name.trim().split(/\s+/)[0] || d.name;

  const bodyHtml = `
<h1 style="margin:8px 0 6px;font:700 24px ${FONT};color:${BRAND.indigoDark};text-align:center">Password Reset Verification Code</h1>
<p style="margin:0 0 22px;text-align:center;color:${BRAND.muted}">Use the code below to reset your password and regain access to your account.</p>

<p style="margin:0 0 16px">Hi ${esc(firstName)},</p>
<p style="margin:0 0 16px">We received a request to reset your ${BRAND.name} account password. Here is your 6-digit verification code:</p>

<div style="text-align:center;margin:24px 0">
  <div style="display:inline-block;padding:12px 28px;background:#f3f4f6;border:2px dashed ${BRAND.indigo};border-radius:12px;font:700 32px 'Courier New',Courier,monospace;letter-spacing:8px;color:${BRAND.indigoDark}">
    ${esc(d.otp)}
  </div>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid ${BRAND.border};border-radius:10px;margin-bottom:20px">
  <tr><td style="padding:16px 20px;font:13px/1.7 ${FONT};color:${BRAND.muted}">
    <strong style="color:${BRAND.text}">A quick note on account security:</strong><br />
    &bull; This code is valid for <strong>10 minutes</strong> and can only be used once.<br />
    &bull; Maximum 5 verification attempts are allowed.<br />
    &bull; If you didn't request a password reset, you can safely disregard this email — your account remains completely safe and untouched.<br />
    &bull; For your safety, never share this code with anyone. ${BRAND.name} staff will never ask for your verification code.
  </td></tr>
</table>

<p style="margin:26px 0 0">Warmly,<br /><strong>The ${BRAND.name} Team</strong></p>`;

  const html = layout({
    preheader: `Your ${BRAND.name} password reset verification code is ${d.otp}.`,
    logoSrc: d.logoSrc,
    bodyHtml,
    footerNote: `You are receiving this email because a password reset verification code was requested for ${d.email}.`,
    supportEmail: d.supportEmail,
  });

  const text = [
    `Hi ${firstName},`,
    '',
    `Your ${BRAND.name} password reset verification code is: ${d.otp}`,
    '',
    'Security notes:',
    '- This code is valid for 10 minutes and can only be used once.',
    '- Maximum 5 attempts allowed.',
    '- If you did not request this, you can safely ignore this email; your account remains secure.',
    '- Never share this verification code with anyone.',
    '',
    'Warmly,',
    `The ${BRAND.name} Team`,
  ].join('\n');

  return { subject: `${d.otp} is your ${BRAND.name} password reset code`, html, text };
}

