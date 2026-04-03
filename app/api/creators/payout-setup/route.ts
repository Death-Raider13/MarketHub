import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin-simple'
import { createPaystackSubaccount } from '@/lib/payment/paystack-subaccount'
import { z } from 'zod'

const payoutSchema = z.object({
  creatorId: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Auth (Optional: if we want to allow other ways, but usually current user)
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json({ error: 'Auth system unavailable' }, { status: 500 })
    }
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1]
    
    let userId: string
    if (idToken) {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      userId = decodedToken.uid
    } else {
      // Direct body if we trust the caller (admin only?)
      // Actually, let's stick to auth token for security
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = getAdminFirestore()
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const payoutDetails = userData?.payoutDetails

    if (!payoutDetails?.bankName || !payoutDetails?.accountNumber) {
      return NextResponse.json({ error: 'Payout details incomplete. Please save your bank details first.' }, { status: 400 })
    }

    // 2. Create Paystack Subaccount
    // We charge 10%, so creator gets 90%
    const subaccount = await createPaystackSubaccount({
      business_name: userData.hubName || userData.storeName || userData.fullName || 'Creator Hub',
      settlement_bank: payoutDetails.bankName,
      account_number: payoutDetails.accountNumber,
      percentage_charge: 90, 
    })

    // 3. Store Subaccount Code in Firestore (Users collection)
    await adminDb.collection('users').doc(userId).update({
      paystackSubaccountCode: subaccount.subaccount_code,
      payoutStatus: 'configured',
      updatedAt: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      subaccountCode: subaccount.subaccount_code 
    })

  } catch (error: any) {
    console.error('Payout setup error:', error)
    return NextResponse.json({ error: error.message || 'Failed to setup payout' }, { status: 500 })
  }
}
