import { NextResponse } from "next/server"
import { sendAdminNewcreatorApplicationEmail, sendcreatorApplicationSubmittedEmail } from "@/lib/email/service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { creatorEmail, creatorName, storeName, category, storeUrl } = body as {
      creatorEmail: string
      creatorName?: string
      storeName: string
      category?: string
      storeUrl?: string
    }

    if (!creatorEmail || !storeName) {
      return NextResponse.json({ error: "Missing creatorEmail or storeName" }, { status: 400 })
    }

    // Admin recipients from env (comma-separated). Fallback to a sensible default.
    const envList = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const adminRecipients = envList.length > 0 ? envList : [process.env.SUPPORT_EMAIL || "admin@feromarkethub.com"]

    await Promise.all([
      sendcreatorApplicationSubmittedEmail(creatorEmail, { creatorName, storeName, category, storeUrl }),
      sendAdminNewcreatorApplicationEmail(adminRecipients, { creatorEmail, creatorName, storeName, category, storeUrl }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("creator-application email error:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
