/**
 * Firebase Error Handler
 * Handles Firebase permission errors and automatic token refresh
 */

import { FirebaseError } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { tokenRefreshManager } from './token-refresh'
import { toast } from 'sonner'

export interface FirebaseErrorHandlerOptions {
  showToast?: boolean
  autoRetry?: boolean
  maxRetries?: number
  onError?: (error: FirebaseError) => void
  onRetrySuccess?: () => void
}

const DEFAULT_OPTIONS: FirebaseErrorHandlerOptions = {
  showToast: true,
  autoRetry: true,
  maxRetries: 2,
}

/**
 * Handle Firebase errors with automatic token refresh and retry
 */
export async function handleFirebaseError<T>(
  operation: () => Promise<T>,
  options: FirebaseErrorHandlerOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let retryCount = 0

  const executeOperation = async (): Promise<T> => {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error('Firebase Error:', error.code, error.message)

        // Handle permission errors
        if (isPermissionError(error)) {
          if (config.autoRetry && retryCount < (config.maxRetries || 2)) {
            retryCount++
            console.log(`Permission error, attempting token refresh and retry ${retryCount}/${config.maxRetries}`)

            const auth = getAuth()
            if (auth.currentUser) {
              try {
                // Force token refresh
                await tokenRefreshManager.refreshTokenNow(auth.currentUser)
                
                // Wait a bit for the token to propagate
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                // Retry the operation
                const result = await executeOperation()
                
                if (config.onRetrySuccess) {
                  config.onRetrySuccess()
                }
                
                if (config.showToast) {
                  toast.success('Connection restored')
                }
                
                return result
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                
                if (config.showToast) {
                  toast.error('Session expired. Please sign in again.')
                }
                
                // Redirect to login if token refresh fails
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login'
                }
                
                throw error
              }
            } else {
              if (config.showToast) {
                toast.error('Please sign in to continue')
              }
              
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login'
              }
              
              throw error
            }
          } else {
            // Max retries reached or auto-retry disabled
            if (config.showToast) {
              toast.error(getErrorMessage(error))
            }
            
            if (config.onError) {
              config.onError(error)
            }
            
            throw error
          }
        } else {
          // Handle other Firebase errors
          if (config.showToast) {
            toast.error(getErrorMessage(error))
          }
          
          if (config.onError) {
            config.onError(error)
          }
          
          throw error
        }
      } else {
        // Non-Firebase error
        console.error('Non-Firebase Error:', error)
        
        if (config.showToast) {
          toast.error('An unexpected error occurred')
        }
        
        throw error
      }
    }
  }

  return executeOperation()
}

/**
 * Check if error is a permission-related error
 */
function isPermissionError(error: FirebaseError): boolean {
  const permissionErrorCodes = [
    'permission-denied',
    'unauthenticated',
    'insufficient-permissions',
    'missing-or-insufficient-permissions',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/user-token-expired',
    'auth/requires-recent-login'
  ]

  return permissionErrorCodes.some(code => 
    error.code.includes(code) || error.message.toLowerCase().includes(code)
  )
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: FirebaseError): string {
  switch (error.code) {
    case 'permission-denied':
    case 'unauthenticated':
      return 'Your session has expired. Please sign in again.'
    
    case 'auth/id-token-expired':
    case 'auth/user-token-expired':
      return 'Your session has expired. Refreshing...'
    
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.'
    
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again.'
    
    case 'deadline-exceeded':
      return 'Request timed out. Please try again.'
    
    case 'resource-exhausted':
      return 'Too many requests. Please wait and try again.'
    
    case 'not-found':
      return 'Requested resource not found.'
    
    case 'already-exists':
      return 'Resource already exists.'
    
    case 'invalid-argument':
      return 'Invalid request. Please check your input.'
    
    default:
      return error.message || 'An error occurred. Please try again.'
  }
}

/**
 * Wrapper for Firestore operations with automatic error handling
 */
export function withFirebaseErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: FirebaseErrorHandlerOptions
) {
  return async (...args: T): Promise<R> => {
    return handleFirebaseError(() => fn(...args), options)
  }
}

/**
 * Initialize global error handling
 */
export function initializeFirebaseErrorHandling() {
  if (typeof window === 'undefined') return

  // Listen for token refresh events
  window.addEventListener('tokenRefreshError', (event: any) => {
    console.error('Token refresh failed globally:', event.detail)
    toast.error('Session expired. Please sign in again.')
    
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/auth/login'
    }, 2000)
  })

  // Listen for successful token refresh
  window.addEventListener('tokenRefreshed', (event: any) => {
    console.log('Token refreshed globally:', event.detail.userId)
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof FirebaseError && isPermissionError(event.reason)) {
      console.error('Unhandled Firebase permission error:', event.reason)
      
      // Prevent the error from being logged to console
      event.preventDefault()
      
      // Handle the error
      handleFirebaseError(async () => {
        throw event.reason
      }, { showToast: false }) // Don't show toast for unhandled errors
    }
  })
}

// Export utility functions
export { isPermissionError, getErrorMessage }
