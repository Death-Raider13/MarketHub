import { NotificationData, NotificationPriority, NotificationType } from './types'

async function getClientDb() {
  const { db } = await import('@/lib/firebase/config')
  return db
}

async function getAuthToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase/config')
  if (!auth.currentUser) {
    return null
  }
  return auth.currentUser.getIdToken()
}

async function authFetch(url: string, body: Record<string, any>) {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Notification request failed')
  }

  return response.json()
}

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  customData?: Partial<NotificationData>
): Promise<void> {
  await authFetch('/api/notifications/send', {
    recipientId,
    type,
    customData: customData || {},
  })
}

export async function createRoleNotification(
  targetRoles: string[],
  type: NotificationType,
  customData?: Partial<NotificationData>
): Promise<void> {
  await authFetch('/api/admin/notifications/send', {
    targetRoles,
    type,
    customData: customData || {},
  })
}

export async function getUserNotifications(
  userId: string,
  limitCount: number = 50,
  unreadOnly: boolean = false
): Promise<NotificationData[]> {
  const db = await getClientDb()
  const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore')

  let q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  if (unreadOnly) {
    q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('status', '==', 'unread'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => {
    const data = doc.data() as any
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt || undefined,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt || null,
    } as NotificationData
  })
}

export async function markAsRead(notificationId: string): Promise<void> {
  const db = await getClientDb()
  const { doc, updateDoc } = await import('firebase/firestore')
  await updateDoc(doc(db, 'notifications', notificationId), {
    status: 'read',
    readAt: new Date(),
  })
}

export async function markAllAsRead(userId: string): Promise<void> {
  const db = await getClientDb()
  const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore')
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('status', '==', 'unread')
  )

  const snapshot = await getDocs(notificationsQuery)
  const promises = snapshot.docs.map(notificationDoc =>
    updateDoc(doc(db, 'notifications', notificationDoc.id), {
      status: 'read',
      readAt: new Date(),
    })
  )

  await Promise.all(promises)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = await getClientDb()
  const { collection, query, where, getDocs } = await import('firebase/firestore')
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('status', '==', 'unread')
  )

  const snapshot = await getDocs(q)
  return snapshot.size
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationData[]) => void,
  limitCount: number = 20
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let unsubscribe: (() => void) | null = null

  ;(async () => {
    try {
      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')
      const db = await getClientDb()
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )

      unsubscribe = onSnapshot(q, snapshot => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data() as any
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt || undefined,
            expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt || null,
          } as NotificationData
        })

        callback(notifications)
      })
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
    }
  })()

  return () => {
    if (unsubscribe) {
      unsubscribe()
    }
  }
}
