import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params

    const ticketDoc = await adminDb.collection('support_tickets').doc(ticketId).get()

    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      )
    }

    const ticketData = ticketDoc.data()

    // Get ticket responses
    const responsesSnapshot = await adminDb
      .collection('support_tickets')
      .doc(ticketId)
      .collection('responses')
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
        firstResponseAt: ticketData?.firstResponseAt?.toDate?.() || ticketData?.firstResponseAt,
        lastResponseAt: ticketData?.lastResponseAt?.toDate?.() || ticketData?.lastResponseAt,
      },
      responses,
    })
  } catch (error) {
    console.error('Error fetching support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params
    const { 
      action, 
      assignedTo, 
      status, 
      priority, 
      tags, 
      internalNote,
      response,
      responderId,
      responderName,
      responderRole,
      customerSatisfaction 
    } = await request.json()

    const ticketRef = adminDb.collection('support_tickets').doc(ticketId)
    const ticketDoc = await ticketRef.get()

    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      )
    }

    const ticketData = ticketDoc.data()
    const now = new Date()
    const updateData: any = { updatedAt: now }

    switch (action) {
      case 'assign':
        if (!assignedTo) {
          return NextResponse.json(
            { error: 'assignedTo is required for assign action' },
            { status: 400 }
          )
        }
        updateData.assignedTo = assignedTo
        updateData.assignedBy = responderId
        updateData.status = 'in_progress'
        break

      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'status is required for update_status action' },
            { status: 400 }
          )
        }
        updateData.status = status
        if (status === 'resolved') {
          updateData.resolvedAt = now
        }
        break

      case 'update_priority':
        if (!priority) {
          return NextResponse.json(
            { error: 'priority is required for update_priority action' },
            { status: 400 }
          )
        }
        updateData.priority = priority
        break

      case 'add_tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json(
            { error: 'tags array is required for add_tags action' },
            { status: 400 }
          )
        }
        updateData.tags = [...(ticketData?.tags || []), ...tags]
        break

      case 'add_internal_note':
        if (!internalNote) {
          return NextResponse.json(
            { error: 'internalNote is required for add_internal_note action' },
            { status: 400 }
          )
        }
        const note = {
          note: internalNote,
          addedBy: responderId,
          addedByName: responderName,
          addedAt: now,
        }
        updateData.internalNotes = [...(ticketData?.internalNotes || []), note]
        break

      case 'add_response':
        if (!response || !responderId || !responderName || !responderRole) {
          return NextResponse.json(
            { error: 'response, responderId, responderName, and responderRole are required for add_response action' },
            { status: 400 }
          )
        }

        // Add response to subcollection
        const responseData = {
          message: response,
          responderId,
          responderName,
          responderRole, // 'support', 'admin', 'customer'
          createdAt: now,
          isInternal: responderRole !== 'customer',
        }

        await ticketRef.collection('responses').add(responseData)

        // Update ticket metadata
        updateData.responseCount = (ticketData?.responseCount || 0) + 1
        updateData.lastResponseAt = now
        
        if (!ticketData?.firstResponseAt && responderRole !== 'customer') {
          updateData.firstResponseAt = now
        }

        if (ticketData?.status === 'open' && responderRole !== 'customer') {
          updateData.status = 'in_progress'
        }

        // Send email notification to customer if response is from support
        if (responderRole !== 'customer') {
          try {
            const { sendSupportTicketResponseEmail } = await import('@/lib/email/service')
            await sendSupportTicketResponseEmail({
              ticketNumber: ticketData?.ticketNumber,
              customerName: ticketData?.name,
              customerEmail: ticketData?.email,
              subject: ticketData?.subject,
              response,
              responderName,
            })
          } catch (emailError) {
            console.error('Failed to send response email:', emailError)
          }
        }
        break

      case 'rate_satisfaction':
        if (customerSatisfaction === undefined || customerSatisfaction < 1 || customerSatisfaction > 5) {
          return NextResponse.json(
            { error: 'customerSatisfaction must be between 1 and 5' },
            { status: 400 }
          )
        }
        updateData.customerSatisfaction = customerSatisfaction
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    await ticketRef.update(updateData)

    // Get updated ticket data
    const updatedTicketDoc = await ticketRef.get()
    const updatedTicketData = updatedTicketDoc.data()

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketId,
        ...updatedTicketData,
        createdAt: updatedTicketData?.createdAt?.toDate?.() || updatedTicketData?.createdAt,
        updatedAt: updatedTicketData?.updatedAt?.toDate?.() || updatedTicketData?.updatedAt,
        resolvedAt: updatedTicketData?.resolvedAt?.toDate?.() || updatedTicketData?.resolvedAt,
        firstResponseAt: updatedTicketData?.firstResponseAt?.toDate?.() || updatedTicketData?.firstResponseAt,
        lastResponseAt: updatedTicketData?.lastResponseAt?.toDate?.() || updatedTicketData?.lastResponseAt,
      },
    })
  } catch (error) {
    console.error('Error updating support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params

    // Delete all responses first
    const responsesSnapshot = await adminDb
      .collection('support_tickets')
      .doc(ticketId)
      .collection('responses')
      .get()

    const batch = adminDb.batch()
    responsesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // Delete the ticket
    batch.delete(adminDb.collection('support_tickets').doc(ticketId))

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: 'Support ticket deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to delete support ticket' },
      { status: 500 }
    )
  }
}