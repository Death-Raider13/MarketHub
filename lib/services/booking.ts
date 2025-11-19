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
  vendorId: string
  serviceName: string
  serviceDescription: string
  
  // Scheduling
  scheduledDate?: Date
  scheduledTime?: string
  duration?: number // in minutes
  location?: 'customer_location' | 'vendor_location' | 'online'
  address?: string
  
  // Requirements
  requirements?: string
  customerNotes?: string
  vendorNotes?: string
  
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
  senderType: 'customer' | 'vendor'
  message: string
  timestamp: Date
  attachments?: string[]
}

export interface ServiceAvailability {
  vendorId: string
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
      vendorId: serviceItem.vendorId,
      serviceName: serviceItem.productName,
      serviceDescription: serviceItem.product?.description || '',
      status: 'pending_schedule',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const bookingRef = await adminDb.collection('serviceBookings').add(booking)

    // Notify vendor about new service booking
    try {
      await notifyVendorNewBooking(serviceItem.vendorId, bookingRef.id, serviceItem.productName)
    } catch (notificationError) {
      logger.error('Failed to notify vendor of new booking', { error: notificationError })
    }

    logger.info('Service booking created', {
      bookingId: bookingRef.id,
      orderId,
      serviceId: serviceItem.productId,
      vendorId: serviceItem.vendorId
    })

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
    vendorNotes?: string
  },
  vendorId: string
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
    
    // Verify vendor ownership
    if (bookingData.vendorId !== vendorId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if vendor is available at the requested time
    const isAvailable = await checkVendorAvailability(
      vendorId, 
      scheduleData.scheduledDate, 
      scheduleData.scheduledTime,
      scheduleData.duration || 60
    )

    if (!isAvailable) {
      return { success: false, error: 'Vendor not available at the requested time' }
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

    logger.info('Service booking scheduled', {
      bookingId,
      vendorId,
      scheduledDate: scheduleData.scheduledDate,
      scheduledTime: scheduleData.scheduledTime
    })

    return { success: true }

  } catch (error) {
    logger.error('Error scheduling service booking', { error, bookingId, vendorId })
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
  userType: 'customer' | 'vendor',
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
                     (userType === 'vendor' && bookingData.vendorId === userId)

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
      if (userType === 'vendor') {
        updateData.vendorNotes = notes
      } else {
        updateData.customerNotes = notes
      }
    }

    await bookingRef.update(updateData)

    // Send notifications
    try {
      if (userType === 'vendor') {
        await notifyCustomerServiceUpdate(bookingData.customerId, bookingId, status)
      } else {
        await notifyVendorServiceUpdate(bookingData.vendorId, bookingId, status)
      }
    } catch (notificationError) {
      logger.error('Failed to send service update notification', { error: notificationError })
    }

    logger.info('Service booking status updated', {
      bookingId,
      oldStatus: currentStatus,
      newStatus: status,
      updatedBy: `${userType}:${userId}`
    })

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
  senderType: 'customer' | 'vendor',
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
                      (senderType === 'vendor' && bookingData.vendorId === senderId)

    if (!canMessage) {
      return { success: false, error: 'Unauthorized' }
    }

    const serviceMessage: ServiceMessage = {
      id: `msg_${Date.now()}`,
      senderId,
      senderType,
      message,
      timestamp: new Date(),
      ...(attachments && { attachments }) // Only include attachments if it exists
    }

    // Convert Date objects to Firestore Timestamps for storage
    const messageForStorage = {
      ...serviceMessage,
      timestamp: new Date() // Firestore will convert this properly
    }
    
    // Get existing messages and ensure they're in the right format
    const existingMessages = bookingData.messages || []
    const messagesForStorage = [...existingMessages, messageForStorage]

    await bookingRef.update({
      messages: messagesForStorage,
      updatedAt: new Date()
    })

    // Notify the other party
    try {
      if (senderType === 'customer') {
        await notifyVendorNewMessage(bookingData.vendorId, bookingId, message)
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
 * Get service bookings for vendor
 */
export async function getVendorServiceBookings(vendorId: string) {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const bookingsSnapshot = await adminDb
      .collection('serviceBookings')
      .where('vendorId', '==', vendorId)
      .orderBy('createdAt', 'desc')
      .get()

    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return bookings

  } catch (error) {
    logger.error('Error getting vendor service bookings', { error, vendorId })
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
 * Check vendor availability for a specific time slot
 */
async function checkVendorAvailability(
  vendorId: string,
  date: Date,
  time: string,
  duration: number
): Promise<boolean> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    return false
  }

  try {
    // Check for conflicting bookings on the same date and time
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const conflictingBookings = await adminDb
      .collection('serviceBookings')
      .where('vendorId', '==', vendorId)
      .where('scheduledDate', '>=', startOfDay)
      .where('scheduledDate', '<=', endOfDay)
      .where('status', 'in', ['scheduled', 'in_progress'])
      .get()

    // Check if there's a time conflict
    for (const bookingDoc of conflictingBookings.docs) {
      const booking = bookingDoc.data()
      if (booking.scheduledTime === time) {
        // Same time slot is already booked
        return false
      }
    }

    // If no conflicts, vendor is available
    // Note: In the future, you can add vendor availability schedule checking here
    return true

  } catch (error) {
    logger.error('Error checking vendor availability', { error, vendorId, date, time })
    // On error, allow scheduling (fail-safe approach)
    return true
  }
}

// Notification helper functions (to be implemented)
async function notifyVendorNewBooking(vendorId: string, bookingId: string, serviceName: string) {
  // TODO: Implement notification
  logger.info('Vendor notification: New booking', { vendorId, bookingId, serviceName })
}

async function notifyCustomerServiceScheduled(customerId: string, bookingId: string, date: Date, time: string) {
  // TODO: Implement notification
  logger.info('Customer notification: Service scheduled', { customerId, bookingId, date, time })
}

async function notifyCustomerServiceUpdate(customerId: string, bookingId: string, status: string) {
  // TODO: Implement notification
  logger.info('Customer notification: Service update', { customerId, bookingId, status })
}

async function notifyVendorServiceUpdate(vendorId: string, bookingId: string, status: string) {
  // TODO: Implement notification
  logger.info('Vendor notification: Service update', { vendorId, bookingId, status })
}

async function notifyVendorNewMessage(vendorId: string, bookingId: string, message: string) {
  // TODO: Implement notification
  logger.info('Vendor notification: New message', { vendorId, bookingId })
}

async function notifyCustomerNewMessage(customerId: string, bookingId: string, message: string) {
  // TODO: Implement notification
  logger.info('Customer notification: New message', { customerId, bookingId })
}
