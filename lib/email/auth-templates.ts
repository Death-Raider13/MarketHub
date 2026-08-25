import { getCanonicalAppUrl } from '@/lib/app-url'

const APP_URL = getCanonicalAppUrl()
const BRAND_NAME = 'Fero E-Library'
const BRAND_EMAIL = process.env.SUPPORT_EMAIL || 'support@fero-elibrary.shop'
const LOGO_URL = process.env.EMAIL_LOGO_URL || `${APP_URL}/logo.png`

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character))
}

function shell(title: string, preheader: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5eaf2;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(22,35,58,.08)">
        <tr><td style="padding:26px 32px;background:linear-gradient(135deg,#102a43,#147d92);color:#fff">
          <table role="presentation" width="100%"><tr><td>${LOGO_URL ? `<img src="${escapeHtml(LOGO_URL)}" alt="${BRAND_NAME}" width="44" height="44" style="display:block;border-radius:12px;margin-bottom:12px">` : ''}<div style="font-size:22px;font-weight:700;letter-spacing:.2px">${BRAND_NAME}</div><div style="font-size:13px;color:#c8f4f2;margin-top:3px">Learn. Create. Grow.</div></td></tr></table>
        </td></tr>
        <tr><td style="padding:34px 32px">${content}</td></tr>
        <tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #edf1f6;color:#667085;font-size:12px">This message was sent by ${BRAND_NAME}. If you did not request this, you can safely ignore it.<br><br><a href="${APP_URL}" style="color:#147d92;text-decoration:none">${APP_URL.replace(/^https?:\/\//, '')}</a> · <a href="mailto:${escapeHtml(BRAND_EMAIL)}" style="color:#147d92;text-decoration:none">Contact support</a></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function button(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#147d92;color:#fff;text-decoration:none;font-weight:700;border-radius:10px;padding:14px 22px;margin:18px 0">${escapeHtml(label)}</a>`
}

export function verificationEmail(displayName: string | undefined, link: string) {
  const name = displayName?.trim() || 'there'
  return {
    subject: 'Confirm your email address · Fero E-Library',
    html: shell('Confirm your email address', 'One quick step to activate your Fero E-Library account.', `<h1 style="font-size:28px;line-height:1.25;margin:0 0 14px;color:#102a43">Welcome to Fero E-Library, ${escapeHtml(name)}.</h1><p style="font-size:16px;color:#475467">Your account is ready. Confirm your email address to protect your account and unlock the full library experience.</p>${button('Confirm my email', link)}<p style="font-size:13px;color:#667085">This verification link expires according to Firebase security rules. For your protection, never forward it to anyone.</p><div style="margin-top:24px;padding:14px 16px;background:#eef8f7;border-left:4px solid #147d92;border-radius:8px;font-size:13px;color:#344054">If the button does not work, copy and paste the link into your browser.</div>`),
    text: `Welcome to Fero E-Library, ${name}.\n\nConfirm your email address to activate your account:\n${link}\n\nIf you did not create this account, you can ignore this message.`,
  }
}

export function passwordResetEmail(displayName: string | undefined, link: string) {
  const name = displayName?.trim() || 'there'
  return {
    subject: 'Reset your password · Fero E-Library',
    html: shell('Reset your password', 'Use this secure link to choose a new Fero E-Library password.', `<h1 style="font-size:28px;line-height:1.25;margin:0 0 14px;color:#102a43">Password reset requested.</h1><p style="font-size:16px;color:#475467">Hi ${escapeHtml(name)}, we received a request to reset the password for your Fero E-Library account.</p>${button('Choose a new password', link)}<p style="font-size:13px;color:#667085">For your security, this link is time-limited and can only be used once. If you did not request a reset, no action is needed.</p>`),
    text: `Hi ${name},\n\nReset your Fero E-Library password here:\n${link}\n\nIf you did not request this, you can ignore this message.`,
  }
}
