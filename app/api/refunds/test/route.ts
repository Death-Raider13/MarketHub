import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { testType, orderId, userId } = await request.json()

    if (!testType) {
      return NextResponse.json(
        { error: 'testType is required' },
        { status: 400 }
      )
    }

    const results: any = {
      testType,
      timestamp: new Date().toISOString(),
      results: {},
    }

    switch (testType) {
      case 'paystack_connection':
        results.results = await testPaystackConnection()
        break

      case 'coinbase_connection':
        results.results = await testCoinbaseConnection()
        break

      case 'create_test_refund':
        if (!orderId || !userId) {
          return NextResponse.json(
            { error: 'orderId and userId are required for test refund creation' },
            { status: 400 }
          )
        }
        results.results = await createTestRefund(orderId, userId)
        break

      case 'refund_workflow':
        results.results = await testRefundWorkflow()
        break

      case 'email_notifications':
        results.results = await testEmailNotifications()
        break

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Refund test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function testPaystackConnection() {
  try {
    const { PaystackRefundService } = await import('@/lib/payment/paystack-refunds')
    
    // Test API connection by listing refunds
    const response = await PaystackRefundService.listRefunds({ perPage: 1 })
    
    return {
      status: 'success',
      message: 'Paystack API connection successful',
      apiResponse: response.status,
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Paystack API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function testCoinbaseConnection() {
  try {
    const { CoinbaseRefundService } = await import('@/lib/payment/coinbase-refunds')
    
    // Test API connection by listing charges
    const response = await CoinbaseRefundService.listCharges({ limit: 1 })
    
    return {
      status: 'success',
      message: 'Coinbase API connection successful',
      apiResponse: response.data ? 'Connected' : 'No data',
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Coinbase API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function createTestRefund(orderId: string, userId: string) {
  try {
    // Create a test refund request
    const refundData = {
      userId,
      orderId,
      vendorId: 'test_vendor',
      reason: 'Test refund request for system validation',
      status: 'pending',
      amount: 1000, // ₦10.00
      paymentMethod: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
      isTestRefund: true,
    }

    const refundRef = await adminDb.collection('refunds').add(refundData)

    return {
      status: 'success',
      message: 'Test refund created successfully',
      refundId: refundRef.id,
      refundData,
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to create test refund',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function testRefundWorkflow() {
  try {
    const results = []

    // Test 1: Create test refund
    const testRefund = await createTestRefund('test_order_123', 'test_user_123')
    results.push({
      step: 'create_refund',
      ...testRefund,
    })

    if (testRefund.status === 'success') {
      // Test 2: Approve refund
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refunds/${testRefund.refundId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            adminUserId: 'test_admin',
            resolutionNotes: 'Test approval',
          }),
        })

        const approvalResult = await response.json()
        results.push({
          step: 'approve_refund',
          status: approvalResult.success ? 'success' : 'error',
          message: approvalResult.success ? 'Refund approved' : 'Approval failed',
          data: approvalResult,
        })

        // Test 3: Mark as refunded
        if (approvalResult.success) {
          const refundResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refunds/${testRefund.refundId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark_refunded',
              adminUserId: 'test_admin',
              resolutionNotes: 'Test completion',
            }),
          })

          const refundResult = await refundResponse.json()
          results.push({
            step: 'complete_refund',
            status: refundResult.success ? 'success' : 'error',
            message: refundResult.success ? 'Refund completed' : 'Completion failed',
            data: refundResult,
          })
        }

        // Cleanup: Delete test refund
        try {
          await adminDb.collection('refunds').doc(testRefund.refundId).delete()
          results.push({
            step: 'cleanup',
            status: 'success',
            message: 'Test refund cleaned up',
          })
        } catch (cleanupError) {
          results.push({
            step: 'cleanup',
            status: 'warning',
            message: 'Failed to cleanup test refund',
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
          })
        }
      } catch (workflowError) {
        results.push({
          step: 'workflow_error',
          status: 'error',
          message: 'Workflow test failed',
          error: workflowError instanceof Error ? workflowError.message : 'Unknown error',
        })
      }
    }

    return {
      status: 'completed',
      message: 'Refund workflow test completed',
      steps: results,
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Refund workflow test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function testEmailNotifications() {
  try {
    const results = []

    // Test email service availability
    try {
      const { sendRefundRequestedEmail } = await import('@/lib/email/service')
      
      // Create mock data for testing
      const mockOrder = {
        id: 'test_order_123',
        userEmail: 'test@example.com',
        customerName: 'Test Customer',
        total: 5000,
      }

      const mockRefund = {
        id: 'test_refund_123',
        reason: 'Test refund notification',
        amount: 5000,
        status: 'pending',
      }

      // Note: In production, you might want to send to a test email
      // await sendRefundRequestedEmail(mockOrder, mockRefund)

      results.push({
        service: 'refund_requested_email',
        status: 'available',
        message: 'Email service is configured and available',
      })
    } catch (emailError) {
      results.push({
        service: 'refund_requested_email',
        status: 'error',
        message: 'Email service test failed',
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      })
    }

    // Test notification service
    try {
      const { NotificationTriggers } = await import('@/lib/notifications/triggers')
      
      results.push({
        service: 'notification_triggers',
        status: 'available',
        message: 'Notification service is configured and available',
      })
    } catch (notificationError) {
      results.push({
        service: 'notification_triggers',
        status: 'error',
        message: 'Notification service test failed',
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error',
      })
    }

    return {
      status: 'completed',
      message: 'Email notification test completed',
      services: results,
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Email notification test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Refund testing endpoint',
    availableTests: [
      {
        type: 'paystack_connection',
        description: 'Test Paystack API connection',
        method: 'POST',
        body: { testType: 'paystack_connection' },
      },
      {
        type: 'coinbase_connection',
        description: 'Test Coinbase API connection',
        method: 'POST',
        body: { testType: 'coinbase_connection' },
      },
      {
        type: 'create_test_refund',
        description: 'Create a test refund request',
        method: 'POST',
        body: { testType: 'create_test_refund', orderId: 'test_order', userId: 'test_user' },
      },
      {
        type: 'refund_workflow',
        description: 'Test complete refund workflow',
        method: 'POST',
        body: { testType: 'refund_workflow' },
      },
      {
        type: 'email_notifications',
        description: 'Test email notification services',
        method: 'POST',
        body: { testType: 'email_notifications' },
      },
    ],
  })
}