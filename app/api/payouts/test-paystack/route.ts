import { NextResponse } from 'next/server'
import { paystackTransferService } from '@/lib/payment/paystack-transfers'

export async function GET() {
  try {
    console.log('Testing Paystack configuration...')
    
    // Check environment variable
    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackKey) {
      return NextResponse.json({
        success: false,
        error: 'PAYSTACK_SECRET_KEY not configured',
        details: 'Environment variable PAYSTACK_SECRET_KEY is missing'
      }, { status: 500 })
    }

    if (!paystackKey.startsWith('sk_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Paystack secret key format',
        details: 'Secret key must start with sk_'
      }, { status: 500 })
    }

    // Test connection
    const connectionTest = await paystackTransferService.testConnection()
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Paystack connection failed',
        details: 'Unable to connect to Paystack API'
      }, { status: 500 })
    }

    // Test getting banks
    try {
      const banks = await paystackTransferService.getBanks()
      console.log(`Retrieved ${banks.length} banks from Paystack`)
      
      return NextResponse.json({
        success: true,
        message: 'Paystack configuration is working correctly',
        details: {
          keyFormat: 'Valid (sk_...)',
          connection: 'Success',
          banksCount: banks.length,
          sampleBanks: banks.slice(0, 3).map(b => ({ name: b.name, code: b.code }))
        }
      })
    } catch (banksError: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch banks from Paystack',
        details: banksError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Paystack test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Paystack test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}