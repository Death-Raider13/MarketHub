"use client"

import { useEffect } from 'react'
import { initializeFirebaseErrorHandling } from '@/lib/firebase/error-handler'

/**
 * Firebase Error Handler Component
 * Initializes global Firebase error handling
 */
export function FirebaseErrorHandler() {
  useEffect(() => {
    // Initialize global Firebase error handling
    initializeFirebaseErrorHandling()
    
    console.log('Firebase error handling initialized')
  }, [])

  // This component doesn't render anything
  return null
}
