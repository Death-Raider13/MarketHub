import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin-simple'
import { sendEmail } from '@/lib/email/send-email'
import { passwordResetEmail } from '@/lib/email/auth-templates'
import { getCanonicalAppUrl } from '@/lib/app-url'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let email = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  try {
    const adminAuth = getAdminAuth()
    if (!adminAuth) return NextResponse.json({ error: 'Server authentication is not configured' }, { status: 500 })

    const user = await adminAuth.getUserByEmail(email)
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${getCanonicalAppUrl()}/auth/action`,
      handleCodeInApp: false,
    })
    const emailContent = passwordResetEmail(user.displayName || undefined, link)
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      from: process.env.EMAIL_FROM || process.env.FROM_EMAIL,
    })
  } catch (error: any) {
    // Deliberately return the same success response for missing users to avoid account enumeration.
    if (error?.code !== 'auth/user-not-found') console.error('Branded password reset email failed:', error)
  }

  return NextResponse.json({ success: true, message: 'If an account exists for that address, a reset link has been sent.' })
}
