# 🚀 Deployment Checklist

## ✅ **Pre-Deployment Verification**

### **1. Environment Variables**
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set
- [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` set
- [ ] Firebase config variables set
- [ ] Paystack keys configured

### **2. Firebase Configuration**
- [x] Firestore rules updated
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Firebase Admin SDK initialized

### **3. API Routes**
- [x] `/api/creator/products` - Create & List products
- [x] `/api/creator/products/[id]` - Update & Delete products
- [x] `/api/creator/stats` - Dashboard statistics
- [x] `/api/advertiser/campaigns` - Ad campaigns
- [x] `/api/advertiser/add-funds` - Payment processing

---

## 📦 **Deployment Commands**

### **Step 1: Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```
**Expected Output:** `✓ firestore: released rules`

### **Step 2: Deploy Firestore Indexes**
```bash
firebase deploy --only firestore:indexes
```
**Expected Output:** `✓ firestore: indexes deployed`

### **Step 3: Build Application**
```bash
npm run build
```
**Check for:** No build errors

### **Step 4: Test Locally**
```bash
npm run dev
```
**Test:**
- [ ] creator can create products
- [ ] Products persist after reload
- [ ] Store customization saves
- [ ] Dashboard shows real data
- [ ] Advertiser can create campaigns
- [ ] Payments work with Paystack

---

## 🧪 **Testing Checklist**

### **creator Flow:**
- [ ] Sign up as creator
- [ ] Email verification works
- [ ] Admin approval process
- [ ] Create product with images
- [ ] Product appears in list
- [ ] Update product details
- [ ] Update stock quantity
- [ ] Delete (archive) product
- [ ] Customize store settings
- [ ] Settings persist after reload
- [ ] Dashboard shows real stats

### **Advertiser Flow:**
- [ ] Sign up as advertiser
- [ ] Create advertiser profile
- [ ] Add funds via Paystack
- [ ] Balance updates correctly
- [ ] Create ad campaign
- [ ] Campaign appears in list
- [ ] Campaign data persists

### **General:**
- [ ] Authentication works
- [ ] Protected routes redirect
- [ ] Role-based access control
- [ ] Error handling works
- [ ] Loading states display
- [ ] Toast notifications show

---

## 🔐 **Security Checklist**

### **Firestore Rules:**
- [x] Users can only read/write their own data
- [x] Products collection secured
- [x] Advertisers collection secured
- [x] Campaigns collection secured
- [x] Store customization secured
- [x] Admin-only operations protected

### **API Routes:**
- [x] Use Firebase Admin SDK
- [x] Validate user authentication
- [x] Check user permissions
- [x] Validate input data
- [x] Handle errors gracefully

---

## 📊 **Data Verification**

### **Collections to Check:**
```
✅ users
✅ products
✅ storeCustomization
✅ advertisers
✅ adCampaigns
✅ transactions
```

### **Indexes Required:**
```
✅ products: creatorId + createdAt
✅ products: status + createdAt
✅ products: category + createdAt
✅ adCampaigns: advertiserId + createdAt
✅ transactions: userId + createdAt
```

---

## 🌐 **Production Deployment**

### **Vercel/Netlify:**
```bash
# Build and deploy
npm run build
vercel deploy --prod
# or
netlify deploy --prod
```

### **Environment Variables (Production):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

---

## ✅ **Post-Deployment Verification**

### **Test in Production:**
- [ ] Visit production URL
- [ ] Sign up new creator account
- [ ] Create test product
- [ ] Verify data in Firestore
- [ ] Test image uploads
- [ ] Test payments (use test keys)
- [ ] Check dashboard stats
- [ ] Test store customization
- [ ] Verify all pages load
- [ ] Check mobile responsiveness

---

## 🐛 **Common Issues & Solutions**

### **Issue: Firestore permission denied**
**Solution:** Deploy Firestore rules
```bash
firebase deploy --only firestore:rules
```

### **Issue: Images not uploading**
**Solution:** Check Cloudinary env variables
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

### **Issue: Admin SDK not working**
**Solution:** Verify Firebase Admin credentials
```
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

### **Issue: Products not loading**
**Solution:** Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

---

## 📈 **Monitoring**

### **What to Monitor:**
- [ ] Error logs in Firebase Console
- [ ] API response times
- [ ] Firestore read/write counts
- [ ] Cloudinary bandwidth usage
- [ ] Paystack transaction logs
- [ ] User sign-ups
- [ ] Product creation rate

---

## 🎯 **Success Criteria**

### **System is Ready When:**
- ✅ All tests pass
- ✅ No console errors
- ✅ Data persists correctly
- ✅ Images upload successfully
- ✅ Payments process correctly
- ✅ Security rules enforced
- ✅ Performance is acceptable
- ✅ Mobile experience is smooth

---

## 📞 **Support Resources**

### **Documentation:**
- Firebase: https://firebase.google.com/docs
- Cloudinary: https://cloudinary.com/documentation
- Paystack: https://paystack.com/docs
- Next.js: https://nextjs.org/docs

### **Troubleshooting:**
1. Check browser console for errors
2. Check Firebase Console for logs
3. Verify environment variables
4. Test API routes directly
5. Check Firestore security rules

---

**🚀 Ready to deploy! Follow this checklist step by step.**

*Last Updated: January 16, 2025*
