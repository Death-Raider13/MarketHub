import { NextResponse } from "next/server"
import { sendVendorApplicationDecisionEmail } from "@/lib/email/service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { vendorEmail, decision, storeName, reason } = body as {
      vendorEmail: string
      decision: 'approved' | 'rejected'
      storeName?: string
      reason?: string
    }

    if (!vendorEmail || !decision) {
      return NextResponse.json({ error: "Missing vendorEmail or decision" }, { status: 400 })
    }

    await sendVendorApplicationDecisionEmail(vendorEmail, decision, storeName, reason)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("vendor-decision email error:", error)
    return NextResponse.json({ error: "Failed to send decision email" }, { status: 500 })
  }
}
