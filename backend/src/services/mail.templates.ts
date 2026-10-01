/**
 * HTML + plain-text email templates. Layout uses nested tables and inline styles only,
 * because Outlook/Gmail strip <style> blocks and ignore flexbox/grid.
 */

export const BRAND = {
  name: 'HomeCareX',
  indigo: '#4338ca',
  indigoDark: '#312e81',
  orange: '#f97316',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  page: '#f1f5f9',
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
    ? `<img src="${esc(logoSrc)}" width="190" alt="${BRAND.name}" style="display:block;margin:0 auto;border:0;outline:none;height:auto;max-width:190px" />`
    : `<span style="font:800 26px ${FONT};color:${BRAND.indigo}">Home<span style="color:${BRAND.orange}">CareX</span></span>`;
  const support = supportEmail
    ? `Need help? Write to <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.indigo};text-decoration:none">${esc(supportEmail)}</a>.<br />`
    : '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${BRAND.name}</title></head>
<body style="margin:0;padding:0;background:${BRAND.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8199;&zwnj;&#8199;&zwnj;&#8199;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page}">
  <tr><td align="center" style="padding:32px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BRAND.border}">
      <tr><td style="height:5px;line-height:5px;font-size:0;background:${BRAND.indigo};border-bottom:3px solid ${BRAND.orange}">&nbsp;</td></tr>
      <tr><td align="center" style="padding:28px 32px 8px">${logo}</td></tr>
      <tr><td style="padding:8px 40px 36px;font-family:${FONT};color:${BRAND.text};font-size:15px;line-height:1.65">${bodyHtml}</td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid ${BRAND.border};padding:22px 40px;font-family:${FONT};font-size:12px;line-height:1.7;color:${BRAND.muted};text-align:center">
        ${support}${esc(footerNote)}<br />
        &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const button = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px">
  <tr><td align="center" bgcolor="${BRAND.indigo}" style="border-radius:10px">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 34px;font:600 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:10px;background:${BRAND.indigo}">${esc(label)} &rarr;</a>
  </td></tr>
</table>`;

const row = (label: string, valueHtml: string, last = false) => `
<tr>
  <td style="padding:12px 18px;${last ? '' : `border-bottom:1px solid ${BRAND.border};`}font:600 12px ${FONT};letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};width:110px;vertical-align:middle">${label}</td>
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

export function partnerCredentialsEmail(d: PartnerCredentialsData) {
  const firstName = d.name.trim().split(/\s+/)[0] || d.name;

  const bodyHtml = `
<h1 style="margin:12px 0 6px;font:700 24px ${FONT};color:${BRAND.indigoDark};text-align:center">Welcome aboard, ${esc(firstName)}!</h1>
<p style="margin:0 0 22px;text-align:center;color:${BRAND.muted}">Your partner account is ready.</p>

<p style="margin:0 0 18px">Hi ${esc(d.name)},</p>
<p style="margin:0 0 22px">You have been registered as a <strong style="color:${BRAND.indigo}">${esc(d.designation)}</strong> on the ${BRAND.name} partner platform. Use the details below to sign in and start receiving jobs.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;background:#f8fafc">
  ${row('Login email', `<span style="color:${BRAND.text}">${esc(d.email)}</span>`)}
  ${row('Password', `<span style="display:inline-block;padding:5px 10px;background:#ffffff;border:1px dashed ${BRAND.indigo};border-radius:6px;font:600 15px 'Courier New',Courier,monospace;letter-spacing:.04em;color:${BRAND.indigoDark}">${esc(d.password)}</span>`)}
  ${row('Role', esc(d.designation), true)}
</table>

${button(d.loginUrl, 'Sign in to your account')}
<p style="margin:0 0 26px;text-align:center;font-size:12px;color:${BRAND.muted}">Button not working? Copy this link into your browser:<br /><a href="${esc(d.loginUrl)}" style="color:${BRAND.indigo};word-break:break-all">${esc(d.loginUrl)}</a></p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border-left:4px solid ${BRAND.orange};border-radius:6px">
  <tr><td style="padding:14px 18px;font:14px/1.6 ${FONT};color:#7c2d12">
    <strong>Keep this secure.</strong> Change your password right after your first sign-in and never share it with anyone. ${BRAND.name} staff will never ask for your password.
  </td></tr>
</table>

<p style="margin:26px 0 8px;font-weight:600;color:${BRAND.indigoDark}">What happens next</p>
<ol style="margin:0;padding-left:20px;color:${BRAND.text}">
  <li style="margin-bottom:6px">Sign in and update your password.</li>
  <li style="margin-bottom:6px">Complete your profile and verification documents.</li>
  <li>Set your working hours to start receiving job requests.</li>
</ol>
<p style="margin:26px 0 0">Warm regards,<br /><strong>The ${BRAND.name} Team</strong></p>`;

  const html = layout({
    preheader: `Your ${BRAND.name} partner account is ready. Sign in with the details inside.`,
    logoSrc: d.logoSrc,
    bodyHtml,
    footerNote: `You are receiving this email because an administrator created a ${BRAND.name} partner account for ${d.email}. If this was not expected, please ignore this message.`,
    supportEmail: d.supportEmail,
  });

  const text = [
    `Welcome to ${BRAND.name}, ${d.name}!`,
    '',
    `Your partner account (${d.designation}) is ready.`,
    '',
    `Login:    ${d.loginUrl}`,
    `Email:    ${d.email}`,
    `Password: ${d.password}`,
    '',
    'Please change your password after your first sign-in and never share it with anyone.',
    '',
    `The ${BRAND.name} Team`,
  ].join('\n');

  return { subject: `Welcome to ${BRAND.name}: your partner account is ready`, html, text };
}
