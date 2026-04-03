import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'

/**
 * GET: Fetch all support staff (Admin Only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users with role 'support'
    const snapshot = await adminDb.collection('users')
      .where('role', '==', 'support')
      .get()
    
    const staff = snapshot.docs.map(doc => ({
      uid: doc.id,
      displayName: doc.data().displayName || doc.data().email || 'Support Staff',
      email: doc.data().email,
    }))

    return NextResponse.json({
      success: true,
      staff,
    })
  } catch (error) {
    console.error('Error fetching support staff:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
