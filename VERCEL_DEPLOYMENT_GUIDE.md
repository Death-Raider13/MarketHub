# 🚀 Vercel Deployment Guide

This guide will walk you through deploying your Nigerian E-commerce Marketplace to Vercel.

## 📋 Prerequisites

- ✅ Vercel CLI installed (already done!)
- ✅ Firebase project set up
- ✅ Vercel account (free tier is sufficient)

## 🔑 Step 1: Prepare Your Environment Variables

Your application requires Firebase configuration to work. You have two options:

### Option A: Configure During Deployment (Recommended)
You'll be prompted to add environment variables during the `vercel` command.

### Option B: Configure in Vercel Dashboard (After Deployment)
You can add them later in the Vercel dashboard.

### Required Environment Variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (optional)
```

**Where to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > Project Settings
4. Scroll down to "Your apps" section
5. Click on your web app or create one
6. Copy the config values

## 🚀 Step 2: Login to Vercel

Run this command to authenticate with Vercel:

```bash
vercel login
```

This will open your browser to login. Choose your preferred method:
- GitHub
- GitLab
- Bitbucket
- Email

## 📦 Step 3: Deploy to Vercel

### First Deployment

Run this command in your project directory:

```bash
vercel
```

You'll be asked several questions:

1. **Set up and deploy?** → Press `Y` (Yes)
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → Press `N` (No, this is your first deployment)
4. **What's your project's name?** → Enter a name (e.g., `marketplace-ecommerce`)
5. **In which directory is your code located?** → Press Enter (current directory)
6. **Want to override the settings?** → Press `N` (No)

The deployment will start! This may take 2-5 minutes.

### Production Deployment

After your first deployment, to deploy to production:

```bash
vercel --prod
```

## 🔧 Step 4: Configure Environment Variables

### Method 1: Via Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Variable name: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: Your Firebase API key
   - Environment: Select **Production**, **Preview**, and **Development**
5. Click **Save**
6. Repeat for all required variables

**After adding variables, redeploy:**
```bash
vercel --prod
```

### Method 2: Via Vercel CLI

```bash
# Add a single environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY

# You'll be prompted to:
# 1. Enter the value
# 2. Select which environments (Production, Preview, Development)
```

## 🌐 Step 5: Access Your Deployed Application

After deployment completes, you'll see:

```
✅ Production: https://your-project.vercel.app
```

Click the URL or copy it to your browser!

## 🔄 Step 6: Update Your Firebase Configuration

**IMPORTANT:** Update your Firebase project to allow your Vercel domain:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain: `your-project.vercel.app`
6. Click **Add**

Also update **Firestore Security Rules** if needed to allow your domain.

## 📝 Common Commands

```bash
# Deploy to preview (development)
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove a deployment
vercel rm [deployment-url]

# View project info
vercel inspect

# Pull environment variables from Vercel
vercel env pull
```

## 🐛 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Add all required Firebase environment variables in Vercel dashboard

**Error: Module not found**
- Solution: Make sure all dependencies are in `package.json`
- Run: `vercel --prod` to redeploy

### Application Errors

**Firebase Authentication not working**
- Solution: Add your Vercel domain to Firebase Authorized domains

**Images not loading**
- Solution: Check if images are in the `public` folder
- Verify `next.config.mjs` has `images: { unoptimized: true }`

**API Routes failing**
- Solution: Check Vercel function logs: `vercel logs`
- Ensure environment variables are set for Production environment

### Performance Issues

**Slow loading**
- Solution: Enable Vercel Analytics in dashboard
- Consider adding a CDN for images (Cloudinary)

## 🎯 Next Steps

1. **Set up a custom domain** (optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Enable Vercel Analytics**
   - Go to Project Settings → Analytics
   - Enable Web Analytics (free)

3. **Set up GitHub Integration** (recommended for future updates)
   - Create a GitHub repository
   - Push your code: `git init && git add . && git commit -m "Initial commit"`
   - Connect to Vercel: Project Settings → Git
   - Future pushes will auto-deploy!

4. **Configure Webhooks** (if using Paystack)
   - Add webhook URL: `https://your-project.vercel.app/api/webhooks/paystack`

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Hosting vs Vercel](https://vercel.com/guides/migrating-from-firebase-to-vercel)

## 🆘 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs: `vercel logs`
2. Check browser console for errors
3. Review Firebase console for authentication errors
4. Contact Vercel support (very responsive!)

---

**Ready to deploy?** Run `vercel login` to get started! 🚀
