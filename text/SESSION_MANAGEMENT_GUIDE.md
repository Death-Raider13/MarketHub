# 🔐 Session Management Guide

## Overview

Comprehensive session management has been implemented to protect your Nigerian e-commerce platform against:
- ✅ Session hijacking
- ✅ Session fixation attacks
- ✅ Unauthorized access
- ✅ Concurrent session abuse
- ✅ Token theft
- ✅ Replay attacks

---

## 🚀 Implementation

### 1. **Session Management Library** (`lib/session-management.ts`)

Provides complete session lifecycle management:
- Session creation and validation
- Activity tracking
- Automatic timeout handling
- Multi-device management
- Security monitoring

### 2. **Updated Auth Context** (`lib/firebase/auth-context.tsx`)

Integrated session management with Firebase Authentication:
- Creates sessions on login
- Validates sessions automatically
- Terminates sessions on logout
- Supports "Remember Me" functionality

### 3. **React Components** (`components/session-manager.tsx`)

UI components for session management:
- `SessionManager` - View and manage active sessions
- `SessionTimeoutWarning` - Warn users before session expires

---

## 🔧 Configuration

### Session Timeouts

```typescript
export const SESSION_CONFIG = {
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_CONCURRENT_SESSIONS: 3, // Max devices per user
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  TOKEN_ROTATION_INTERVAL: 15 * 60 * 1000, // 15 minutes
};
```

### Customizing Timeouts

Edit `lib/session-management.ts`:

```typescript
// Increase session timeout to 2 hours
SESSION_TIMEOUT: 2 * 60 * 60 * 1000,

// Allow more concurrent sessions
MAX_CONCURRENT_SESSIONS: 5,
```

---

## 📋 Features

### 1. **Automatic Session Creation**

Sessions are automatically created on login:

```typescript
import { useAuth } from '@/lib/firebase/auth-context';

function LoginForm() {
  const { signIn } = useAuth();
  
  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    await signIn(email, password, rememberMe);
    // Session automatically created!
  };
}
```

### 2. **Session Validation**

Sessions are validated automatically:
- On page load
- Every 5 minutes
- On user activity
- When page becomes visible

```typescript
import { validateSession } from '@/lib/session-management';

const result = await validateSession(sessionId);

if (result.isValid) {
  // Session is valid
  console.log('Session:', result.session);
} else {
  // Session invalid
  console.log('Reason:', result.reason);
}
```

### 3. **Activity Tracking**

User activity is tracked automatically:
- Mouse movements
- Keyboard input
- Scrolling
- Touch events

Sessions are terminated after 30 minutes of inactivity.

### 4. **Multi-Device Management**

Users can manage sessions across devices:

```typescript
import { SessionManager } from '@/components/session-manager';

function AccountSettings() {
  return (
    <div>
      <h1>Security Settings</h1>
      <SessionManager />
    </div>
  );
}
```

### 5. **Remember Me**

Extended sessions for trusted devices:

```typescript
// Login with Remember Me
await signIn(email, password, true); // 30-day session

// Login without Remember Me
await signIn(email, password, false); // 1-hour session
```

### 6. **Session Timeout Warning**

Warn users 5 minutes before session expires:

```typescript
import { SessionTimeoutWarning } from '@/components/session-manager';

function Layout({ children }) {
  return (
    <>
      {children}
      <SessionTimeoutWarning />
    </>
  );
}
```

### 7. **Logout All Devices**

Terminate all sessions at once:

```typescript
import { useAuth } from '@/lib/firebase/auth-context';

function SecuritySettings() {
  const { logoutAllDevices } = useAuth();
  
  return (
    <button onClick={logoutAllDevices}>
      Logout from all devices
    </button>
  );
}
```

---

## 🛡️ Security Features

### 1. **Session Hijacking Prevention**

- Unique session IDs
- IP address tracking
- User agent validation
- Device fingerprinting

```typescript
// Detect suspicious activity
const isSuspicious = await detectSuspiciousActivity(
  sessionId,
  newIpAddress,
  newUserAgent
);

if (isSuspicious) {
  await handleSuspiciousActivity(sessionId);
}
```

### 2. **Concurrent Session Limits**

Maximum 3 active sessions per user:

```typescript
// When creating 4th session, oldest is terminated
const session = await createSession(...);
// Oldest session automatically terminated
```

### 3. **Token Rotation**

Firebase tokens are refreshed every 15 minutes:

```typescript
// Automatic token refresh
await refreshSession(sessionId);
// Firebase token rotated
```

### 4. **Idle Timeout**

Sessions terminated after 30 minutes of inactivity:

```typescript
// User inactive for 30 minutes
// Session automatically terminated
```

### 5. **Absolute Timeout**

Sessions expire after maximum duration:
- 1 hour (normal)
- 30 days (remember me)

---

## 📊 Session Data Structure

```typescript
interface Session {
  sessionId: string; // Unique identifier
  userId: string; // User ID
  email: string; // User email
  role: 'customer' | 'vendor' | 'admin'; // User role
  createdAt: Date; // Session creation time
  lastActivity: Date; // Last activity time
  expiresAt: Date; // Expiration time
  ipAddress: string; // IP address
  userAgent: string; // Browser user agent
  deviceInfo: DeviceInfo; // Device information
  isActive: boolean; // Active status
  rememberMe: boolean; // Remember me flag
}

interface DeviceInfo {
  browser: string; // Chrome, Firefox, etc.
  os: string; // Windows, macOS, etc.
  device: string; // Desktop, Mobile, Tablet
  isMobile: boolean; // Is mobile device
}
```

---

## 🎯 Usage Examples

### 1. **Basic Login with Session**

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(email, password, rememberMe);
      // Session created automatically!
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <div className="flex items-center gap-2">
        <Checkbox
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <label>Remember me for 30 days</label>
      </div>
      <Button type="submit">Login</Button>
    </form>
  );
}
```

### 2. **Protected Route with Session Validation**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { isSessionValid } from '@/lib/session-management';

export function ProtectedPage() {
  const { user, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      if (!user || !session) {
        router.push('/auth/login');
        return;
      }

      const valid = await isSessionValid();
      if (!valid) {
        router.push('/auth/login?reason=session_expired');
      }
    };

    checkSession();
  }, [user, session, router]);

  return <div>Protected Content</div>;
}
```

### 3. **Account Security Page**

```typescript
'use client';

import { SessionManager, SessionTimeoutWarning } from '@/components/session-manager';
import { useAuth } from '@/lib/firebase/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SecurityPage() {
  const { session } = useAuth();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Security Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>Your current login session</CardDescription>
        </CardHeader>
        <CardContent>
          {session && (
            <div className="space-y-2 text-sm">
              <p><strong>Device:</strong> {session.deviceInfo.device}</p>
              <p><strong>Browser:</strong> {session.deviceInfo.browser}</p>
              <p><strong>OS:</strong> {session.deviceInfo.os}</p>
              <p><strong>IP Address:</strong> {session.ipAddress}</p>
              <p><strong>Expires:</strong> {session.expiresAt.toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SessionManager />
      <SessionTimeoutWarning />
    </div>
  );
}
```

### 4. **Manual Session Management**

```typescript
import {
  createSession,
  validateSession,
  terminateSession,
  refreshSession,
  getUserActiveSessions,
} from '@/lib/session-management';

// Create session manually
const session = await createSession(
  userId,
  email,
  role,
  ipAddress,
  userAgent,
  rememberMe
);

// Validate session
const result = await validateSession(sessionId);

// Refresh session
await refreshSession(sessionId);

// Terminate session
await terminateSession(sessionId);

// Get all user sessions
const sessions = await getUserActiveSessions(userId);
```

---

## 🔔 Event Handling

### Session Events

The system automatically handles these events:

1. **User Activity** - Updates last activity timestamp
2. **Page Visibility** - Validates session when page becomes visible
3. **Before Unload** - Updates activity before page closes
4. **Auth State Change** - Cleans up session on logout
5. **Periodic Validation** - Validates every 5 minutes

---

## 📱 Mobile Considerations

### Mobile Session Handling

```typescript
// Detect mobile device
if (session.deviceInfo.isMobile) {
  // Adjust timeout for mobile
  // Mobile users may have intermittent connectivity
}

// Handle app backgrounding
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // App returned to foreground
    const valid = await isSessionValid();
    if (!valid) {
      // Redirect to login
    }
  }
});
```

---

## 🧪 Testing

### Manual Testing

```bash
# Test session creation
1. Login to the application
2. Check localStorage for sessionId
3. Verify session in Firestore

# Test session timeout
1. Login to the application
2. Wait 30 minutes without activity
3. Try to perform an action
4. Should redirect to login

# Test concurrent sessions
1. Login on Device A
2. Login on Device B
3. Login on Device C
4. Login on Device D
5. Device A session should be terminated

# Test remember me
1. Login with "Remember Me" checked
2. Close browser
3. Reopen browser
4. Should still be logged in
```

### Automated Testing

```typescript
import { createSession, validateSession, terminateSession } from '@/lib/session-management';

describe('Session Management', () => {
  it('should create a session', async () => {
    const session = await createSession(
      'user123',
      'user@example.com',
      'customer',
      '127.0.0.1',
      'Mozilla/5.0',
      false
    );
    
    expect(session.sessionId).toBeDefined();
    expect(session.isActive).toBe(true);
  });

  it('should validate a session', async () => {
    const session = await createSession(...);
    const result = await validateSession(session.sessionId);
    
    expect(result.isValid).toBe(true);
  });

  it('should terminate a session', async () => {
    const session = await createSession(...);
    await terminateSession(session.sessionId);
    
    const result = await validateSession(session.sessionId);
    expect(result.isValid).toBe(false);
  });
});
```

---

## 🆘 Troubleshooting

### Issue: Session expires too quickly

**Solution:** Increase session timeout

```typescript
SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
```

### Issue: Too many concurrent sessions

**Solution:** Increase limit

```typescript
MAX_CONCURRENT_SESSIONS: 5,
```

### Issue: Session not persisting

**Solution:** Check localStorage and Firestore

```typescript
// Check localStorage
const sessionId = localStorage.getItem('sessionId');
console.log('Session ID:', sessionId);

// Check Firestore
const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
console.log('Session exists:', sessionDoc.exists());
```

### Issue: False positive suspicious activity

**Solution:** Disable IP/UA checking for development

```typescript
// In development, skip suspicious activity checks
if (process.env.NODE_ENV === 'development') {
  return false; // Not suspicious
}
```

---

## 📋 Security Checklist

Before deploying to production:

- [ ] Session timeouts configured appropriately
- [ ] Concurrent session limits set
- [ ] Remember Me functionality tested
- [ ] Session timeout warnings working
- [ ] Logout all devices tested
- [ ] Suspicious activity detection enabled
- [ ] Session data stored securely in Firestore
- [ ] Token rotation working
- [ ] Idle timeout tested
- [ ] Mobile session handling tested
- [ ] Session cleanup job scheduled
- [ ] Security events logged
- [ ] User can view active sessions
- [ ] User can terminate individual sessions

---

## 🎯 Summary

Your Nigerian e-commerce platform now has:

✅ **Automatic session management** on login/logout  
✅ **Activity tracking** with idle timeout  
✅ **Multi-device support** with concurrent session limits  
✅ **Remember Me** functionality for trusted devices  
✅ **Session timeout warnings** for users  
✅ **Security monitoring** for suspicious activity  
✅ **Token rotation** every 15 minutes  
✅ **UI components** for session management  
✅ **Firestore integration** for persistent sessions  
✅ **Mobile-friendly** session handling  

**All user sessions are now secure and properly managed! 🔐**

---

**Last Updated:** September 30, 2025  
**Version:** 1.0
