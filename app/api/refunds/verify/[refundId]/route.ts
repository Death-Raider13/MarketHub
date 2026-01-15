import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { refundId: string } }
) {
  try {
    const { refundId } = params

    const refundRef = adminDb.collection('refunds').doc(refundId)
    const refundDoc = await refundRef.get()

    if (!refundDoc.exists) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }

    const refundData = refundDoc.data() as any

    // Verify refund status with payment provider
    let verificationResult = null

    if (refundData.paystackRefundId) {
      try {
        const { PaystackRefundService } = await import('@/lib/payment/paystack-refunds')
        verificationResult = await PaystackRefundService.verifyRefundStatus(
          refundData.paystackRefundId,
          refundId
        )
      } catch (error) {
        console.error('Paystack refund verification failed:', error)
      }
    } else if (refundData.coinbaseRefundId) {
      // Coinbase verification would go here
      // For now, just return the current status
      verificationResult = {
        status: refundData.coinbaseRefundStatus || 'pending_manual_processing',
        message: 'Coinbase refunds require manual verification'
      }
    }

    // Get updated refund data
    const updatedRefundDoc = await refundRef.get()
    const updatedRefundData = updatedRefundDoc.data()

    return NextResponse.json({
      success: true,
      refund: {
        id: refundId,
        ...updatedRefundData,
        createdAt: updatedRefundData?.createdAt?.toDate?.() || updatedRefundData?.createdAt,
        updatedAt: updatedRefundData?.updatedAt?.toDate?.() || updatedRefundData?.updatedAt,
        refundedAt: updatedRefundData?.refundedAt?.toDate?.() || updatedRefundData?.refundedAt,
      },
      verification: verificationResult,
    })
  } catch (error) {
    console.error('Error verifying refund:', error)
    return NextResponse.json(
      { error: 'Failed to verify refund' },
      { status: 500 }
    )
  }
}