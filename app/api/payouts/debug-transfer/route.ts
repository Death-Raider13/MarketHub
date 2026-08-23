import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'
import { paystackTransferService } from '@/lib/payment/paystack-transfers'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.success || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    console.log('=== DEBUG TRANSFER TEST ===')
    
    // Test 1: Check Paystack connection
    console.log('1. Testing Paystack connection...')
    const connectionTest = await paystackTransferService.testConnection()
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        step: 'connection',
        error: 'Paystack connection failed'
      })
    }
    console.log('✅ Connection test passed')

    // Test 2: Get banks
    console.log('2. Testing bank retrieval...')
    const banks = await paystackTransferService.getBanks()
    console.log(`✅ Retrieved ${banks.length} banks`)

    // Test 3: Test account resolution with a known test account
    console.log('3. Testing account resolution...')
    try {
      // Using GTBank test account (this is a common test account)
      const testAccount = await paystackTransferService.resolveAccountNumber(
        '0123456789', // Test account number
        '058' // GTBank code
      )
      console.log('✅ Account resolution test passed:', testAccount)
    } catch (accountError: any) {
      console.log('⚠️ Account resolution failed (expected for test):', accountError.message)
    }

    // Test 4: Check balance
    console.log('4. Testing balance check...')
    try {
      const balance = await paystackTransferService.getBalance()
      console.log('✅ Balance check passed:', balance)
    } catch (balanceError: any) {
      console.log('⚠️ Balance check failed:', balanceError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Debug tests completed',
      results: {
        connection: 'passed',
        banksCount: banks.length,
        sampleBanks: banks.slice(0, 5).map(b => ({ name: b.name, code: b.code }))
      }
    })

  } catch (error: any) {
    console.error('=== DEBUG TRANSFER ERROR ===')
    console.error('Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Payout diagnostic failed'
    }, { status: 500 })
  }
}