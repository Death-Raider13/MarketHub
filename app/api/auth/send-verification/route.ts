import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { sendEmail } from '@/lib/email/send-email'
import { verificationEmail } from '@/lib/email/auth-templates'

export const dynamic = 'force-dynamic'

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuthToken(request)
  if ('error' in authResult) return authResult.error

  try {
    const adminAuth = getAdminAuth()
    if (!adminAuth) return NextResponse.json({ error: 'Server authentication is not configured' }, { status: 500 })

    const user = await adminAuth.getUser(authResult.user.uid)
    if (!user.email) return NextResponse.json({ error: 'Your account has no email address' }, { status: 400 })
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true })

    const link = await adminAuth.generateEmailVerificationLink(user.email, {
      url: `${appUrl()}/auth/action`,
      handleCodeInApp: false,
    })
    const email = verificationEmail(user.displayName || undefined, link)
    await sendEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: process.env.EMAIL_FROM || process.env.FROM_EMAIL,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Branded verification email failed:', error)
    return NextResponse.json({ error: 'Unable to send the verification email right now' }, { status: 500 })
  }
}
