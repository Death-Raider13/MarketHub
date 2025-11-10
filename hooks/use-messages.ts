import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'

interface UseMessagesReturn {
  unreadCount: number
  loading: boolean
  refreshUnreadCount: () => void
}

export function useMessages(): UseMessagesReturn {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/customer/messages?customerId=${user.uid}`)
      
      if (!response.ok) {
        console.error('Failed to fetch unread count:', response.status, response.statusText)
        return
      }
      
      const data = await response.json()

      if (data.success && data.conversations) {
        const totalUnread = data.conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0), 
          0
        )
        setUnreadCount(totalUnread)
      } else {
        console.error('API returned error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      // Don't show error to user, just fail silently for unread counts
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
  }, [user])

  // Refresh every 30 seconds when user is active
  useEffect(() => {
    if (!user) return

    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount
  }
}
