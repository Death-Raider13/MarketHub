import { NextResponse } from "next/server"
import { sendcreatorApplicationDecisionEmail } from "@/lib/email/service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { creatorEmail, decision, storeName, reason } = body as {
      creatorEmail: string
      decision: 'approved' | 'rejected'
      storeName?: string
      reason?: string
    }

    if (!creatorEmail || !decision) {
      return NextResponse.json({ error: "Missing creatorEmail or decision" }, { status: 400 })
    }

    await sendcreatorApplicationDecisionEmail(creatorEmail, decision, storeName, reason)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("creator-decision email error:", error)
    return NextResponse.json({ error: "Failed to send decision email" }, { status: 500 })
  }
}
