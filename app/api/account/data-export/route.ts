import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getAdminFirestore } from "@/lib/firebase/admin"
import { verifyAuthToken } from "@/lib/api-auth"

/**
 * NDPR / data-access endpoint.
 *
 * Returns a JSON dump of every personal record we hold for the authenticated
 * user. Customers and creators can both call this to satisfy data-access
 * requests required by the Nigeria Data Protection Regulation.
 *
 * NOTE: returns a structured JSON document, not a downloadable archive — the
 * client can offer it as a `data:` download. We deliberately omit other users'
 * messages, only including the authenticated side of each conversation.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  const adminDb = getAdminFirestore()
  if (!adminDb) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const uid = auth.user.uid

  try {
    const [
      userDoc,
      orders,
      purchases,
      reviews,
      payouts,
      creatorBalances,
      reputation,
      messagesSent,
      tickets,
      transactions,
      downloads,
      reports,
    ] = await Promise.all([
      adminDb.collection('users').doc(uid).get(),
      adminDb.collection('orders').where('userId', '==', uid).get(),
      adminDb.collection('purchasedProducts').where('userId', '==', uid).get(),
      adminDb.collection('reviews').where('userId', '==', uid).get(),
      adminDb.collection('payoutRequests').where('creatorId', '==', uid).get(),
      adminDb.collection('creatorBalances').doc(uid).get(),
      adminDb.collection('creator_reputation').doc(uid).get(),
      adminDb.collection('messages').where('senderId', '==', uid).get(),
      adminDb.collection('support_tickets').where('userId', '==', uid).get(),
      adminDb.collection('transactions').where('userId', '==', uid).get(),
      adminDb.collection('downloadLogs').where('userId', '==', uid).get(),
      adminDb.collection('abuse_reports').where('reporterId', '==', uid).get(),
    ])

    const snap = (s: FirebaseFirestore.QuerySnapshot) =>
      s.docs.map((d) => ({ id: d.id, ...d.data() }))

    const payload = {
      exportedAt: new Date().toISOString(),
      user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null,
      orders: snap(orders),
      purchases: snap(purchases),
      reviews: snap(reviews),
      messagesSent: snap(messagesSent),
      supportTickets: snap(tickets),
      transactions: snap(transactions),
      downloadLogs: snap(downloads),
      reportsFiled: snap(reports),
      creatorData: {
        balance: creatorBalances.exists ? creatorBalances.data() : null,
        reputation: reputation.exists ? reputation.data() : null,
        payoutRequests: snap(payouts),
      },
    }

    return NextResponse.json(payload, {
      headers: {
        'Content-Disposition': `attachment; filename="markethub-data-${uid}.json"`,
      },
    })
  } catch (err: any) {
    console.error('Data export failed', err)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
