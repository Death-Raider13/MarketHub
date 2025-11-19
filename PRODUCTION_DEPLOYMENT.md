# 🚀 Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update all Firebase credentials with production values
- [ ] Replace test Paystack keys with live keys (`pk_live_...` and `sk_live_...`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Set `NODE_ENV=production`
- [ ] Verify all environment variables with: `npm run build`

### 2. Firebase Configuration
- [ ] Create production Firebase project
- [ ] Enable Authentication, Firestore, and Storage
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Create Firebase Admin service account for server-side operations
- [ ] Add production domain to Firebase Auth authorized domains

### 3. Payment Gateway Setup
- [ ] Activate Paystack live mode
- [ ] Update webhook URLs to production endpoints
- [ ] Test payment flow in live mode with small amounts

### 4. Security Verification
- [ ] Verify admin authentication is enabled (no TEMPORARY comments)
- [ ] Confirm Firestore rules are restrictive (no `allow read: if true`)
- [ ] Check TypeScript and ESLint are enabled in `next.config.mjs`
- [ ] Verify environment variable validation runs on startup

## 🔧 Deployment Steps

### Option 1: Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add all environment variables in Vercel dashboard
   - Deploy automatically on push to main branch

3. **Configure Custom Domain**
   - Add your custom domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` environment variable

### Option 2: Manual Deployment

1. **Build Application**
   ```bash
   npm run build
   npm start
   ```

2. **Deploy to Your Server**
   - Upload built files to your server
   - Configure environment variables
   - Set up reverse proxy (nginx/Apache)

## 🛡️ Security Hardening

### 1. Firestore Security Rules
Ensure these rules are properly configured:
```javascript
// Products - only approved products are publicly readable
allow read: if resource.data.status == "approved";

// Orders - strict payment verification rules
allow update: if resource.data.status == 'pending' && 
              request.resource.data.status == 'paid' &&
              request.resource.data.keys().hasAll(['paymentStatus', 'paymentReference', 'paidAt']);
```

### 2. Admin Access Control
- Admin authentication is now properly enabled
- Permission-based access control is enforced
- All admin actions are logged for audit trails

### 3. Rate Limiting
- Implemented for all critical endpoints
- Different limits for different operations
- IP-based and user-based tracking

## 📊 Monitoring & Logging

### 1. Application Logging
- Structured JSON logging implemented
- Security events are tracked
- Business events are logged for analytics

### 2. Error Tracking (Recommended)
Add error tracking service:
```bash
npm install @sentry/nextjs
```

### 3. Performance Monitoring
Monitor these metrics:
- API response times
- Database query performance
- Payment processing success rates
- User authentication success rates

## 🔄 Post-Deployment Verification

### 1. Functional Testing
- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Shopping cart and checkout
- [ ] Payment processing
- [ ] Order management
- [ ] Admin panel access
- [ ] Vendor dashboard functionality

### 2. Security Testing
- [ ] Unauthorized access attempts
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Rate limiting effectiveness
- [ ] Admin permission enforcement

### 3. Performance Testing
- [ ] Page load times
- [ ] API response times
- [ ] Database query performance
- [ ] Image loading optimization

## 🚨 Emergency Procedures

### 1. Rollback Plan
```bash
# Quick rollback to previous version
git revert HEAD
git push origin main
# Redeploy through Vercel
```

### 2. Security Incident Response
1. Immediately disable affected admin accounts
2. Check logs for unauthorized access
3. Update security rules if needed
4. Notify affected users if data breach occurred

### 3. Performance Issues
1. Check database query performance
2. Monitor API response times
3. Scale server resources if needed
4. Optimize slow queries

## 📞 Support Contacts

- **Technical Issues**: Check application logs first
- **Payment Issues**: Contact Paystack support
- **Firebase Issues**: Check Firebase console
- **Security Concerns**: Review audit logs immediately

## 🎯 Success Metrics

Track these KPIs post-deployment:
- User registration rate
- Payment success rate
- Page load times < 3 seconds
- API response times < 500ms
- Zero security incidents
- 99.9% uptime

---

## ✅ Deployment Status

- [x] **Critical Security Issues Fixed**
- [x] **Admin Authentication Enabled**
- [x] **Firestore Rules Secured**
- [x] **Environment Validation Added**
- [x] **Logging System Implemented**
- [x] **TypeScript/ESLint Enabled**

**🎉 Your application is now PRODUCTION READY!**
