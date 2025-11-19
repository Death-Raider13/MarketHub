/**
 * Environment Variable Validation
 * Ensures all required environment variables are present at startup
 */

interface RequiredEnvVars {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
  NEXT_PUBLIC_FIREBASE_APP_ID: string
  
  // Firebase Admin (Server-side)
  FIREBASE_ADMIN_PROJECT_ID?: string
  FIREBASE_ADMIN_CLIENT_EMAIL?: string
  FIREBASE_ADMIN_PRIVATE_KEY?: string
  FIREBASE_SERVICE_ACCOUNT_JSON?: string
  
  // Cloudinary Configuration
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: string
  
  // Payment Gateway
  PAYSTACK_SECRET_KEY: string
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: string
  
  // Email Service
  RESEND_API_KEY: string
}

/**
 * Validate that all required environment variables are present
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = []
  
  // Required client-side variables
  const clientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'
  ]
  
  // Required server-side variables
  const serverVars = [
    'PAYSTACK_SECRET_KEY',
    'RESEND_API_KEY'
  ]
  
  // Check client-side variables
  clientVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  })
  
  // Check server-side variables (only on server)
  if (typeof window === 'undefined') {
    serverVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required server environment variable: ${varName}`)
      }
    })
    
    // Check Firebase Admin credentials
    const hasServiceAccountJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    const hasIndividualVars = !!(
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
    )
    
    if (!hasServiceAccountJson && !hasIndividualVars) {
      errors.push(
        'Missing Firebase Admin credentials. Provide either FIREBASE_SERVICE_ACCOUNT_JSON or all of: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY'
      )
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment Variable Validation Failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    
    if (typeof window === 'undefined') {
      // Only exit on server-side
      process.exit(1)
    } else {
      // On client-side, just log the errors
      console.error('⚠️ Some environment variables are missing. App may not function correctly.')
    }
  } else {
    console.log('✅ All required environment variables are present')
  }
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(name: keyof RequiredEnvVars, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`)
  }
  
  return value
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin
  }
  
  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  return 'http://localhost:3000'
}
