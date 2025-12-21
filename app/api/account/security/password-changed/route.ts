import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const { sendPasswordChangedEmail } = await import('@/lib/email/service')
    await sendPasswordChangedEmail(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending password changed email:', error)
    return NextResponse.json(
      { error: 'Failed to send password changed email' },
      { status: 500 }
    )
  }
}
