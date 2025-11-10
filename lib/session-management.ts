/**
 * Session Management for Nigerian E-commerce Platform
 * Protects against session hijacking, fixation, and unauthorized access
 */

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase/config';

// ==================== SESSION CONFIGURATION ====================

export const SESSION_CONFIG = {
  // Session timeout (1 hour)
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour in milliseconds
  
  // Idle timeout (30 minutes)
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Remember me duration (30 days)
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Maximum concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 3,
  
  // Session refresh interval (5 minutes)
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Token rotation interval (15 minutes)
  TOKEN_ROTATION_INTERVAL: 15 * 60 * 1000, // 15 minutes
};

// ==================== SESSION TYPES ====================

export interface Session {
  sessionId: string;
  userId: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin' | 'super_admin' | 'moderator' | 'support';
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  rememberMe: boolean;
  isActive: boolean;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
}

export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
  session?: Session;
}

// ==================== SESSION STORAGE ====================

class SessionStore {
  private static instance: SessionStore;
  private sessions: Map<string, Session> = new Map();
  private activityTimers: Map<string, NodeJS.Timeout> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  set(sessionId: string, session: Session): void {
    this.sessions.set(sessionId, session);
    this.startActivityTimer(sessionId);
    this.startRefreshTimer(sessionId);
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.clearTimers(sessionId);
  }

  clear(): void {
    this.sessions.clear();
    this.activityTimers.forEach((timer) => clearTimeout(timer));
    this.refreshTimers.forEach((timer) => clearInterval(timer));
    this.activityTimers.clear();
    this.refreshTimers.clear();
  }

  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId && session.isActive
    );
  }

  private startActivityTimer(sessionId: string): void {
    const timer = setTimeout(() => {
      this.handleInactiveSession(sessionId);
    }, SESSION_CONFIG.IDLE_TIMEOUT);
    
    this.activityTimers.set(sessionId, timer);
  }

  private startRefreshTimer(sessionId: string): void {
    const timer = setInterval(() => {
      this.refreshSession(sessionId);
    }, SESSION_CONFIG.REFRESH_INTERVAL);
    
    this.refreshTimers.set(sessionId, timer);
  }

  private clearTimers(sessionId: string): void {
    const activityTimer = this.activityTimers.get(sessionId);
    const refreshTimer = this.refreshTimers.get(sessionId);
    
    if (activityTimer) clearTimeout(activityTimer);
    if (refreshTimer) clearInterval(refreshTimer);
    
    this.activityTimers.delete(sessionId);
    this.refreshTimers.delete(sessionId);
  }

  private async handleInactiveSession(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    if (session) {
      await terminateSession(sessionId);
    }
  }

  private async refreshSession(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    if (session) {
      await updateSessionActivity(sessionId);
    }
  }
}

// ==================== SESSION MANAGEMENT FUNCTIONS ====================

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

/**
 * Get device information from user agent
 */
export function getDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Detect device type
  let device = 'Desktop';
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua);
  if (isMobile) {
    device = ua.includes('tablet') || ua.includes('ipad') ? 'Tablet' : 'Mobile';
  }
  
  return { browser, os, device, isMobile };
}

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  email: string,
  role: 'customer' | 'vendor' | 'admin' | 'super_admin' | 'moderator' | 'support',
  ipAddress: string,
  userAgent: string,
  rememberMe: boolean = false
): Promise<Session> {
  const sessionId = generateSessionId();
  const now = new Date();
  const duration = rememberMe 
    ? SESSION_CONFIG.REMEMBER_ME_DURATION 
    : SESSION_CONFIG.SESSION_TIMEOUT;
  
  const session: Session = {
    sessionId,
    userId,
    email,
    role,
    createdAt: now,
    lastActivity: now,
    expiresAt: new Date(now.getTime() + duration),
    ipAddress,
    userAgent,
    deviceInfo: getDeviceInfo(userAgent),
    isActive: true,
    rememberMe,
  };
  
  // Check concurrent sessions limit
  const userSessions = await getUserActiveSessions(userId);
  if (userSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
    // Terminate oldest session
    const oldestSession = userSessions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];
    await terminateSession(oldestSession.sessionId);
  }
  
  // Store session in memory
  SessionStore.getInstance().set(sessionId, session);
  
  // Store session in Firestore
  await setDoc(doc(db, 'sessions', sessionId), {
    ...session,
    createdAt: session.createdAt.toISOString(),
    lastActivity: session.lastActivity.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  });
  
  // Store session ID in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('sessionId', sessionId);
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    }
  }
  
  return session;
}

/**
 * Validate session
 */
export async function validateSession(
  sessionId: string
): Promise<SessionValidationResult> {
  try {
    // Check memory store first
    let session = SessionStore.getInstance().get(sessionId);
    
    // If not in memory, check Firestore
    if (!session) {
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      if (!sessionDoc.exists()) {
        return { isValid: false, reason: 'Session not found' };
      }
      
      const data = sessionDoc.data();
      session = {
        ...data,
        createdAt: new Date(data.createdAt),
        lastActivity: new Date(data.lastActivity),
        expiresAt: new Date(data.expiresAt),
      } as Session;
      
      // Restore to memory
      SessionStore.getInstance().set(sessionId, session);
    }
    
    // Check if session is active
    if (!session.isActive) {
      return { isValid: false, reason: 'Session is inactive' };
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await terminateSession(sessionId);
      return { isValid: false, reason: 'Session expired' };
    }
    
    // Check idle timeout
    const idleTime = Date.now() - session.lastActivity.getTime();
    if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT) {
      await terminateSession(sessionId);
      return { isValid: false, reason: 'Session idle timeout' };
    }
    
    // Validate Firebase auth token
    const user = auth.currentUser;
    if (!user || user.uid !== session.userId) {
      return { isValid: false, reason: 'User not authenticated' };
    }
    
    // Update last activity
    await updateSessionActivity(sessionId);
    
    return { isValid: true, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, reason: 'Validation error' };
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = SessionStore.getInstance().get(sessionId);
  if (!session) return;
  
  const now = new Date();
  session.lastActivity = now;
  
  // Update in memory
  SessionStore.getInstance().set(sessionId, session);
  
  // Update in Firestore
  await updateDoc(doc(db, 'sessions', sessionId), {
    lastActivity: now.toISOString(),
  });
}

/**
 * Refresh session (extend expiration)
 */
export async function refreshSession(sessionId: string): Promise<void> {
  const session = SessionStore.getInstance().get(sessionId);
  if (!session) return;
  
  const now = new Date();
  const duration = session.rememberMe 
    ? SESSION_CONFIG.REMEMBER_ME_DURATION 
    : SESSION_CONFIG.SESSION_TIMEOUT;
  
  session.expiresAt = new Date(now.getTime() + duration);
  session.lastActivity = now;
  
  // Update in memory
  SessionStore.getInstance().set(sessionId, session);
  
  // Update in Firestore
  await updateDoc(doc(db, 'sessions', sessionId), {
    expiresAt: session.expiresAt.toISOString(),
    lastActivity: now.toISOString(),
  });
  
  // Rotate Firebase token
  const user = auth.currentUser;
  if (user) {
    await user.getIdToken(true); // Force token refresh
  }
}

/**
 * Terminate session
 */
export async function terminateSession(sessionId: string): Promise<void> {
  try {
    // Remove from memory
    SessionStore.getInstance().delete(sessionId);
    
    // Update in Firestore
    const sessionDoc = doc(db, 'sessions', sessionId);
    const sessionData = await getDoc(sessionDoc);
    
    if (sessionData.exists()) {
      await updateDoc(sessionDoc, {
        isActive: false,
        terminatedAt: new Date().toISOString(),
      });
    }
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      const currentSessionId = localStorage.getItem('sessionId');
      if (currentSessionId === sessionId) {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('rememberMe');
      }
    }
    
    // Sign out from Firebase if this is the current session
    const user = auth.currentUser;
    if (user) {
      const currentSessionId = typeof window !== 'undefined' 
        ? localStorage.getItem('sessionId') 
        : null;
      
      if (currentSessionId === sessionId) {
        await signOut(auth);
      }
    }
  } catch (error) {
    console.error('Error terminating session:', error);
  }
}

/**
 * Terminate all user sessions
 */
export async function terminateAllUserSessions(userId: string): Promise<void> {
  const sessions = await getUserActiveSessions(userId);
  
  await Promise.all(
    sessions.map((session) => terminateSession(session.sessionId))
  );
}

/**
 * Get user's active sessions
 */
export async function getUserActiveSessions(userId: string): Promise<Session[]> {
  // Check memory first
  const memorySessions = SessionStore.getInstance().getUserSessions(userId);
  if (memorySessions.length > 0) {
    return memorySessions;
  }
  
  // Query Firestore
  const { getDocs, query, where, collection } = await import('firebase/firestore');
  const sessionsQuery = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(sessionsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastActivity: new Date(data.lastActivity),
      expiresAt: new Date(data.expiresAt),
    } as Session;
  });
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null;
  
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return null;
  
  const result = await validateSession(sessionId);
  return result.isValid ? result.session || null : null;
}

/**
 * Check if session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return false;
  
  const result = await validateSession(sessionId);
  return result.isValid;
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(
  sessionId: string,
  newIpAddress: string,
  newUserAgent: string
): Promise<boolean> {
  const session = SessionStore.getInstance().get(sessionId);
  if (!session) return false;
  
  // Check for IP address change
  if (session.ipAddress !== newIpAddress) {
    console.warn('IP address changed for session:', sessionId);
    return true;
  }
  
  // Check for user agent change
  if (session.userAgent !== newUserAgent) {
    console.warn('User agent changed for session:', sessionId);
    return true;
  }
  
  return false;
}

/**
 * Handle suspicious activity
 */
export async function handleSuspiciousActivity(sessionId: string): Promise<void> {
  // Terminate the suspicious session
  await terminateSession(sessionId);
  
  // Log security event
  const session = SessionStore.getInstance().get(sessionId);
  if (session) {
    await setDoc(doc(db, 'security_events', generateSessionId()), {
      type: 'suspicious_activity',
      sessionId,
      userId: session.userId,
      timestamp: new Date().toISOString(),
      details: 'Session terminated due to suspicious activity',
    });
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const { getDocs, query, where, collection } = await import('firebase/firestore');
  
  const now = new Date().toISOString();
  const sessionsQuery = query(
    collection(db, 'sessions'),
    where('isActive', '==', true),
    where('expiresAt', '<', now)
  );
  
  const snapshot = await getDocs(sessionsQuery);
  
  await Promise.all(
    snapshot.docs.map((doc) => terminateSession(doc.id))
  );
}

// ==================== SESSION HOOKS ====================

/**
 * Initialize session management
 */
export function initializeSessionManagement(): void {
  if (typeof window === 'undefined') return;
  
  // Monitor user activity
  let activityTimeout: NodeJS.Timeout;
  
  const resetActivityTimer = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await updateSessionActivity(sessionId);
      }
    }, 60000); // Update every minute
  };
  
  // Track user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
    window.addEventListener(event, resetActivityTimer);
  });
  
  // Monitor auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // User signed out, clean up session
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await terminateSession(sessionId);
      }
    }
  });
  
  // Periodic session validation
  setInterval(async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const result = await validateSession(sessionId);
      if (!result.isValid) {
        // Session invalid, redirect to login
        window.location.href = '/auth/login?reason=session_expired';
      }
    }
  }, SESSION_CONFIG.REFRESH_INTERVAL);
  
  // Clean up expired sessions (every hour)
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
  
  // Handle page visibility change
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      // Page became visible, validate session
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        const result = await validateSession(sessionId);
        if (!result.isValid) {
          window.location.href = '/auth/login?reason=session_expired';
        }
      }
    }
  });
  
  // Handle before unload
  window.addEventListener('beforeunload', async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
  });
}

/**
 * Get session timeout warning time (5 minutes before expiry)
 */
export function getSessionTimeoutWarning(session: Session): number {
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
  const warningTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before
  return Math.max(0, warningTime);
}
