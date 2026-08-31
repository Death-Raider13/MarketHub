import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { paystackTransferService, PaystackTransferService } from '@/lib/payment/paystack-transfers'
import { createAdminNotification } from '@/lib/notifications/admin-service'
import { sendPayoutCompletedEmail, sendPayoutRejectedEmail } from '@/lib/email/service'

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  console.log('=== PAYOUT PROCESSING STARTED ===')

  const adminDb = getAdminFirestore()

  if (!adminDb) {
    console.error('Firebase Admin SDK not initialized')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { payoutId } = params
    const { adminUserId } = await request.json()

    console.log('Processing payout:', payoutId, 'by admin:', adminUserId)

    if (!payoutId) {
      console.error('No payout ID provided')
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      )
    }

    // Check Paystack configuration
    console.log('Checking Paystack configuration...')
    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }
    console.log('Paystack key found:', paystackKey.substring(0, 10) + '...')

    // Test Paystack connection
    try {
      const connectionTest = await paystackTransferService.testConnection()
      if (!connectionTest) {
        console.error('Paystack connection test failed')
        return NextResponse.json(
          { error: 'Unable to connect to payment gateway' },
          { status: 500 }
        )
      }
      console.log('Paystack connection test passed')
    } catch (connectionError) {
      console.error('Paystack connection error:', connectionError)
      return NextResponse.json(
        { error: 'Payment gateway connection failed' },
        { status: 500 }
      )
    }

    const payoutRef = adminDb.collection('payoutRequests').doc(payoutId)
    const payoutDoc = await payoutRef.get()

    if (!payoutDoc.exists) {
      console.error('Payout not found:', payoutId)
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      )
    }

    const payoutData = payoutDoc.data() as any
    console.log('Payout data:', {
      id: payoutId,
      status: payoutData.status,
      amount: payoutData.amount,
      paymentMethod: payoutData.paymentMethod,
      creatorName: payoutData.creatorName
    })

    // Only process approved payouts
    if (payoutData.status !== 'approved') {
      console.error('Payout not approved. Current status:', payoutData.status)
      return NextResponse.json(
        { error: `Only approved payouts can be processed. Current status: ${payoutData.status}` },
        { status: 400 }
      )
    }

    // Update status to processing
    console.log('Updating payout status to processing...')
    await payoutRef.update({
      status: 'processing',
      processedAt: new Date(),
      processedBy: adminUserId || null,
      updatedAt: new Date()
    })

    try {
      let transferResult: any = null
      let recipientCode: string | null = null

      // Process based on payment method
      if (payoutData.paymentMethod === 'bank_transfer') {
        console.log('Processing bank transfer...')

        if (!payoutData.bankDetails) {
          throw new Error('Bank details are required for bank transfer')
        }

        const { resolveBankCode } = await import('@/lib/payment/paystack-transfers')
        const accountName = payoutData.bankDetails.accountName
        const accountNumber = payoutData.bankDetails.accountNumber
        const bankName = payoutData.bankDetails.bankName
        const bankCode = payoutData.bankDetails.bankCode || resolveBankCode(bankName)
        console.log('Bank details resolved:', { accountName, accountNumber, bankName, bankCode })

        if (!bankCode) {
          throw new Error(`Could not find Paystack bank code for "${bankName || 'unspecified bank'}". Please specify valid bank code.`)
        }

        // Verify account number first
        console.log('Verifying account number...')
        try {
          const accountVerification = await paystackTransferService.resolveAccountNumber(
            accountNumber,
            bankCode
          )
          console.log('Account verification successful:', accountVerification)
        } catch (verifyError: any) {
          console.error('Account verification failed:', verifyError)
          throw new Error(`Account verification failed: ${verifyError.message}`)
        }

        // Create transfer recipient
        console.log('Creating transfer recipient...')
        try {
          const recipient = await paystackTransferService.createTransferRecipient({
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
            description: `Payout for ${payoutData.creatorName}`,
            metadata: {
              payoutId: payoutId,
              creatorId: payoutData.creatorId,
              creatorName: payoutData.creatorName
            }
          })

          recipientCode = recipient.recipient_code
          console.log('Transfer recipient created:', recipientCode)
        } catch (recipientError: any) {
          console.error('Failed to create transfer recipient:', recipientError)
          throw new Error(`Failed to create transfer recipient: ${recipientError.message}`)
        }

        // Initiate transfer
        console.log('Initiating transfer...')
        const transferAmount = PaystackTransferService.nairaToKobo(payoutData.amount)
        console.log('Transfer amount in kobo:', transferAmount)

        try {
          transferResult = await paystackTransferService.initiateTransfer({
            source: 'balance',
            amount: transferAmount,
            recipient: recipientCode,
            reason: `Payout to ${payoutData.creatorName} - ${payoutId}`,
            currency: 'NGN',
            reference: `payout_${payoutId}_${Date.now()}`,
            metadata: {
              payoutId: payoutId,
              creatorId: payoutData.creatorId,
              creatorName: payoutData.creatorName,
              originalAmount: payoutData.amount
            }
          })
          console.log('Transfer initiated successfully:', transferResult)
        } catch (transferError: any) {
          console.error('Failed to initiate transfer:', transferError)
          throw new Error(`Failed to initiate transfer: ${transferError.message}`)
        }

      } else if (payoutData.paymentMethod === 'mobile_money') {
        throw new Error('Mobile money transfers require manual processing. Please process this payout manually and mark as completed.')
      } else if (payoutData.paymentMethod === 'paypal') {
        throw new Error('PayPal transfers require manual processing. Please process this payout manually and mark as completed.')
      } else {
        throw new Error(`Unsupported payment method: ${payoutData.paymentMethod}`)
      }

      // Update payout with transfer details
      console.log('Updating payout with transfer details...')
      const updateData: any = {
        status: 'completed',
        processedAt: new Date(),
        processedBy: adminUserId || null,
        paystackTransferCode: transferResult?.transfer_code,
        paystackReference: transferResult?.reference,
        transactionReference: transferResult?.reference,
        recipientCode: recipientCode,
        updatedAt: new Date()
      }

      await payoutRef.update(updateData)

      // Update creator balance
      console.log('Updating creator balance...')
      const balanceRef = adminDb.collection('creatorBalances').doc(payoutData.creatorId)
      const balanceDoc = await balanceRef.get()

      if (balanceDoc.exists) {
        const currentBalance = balanceDoc.data() as any
        await balanceRef.update({
          pendingBalance: Math.max(0, (currentBalance.pendingBalance || 0) - payoutData.amount),
          totalWithdrawn: (currentBalance.totalWithdrawn || 0) + payoutData.amount,
          lastPayoutDate: new Date(),
          updatedAt: new Date(),
        })
        console.log('creator balance updated successfully')
      }

      // Send success notifications
      console.log('Sending success notifications...')
      try {
        const latestPayout = {
          id: payoutId,
          ...payoutData,
          ...updateData,
        }

        // Send email notification
        await sendPayoutCompletedEmail(latestPayout)

        // Send in-app notification
        await createAdminNotification(payoutData.creatorId, 'payout_processed', {
          metadata: {
            amount: payoutData.amount,
            actionUrl: `/creator/payouts`
          } as any
        })
        console.log('Notifications sent successfully')
      } catch (notifyError) {
        console.error('Failed to send payout completion notifications:', notifyError)
      }

      console.log('=== PAYOUT PROCESSING COMPLETED SUCCESSFULLY ===')
      return NextResponse.json({
        success: true,
        message: 'Payout processed successfully via Paystack',
        transferCode: transferResult?.transfer_code,
        reference: transferResult?.reference,
        payout: {
          id: payoutId,
          ...payoutData,
          ...updateData,
        }
      })

    } catch (transferError: any) {
      console.error('=== TRANSFER FAILED ===')
      console.error('Transfer error:', transferError)

      // Update payout status to failed/rejected
      const failureUpdate = {
        status: 'rejected',
        rejectionReason: `Transfer failed: ${transferError.message}`,
        processedAt: new Date(),
        processedBy: adminUserId || null,
        updatedAt: new Date()
      }

      await payoutRef.update(failureUpdate)

      // Restore creator balance (move from pending back to available)
      const balanceRef = adminDb.collection('creatorBalances').doc(payoutData.creatorId)
      const balanceDoc = await balanceRef.get()

      if (balanceDoc.exists) {
        const currentBalance = balanceDoc.data() as any
        await balanceRef.update({
          availableBalance: (currentBalance.availableBalance || 0) + payoutData.amount,
          pendingBalance: Math.max(0, (currentBalance.pendingBalance || 0) - payoutData.amount),
          updatedAt: new Date()
        })
      }

      // Send failure notification
      try {
        const failedPayout = {
          id: payoutId,
          ...payoutData,
          ...failureUpdate,
        }
        await sendPayoutRejectedEmail(failedPayout)
      } catch (notifyError) {
        console.error('Failed to send payout failure notification:', notifyError)
      }

      return NextResponse.json({
        success: false,
        error: `Transfer failed: ${transferError.message}`,
        details: transferError.stack || transferError.toString(),
        payout: {
          id: payoutId,
          ...payoutData,
          ...failureUpdate,
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('=== PAYOUT PROCESSING ERROR ===')
    console.error('Error processing payout:', error)
    console.error('Error stack:', error.stack)

    return NextResponse.json(
      {
        error: 'Failed to process payout',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}