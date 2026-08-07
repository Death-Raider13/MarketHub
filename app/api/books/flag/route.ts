import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { bookId, reason, customerEmail, details } = await request.json();

    if (!bookId || !reason || !customerEmail) {
      return NextResponse.json(
        { error: "Book ID, reason, and customer email are required." },
        { status: 400 }
      );
    }

    // 1) Save flag complaint to Firestore
    const flagRef = await addDoc(collection(db, "flags"), {
      bookId,
      reason,
      details: details || "",
      customerEmail,
      status: "pending_review",
      createdAt: serverTimestamp(),
    });

    // 2) Automatically put book status on hold for admin review
    const bookRef = doc(db, "products", bookId);
    await updateDoc(bookRef, {
      status: "on_hold",
      flaggedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      flagId: flagRef.id,
      message: "Flag logged successfully. Creator payout placed on hold pending admin review & customer refund evaluation."
    });
  } catch (error: any) {
    console.error("Error logging product flag:", error);
    return NextResponse.json(
      { error: "Failed to process flag request.", details: error.message },
      { status: 500 }
    );
  }
}
