'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { NotificationData } from '@/lib/notifications/types';
import { notificationService } from '@/lib/notifications/service';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Subscribe to real-time notifications
      const unsubscribe = notificationService.subscribeToNotifications(
        user.uid,
        (newNotifications) => {
          setNotifications(newNotifications);
          setUnreadCount(newNotifications.filter(n => n.status === 'unread').length);
          setLoading(false);
        },
        50 // Get last 50 notifications
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setLoading(false);
    }
  }, [user?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' as const, readAt: new Date() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await notificationService.markAllAsRead(user.uid);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: 'read' as const,
          readAt: notification.status === 'unread' ? new Date() : notification.readAt
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const freshNotifications = await notificationService.getUserNotifications(user.uid, 50);
      setNotifications(freshNotifications);
      setUnreadCount(freshNotifications.filter(n => n.status === 'unread').length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
