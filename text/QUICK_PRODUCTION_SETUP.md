# ⚡ Quick Production Setup (5 Minutes)

## 🎯 The Code Already Handles Dev vs Production Automatically!

### **How It Works:**

```typescript
// The code automatically detects your environment:
url: window.location.origin + '/auth/action'

// Development: http://localhost:3000/auth/action
// Production:  https://your-domain.com/auth/action
```

**No code changes needed between dev and production!** ✅

---

## 🚀 Production Setup (Step-by-Step)

### **1. Deploy to Vercel (2 minutes)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Your site is now live!** 🎉

---

### **2. Set Environment Variables in Vercel (2 minutes)**

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

```bash
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Redeploy after adding variables:**
```bash
vercel --prod
```

---

### **3. Update Firebase Console (1 minute)**

1. Go to: https://console.firebase.google.com
2. Authentication → Templates
3. Edit "Email address verification"
4. Change Action URL to:
   ```
   https://your-project.vercel.app/auth/action
   ```
5. Save

**Done!** ✅

---

## 🧪 Test Production

1. Go to your live site
2. Sign up with real email
3. Check email
4. Click verification link
5. Should see your beautiful branded page!

---

## 📋 Environment Variables Needed

### **Required:**
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
```

### **Firebase (copy from .env.local):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### **Firebase Admin SDK:**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 🎯 That's It!

**3 Steps:**
1. ✅ Deploy to Vercel
2. ✅ Add environment variables
3. ✅ Update Firebase action URL

**Total Time:** ~5 minutes

**The code automatically handles everything else!** 🚀

---

## 🔄 For Custom Domain

1. Add domain in Vercel
2. Update DNS records
3. Change `NEXT_PUBLIC_APP_URL` to your domain
4. Update Firebase action URL to your domain

---

## 💡 Pro Tips

### **Tip 1: Use Preview Deployments**
Every git push creates a preview:
```
https://your-project-git-branch.vercel.app
```

### **Tip 2: Separate Firebase Projects**
- Development: `your-project-dev`
- Production: `your-project-prod`

### **Tip 3: Environment-Specific Keys**
```bash
# Development (.env.local)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Production (Vercel)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
```

---

## 🚨 Common Issues

### **Issue: Verification email still shows Firebase URL**
**Fix:** Update Firebase Console action URL

### **Issue: Payment not working**
**Fix:** Switch to live Paystack keys

### **Issue: Emails not sending**
**Fix:** Verify domain in Resend

---

## ✅ Checklist

- [ ] Deployed to Vercel
- [ ] Environment variables added
- [ ] Firebase action URL updated
- [ ] Tested signup flow
- [ ] Tested payment flow
- [ ] Verified emails working

---

*Quick Setup Guide*
*Time Required: 5 minutes* ⚡
