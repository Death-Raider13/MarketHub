"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth"
import { onUserRegistration } from '@/lib/notifications/client-triggers'
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "./config"
import { handleAuthError, handleFirestoreError } from '@/lib/production-error-handler'
import {
  createSession,
  validateSession,
  terminateSession,
  terminateAllUserSessions,
  getCurrentSession,
  initializeSessionManagement,
  type Session,
} from "../session-management"
import { tokenRefreshManager, getCurrentToken } from "./token-refresh"

export type UserRole = "customer" | "creator" | "admin" | "super_admin" | "moderator" | "support" | "promoter" | "verifier"

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  displayName?: string
  photoURL?: string
  createdAt: Date
  emailVerified?: boolean
  lastLoginAt?: Date
  updatedAt?: Date
  phoneNumber?: string
  phone?: string // Alternative phone field
  birthday?: string // Date of birth
  address?: {
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  // creator-specific fields
  storeName?: string
  storeUrl?: string
  storeDescription?: string
  verified?: boolean
  commission?: number
  businessName?: string
  hubName?: string
  // promoter fields
  referralCode?: string
  earnings?: number
  // verifier fields
  verificationStatus?: 'pending' | 'approved' | 'rejected'
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  getCurrentToken: () => Promise<string | null>
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize session management
    initializeSessionManagement()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile

          // Sync emailVerified status from Firebase Auth to Firestore
          if (user.emailVerified && !profile.emailVerified) {
            await setDoc(doc(db, "users", user.uid), {
              ...profile,
              emailVerified: true,
              updatedAt: new Date()
            })
            profile.emailVerified = true
          }

          setUserProfile(profile)
        }

        // Validate or restore session
        const currentSession = await getCurrentSession()
        if (currentSession) {
          const validation = await validateSession(currentSession.sessionId)
          if (validation.isValid) {
            setSession(validation.session || null)
          } else {
            setSession(null)
          }
        }
      } else {
        setUserProfile(null)
        setSession(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string, role: UserRole, displayName?: string) => {
    // Rate limiting is handled by middleware, but we can add client-side checks
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // Send email verification with custom action handler
      // Automatically uses correct URL for dev/production
      const actionCodeSettings = {
        url: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/action`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/action`,
        handleCodeInApp: false
      }
      await sendEmailVerification(userCredential.user, actionCodeSettings)

      const generateReferralCode = (name: string) => {
        return `${name.split(' ')[0].toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        role,
        displayName,
        createdAt: new Date(),
        emailVerified: false, // Track email verification status
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        ...(role === "creator" && { verified: false, commission: 80 }),
        ...(role === "promoter" && { 
          referralCode: displayName ? generateReferralCode(displayName) : `PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          commission: 20,
          earnings: 0
        }),
        ...(role === "verifier" && { verificationStatus: 'pending' }),
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userProfile)
      setUserProfile(userProfile)
      // Trigger notifications for new registration (fire-and-forget)
      try {
        onUserRegistration(userCredential.user.uid, displayName || email, role).catch(err => console.error('notify onUserRegistration failed', err))
      } catch (err) {
        console.error('Error calling onUserRegistration:', err)
      }
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string }
      // Handle rate limit errors
      if (authError.code === 'auth/too-many-requests') {
        throw new Error('Too many signup attempts. Please try again later.')
      }
      const userFriendlyMessage = handleAuthError(error)
      throw new Error(userFriendlyMessage)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (!userDoc.exists()) {
        // New user: create a minimal profile and redirect to onboarding
        const minimalProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email || '',
          photoURL: user.photoURL || undefined,
          emailVerified: user.emailVerified,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(db, "users", user.uid), minimalProfile)

        // Set a flag in sessionStorage to show onboarding
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('needsOnboarding', 'true')
        }
      } else {
        // Existing user: update last login and proceed normally
        const profile = userDoc.data() as UserProfile
        await setDoc(doc(db, "users", user.uid), {
          ...profile,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        }, { merge: true })

        // Only create session if user has a role
        if (profile.role) {
          // Create session (best-effort)
          try {
            // Note: External IP resolution removed for performance and reliability.
            // IP tracking should be handled exclusively on the server side via middleware/headers.
            const ipAddress = 'client-ip'

            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'

            const newSession = await createSession(
              user.uid,
              user.email!,
              profile.role,
              ipAddress,
              userAgent,
              false
            )

            setSession(newSession)
          } catch (sessionError) {
            console.error('Session creation failed:', sessionError)
          }
        } else {
          // User exists but has no role, send to onboarding
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('needsOnboarding', 'true')
          }
        }
      }
    } catch (error: unknown) {
      const userFriendlyMessage = handleAuthError(error)
      throw new Error(userFriendlyMessage)
    }
  }
  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      // 1) Primary auth step – if this fails, we show an error to the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // 2) Best-effort post-login setup (profile + session). If this fails, we log
      // it but do NOT treat it as a login failure since the user is already
      // authenticated and onAuthStateChanged will still fire.
      try {
        // Get user profile to determine role
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

        if (!userDoc.exists()) {
          console.warn('User profile not found after sign-in; skipping session creation', {
            uid: userCredential.user.uid,
          })
          return
        }

        const profile = userDoc.data() as UserProfile

        // Create session (best-effort)
        // Note: External IP tracking is now handled on the server side
        const ipAddress = 'client-ip'

        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'

        const newSession = await createSession(
          userCredential.user.uid,
          userCredential.user.email!,
          profile.role as UserRole,
          ipAddress,
          userAgent,
          rememberMe
        )

        setSession(newSession)
      } catch (secondaryError: unknown) {
        // Log but don't block login flow
        console.error('Post-sign-in profile/session setup failed:', secondaryError)
      }
    } catch (error: unknown) {
      // Only true auth failures should surface to the UI
      const userFriendlyMessage = handleAuthError(error)
      throw new Error(userFriendlyMessage)
    }
  }

  const logout = async () => {
    // Terminate current session
    if (session) {
      await terminateSession(session.sessionId)
    }

    await signOut(auth)
    setUserProfile(null)
    setSession(null)
  }

  const logoutAllDevices = async () => {
    // Terminate all user sessions
    if (user) {
      await terminateAllUserSessions(user.uid)
    }

    await signOut(auth)
    setUserProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      const userFriendlyMessage = handleAuthError(error)
      throw new Error(userFriendlyMessage)
    }
  }

  const resendVerificationEmail = async () => {
    if (!user) {
      throw new Error('No user logged in')
    }

    if (user.emailVerified) {
      throw new Error('Email already verified')
    }

    // Automatically uses correct URL for dev/production
    const actionCodeSettings = {
      url: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/action`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/action`,
      handleCodeInApp: false
    }

    try {
      await sendEmailVerification(user, actionCodeSettings)
    } catch (error: any) {
      const userFriendlyMessage = handleAuthError(error)
      throw new Error(userFriendlyMessage)
    }
  }

  const refreshUserProfile = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile)
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  const getCurrentUserToken = async (): Promise<string | null> => {
    try {
      return await getCurrentToken()
    } catch (error) {
      console.error("Error getting current token:", error)
      return null
    }
  }

  const refreshToken = async (): Promise<string | null> => {
    try {
      if (!user) return null
      return await tokenRefreshManager.refreshTokenNow(user)
    } catch (error) {
      console.error("Error refreshing token:", error)
      return null
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    logoutAllDevices,
    resetPassword,
    resendVerificationEmail,
    refreshUserProfile,
    getCurrentToken: getCurrentUserToken,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
