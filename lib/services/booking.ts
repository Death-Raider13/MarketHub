/**
 * Service Booking System
 * Handles service appointments, scheduling, and management
 */

import { getAdminFirestore } from '@/lib/firebase/admin'
import { logger } from '@/lib/logger'

export interface ServiceBooking {
  id?: string
  orderId: string
  serviceId: string
  customerId: string
  creatorId: string
  serviceName: string
  serviceDescription: string

  // Scheduling
  scheduledDate?: Date
  scheduledTime?: string
  duration?: number // in minutes
  location?: 'customer_location' | 'creator_location' | 'online'
  address?: string

  // Requirements
  requirements?: string
  customerNotes?: string
  creatorNotes?: string

  // Status
  status: 'pending_schedule' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

  // Communication
  messages?: ServiceMessage[]

  // Completion
  completedAt?: Date
  rating?: number
  review?: string

  createdAt: Date
  updatedAt: Date
}

export interface ServiceMessage {
  id: string
  senderId: string
  senderType: 'customer' | 'creator'
  message: string
  timestamp: Date
  attachments?: string[]
}

export interface ServiceAvailability {
  creatorId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // "09:00"
  endTime: string // "17:00"
  isAvailable: boolean
}

/**
 * Create a service booking after order payment
 */
export async function createServiceBooking(
  orderId: string,
  serviceItem: any,
  customerId: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const booking: ServiceBooking = {
      orderId,
      serviceId: serviceItem.productId,
      customerId,
      creatorId: serviceItem.creatorId || serviceItem.creatorId,
      serviceName: serviceItem.productName,
      serviceDescription: serviceItem.product?.description || '',
      status: 'pending_schedule',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const bookingRef = await adminDb.collection('serviceBookings').add(booking)

    // Notify creator about new service booking
    try {
      await notifyCreatorNewBooking(booking.creatorId, bookingRef.id, serviceItem.productName)
    } catch (notificationError) {
      logger.error('Failed to notify creator of new booking', { error: notificationError })
    }

    // Send customer confirmation email for service booking
    try {
      // Get customer details
      const customerDoc = await adminDb.collection('users').doc(customerId).get()
      const customerData = customerDoc.data()
      const customerEmail = customerData?.email
      const customerName = customerData?.displayName || customerData?.name || customerEmail?.split('@')[0] || 'Customer'

      if (customerEmail) {
        const { sendServiceBookingConfirmationEmail } = await import('@/lib/email/service')
        await sendServiceBookingConfirmationEmail(
          customerEmail,
          customerName,
          {
            id: bookingRef.id,
            orderId,
            serviceName: serviceItem.productName,
            serviceDescription: serviceItem.product?.description || '',
            creatorId: booking.creatorId
          },
          serviceItem.productPrice * serviceItem.quantity
        )
        console.log('✅ Service booking confirmation email sent to customer')
      }
    } catch (emailError) {
      logger.error('Failed to send service booking confirmation email', { error: emailError })
    }

    return { success: true, bookingId: bookingRef.id }

  } catch (error) {
    logger.error('Error creating service booking', { error, orderId, serviceItem })
    return { success: false, error: 'Failed to create service booking' }
  }
}

/**
 * Schedule a service booking
 */
export async function scheduleServiceBooking(
  bookingId: string,
  scheduleData: {
    scheduledDate: Date
    scheduledTime: string
    duration?: number
    location?: string
    address?: string
    creatorNotes?: string
  },
  creatorId: string
): Promise<{ success: boolean; error?: string }> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingRef = adminDb.collection('serviceBookings').doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return { success: false, error: 'Booking not found' }
    }

    const bookingData = bookingDoc.data() as ServiceBooking

    // Verify creator ownership
    if (bookingData.creatorId !== creatorId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if creator is available at the requested time
    const isAvailable = await checkCreatorAvailability(
      creatorId,
      scheduleData.scheduledDate,
      scheduleData.scheduledTime,
      scheduleData.duration || 60
    )

    if (!isAvailable) {
      return { success: false, error: 'Creator not available at the requested time' }
    }

    // Update booking with schedule
    await bookingRef.update({
      ...scheduleData,
      status: 'scheduled',
      updatedAt: new Date()
    })

    // Notify customer about scheduled service
    try {
      await notifyCustomerServiceScheduled(
        bookingData.customerId,
        bookingId,
        scheduleData.scheduledDate,
        scheduleData.scheduledTime
      )
    } catch (notificationError) {
      logger.error('Failed to notify customer of scheduled service', { error: notificationError })
    }

    return { success: true }

  } catch (error) {
    logger.error('Error scheduling service booking', { error, bookingId, creatorId })
    return { success: false, error: 'Failed to schedule service' }
  }
}

/**
 * Update service booking status
 */
export async function updateServiceStatus(
  bookingId: string,
  status: ServiceBooking['status'],
  userId: string,
  userType: 'customer' | 'creator',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingRef = adminDb.collection('serviceBookings').doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return { success: false, error: 'Booking not found' }
    }

    const bookingData = bookingDoc.data() as ServiceBooking

    // Verify authorization
    const canUpdate = (userType === 'customer' && bookingData.customerId === userId) ||
      (userType === 'creator' && bookingData.creatorId === userId)

    if (!canUpdate) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'pending_schedule': ['scheduled', 'cancelled'],
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    }

    const currentStatus = bookingData.status
    if (!validTransitions[currentStatus]?.includes(status)) {
      return { success: false, error: `Cannot change status from ${currentStatus} to ${status}` }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    if (notes) {
      if (userType === 'creator') {
        updateData.creatorNotes = notes
      } else {
        updateData.customerNotes = notes
      }
    }

    await bookingRef.update(updateData)

    // Send notifications
    try {
      if (userType === 'creator') {
        await notifyCustomerServiceUpdate(bookingData.customerId, bookingId, status)
      } else {
        await notifyCreatorServiceUpdate(bookingData.creatorId, bookingId, status)
      }
    } catch (notificationError) {
      logger.error('Failed to send service update notification', { error: notificationError })
    }

    return { success: true }

  } catch (error) {
    logger.error('Error updating service status', { error, bookingId, userId })
    return { success: false, error: 'Failed to update service status' }
  }
}

/**
 * Add message to service booking
 */
export async function addServiceMessage(
  bookingId: string,
  senderId: string,
  senderType: 'customer' | 'creator',
  message: string,
  attachments?: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingRef = adminDb.collection('serviceBookings').doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return { success: false, error: 'Booking not found' }
    }

    const bookingData = bookingDoc.data() as ServiceBooking

    // Verify authorization
    const canMessage = (senderType === 'customer' && bookingData.customerId === senderId) ||
      (senderType === 'creator' && bookingData.creatorId === senderId)

    if (!canMessage) {
      return { success: false, error: 'Unauthorized' }
    }

    const serviceMessage: ServiceMessage = {
      id: `msg_${Date.now()}`,
      senderId,
      senderType,
      message,
      timestamp: new Date(),
      ...(attachments && { attachments })
    }

    const existingMessages = bookingData.messages || []
    const messagesForStorage = [...existingMessages, serviceMessage]

    await bookingRef.update({
      messages: messagesForStorage,
      updatedAt: new Date()
    })

    // Notify the other party
    try {
      if (senderType === 'customer') {
        await notifyCreatorNewMessage(bookingData.creatorId, bookingId, message)
      } else {
        await notifyCustomerNewMessage(bookingData.customerId, bookingId, message)
      }
    } catch (notificationError) {
      logger.error('Failed to send message notification', { error: notificationError })
    }

    return { success: true, messageId: serviceMessage.id }

  } catch (error) {
    logger.error('Error adding service message', { error, bookingId, senderId })
    return { success: false, error: 'Failed to send message' }
  }
}

/**
 * Get service bookings for creator
 */
export async function getCreatorServiceBookings(creatorId: string) {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingsSnapshot = await adminDb
      .collection('serviceBookings')
      .where('creatorId', '==', creatorId)
      .orderBy('createdAt', 'desc')
      .get()

    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return bookings

  } catch (error) {
    logger.error('Error getting creator service bookings', { error, creatorId })
    throw error
  }
}

/**
 * Get service bookings for customer
 */
export async function getCustomerServiceBookings(customerId: string) {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingsSnapshot = await adminDb
      .collection('serviceBookings')
      .where('customerId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .get()

    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return bookings

  } catch (error) {
    logger.error('Error getting customer service bookings', { error, customerId })
    throw error
  }
}

/**
 * Check creator availability for a specific time slot
 */
async function checkCreatorAvailability(
  creatorId: string,
  date: Date,
  time: string,
  duration: number
): Promise<boolean> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    return false
  }

  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const conflictingBookings = await adminDb
      .collection('serviceBookings')
      .where('creatorId', '==', creatorId)
      .where('scheduledDate', '>=', startOfDay)
      .where('scheduledDate', '<=', endOfDay)
      .where('status', 'in', ['scheduled', 'in_progress'])
      .get()

    for (const bookingDoc of conflictingBookings.docs) {
      const booking = bookingDoc.data()
      if (booking.scheduledTime === time) {
        return false
      }
    }

    return true

  } catch (error) {
    logger.error('Error checking creator availability', { error, creatorId, date, time })
    return true
  }
}

// Notification helper functions
async function notifyCreatorNewBooking(creatorId: string, bookingId: string, serviceName: string) {
  logger.info('Creator notification: New booking', { creatorId, bookingId, serviceName })
}

async function notifyCustomerServiceScheduled(customerId: string, bookingId: string, date: Date, time: string) {
  logger.info('Customer notification: Service scheduled', { customerId, bookingId, date, time })
}

async function notifyCustomerServiceUpdate(customerId: string, bookingId: string, status: string) {
  logger.info('Customer notification: Service update', { customerId, bookingId, status })
}

async function notifyCreatorServiceUpdate(creatorId: string, bookingId: string, status: string) {
  logger.info('Creator notification: Service update', { creatorId, bookingId, status })
}

async function notifyCreatorNewMessage(creatorId: string, bookingId: string, message: string) {
  logger.info('Creator notification: New message', { creatorId, bookingId })
}

async function notifyCustomerNewMessage(customerId: string, bookingId: string, message: string) {
  logger.info('Customer notification: New message', { customerId, bookingId })
}

