# Adding Environment Variables to Your Website

This guide will help you add the Cloudinary and Paystack keys to your MarketHub e-commerce platform.

## 📋 Environment Variables to Add

You need to add the following keys to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dkd6x857p
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Andrew Cares Village Hub

# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_4f982216f23d912048d00f1a9c9f77a7b54647bc
```

## 🚀 Step-by-Step Instructions

### Step 1: Open Your `.env.local` File

1. Navigate to your project root directory: `c:\Users\ENVY\Downloads\marketplace-ecommerce`
2. Open the `.env.local` file in your code editor

### Step 2: Add the Environment Variables

Add the following lines to your `.env.local` file:

```env
# ==================== CLOUDINARY CONFIGURATION ====================
# Cloud name for your Cloudinary account
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dkd6x857p

# Upload preset for unsigned uploads (allows client-side uploads without API secret)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Andrew Cares Village Hub

# ==================== PAYSTACK CONFIGURATION ====================
# Paystack public key for client-side payment processing
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_4f982216f23d912048d00f1a9c9f77a7b54647bc
```

### Step 3: Restart Your Development Server

After adding the environment variables, you need to restart your development server for the changes to take effect:

1. Stop the current server (press `Ctrl+C` in the terminal)
2. Start the server again:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

## ✅ What These Keys Enable

### Cloudinary Keys
- **`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`**: Identifies your Cloudinary account
- **`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`**: Allows users to upload images directly from the browser without exposing your API secret
  - This is used for product images, vendor logos, user avatars, etc.
  - The preset "Andrew Cares Village Hub" should be configured in your Cloudinary dashboard

### Paystack Key
- **`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`**: Enables payment processing on the client side
  - This is a **test key** (starts with `pk_test_`)
  - Use this for testing payments during development
  - Replace with a live key (`pk_live_...`) when going to production

## 🔒 Security Notes

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Test vs Live Keys**: 
   - You're currently using a Paystack **test key** - perfect for development
   - Before going live, replace it with your production key
3. **Upload Preset**: Make sure your Cloudinary upload preset is configured as "unsigned" in the Cloudinary dashboard

## 🧪 Testing Your Configuration

After adding the keys and restarting the server:

1. **Test Cloudinary**:
   - Try uploading a product image
   - Try updating your vendor profile picture
   - Check if images are being uploaded to your Cloudinary account

2. **Test Paystack**:
   - Go through the checkout process
   - Use Paystack test card numbers (available in Paystack documentation)
   - Verify that payment processing works

## 📝 Additional Configuration (Optional)

If you need server-side Cloudinary operations (like image transformations, deletions, etc.), you can also add:

```env
# Server-side Cloudinary keys (optional)
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=Andrew Cares Village Hub
```

Get these from your Cloudinary dashboard: https://console.cloudinary.com/

## 🎯 What's Already Configured

The following files have been updated to support these environment variables:

1. **`lib/env.ts`**: 
   - Added validation schemas for Cloudinary and Paystack keys
   - Added client-side environment variables for browser access
   - Added server-side environment variables for API routes

2. **`env.example.txt`**: 
   - Updated with Cloudinary configuration examples
   - Shows the proper format for all environment variables

## 🆘 Troubleshooting

### Environment Variables Not Working?

1. **Restart the dev server** - Environment variables are loaded at startup
2. **Check for typos** - Variable names must match exactly (including `NEXT_PUBLIC_` prefix)
3. **Check the console** - The app validates environment variables on startup and will show errors

### Cloudinary Upload Failing?

1. Verify the cloud name is correct: `dkd6x857p`
2. Check that the upload preset exists in your Cloudinary dashboard
3. Ensure the upload preset is set to "unsigned" mode

### Paystack Not Working?

1. Verify you're using the test key for development
2. Check that the key starts with `pk_test_`
3. Use Paystack test card numbers for testing

## 📚 Related Documentation

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Paystack Documentation](https://paystack.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Need Help?** Check the project's other documentation files or refer to the official documentation for each service.
