import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    
    if (!paystackKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Call Paystack API directly
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json'
      }
    })

    const banks = response.data.data
    
    // Filter for Nigerian banks and sort alphabetically
    const nigerianBanks = banks
      .filter((bank: any) => bank.country === 'Nigeria' && bank.active)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((bank: any) => ({
        code: bank.code,
        name: bank.name,
        slug: bank.slug
      }))

    return NextResponse.json({
      success: true,
      banks: nigerianBanks
    })

  } catch (error: any) {
    console.error('Error fetching banks:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch bank list' },
      { status: 500 }
    )
  }
}
