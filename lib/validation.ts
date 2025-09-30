/**
 * Input Validation & Sanitization for Nigerian E-commerce Platform
 * Protects against XSS, SQL Injection, and malicious input
 */

import { z } from 'zod';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// ==================== SANITIZATION FUNCTIONS ====================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string, allowedTags?: string[]): string {
  const config = allowedTags
    ? { ALLOWED_TAGS: allowedTags }
    : {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return validator.normalizeEmail(email.trim().toLowerCase()) || '';
}

/**
 * Sanitize phone number (Nigerian format)
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format to Nigerian standard
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  if (!validator.isURL(trimmed, { require_protocol: true })) {
    return '';
  }
  
  // Only allow http and https protocols
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  const cleaned = fileName.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  
  // Remove special characters except dots, dashes, and underscores
  return cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Escape special characters for database queries
 */
export function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
}

// ==================== VALIDATION SCHEMAS ====================

/**
 * User Registration Schema
 */
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters')
    .transform(sanitizeEmail),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(sanitizeText),
  
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .transform(sanitizePhone),
  
  role: z.enum(['customer', 'vendor', 'admin', 'super_admin'], {
    errorMap: () => ({ message: 'Role must be customer, vendor, admin, or super_admin' }),
  }),
});

/**
 * Product Schema
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters')
    .transform(sanitizeText),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .transform((val) => sanitizeHtml(val)),
  
  price: z
    .number()
    .positive('Price must be greater than 0')
    .max(10000000, 'Price must not exceed ₦10,000,000')
    .refine((val) => Number.isFinite(val), 'Price must be a valid number'),
  
  comparePrice: z
    .number()
    .positive('Compare price must be greater than 0')
    .optional()
    .nullable(),
  
  stock: z
    .number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative')
    .max(1000000, 'Stock must not exceed 1,000,000'),
  
  category: z
    .string()
    .min(2, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
    .transform(sanitizeText),
  
  subcategory: z
    .string()
    .max(50, 'Subcategory must not exceed 50 characters')
    .optional()
    .transform((val) => val ? sanitizeText(val) : undefined),
  
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU can only contain uppercase letters, numbers, and hyphens')
    .transform(sanitizeText),
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  
  vendorId: z
    .string()
    .min(1, 'Vendor ID is required')
    .transform(sanitizeText),
});

/**
 * Order Schema
 */
export const orderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive().max(100, 'Quantity cannot exceed 100'),
        price: z.number().positive(),
      })
    )
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per order'),
  
  total: z
    .number()
    .positive('Total must be greater than 0')
    .max(50000000, 'Total must not exceed ₦50,000,000'),
  
  shippingAddress: z.object({
    fullName: z
      .string()
      .min(2, 'Full name is required')
      .max(100, 'Full name must not exceed 100 characters')
      .transform(sanitizeText),
    
    phone: z
      .string()
      .min(10, 'Phone number is required')
      .transform(sanitizePhone),
    
    addressLine1: z
      .string()
      .min(5, 'Address is required')
      .max(200, 'Address must not exceed 200 characters')
      .transform(sanitizeText),
    
    addressLine2: z
      .string()
      .max(200, 'Address must not exceed 200 characters')
      .optional()
      .transform((val) => val ? sanitizeText(val) : undefined),
    
    city: z
      .string()
      .min(2, 'City is required')
      .max(50, 'City must not exceed 50 characters')
      .transform(sanitizeText),
    
    state: z
      .string()
      .min(2, 'State is required')
      .max(50, 'State must not exceed 50 characters')
      .transform(sanitizeText),
    
    zipCode: z
      .string()
      .min(5, 'ZIP code is required')
      .max(10, 'ZIP code must not exceed 10 characters')
      .transform(sanitizeText),
    
    country: z
      .string()
      .default('Nigeria')
      .transform(sanitizeText),
  }),
  
  paymentMethod: z.enum(['paystack', 'flutterwave', 'bank_transfer', 'cash_on_delivery']),
});

/**
 * Review Schema
 */
export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  
  userId: z.string().min(1, 'User ID is required'),
  
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review must not exceed 2000 characters')
    .transform((val) => sanitizeHtml(val, ['b', 'i', 'em', 'strong', 'p', 'br'])),
  
  title: z
    .string()
    .max(100, 'Title must not exceed 100 characters')
    .optional()
    .transform((val) => val ? sanitizeText(val) : undefined),
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

/**
 * Vendor Application Schema
 */
export const vendorApplicationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  
  businessName: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .transform(sanitizeText),
  
  storeName: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(50, 'Store name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Store name can only contain letters, numbers, spaces, and hyphens')
    .transform(sanitizeText),
  
  storeDescription: z
    .string()
    .min(20, 'Store description must be at least 20 characters')
    .max(500, 'Store description must not exceed 500 characters')
    .transform((val) => sanitizeHtml(val)),
  
  businessType: z.enum([
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'Corporation',
    'Non-Profit',
    'Other',
  ]),
  
  taxId: z
    .string()
    .min(5, 'Tax ID is required')
    .max(50, 'Tax ID must not exceed 50 characters')
    .transform(sanitizeText),
  
  email: z
    .string()
    .email('Invalid email address')
    .transform(sanitizeEmail),
  
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .transform(sanitizePhone),
  
  storeCategory: z
    .array(z.string())
    .min(1, 'At least one category is required')
    .max(5, 'Maximum 5 categories allowed'),
});

/**
 * Message Schema
 */
export const messageSchema = z.object({
  senderId: z.string().min(1, 'Sender ID is required'),
  
  receiverId: z.string().min(1, 'Receiver ID is required'),
  
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must not exceed 1000 characters')
    .transform((val) => sanitizeHtml(val, ['b', 'i', 'em', 'strong', 'br'])),
  
  subject: z
    .string()
    .max(200, 'Subject must not exceed 200 characters')
    .optional()
    .transform((val) => val ? sanitizeText(val) : undefined),
});

/**
 * Search Query Schema
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query must not exceed 200 characters')
    .transform(sanitizeText),
  
  category: z
    .string()
    .max(50, 'Category must not exceed 50 characters')
    .optional()
    .transform((val) => val ? sanitizeText(val) : undefined),
  
  minPrice: z
    .number()
    .nonnegative('Minimum price cannot be negative')
    .optional(),
  
  maxPrice: z
    .number()
    .positive('Maximum price must be greater than 0')
    .optional(),
  
  sortBy: z
    .enum(['relevance', 'price-low', 'price-high', 'rating', 'newest'])
    .optional(),
  
  page: z
    .number()
    .int()
    .positive()
    .max(1000, 'Page number too high')
    .default(1),
  
  limit: z
    .number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

/**
 * Validate Nigerian phone number
 */
export function validateNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  const patterns = [
    /^0[789][01]\d{8}$/, // 0803XXXXXXX
    /^\+234[789][01]\d{8}$/, // +2348XXXXXXXX
    /^234[789][01]\d{8}$/, // 2348XXXXXXXX
  ];
  
  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters (A-Z)');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters (a-z)');
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers (0-9)');
  } else {
    score++;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  } else {
    score++;
  }

  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

  return {
    isValid: score >= 3,
    strength,
    feedback,
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must not exceed ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { isValid: true };
}

/**
 * Validate Nigerian state
 */
export function validateNigerianState(state: string): boolean {
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
    'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  ];

  return nigerianStates.includes(state);
}

/**
 * Check for SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(UNION.*SELECT)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(
  input: string,
  type: 'text' | 'html' | 'email' | 'url' | 'phone' = 'text'
): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  let sanitized = input;

  // Check for SQL injection
  if (detectSqlInjection(input)) {
    errors.push('Input contains potentially malicious SQL patterns');
  }

  // Check for XSS
  if (detectXss(input)) {
    errors.push('Input contains potentially malicious scripts');
  }

  // Sanitize based on type
  switch (type) {
    case 'html':
      sanitized = sanitizeHtml(input);
      break;
    case 'email':
      sanitized = sanitizeEmail(input);
      if (!validateEmail(sanitized)) {
        errors.push('Invalid email format');
      }
      break;
    case 'url':
      sanitized = sanitizeUrl(input);
      if (!sanitized) {
        errors.push('Invalid URL format');
      }
      break;
    case 'phone':
      sanitized = sanitizePhone(input);
      if (!validateNigerianPhone(sanitized)) {
        errors.push('Invalid Nigerian phone number');
      }
      break;
    default:
      sanitized = sanitizeText(input);
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}
