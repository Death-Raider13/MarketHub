import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { sendBetaApplicationEmail } from '@/lib/email/service'
import { z } from 'zod'

const betaSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  role: z.enum(['creator', 'customer']),
  message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = betaSchema.parse(body)

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // 1. Store in Firestore
    await adminDb.collection('beta_testers').add({
      ...validatedData,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),
    })

    // 2. Send Email to Admin
    try {
      await sendBetaApplicationEmail(validatedData)
    } catch (emailErr) {
      console.error('Failed to send beta notification email:', emailErr)
      // We don't fail the request if only email fails, as it's in DB
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application received! We will contact you soon.' 
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Beta application error:', error)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}
