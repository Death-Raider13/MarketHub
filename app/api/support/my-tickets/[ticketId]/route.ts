import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/api-auth'

/**
 * GET: Fetch a specific support ticket for the authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { uid } = auth.user
    const { ticketId } = params

    const ticketDoc = await adminDb.collection('support_tickets').doc(ticketId).get()

    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      )
    }

    const ticketData = ticketDoc.data()

    // Verify ownership
    if (ticketData?.userId !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized to view this ticket' },
        { status: 403 }
      )
    }

    // Get ticket responses
    const responsesSnapshot = await adminDb
      .collection('support_tickets')
      .doc(ticketId)
      .collection('responses')
      .where('isInternal', '==', false) // Only show public responses
      .orderBy('createdAt', 'asc')
      .get()

    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }))

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketId,
        ...ticketData,
        createdAt: ticketData?.createdAt?.toDate?.() || ticketData?.createdAt,
        updatedAt: ticketData?.updatedAt?.toDate?.() || ticketData?.updatedAt,
        resolvedAt: ticketData?.resolvedAt?.toDate?.() || ticketData?.resolvedAt,
      },
      responses,
    })
  } catch (error) {
    console.error('Error fetching my support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Update a support ticket (add response or rate satisfaction)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { uid } = auth.user
    const { ticketId } = params
    const { action, response, customerSatisfaction } = await request.json()

    const ticketRef = adminDb.collection('support_tickets').doc(ticketId)
    const ticketDoc = await ticketRef.get()

    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      )
    }

    const ticketData = ticketDoc.data()

    // Verify ownership
    if (ticketData?.userId !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this ticket' },
        { status: 403 }
      )
    }

    const now = new Date()
    const updateData: any = { updatedAt: now }

    if (action === 'add_response') {
      if (!response || response.trim() === '') {
        return NextResponse.json(
          { error: 'Response message is required' },
          { status: 400 }
        )
      }

      // Add response to subcollection
      const responseData = {
        message: response.trim(),
        responderId: uid,
        responderName: auth.user.email?.split('@')[0] || 'User',
        responderRole: 'customer',
        createdAt: now,
        isInternal: false,
      }

      await ticketRef.collection('responses').add(responseData)

      // Update ticket metadata
      updateData.responseCount = (ticketData?.responseCount || 0) + 1
      updateData.lastResponseAt = now
      updateData.status = 'open' // Re-open if it was in progress/resolved? Or just keep same? Admin usually wants to know customer replied.
    } else if (action === 'rate_satisfaction') {
      const { rating, comment } = await request.json()
      if (rating === undefined || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
      updateData.feedback = {
        rating,
        comment: comment || '',
        createdAt: now
      }
      updateData.customerSatisfaction = rating
    } else {
      return NextResponse.json(
        { error: 'Invalid or unauthorized action' },
        { status: 400 }
      )
    }

    await ticketRef.update(updateData)

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
    })
  } catch (error) {
    console.error('Error updating my support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    )
  }
}
