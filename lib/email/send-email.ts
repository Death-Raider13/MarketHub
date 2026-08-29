// Simple email service that supports SMTP (e.g. Gmail) and Resend, with a console fallback.

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  const from = options.from || process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'Fero E-Library <no-reply@fero-elibrary.shop>'
  const isProd = process.env.NODE_ENV === 'production'

  // Prefer Resend for serverless branded email when configured.
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const result = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      })
      if (result.error) throw new Error(result.error.message)
      return result.data
    } catch (error) {
      console.error('Failed to send email via Resend, trying SMTP fallback:', error)
    }
  }

  // SMTP fallback for installations that already have a mail server configured.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import('nodemailer')

      if (isProd) {
        console.log('📧 SMTP configured (production-safe):', {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure:
            process.env.SMTP_SECURE === 'true' ||
            Number(process.env.SMTP_PORT || 587) === 465,
          user: process.env.SMTP_USER,
          from,
        })
      }

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
        ...(options.text ? { text: options.text } : {}),
      })
    } catch (error) {
      console.error('Failed to send email via SMTP, falling back to other providers:', error)
    }
  }

  // Final fallback: just log the email in development; production fails closed.
  if (isProd) {
    const configured = {
      smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      resend: !!process.env.RESEND_API_KEY
    }
    throw new Error(
      `Email provider not configured in production. Configure SMTP_* or RESEND_API_KEY. Current: ${JSON.stringify(configured)}`
    )
  }

  console.log('📧 Email would be sent (no provider configured):', {
    to: options.to,
    subject: options.subject,
    from,
  })
  console.log('📧 Email content:', options.html)

  return { success: true }
}
