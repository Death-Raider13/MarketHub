# Vercel Environment Variables Setup Guide

## ⚠️ IMPORTANT: `.env.local` is NOT deployed to Vercel!

You need to manually add these environment variables to your Vercel project dashboard.

## Steps to Add Environment Variables to Vercel:

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **MarketHub**
3. Go to **Settings** → **Environment Variables**
4. Add each variable below with your actual values

## Required Environment Variables:

### Firebase Client Configuration (Public - can be exposed)
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

### Firebase Admin SDK (Private - keep secret!)
```
FIREBASE_SERVICE_ACCOUNT_JSON=<your-service-account-json-string>
```
**Note:** Copy the entire JSON object from your `.env.local` file as a single-line string.

### Cloudinary Configuration
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

### Paystack Configuration
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<your-paystack-public-key>
PAYSTACK_SECRET_KEY=<your-paystack-secret-key>
```

### Resend API
```
RESEND_API_KEY=<your-resend-api-key>
```

### App URL (Update for production!)
```
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

## Important Notes:

1. **For each variable**, click "Add" after pasting the value
2. **Select environments**: Check all three (Production, Preview, Development)
3. **FIREBASE_SERVICE_ACCOUNT_JSON**: Copy the ENTIRE JSON string as one line from your local `.env.local` file
4. **NEXT_PUBLIC_APP_URL**: Update this with your actual Vercel deployment URL after first deployment
5. After adding all variables, **redeploy** your application

## How to Get Your Values:

- **Firebase credentials**: Copy from your local `.env.local` file
- **Cloudinary**: Get from your Cloudinary dashboard
- **Paystack**: Get from your Paystack dashboard
- **Resend**: Get from your Resend dashboard

## Security Best Practices:

- ✅ Variables starting with `NEXT_PUBLIC_` are exposed to the browser (safe for client-side)
- 🔒 Variables WITHOUT `NEXT_PUBLIC_` are server-only (keep secret!)
- ⚠️ Never commit `.env.local` to Git (it's already in `.gitignore`)
- 🔐 Never share your Firebase service account JSON publicly
