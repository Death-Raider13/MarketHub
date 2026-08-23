import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAuthToken } from "@/lib/api-auth"
import axios from "axios"

/**
 * Credit an advertiser's account balance after a confirmed Paystack payment.
 *
 * Security:
 *  - Requires a valid Firebase ID token.
 *  - The authenticated user must match the userId being credited (or be admin).
 *  - The Paystack reference is verified server-side via the Paystack API.
 *  - The amount credited is taken from Paystack's response, not the request body.
 *  - References are idempotent: a second call with the same reference is a no-op.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { userId, reference } = body as { userId?: string; reference?: string }

    if (!userId || !reference) {
      return NextResponse.json(
        { error: "Missing required fields: userId and reference" },
        { status: 400 }
      )
    }

    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'
    if (userId !== auth.user.uid && !isAdmin) {
      return NextResponse.json(
        { error: "You can only top up your own account" },
        { status: 403 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured")
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      )
    }

    // Idempotency: refuse to credit twice for the same reference.
    const existing = await adminDb
      .collection("transactions")
      .where("reference", "==", reference)
      .where("type", "==", "credit")
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json({
        success: true,
        message: "Funds already credited for this reference",
        idempotent: true,
      })
    }

    // Verify the transaction with Paystack — trust their response, not the caller.
    let paystackData: any
    try {
      const verifyRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      )
      paystackData = verifyRes.data?.data
    } catch (err: any) {
      console.error("Paystack verification failed:", err?.response?.data || err?.message)
      return NextResponse.json(
        { error: "Could not verify payment with Paystack" },
        { status: 400 }
      )
    }

    if (!paystackData || paystackData.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful", status: paystackData?.status },
        { status: 400 }
      )
    }

    // Paystack amounts are in kobo — convert to Naira.
    const amount = Math.floor(Number(paystackData.amount) / 100)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    // Atomic credit + transaction log.
    const advertiserRef = adminDb.collection("advertisers").doc(userId)
    const txRef = adminDb.collection("transactions").doc()

    await adminDb.runTransaction(async (tx) => {
      const advertiserDoc = await tx.get(advertiserRef)
      if (!advertiserDoc.exists) {
        tx.set(advertiserRef, {
          userId,
          accountBalance: amount,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      } else {
        tx.update(advertiserRef, {
          accountBalance: FieldValue.increment(amount),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }

      tx.set(txRef, {
        userId,
        type: "credit",
        amount,
        reference,
        description: "Account top-up",
        status: "completed",
        provider: "paystack",
        paystackChannel: paystackData.channel || null,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({
      success: true,
      message: "Funds added successfully",
      amount,
      transactionId: txRef.id,
    })
  } catch (error: any) {
    console.error("Error adding funds:", error)
    return NextResponse.json({ error: "Failed to add funds" }, { status: 500 })
  }
}
