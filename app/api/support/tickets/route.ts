import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      email, 
      subject, 
      category, 
      message, 
      priority = 'medium',
      userId,
      orderId,
      productId 
    } = await request.json()

    if (!name || !email || !subject || !message || !category) {
      return NextResponse.json(
        { error: 'Name, email, subject, category, and message are required' },
        { status: 400 }
      )
    }

    // Generate ticket number
    const ticketNumber = `FMHUB-${Date.now().toString().slice(-8)}`

    const ticketData = {
      ticketNumber,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category,
      message: message.trim(),
      priority,
      status: 'open',
      userId: userId || null,
      orderId: orderId || null,
      productId: productId || null,
      assignedTo: null,
      assignedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      firstResponseAt: null,
      lastResponseAt: null,
      responseCount: 0,
      customerSatisfaction: null,
      tags: [],
      internalNotes: [],
      source: 'contact_form',
    }

    const ticketRef = await adminDb.collection('support_tickets').add(ticketData)

    // Send confirmation email to customer
    try {
      const { sendSupportTicketCreatedEmail } = await import('@/lib/email/service')
      await sendSupportTicketCreatedEmail({
        ticketNumber,
        customerName: name,
        customerEmail: email,
        subject,
        category,
        message,
      })
    } catch (emailError) {
      console.error('Failed to send ticket confirmation email:', emailError)
    }

    // Notify support team
    try {
      const { AdminNotificationService } = await import('@/lib/notifications/admin-service')
      const notificationService = AdminNotificationService.getInstance()
      
      // Get all support staff
      const supportStaffQuery = await adminDb
        .collection('users')
        .where('role', 'in', ['support', 'admin', 'super_admin'])
        .get()

      for (const staffDoc of supportStaffQuery.docs) {
        await notificationService.createNotification(
          staffDoc.id,
          'support_ticket_created',
          {
            title: `New Support Ticket: ${subject}`,
            message: `${name} submitted a ${category} ticket: ${subject}`,
            priority: priority as 'low' | 'medium' | 'high',
            metadata: {
              ticketId: ticketRef.id,
              ticketNumber,
              category,
              customerName: name,
              customerEmail: email,
              actionUrl: `/support/tickets/${ticketRef.id}`
            } as any
          }
        )
      }

      // Send email notification to support team
      const { sendSupportTicketNotificationEmail } = await import('@/lib/email/service')
      await sendSupportTicketNotificationEmail({
        ticketId: ticketRef.id,
        ticketNumber,
        customerName: name,
        customerEmail: email,
        subject,
        category,
        message,
        priority,
      })
    } catch (notifyError) {
      console.error('Failed to notify support team:', notifyError)
    }

    return NextResponse.json({
      success: true,
      ticketId: ticketRef.id,
      ticketNumber,
      message: 'Support ticket created successfully',
    })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query: any = adminDb.collection('support_tickets')

    // Apply filters
    if (status) {
      query = query.where('status', '==', status)
    }
    if (category) {
      query = query.where('category', '==', category)
    }
    if (priority) {
      query = query.where('priority', '==', priority)
    }
    if (assignedTo) {
      query = query.where('assignedTo', '==', assignedTo)
    }
    if (userId) {
      query = query.where('userId', '==', userId)
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc')

    // Apply pagination
    const offset = (page - 1) * limit
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get()
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
        query = query.startAfter(lastDoc)
      }
    }

    query = query.limit(limit)

    const snapshot = await query.get()
    
    const tickets = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      resolvedAt: doc.data().resolvedAt?.toDate?.() || doc.data().resolvedAt,
      firstResponseAt: doc.data().firstResponseAt?.toDate?.() || doc.data().firstResponseAt,
      lastResponseAt: doc.data().lastResponseAt?.toDate?.() || doc.data().lastResponseAt,
    }))

    // Get total count for pagination
    const totalQuery = adminDb.collection('support_tickets')
    let countQuery: any = totalQuery
    if (status) countQuery = countQuery.where('status', '==', status)
    if (category) countQuery = countQuery.where('category', '==', category)
    if (priority) countQuery = countQuery.where('priority', '==', priority)
    if (assignedTo) countQuery = countQuery.where('assignedTo', '==', assignedTo)
    if (userId) countQuery = countQuery.where('userId', '==', userId)

    const totalSnapshot = await countQuery.get()
    const total = totalSnapshot.size

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}