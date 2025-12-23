import { NextResponse } from "next/server"
import { sendAdminNewVendorApplicationEmail, sendVendorApplicationSubmittedEmail } from "@/lib/email/service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { vendorEmail, vendorName, storeName, category, storeUrl } = body as {
      vendorEmail: string
      vendorName?: string
      storeName: string
      category?: string
      storeUrl?: string
    }

    if (!vendorEmail || !storeName) {
      return NextResponse.json({ error: "Missing vendorEmail or storeName" }, { status: 400 })
    }

    // Admin recipients from env (comma-separated). Fallback to a sensible default.
    const envList = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const adminRecipients = envList.length > 0 ? envList : [process.env.SUPPORT_EMAIL || "admin@feromarkethub.com"]

    await Promise.all([
      sendVendorApplicationSubmittedEmail(vendorEmail, { vendorName, storeName, category, storeUrl }),
      sendAdminNewVendorApplicationEmail(adminRecipients, { vendorEmail, vendorName, storeName, category, storeUrl }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("vendor-application email error:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
