/**
 * Firebase Token Refresh Management
 * Handles automatic token refresh to prevent session expiration errors
 */

import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './config'

interface TokenRefreshConfig {
  refreshInterval: number // milliseconds
  maxRetries: number
  retryDelay: number
}

const DEFAULT_CONFIG: TokenRefreshConfig = {
  refreshInterval: 50 * 60 * 1000, // 50 minutes (tokens expire after 1 hour)
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
}

class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null
  private config: TokenRefreshConfig
  private isRefreshing = false
  private retryCount = 0

  constructor(config: Partial<TokenRefreshConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.startTokenRefresh(user)
      } else {
        this.stopTokenRefresh()
      }
    })

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && auth.currentUser) {
        // Page became visible, refresh token immediately
        this.refreshTokenNow(auth.currentUser)
      }
    })

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (auth.currentUser) {
        this.refreshTokenNow(auth.currentUser)
      }
    })
  }

  private startTokenRefresh(user: User) {
    this.stopTokenRefresh() // Clear any existing timer
    
    this.refreshTimer = setInterval(() => {
      this.refreshTokenNow(user)
    }, this.config.refreshInterval)

    // Also refresh immediately if token is close to expiry
    this.checkTokenExpiry(user)
  }

  private stopTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    this.retryCount = 0
  }

  private async checkTokenExpiry(user: User) {
    try {
      const tokenResult = await user.getIdTokenResult()
      const expirationTime = new Date(tokenResult.expirationTime).getTime()
      const currentTime = Date.now()
      const timeUntilExpiry = expirationTime - currentTime

      // If token expires in less than 10 minutes, refresh now
      if (timeUntilExpiry < 10 * 60 * 1000) {
        console.log('Token expires soon, refreshing now...')
        await this.refreshTokenNow(user)
      }
    } catch (error) {
      console.error('Error checking token expiry:', error)
    }
  }

  public async refreshTokenNow(user: User): Promise<string | null> {
    if (this.isRefreshing) {
      console.log('Token refresh already in progress...')
      return null
    }

    this.isRefreshing = true

    try {
      console.log('Refreshing Firebase token...')
      const token = await user.getIdToken(true) // Force refresh
      this.retryCount = 0 // Reset retry count on success
      console.log('Token refreshed successfully')
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
        detail: { token, userId: user.uid } 
      }))
      
      return token
    } catch (error) {
      console.error('Error refreshing token:', error)
      
      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        console.log(`Retrying token refresh (${this.retryCount}/${this.config.maxRetries})...`)
        
        setTimeout(() => {
          this.refreshTokenNow(user)
        }, this.config.retryDelay * this.retryCount) // Exponential backoff
      } else {
        console.error('Max retries reached for token refresh')
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('tokenRefreshError', { 
          detail: { error, userId: user.uid } 
        }))
      }
      
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  public getConfig(): TokenRefreshConfig {
    return { ...this.config }
  }

  public updateConfig(newConfig: Partial<TokenRefreshConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // Restart with new config if user is logged in
    if (auth.currentUser) {
      this.startTokenRefresh(auth.currentUser)
    }
  }

  public destroy() {
    this.stopTokenRefresh()
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', () => {})
    window.removeEventListener('online', () => {})
  }
}

// Create singleton instance
export const tokenRefreshManager = new TokenRefreshManager()

// Utility functions
export async function getCurrentToken(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting current token:', error)
    return null
  }
}

export async function forceTokenRefresh(): Promise<string | null> {
  try {
    const user = auth.currentUser
    if (!user) return null
    
    return await tokenRefreshManager.refreshTokenNow(user)
  } catch (error) {
    console.error('Error forcing token refresh:', error)
    return null
  }
}

// Hook for React components
export function useTokenRefresh() {
  const refreshToken = async () => {
    return await forceTokenRefresh()
  }

  const getCurrentUserToken = async () => {
    return await getCurrentToken()
  }

  return {
    refreshToken,
    getCurrentUserToken,
    isRefreshing: tokenRefreshManager['isRefreshing']
  }
}
