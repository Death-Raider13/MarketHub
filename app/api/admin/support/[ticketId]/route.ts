import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'
import { sendEmail } from '@/lib/email/send-email'

export const dynamic = 'force-dynamic'

/**
 * GET: Fetch a specific support ticket (Admin Only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketId } = params
    const ticketDoc = await adminDb.collection('support_tickets').doc(ticketId).get()

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticketData = ticketDoc.data()
    
    // Get ALL responses (including internal)
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
      },
      responses,
    })
  } catch (error) {
    console.error('Error fetching admin ticket detail:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PATCH: Update ticket status, add response, or internal note (Admin Only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticketId } = params
    const { 
      action, 
      response, 
      status, 
      priority, 
      isInternal = false,
      staffId,
      staffName 
    } = await request.json()
    const ticketRef = adminDb.collection('support_tickets').doc(ticketId)
    const ticketDoc = await ticketRef.get()

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticketData = ticketDoc.data()
    const now = new Date()
    const updateData: any = { updatedAt: now }

    if (action === 'add_response') {
      if (!response || response.trim() === '') {
        return NextResponse.json({ error: 'Response message is required' }, { status: 400 })
      }

      await ticketRef.collection('responses').add({
        message: response.trim(),
        responderId: auth.user.uid,
        responderName: auth.user.displayName || auth.user.email,
        responderRole: 'support',
        createdAt: now,
        isInternal,
      })

      if (!isInternal) {
        updateData.lastResponseAt = now
        updateData.responseCount = (ticketData?.responseCount || 0) + 1
        // Auto-set status to 'in_progress' if the admin replies to an 'open' ticket
        if (ticketData?.status === 'open') {
          updateData.status = 'in_progress'
        }
      }
    }

    if (action === 'assign') {
      if (!staffId) {
        return NextResponse.json({ error: 'Staff ID is required for assignment' }, { status: 400 })
      }

      updateData.assignedTo = staffId
      updateData.assignedByName = auth.user.displayName || auth.user.email
      updateData.assignedByUid = auth.user.uid
      updateData.assignedAt = now
      updateData.staffName = staffName || 'Support Staff'

      // Notify the assigned staff
      const staffDoc = await adminDb.collection('users').doc(staffId).get()
      if (staffDoc.exists) {
        const staffEmail = staffDoc.data()?.email
        if (staffEmail) {
          await sendEmail({
            to: staffEmail,
            subject: `Ticket Assigned: ${ticketData?.ticketNumber}`,
            html: `
              <h1>Support Ticket Assignment</h1>
              <p>Hello ${staffName || 'Support Staff'},</p>
              <p>A new support ticket has been assigned to you by ${auth.user.displayName || auth.user.email}.</p>
              <p><strong>Ticket Number:</strong> ${ticketData?.ticketNumber}</p>
              <p><strong>Subject:</strong> ${ticketData?.subject}</p>
              <p>Please log in to your support dashboard to start treating the request.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/support/staff/tickets/${ticketId}">View Ticket</a>
            `
          })
        }
      }
    }

    if (action === 'submit_report') {
      const { reportContent } = await request.json()
      if (!reportContent || reportContent.trim() === '') {
        return NextResponse.json({ error: 'Report content is required' }, { status: 400 })
      }

      updateData.status = 'resolved'
      updateData.resolvedAt = now
      updateData.report = {
        content: reportContent.trim(),
        submittedBy: auth.user.displayName || auth.user.email,
        submittedAt: now
      }

      // Add a final response to the thread if needed or just notify
      await ticketRef.collection('responses').add({
        message: "The issue has been marked as resolved by support. A final report has been submitted to the administration.",
        responderId: auth.user.uid,
        responderName: auth.user.displayName || auth.user.email,
        responderRole: 'support',
        createdAt: now,
        isInternal: true
      })

      // Notify the customer
      if (ticketData?.email) {
        await sendEmail({
          to: ticketData.email,
          subject: `Ticket Resolved: ${ticketData?.ticketNumber}`,
          html: `
            <h1>Support Ticket Resolved</h1>
            <p>Hello ${ticketData.name},</p>
            <p>Your support ticket ${ticketData?.ticketNumber} has been resolved by our team.</p>
            <p><strong>Resolution Message:</strong> ${reportContent.trim()}</p>
            <p>If you have any further issues or would like to provide feedback, please view your ticket details.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support/my-tickets/${ticketId}">View Ticket & Provide Feedback</a>
          `
        })
      }
    }

    if (status) {
      updateData.status = status
      if (status === 'resolved') {
        updateData.resolvedAt = now
      }
    }

    if (priority) {
      updateData.priority = priority
    }

    await ticketRef.update(updateData)

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
    })
  } catch (error) {
    console.error('Error updating admin ticket:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
