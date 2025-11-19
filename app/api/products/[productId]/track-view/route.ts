import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { productId } = params
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 })
    }

    const productRef = adminDb.collection("products").doc(productId)
    await productRef.set(
      {
        stats: {
          views: FieldValue.increment(1),
        },
      },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking product view:", error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
