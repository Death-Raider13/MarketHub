import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    
    if (!paystackKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const { accountNumber, bankCode } = await request.json()

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      )
    }

    // Validate account number format (should be 10 digits for most Nigerian banks)
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      )
    }

    // Call Paystack API directly
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const accountDetails = response.data.data

    return NextResponse.json({
      success: true,
      accountDetails: {
        accountNumber: accountDetails.account_number,
        accountName: accountDetails.account_name,
        bankId: accountDetails.bank_id
      }
    })

  } catch (error: any) {
    console.error('Error verifying account:', error.response?.data || error.message)
    
    // Handle specific Paystack errors
    if (error.response?.status === 422 || error.response?.data?.message?.includes('Could not resolve')) {
      return NextResponse.json(
        { error: 'Invalid account number or bank combination. Please check and try again.' },
        { status: 400 }
      )
    }

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Payment gateway authentication failed. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to verify account details. Please try again.' },
      { status: 500 }
    )
  }
}
