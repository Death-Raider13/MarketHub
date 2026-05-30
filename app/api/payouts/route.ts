import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { createAdminRoleNotification } from '@/lib/notifications/admin-service'
import { sendPayoutRequestSubmittedEmail, sendPayoutRequestAdminEmail } from '@/lib/email/service'
import { verifyAuthToken } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      console.error('Firebase Admin SDK not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedCreatorId = searchParams.get('creatorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'

    // Creators can only see their own payouts; admins see all.
    const creatorId = isAdmin
      ? (requestedCreatorId ?? null)
      : auth.user.uid

    let query = adminDb.collection('payoutRequests').orderBy('requestedAt', 'desc')

    if (creatorId) {
      query = query.where('creatorId', '==', creatorId)
    } else if (!isAdmin) {
      // Non-admin with no uid — shouldn't happen, but safe fallback.
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get()
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
        query = query.startAfter(lastDoc)
      }
    }

    const snapshot = await query.limit(limit).get()

    const payouts = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate?.()?.toISOString() || data.requestedAt,
        processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt
      }
    })

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('payoutRequests').get()
    const total = totalSnapshot.size

    return NextResponse.json({
      success: true,
      payouts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: snapshot.docs.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authPost = await verifyAuthToken(request)
  if ('error' in authPost) return authPost.error

  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      console.error('Firebase Admin SDK not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      creatorName,
      creatorEmail,
      amount,
      paymentMethod,
      bankDetails,
      mobileMoneyDetails,
      paypalEmail
    } = body

    // Always use the authenticated uid — ignore any creatorId in the body.
    const creatorId = authPost.user.uid

    // Validate required fields
    if (!creatorName || !creatorEmail || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Minimum payout validation
    const minimumPayout = 1000 // ₦1,000
    if (amount < minimumPayout) {
      return NextResponse.json(
        { error: `Minimum payout amount is ₦${minimumPayout.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Check creator balance
    const balanceDoc = await adminDb.collection('creatorBalances').doc(creatorId).get()
    if (!balanceDoc.exists) {
      return NextResponse.json(
        { error: 'creator balance not found' },
        { status: 404 }
      )
    }

    const balance = balanceDoc.data()
    if (!balance || balance.availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Check for pending payout requests (prevent duplicate requests)
    const pendingPayoutsSnapshot = await adminDb
      .collection('payoutRequests')
      .where('creatorId', '==', creatorId)
      .where('status', 'in', ['pending', 'approved', 'processing'])
      .get()

    if (!pendingPayoutsSnapshot.empty) {
      return NextResponse.json(
        { error: 'You already have a pending payout request' },
        { status: 400 }
      )
    }

    // Validate payment method details
    if (paymentMethod === 'bank_transfer') {
      if (!bankDetails?.accountName || !bankDetails?.accountNumber || !bankDetails?.bankName) {
        return NextResponse.json(
          { error: 'Bank details are required for bank transfer' },
          { status: 400 }
        )
      }
    } else if (paymentMethod === 'mobile_money') {
      if (!mobileMoneyDetails?.provider || !mobileMoneyDetails?.phoneNumber || !mobileMoneyDetails?.accountName) {
        return NextResponse.json(
          { error: 'Mobile money details are required' },
          { status: 400 }
        )
      }
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail) {
        return NextResponse.json(
          { error: 'PayPal email is required' },
          { status: 400 }
        )
      }
    }

    // Create payout request
    const payoutData = {
      creatorId,
      creatorName,
      creatorEmail,
      amount,
      paymentMethod,
      status: 'pending',
      requestedAt: new Date(),
      ...(bankDetails && { bankDetails }),
      ...(mobileMoneyDetails && { mobileMoneyDetails }),
      ...(paypalEmail && { paypalEmail })
    }

    const payoutRef = await adminDb.collection('payoutRequests').add(payoutData)

    // Update creator balance (move from available to pending)
    await adminDb.collection('creatorBalances').doc(creatorId).update({
      availableBalance: balance.availableBalance - amount,
      pendingBalance: (balance.pendingBalance || 0) + amount,
      updatedAt: new Date()
    })

    // Send confirmation email to creator
    try {
      await sendPayoutRequestSubmittedEmail(creatorEmail, {
        creatorName,
        amount,
        paymentMethod,
        payoutId: payoutRef.id,
        requestedAt: new Date()
      })
    } catch (emailError) {
      console.error('Failed to send creator confirmation email:', emailError)
    }

    // Send notification email to admins
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@feromarkethub.com'
      const allAdminEmails = [...adminEmails, supportEmail].filter(Boolean)

      if (allAdminEmails.length > 0) {
        await sendPayoutRequestAdminEmail(allAdminEmails, {
          creatorName,
          creatorEmail,
          amount,
          paymentMethod,
          payoutId: payoutRef.id,
          requestedAt: new Date()
        })
      }
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
    }

    // Send notification to admins
    try {
      await createAdminRoleNotification(['admin', 'super_admin'], 'payout_pending', {
        metadata: {
          creatorName,
          amount,
          paymentMethod,
          actionUrl: '/admin/payouts'
        } as any
      })
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      payoutId: payoutRef.id,
      message: 'Payout request submitted successfully'
    })

  } catch (error) {
    console.error('Error creating payout request:', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}