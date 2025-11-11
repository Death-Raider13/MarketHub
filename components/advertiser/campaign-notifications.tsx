"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { handleFirebaseError } from "@/lib/firebase/error-handler"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Clock, AlertCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface CampaignNotification {
  id: string
  type: 'campaign_approved' | 'campaign_rejected' | 'campaign_paused' | 'campaign_resumed' | 'low_budget' | 'campaign_completed'
  title: string
  message: string
  campaignId?: string
  campaignName?: string
  read: boolean
  createdAt: Date
  metadata?: {
    reason?: string
    actionUrl?: string
  }
}

export function CampaignNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<CampaignNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    setLoading(true)
    
    try {
      await handleFirebaseError(async () => {
        const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase/config")
        
        const notificationsRef = collection(db, "notifications")
        const q = query(
          notificationsRef,
          where("userId", "==", user?.uid),
          orderBy("createdAt", "desc")
        )
        
        const snapshot = await getDocs(q)
        const notificationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as CampaignNotification[]
        
        setNotifications(notificationData)
        setUnreadCount(notificationData.filter(n => !n.read).length)
      }, {
        showToast: true,
        autoRetry: true,
        maxRetries: 2
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase/config")
      
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: new Date()
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { writeBatch, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase/config")
      
      const batch = writeBatch(db)
      const unreadNotifications = notifications.filter(n => !n.read)
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.update(notificationRef, {
          read: true,
          readAt: new Date()
        })
      })
      
      await batch.commit()
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark notifications as read")
    }
  }

  const getNotificationIcon = (type: CampaignNotification['type']) => {
    switch (type) {
      case 'campaign_approved':
        return <Check className="h-4 w-4 text-green-600" />
      case 'campaign_rejected':
        return <X className="h-4 w-4 text-red-600" />
      case 'campaign_paused':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'campaign_resumed':
        return <Check className="h-4 w-4 text-blue-600" />
      case 'low_budget':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'campaign_completed':
        return <Check className="h-4 w-4 text-gray-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: CampaignNotification['type']) => {
    switch (type) {
      case 'campaign_approved':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950'
      case 'campaign_rejected':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950'
      case 'campaign_paused':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      case 'campaign_resumed':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
      case 'low_budget':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950'
      case 'campaign_completed':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950'
      default:
        return 'border-l-gray-300 bg-gray-50 dark:bg-gray-950'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Campaign Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Campaign Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll receive updates about your campaigns here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 rounded-r-lg transition-all cursor-pointer ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    {notification.campaignName && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Campaign: <span className="font-medium">{notification.campaignName}</span>
                      </p>
                    )}
                    {notification.metadata?.reason && (
                      <p className="text-xs text-muted-foreground mb-2 italic">
                        Reason: {notification.metadata.reason}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt)} ago
                      </p>
                      {notification.metadata?.actionUrl && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
