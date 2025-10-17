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
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "./config"
import {
  createSession,
  validateSession,
  terminateSession,
  terminateAllUserSessions,
  getCurrentSession,
  initializeSessionManagement,
  type Session,
} from "../session-management"

export type UserRole = "customer" | "vendor" | "admin" | "super_admin"

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
  address?: {
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  // Vendor-specific fields
  storeName?: string
  storeUrl?: string
  storeDescription?: string
  verified?: boolean
  commission?: number
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  refreshUserProfile: () => Promise<void>
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
        ...(role === "vendor" && { verified: false, commission: 15 }),
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userProfile)
      setUserProfile(userProfile)
    } catch (error: any) {
      // Handle rate limit errors
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many signup attempts. Please try again later.')
      }
      throw error
    }
  }

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Get user profile to determine role
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const profile = userDoc.data() as UserProfile
      
      // Create session
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown')
      
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      
      const newSession = await createSession(
        userCredential.user.uid,
        userCredential.user.email!,
        profile.role,
        ipAddress,
        userAgent,
        rememberMe
      )
      
      setSession(newSession)
    } catch (error: any) {
      // Handle rate limit errors
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many login attempts. Please try again in 15 minutes.')
      }
      throw error
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
    await sendPasswordResetEmail(auth, email)
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
    await sendEmailVerification(user, actionCodeSettings)
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

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    logout,
    logoutAllDevices,
    resetPassword,
    resendVerificationEmail,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
