import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code, email, originalAmount = 2500 } = await request.json();

    if (!code || !email) {
      return NextResponse.json(
        { error: "Promo code and email address are required." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    // 1) Verify Promo Code validity
    const promoRef = collection(db, "promo_codes");
    const promoQuery = query(promoRef, where("code", "==", normalizedCode), where("active", "==", true));
    const promoSnapshot = await getDocs(promoQuery);

    if (promoSnapshot.empty) {
      return NextResponse.json({
        valid: false,
        message: "Invalid or expired promo code."
      }, { status: 400 });
    }

    const promoData = promoSnapshot.docs[0].data();
    const discountPercent = promoData.discountPercent || 25;

    // 2) Cross-reference email against the Waitlist collection
    const waitlistRef = collection(db, "waitlist");
    const waitlistQuery = query(waitlistRef, where("email", "==", normalizedEmail));
    const waitlistSnapshot = await getDocs(waitlistQuery);

    if (waitlistSnapshot.empty) {
      return NextResponse.json({
        valid: false,
        message: "Sorry, 25% OFF promo codes are exclusive to registered Waitlist members."
      }, { status: 400 });
    }

    // 3) Calculate discounted price
    const discountAmount = (originalAmount * discountPercent) / 100;
    const finalAmount = originalAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      discountPercent,
      originalAmount,
      discountAmount,
      finalAmount,
      message: `Waitlist verified! ${discountPercent}% OFF discount applied.`
    });

  } catch (error: any) {
    console.error("Error verifying promo code:", error);
    return NextResponse.json(
      { error: "Failed to process promo verification.", details: error.message },
      { status: 500 }
    );
  }
}
