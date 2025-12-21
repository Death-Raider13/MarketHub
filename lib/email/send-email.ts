// Simple email service that supports SMTP (e.g. Gmail) and Resend, with a console fallback.

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  const from = options.from || process.env.FROM_EMAIL || 'noreply@FEROMARKETHUB.com'

  // 1) Prefer SMTP via Nodemailer if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure:
          process.env.SMTP_SECURE === 'true' ||
          Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      return await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
    } catch (error) {
      console.error('Failed to send email via SMTP, falling back to other providers:', error)
    }
  }

  // 2) Fallback to Resend if API key is available
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      return await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
    } catch (error) {
      console.error('Failed to send email via Resend, falling back to console log:', error)
    }
  }

  // 3) Final fallback: just log the email so nothing explodes in development
  console.log('📧 Email would be sent (no provider configured):', {
    to: options.to,
    subject: options.subject,
    from,
  })
  console.log('📧 Email content:', options.html)

  return { success: true }
}
