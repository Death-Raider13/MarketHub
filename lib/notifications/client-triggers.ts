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
    throw new Error(error || 'Notification trigger request failed')
  }

  return response.json()
}

export async function onOrderPlaced(
  orderId: string,
  customerId: string,
  creatorId: string | undefined,
  amount: number
): Promise<void> {
  await authFetch('/api/notifications/order-placed', {
    orderId,
    customerId,
    creatorId,
    amount,
  })
}

export async function onPasswordChanged(userId: string): Promise<void> {
  await authFetch('/api/notifications/send', {
    recipientId: userId,
    type: 'password_changed',
    customData: {
      actionUrl: '/account/security',
    },
  })
}

export async function onUserRegistration(userId: string, userName: string, userRole: string): Promise<void> {
  await authFetch('/api/notifications/user-registered', {
    userId,
    userName,
    userRole,
  })
}

export async function onSystemMaintenance(
  maintenanceDate: string,
  duration: string
): Promise<void> {
  await authFetch('/api/admin/notifications/send', {
    targetRoles: ['customer', 'creator', 'admin', 'super_admin', 'moderator', 'support'],
    type: 'system_maintenance',
    customData: {
      priority: 'high',
      message: `Scheduled maintenance will begin on ${maintenanceDate} and last approximately ${duration}`,
      metadata: {
        actionUrl: '/maintenance-info',
      },
    },
  })
}
