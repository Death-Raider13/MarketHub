# 🛡️ Input Validation & Sanitization Guide

## Overview

Comprehensive input validation and sanitization has been implemented to protect your Nigerian e-commerce platform against:
- ✅ XSS (Cross-Site Scripting) attacks
- ✅ SQL Injection attacks
- ✅ HTML Injection
- ✅ Path Traversal
- ✅ Malicious file uploads
- ✅ Invalid data formats
- ✅ Buffer overflow attacks

---

## 🚀 Implementation

### 1. **Validation Library** (`lib/validation.ts`)

Provides comprehensive validation schemas and sanitization functions using:
- **Zod** - TypeScript-first schema validation
- **Validator.js** - String validation and sanitization
- **DOMPurify** - HTML sanitization

### 2. **React Hooks** (`hooks/use-validation.ts`)

Custom hooks for form validation in React components.

### 3. **API Route Integration**

All API routes now validate and sanitize input automatically.

---

## 📋 Available Validation Schemas

### 1. **User Registration**

```typescript
import { userRegistrationSchema } from '@/lib/validation';

const result = userRegistrationSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123!',
  displayName: 'John Doe',
  phone: '08012345678',
  role: 'customer',
});
```

**Validates:**
- Email format and normalization
- Password strength (8+ chars, uppercase, lowercase, number, special char)
- Display name (2-50 chars, letters only)
- Nigerian phone number format
- Role (customer or vendor)

### 2. **Product Creation**

```typescript
import { productSchema } from '@/lib/validation';

const result = productSchema.parse({
  name: 'Wireless Headphones',
  description: 'High-quality audio device',
  price: 15000,
  stock: 50,
  category: 'Electronics',
  sku: 'WH-1000',
  images: ['https://example.com/image.jpg'],
  vendorId: 'vendor123',
});
```

**Validates:**
- Product name (3-200 chars)
- Description (10-5000 chars, HTML sanitized)
- Price (positive, max ₦10M)
- Stock (non-negative integer)
- SKU format (uppercase, numbers, hyphens)
- Images (1-10 valid URLs)

### 3. **Order Creation**

```typescript
import { orderSchema } from '@/lib/validation';

const result = orderSchema.parse({
  userId: 'user123',
  items: [
    { productId: 'prod1', quantity: 2, price: 5000 },
  ],
  total: 10000,
  shippingAddress: {
    fullName: 'John Doe',
    phone: '+2348012345678',
    addressLine1: '123 Main Street',
    city: 'Lagos',
    state: 'Lagos',
    zipCode: '100001',
    country: 'Nigeria',
  },
  paymentMethod: 'paystack',
});
```

**Validates:**
- User ID
- Items array (1-50 items, valid quantities)
- Total amount (positive, max ₦50M)
- Complete shipping address
- Nigerian phone number
- Payment method

### 4. **Review Submission**

```typescript
import { reviewSchema } from '@/lib/validation';

const result = reviewSchema.parse({
  productId: 'prod123',
  userId: 'user123',
  rating: 5,
  comment: 'Excellent product!',
  title: 'Great purchase',
  images: ['https://example.com/review.jpg'],
});
```

**Validates:**
- Rating (1-5 stars)
- Comment (10-2000 chars, HTML sanitized)
- Optional title and images

### 5. **Vendor Application**

```typescript
import { vendorApplicationSchema } from '@/lib/validation';

const result = vendorApplicationSchema.parse({
  userId: 'user123',
  businessName: 'ABC Trading Ltd',
  storeName: 'ABC Store',
  storeDescription: 'Quality products at affordable prices',
  businessType: 'LLC',
  taxId: 'TIN-12345678',
  email: 'vendor@example.com',
  phone: '+2348012345678',
  storeCategory: ['Electronics', 'Fashion'],
});
```

**Validates:**
- Business information
- Store name (alphanumeric, spaces, hyphens)
- Store description (20-500 chars)
- Tax ID
- Categories (1-5 selections)

---

## 🧹 Sanitization Functions

### 1. **HTML Sanitization**

```typescript
import { sanitizeHtml } from '@/lib/validation';

// Allow specific tags
const clean = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>');
// Result: '<p>Hello </p>'

// Custom allowed tags
const clean2 = sanitizeHtml('<b>Bold</b> <i>Italic</i>', ['b']);
// Result: '<b>Bold</b> Italic'
```

### 2. **Text Sanitization**

```typescript
import { sanitizeText } from '@/lib/validation';

const clean = sanitizeText('<p>Hello World</p>');
// Result: 'Hello World'
```

### 3. **Email Sanitization**

```typescript
import { sanitizeEmail } from '@/lib/validation';

const clean = sanitizeEmail('  USER@EXAMPLE.COM  ');
// Result: 'user@example.com'
```

### 4. **Phone Number Sanitization**

```typescript
import { sanitizePhone } from '@/lib/validation';

const clean1 = sanitizePhone('0803 456 7890');
// Result: '+2348034567890'

const clean2 = sanitizePhone('08034567890');
// Result: '+2348034567890'

const clean3 = sanitizePhone('2348034567890');
// Result: '+2348034567890'
```

### 5. **URL Sanitization**

```typescript
import { sanitizeUrl } from '@/lib/validation';

const clean = sanitizeUrl('https://example.com/page');
// Result: 'https://example.com/page'

const invalid = sanitizeUrl('javascript:alert("xss")');
// Result: ''
```

### 6. **File Name Sanitization**

```typescript
import { sanitizeFileName } from '@/lib/validation';

const clean = sanitizeFileName('../../../etc/passwd');
// Result: 'etcpasswd'

const clean2 = sanitizeFileName('my file (1).jpg');
// Result: 'my_file__1_.jpg'
```

---

## 🎣 React Hooks Usage

### 1. **useValidation Hook**

```typescript
import { useValidation } from '@/hooks/use-validation';
import { productSchema } from '@/lib/validation';

function ProductForm() {
  const { errors, isValid, validate, getFieldError } = useValidation(productSchema);
  
  const handleSubmit = (data: any) => {
    if (validate(data)) {
      // Data is valid and sanitized
      submitProduct(data);
    } else {
      // Show errors
      console.log(errors);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {getFieldError('name') && <span>{getFieldError('name')}</span>}
    </form>
  );
}
```

### 2. **useFieldValidation Hook**

```typescript
import { useFieldValidation } from '@/hooks/use-validation';
import { validateEmail } from '@/lib/validation';

function EmailInput() {
  const email = useFieldValidation('', (value) => ({
    isValid: validateEmail(value),
    error: validateEmail(value) ? undefined : 'Invalid email',
  }));
  
  return (
    <div>
      <input
        value={email.value}
        onChange={(e) => email.setValue(e.target.value)}
        onBlur={email.onBlur}
      />
      {email.touched && email.error && <span>{email.error}</span>}
    </div>
  );
}
```

### 3. **usePasswordStrength Hook**

```typescript
import { usePasswordStrength } from '@/hooks/use-validation';

function PasswordInput() {
  const [password, setPassword] = useState('');
  const { strength, feedback, checkStrength } = usePasswordStrength(password);
  
  useEffect(() => {
    checkStrength(password);
  }, [password]);
  
  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div>Strength: {strength}</div>
      <ul>
        {feedback.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🔒 Security Features

### 1. **XSS Detection**

```typescript
import { detectXss } from '@/lib/validation';

const hasXss = detectXss('<script>alert("xss")</script>');
// Result: true

const safe = detectXss('Hello World');
// Result: false
```

### 2. **SQL Injection Detection**

```typescript
import { detectSqlInjection } from '@/lib/validation';

const hasSql = detectSqlInjection("'; DROP TABLE users; --");
// Result: true

const safe = detectSqlInjection('John Doe');
// Result: false
```

### 3. **Comprehensive Input Validation**

```typescript
import { validateInput } from '@/lib/validation';

const result = validateInput('<script>alert("xss")</script>', 'html');
// Result: {
//   isValid: false,
//   sanitized: '',
//   errors: ['Input contains potentially malicious scripts']
// }
```

---

## 📡 API Route Integration

### Example: Product Creation API

```typescript
// app/api/products/route.ts
import { productSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    // Validate and sanitize automatically
    const validatedData = productSchema.parse(body);
    
    // Use sanitized data
    await createProduct(validatedData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Return validation errors
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: error.errors 
      },
      { status: 400 }
    );
  }
}
```

### Error Response Format

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 🧪 Testing Validation

### Unit Tests

```typescript
import { sanitizeHtml, validateEmail, detectXss } from '@/lib/validation';

describe('Validation', () => {
  it('should sanitize HTML', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>');
    expect(result).toBe('');
  });
  
  it('should validate email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });
  
  it('should detect XSS', () => {
    expect(detectXss('<script>alert("xss")</script>')).toBe(true);
    expect(detectXss('Hello World')).toBe(false);
  });
});
```

---

## 🎯 Nigerian-Specific Validation

### 1. **Phone Number Validation**

```typescript
import { validateNigerianPhone } from '@/lib/validation';

// Valid formats
validateNigerianPhone('08012345678'); // true
validateNigerianPhone('+2348012345678'); // true
validateNigerianPhone('2348012345678'); // true

// Invalid
validateNigerianPhone('1234567890'); // false
```

### 2. **State Validation**

```typescript
import { validateNigerianState } from '@/lib/validation';

validateNigerianState('Lagos'); // true
validateNigerianState('Kano'); // true
validateNigerianState('Invalid'); // false
```

### 3. **Currency Validation**

```typescript
// Price must be in Naira (₦)
const productSchema = z.object({
  price: z.number().positive().max(10000000), // Max ₦10M
});
```

---

## 📋 Validation Checklist

Before deploying to production:

- [ ] All user inputs are validated
- [ ] All HTML content is sanitized
- [ ] Email addresses are normalized
- [ ] Phone numbers are formatted consistently
- [ ] URLs are validated and sanitized
- [ ] File uploads are validated (type, size, extension)
- [ ] SQL injection patterns are detected
- [ ] XSS patterns are detected
- [ ] Nigerian phone numbers are validated
- [ ] Nigerian states are validated
- [ ] Price limits are enforced
- [ ] Stock quantities are validated
- [ ] API routes return proper validation errors
- [ ] Frontend forms use validation hooks
- [ ] Error messages are user-friendly

---

## 🆘 Troubleshooting

### Issue: Validation too strict

**Solution:** Adjust schema constraints

```typescript
// Before
name: z.string().min(10)

// After
name: z.string().min(3)
```

### Issue: HTML being stripped

**Solution:** Allow specific tags

```typescript
sanitizeHtml(content, ['b', 'i', 'p', 'br', 'ul', 'ol', 'li'])
```

### Issue: Phone numbers not formatting

**Solution:** Use sanitizePhone before validation

```typescript
const cleaned = sanitizePhone(phoneInput);
const isValid = validateNigerianPhone(cleaned);
```

---

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Validator.js Documentation](https://github.com/validatorjs/validator.js)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

## 🎯 Summary

Your Nigerian e-commerce platform now has:

✅ **Comprehensive validation** for all data types  
✅ **Automatic sanitization** of user input  
✅ **XSS protection** via HTML sanitization  
✅ **SQL injection prevention** via pattern detection  
✅ **Nigerian-specific validation** (phone, states, currency)  
✅ **Type-safe schemas** with TypeScript  
✅ **React hooks** for form validation  
✅ **API route integration** with error handling  
✅ **File upload validation** (type, size, extension)  
✅ **Password strength validation**  

**All user input is now validated and sanitized! 🛡️**

---

**Last Updated:** September 30, 2025  
**Version:** 1.0
