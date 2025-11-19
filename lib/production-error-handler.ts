/**
 * Production Error Handler
 * Suppresses development warnings and handles errors gracefully in production
 */

import { isDevelopment } from './env-validation'

// Extend Window interface for React DevTools
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot: (...args: any[]) => void
      onCommitFiberUnmount: (...args: any[]) => void
    }
  }
}

/**
 * Initialize production error handling
 * Suppresses console warnings and development messages in production
 */
export function initializeProductionErrorHandling() {
  if (typeof window === 'undefined') return

  // Only suppress errors in production
  if (!isDevelopment()) {
    // Suppress React DevTools warnings
    if (typeof window !== 'undefined') {
      // Override console methods to filter out development warnings
      const originalConsoleWarn = console.warn
      const originalConsoleError = console.error
      const originalConsoleLog = console.log

      // List of development-only warnings to suppress
      const suppressedWarnings = [
        'Download the React DevTools',
        'Consider using MutationObserver instead',
        'Listener added for a synchronous',
        'DOMNodeInsertedIntoDocument',
        'This event type is deprecated',
        'Third-party cookie will be blocked',
        'auth-context.tsx',
        'firebase-error-handler.tsx',
        'Uncaught (in promise) FirebaseError',
        'Failed to get document because the client is offline',
        'Could not reach Cloud Firestore backend'
      ]

      // List of React development warnings to suppress
      const reactWarnings = [
        'Cannot update a component',
        'while rendering a different component',
        'To locate the bad setState() call',
        'Warning: Cannot update a component',
        'ReactDevOverlay',
        'HotReload'
      ]

      console.warn = (...args: any[]) => {
        const message = args.join(' ')
        
        // Check if this is a warning we want to suppress
        const shouldSuppress = suppressedWarnings.some(warning => 
          message.includes(warning)
        ) || reactWarnings.some(warning => 
          message.includes(warning)
        )

        if (!shouldSuppress) {
          originalConsoleWarn.apply(console, args)
        }
      }

      console.error = (...args: any[]) => {
        const message = args.join(' ')
        
        // Check if this is an error we want to suppress
        const shouldSuppress = suppressedWarnings.some(warning => 
          message.includes(warning)
        ) || reactWarnings.some(warning => 
          message.includes(warning)
        )

        if (!shouldSuppress) {
          originalConsoleError.apply(console, args)
        }
      }

      // Suppress specific Firebase warnings
      const originalFirebaseWarn = console.warn
      console.warn = (...args: any[]) => {
        const message = args.join(' ')
        
        if (
          message.includes('auth-context.tsx') ||
          message.includes('firebase-error-handler') ||
          message.includes('Firestore') ||
          message.includes('Firebase')
        ) {
          return // Suppress Firebase development warnings
        }
        
        originalFirebaseWarn.apply(console, args)
      }
    }

    // Suppress unhandled promise rejections for known Firebase issues
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      
      if (error && typeof error === 'object') {
        const errorMessage = error.message || error.toString()
        
        // Suppress known Firebase offline errors
        if (
          errorMessage.includes('Failed to get document because the client is offline') ||
          errorMessage.includes('Could not reach Cloud Firestore backend') ||
          errorMessage.includes('auth/network-request-failed')
        ) {
          event.preventDefault()
          return
        }
      }
    })

    // Suppress React DevTools detection
    if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      try {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = () => {}
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = () => {}
      } catch (e) {
        // Ignore errors when trying to disable React DevTools
      }
    }
  }
}

/**
 * Handle authentication errors gracefully
 */
export function handleAuthError(error: any): string {
  // Don't log auth errors to console in production
  if (!isDevelopment()) {
    // Return user-friendly error messages
    switch (error?.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      default:
        return 'Sign in failed. Please try again.'
    }
  }

  // In development, show the actual error
  console.error('Auth error:', error)
  return error?.message || 'Authentication failed'
}

/**
 * Handle Firestore errors gracefully
 */
export function handleFirestoreError(error: any): string {
  // Don't log Firestore errors to console in production
  if (!isDevelopment()) {
    switch (error?.code) {
      case 'permission-denied':
        return 'Access denied. Please sign in and try again.'
      case 'not-found':
        return 'The requested data was not found.'
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.'
      case 'deadline-exceeded':
        return 'Request timed out. Please try again.'
      default:
        return 'An error occurred. Please try again.'
    }
  }

  // In development, show the actual error
  console.error('Firestore error:', error)
  return error?.message || 'Database error'
}

/**
 * Graceful error boundary for production
 */
export class ProductionErrorBoundary extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'ProductionErrorBoundary'
    
    // Don't log to console in production
    if (isDevelopment() && originalError) {
      console.error('Original error:', originalError)
    }
  }
}
