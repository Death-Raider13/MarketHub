import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { vendorId } = params
    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 })
    }

    const vendorRef = adminDb.collection("vendorStats").doc(vendorId)
    await vendorRef.set(
      {
        storeViews: FieldValue.increment(1),
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking store view:", error)
    return NextResponse.json({ error: "Failed to track store view" }, { status: 500 })
  }
}
