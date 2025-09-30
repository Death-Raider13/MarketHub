/**
 * Environment Variable Validation for Nigerian E-commerce Platform
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

// ==================== ENVIRONMENT SCHEMAS ====================

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 */
const clientEnvSchema = z.object({
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, 'Firebase API key is required')
    .startsWith('AIza', 'Invalid Firebase API key format'),
  
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, 'Firebase auth domain is required')
    .endsWith('.firebaseapp.com', 'Invalid Firebase auth domain'),
  
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, 'Firebase project ID is required')
    .regex(/^[a-z0-9-]+$/, 'Invalid Firebase project ID format'),
  
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, 'Firebase storage bucket is required')
    .endsWith('.appspot.com', 'Invalid Firebase storage bucket'),
  
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'Firebase messaging sender ID is required')
    .regex(/^\d+$/, 'Messaging sender ID must be numeric'),
  
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, 'Firebase app ID is required')
    .startsWith('1:', 'Invalid Firebase app ID format'),
  
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('G-'),
      'Invalid Firebase measurement ID format'
    ),
  
  // Paystack Configuration (Nigerian Payment Gateway)
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('pk_'),
      'Invalid Paystack public key format'
    ),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .default('http://localhost:3000'),
  
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, 'App name is required')
    .default('MarketHub'),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  
  NEXT_PUBLIC_ENABLE_PWA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  
  // Environment
  NEXT_PUBLIC_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
});

/**
 * Server-side environment variables
 */
const serverEnvSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  
  // Firebase Admin SDK (Server-side)
  FIREBASE_ADMIN_PROJECT_ID: z
    .string()
    .optional(),
  
  FIREBASE_ADMIN_CLIENT_EMAIL: z
    .string()
    .email('Invalid Firebase admin client email')
    .optional(),
  
  FIREBASE_ADMIN_PRIVATE_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.includes('BEGIN PRIVATE KEY'),
      'Invalid Firebase admin private key format'
    ),
  
  // Paystack Secret Key (Server-side)
  PAYSTACK_SECRET_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('sk_'),
      'Invalid Paystack secret key format'
    ),
  
  // Flutterwave Configuration (Alternative Payment Gateway)
  FLUTTERWAVE_SECRET_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('FLWSECK-'),
      'Invalid Flutterwave secret key format'
    ),
  
  FLUTTERWAVE_PUBLIC_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('FLWPUBK-'),
      'Invalid Flutterwave public key format'
    ),
  
  // Email Service (Resend)
  RESEND_API_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('re_'),
      'Invalid Resend API key format'
    ),
  
  // SendGrid (Alternative Email Service)
  SENDGRID_API_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('SG.'),
      'Invalid SendGrid API key format'
    ),
  
  // SMS Service (Termii - Nigerian SMS Provider)
  TERMII_API_KEY: z
    .string()
    .optional(),
  
  TERMII_SENDER_ID: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 11,
      'Termii sender ID must be 11 characters or less'
    ),
  
  // Redis Configuration (for rate limiting and caching)
  REDIS_URL: z
    .string()
    .url('Invalid Redis URL')
    .optional(),
  
  REDIS_TOKEN: z
    .string()
    .optional(),
  
  // Database URLs
  DATABASE_URL: z
    .string()
    .url('Invalid database URL')
    .optional(),
  
  // Cloudinary (Image CDN)
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .optional(),
  
  CLOUDINARY_API_KEY: z
    .string()
    .optional(),
  
  CLOUDINARY_API_SECRET: z
    .string()
    .optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('G-') || val.startsWith('UA-'),
      'Invalid Google Analytics ID format'
    ),
  
  // Sentry (Error Tracking)
  SENTRY_DSN: z
    .string()
    .url('Invalid Sentry DSN')
    .optional(),
  
  SENTRY_AUTH_TOKEN: z
    .string()
    .optional(),
  
  // Vercel Configuration
  VERCEL_URL: z
    .string()
    .optional(),
  
  VERCEL_ENV: z
    .enum(['development', 'preview', 'production'])
    .optional(),
  
  // Security
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NextAuth secret must be at least 32 characters')
    .optional(),
  
  NEXTAUTH_URL: z
    .string()
    .url('Invalid NextAuth URL')
    .optional(),
  
  // Webhook Secrets
  PAYSTACK_WEBHOOK_SECRET: z
    .string()
    .optional(),
  
  FLUTTERWAVE_WEBHOOK_SECRET: z
    .string()
    .optional(),
  
  // Rate Limiting
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
  
  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),
});

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate client-side environment variables
 */
export function validateClientEnv() {
  try {
    const env = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA,
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    };

    return clientEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid client environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Client environment validation failed');
    }
    throw error;
  }
}

/**
 * Validate server-side environment variables
 */
export function validateServerEnv() {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
      FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      TERMII_API_KEY: process.env.TERMII_API_KEY,
      TERMII_SENDER_ID: process.env.TERMII_SENDER_ID,
      REDIS_URL: process.env.REDIS_URL,
      REDIS_TOKEN: process.env.REDIS_TOKEN,
      DATABASE_URL: process.env.DATABASE_URL,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
      FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
      RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
      LOG_LEVEL: process.env.LOG_LEVEL,
    };

    return serverEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid server environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Server environment validation failed');
    }
    throw error;
  }
}

/**
 * Check if required environment variables are set
 */
export function checkRequiredEnv(): {
  isValid: boolean;
  missing: string[];
  invalid: string[];
} {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Required client variables
  const requiredClient = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  requiredClient.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Validate formats
  try {
    validateClientEnv();
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        invalid.push(err.path.join('.'));
      });
    }
  }

  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig() {
  const env = process.env.NODE_ENV || 'development';

  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    env,
  };
}

/**
 * Mask sensitive environment variables for logging
 */
export function maskSensitiveEnv(key: string, value: string): string {
  const sensitiveKeys = [
    'API_KEY',
    'SECRET',
    'TOKEN',
    'PASSWORD',
    'PRIVATE_KEY',
    'DSN',
  ];

  const isSensitive = sensitiveKeys.some((sensitive) =>
    key.toUpperCase().includes(sensitive)
  );

  if (isSensitive && value) {
    return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  }

  return value;
}

/**
 * Log environment configuration (safe for production)
 */
export function logEnvConfig(): void {
  console.log('🔧 Environment Configuration:');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
  console.log(`  Firebase Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}`);
  console.log(`  Paystack: ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Email Service: ${process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  SMS Service: ${process.env.TERMII_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Redis: ${process.env.REDIS_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Analytics: ${process.env.GOOGLE_ANALYTICS_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Error Tracking: ${process.env.SENTRY_DSN ? '✅ Configured' : '❌ Not configured'}`);
}

// ==================== EXPORTED ENVIRONMENT ====================

/**
 * Validated client environment variables
 * Safe to use in client-side code
 */
export const clientEnv = validateClientEnv();

/**
 * Validated server environment variables
 * Only use in server-side code (API routes, server components)
 */
export const serverEnv = typeof window === 'undefined' ? validateServerEnv() : null;

/**
 * Type-safe environment access
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// ==================== INITIALIZATION ====================

// Validate on module load
if (typeof window === 'undefined') {
  // Server-side
  try {
    validateClientEnv();
    validateServerEnv();
    
    if (process.env.NODE_ENV === 'development') {
      logEnvConfig();
    }
  } catch (error) {
    console.error('❌ Environment validation failed on startup');
    if (process.env.NODE_ENV === 'production') {
      // In production, fail fast
      process.exit(1);
    }
  }
} else {
  // Client-side
  try {
    validateClientEnv();
  } catch (error) {
    console.error('❌ Client environment validation failed');
  }
}
