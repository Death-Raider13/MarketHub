import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { sendEmail } from '@/lib/email/send-email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authUser = await verifyAuthToken(request)
  if ('error' in authUser) return authUser.error

  const db = getAdminFirestore()
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

  try {
    const adminDoc = await db.collection('users').doc(authUser.user.uid).get()
    const adminRole = adminDoc.data()?.role
    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const { targetRole, testEmailOnly } = await request.json().catch(() => ({}))

    // Collect target email addresses
    let emailsToSend: { email: string; displayName?: string; role?: string }[] = []

    if (testEmailOnly) {
      emailsToSend.push({ email: String(testEmailOnly).trim().toLowerCase(), displayName: 'Admin Tester', role: 'admin' })
    } else {
      const usersSnapshot = await db.collection('users').get()
      const emailSet = new Set<string>()

      usersSnapshot.forEach((doc: any) => {
        const data = doc.data() || {}
        const email = data.email?.toLowerCase().trim()
        if (email && !emailSet.has(email)) {
          if (!targetRole || targetRole === 'all' || data.role === targetRole) {
            emailSet.add(email)
            emailsToSend.push({
              email,
              displayName: data.displayName || data.storeName || email.split('@')[0],
              role: data.role || 'customer'
            })
          }
        }
      })

      // Also include waitlist members if not already registered
      const waitlistSnapshot = await db.collection('waitlist').get()
      waitlistSnapshot.forEach((doc: any) => {
        const data = doc.data() || {}
        const email = data.email?.toLowerCase().trim()
        if (email && !emailSet.has(email)) {
          emailSet.add(email)
          emailsToSend.push({
            email,
            displayName: email.split('@')[0],
            role: data.role || 'customer'
          })
        }
      })
    }

    if (emailsToSend.length === 0) {
      return NextResponse.json({ message: 'No target emails found.' })
    }

    const appUrl = 'https://fero-elibrary.shop'
    let successCount = 0
    let failureCount = 0

    for (const recipient of emailsToSend) {
      const name = recipient.displayName || 'Learner'

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fero E-Library Official Opening</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 20px; color: #E2E8F0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">🚀 Fero E-Library is OFFICIALLY OPEN!</h1>
              <p style="color: #DBEAFE; font-size: 15px; margin-top: 8px; margin-bottom: 0;">Public Access is Live — Explore Textbooks, Past Questions & Earn Big!</p>
            </div>

            <!-- Main Body -->
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; color: #F8FAFC; margin-top: 0;">Hi <strong>${name}</strong>,</p>
              <p style="font-size: 15px; color: #CBD5E1; line-height: 1.6;">
                The wait is officially over! We are excited to announce that <strong>Fero E-Library is now 100% OPEN to the public</strong> across all smartphones, tablets, and computers.
              </p>

              <!-- Feature Cards -->
              <div style="margin: 24px 0; space-y: 16px;">
                
                <!-- For Students -->
                <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="color: #38BDF8; font-size: 16px; margin: 0 0 8px 0; display: flex; align-items: center;">📚 For Students & Learners</h3>
                  <p style="color: #94A3B8; font-size: 14px; margin: 0; line-height: 1.5;">
                    Gain instant access to verified 100-Level to 400-Level textbooks, past questions, MCQs, and exam revision guides. Instant download & offline reading!
                  </p>
                </div>

                <!-- For Affiliates -->
                <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="color: #34D399; font-size: 16px; margin: 0 0 8px 0;">💼 For Affiliates & Marketers</h3>
                  <p style="color: #94A3B8; font-size: 14px; margin: 0; line-height: 1.5;">
                    Earn <strong>10% instant commission</strong> on every single study guide or textbook sold through your link. 30-day cookie tracking + fast payouts straight to your bank account (Minimum withdrawal: ₦1,000).
                  </p>
                </div>

                <!-- For Creators -->
                <div style="background-color: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
                  <h3 style="color: #FBBF24; font-size: 16px; margin: 0 0 8px 0;">🎓 For Creators & Educators</h3>
                  <p style="color: #94A3B8; font-size: 14px; margin: 0; line-height: 1.5;">
                    Publish your lecture materials, past question solutions, and eBooks. Your first <strong>3 book uploads are 100% FREE</strong>! Earn direct income while helping thousands of students pass.
                  </p>
                </div>

              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 36px 0 24px 0;">
                <a href="${appUrl}" target="_blank" style="background-color: #2563EB; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.4);">
                  Explore Fero E-Library Now &rarr;
                </a>
              </div>

              <p style="font-size: 13px; color: #64748B; text-align: center; margin-bottom: 0;">
                Direct Store Link: <a href="${appUrl}" style="color: #60A5FA; text-decoration: underline;">https://fero-elibrary.shop</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #0F172A; padding: 20px 24px; text-align: center; border-t: 1px solid #334155;">
              <p style="color: #64748B; font-size: 12px; margin: 0;">
                &copy; 2026 Fero E-Library. All rights reserved.<br>
                Empowering Nigerian Students & Educators with Premier Digital Learning.
              </p>
            </div>

          </div>
        </body>
        </html>
      `

      try {
        await sendEmail({
          to: recipient.email,
          subject: '🚀 Fero E-Library is OFFICIALLY OPEN to Everyone!',
          html: htmlContent
        })
        successCount++
      } catch (err: any) {
        console.error(`Failed sending broadcast email to ${recipient.email}:`, err)
        failureCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Launch broadcast processed. Sent to ${successCount} recipients (${failureCount} errors).`,
      totalTargeted: emailsToSend.length,
      successCount,
      failureCount
    })
  } catch (error: any) {
    console.error('Launch broadcast error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send launch broadcast' }, { status: 500 })
  }
}
