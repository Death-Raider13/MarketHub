# Deploy Firestore Indexes

## Critical: Missing Index for purchasedProducts

The `/api/customer/purchases` endpoint is failing because it's missing a Firestore index.

### Required Index
```json
{
  "collectionGroup": "purchasedProducts",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "userId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "purchasedAt",
      "order": "DESCENDING"
    }
  ]
}
```

## Deployment Steps

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Deploy indexes**:
```bash
firebase deploy --only firestore:indexes
```

This will read `firestore.indexes.json` and create all missing indexes.

### Option 2: Create Index Manually

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `marketplace-97508`
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Fill in:
   - Collection ID: `purchasedProducts`
   - Fields to index:
     - Field: `userId`, Order: `Ascending`
     - Field: `purchasedAt`, Order: `Descending`
   - Query scope: `Collection`
6. Click **Create**

### Option 3: Use the Error Link

When you try to query without the index, Firestore will return an error with a link to create the index automatically. 

1. Try accessing `/my-purchases` page
2. Check browser console or server logs for error
3. Look for a link like: `https://console.firebase.google.com/...`
4. Click the link to auto-create the index

## Verification

After deploying indexes, verify they're active:

1. Go to Firebase Console → Firestore → Indexes
2. Check that the index status is "Enabled" (not "Building")
3. Test the `/my-purchases` page again

## Index Build Time

- Small collections: ~1 minute
- Medium collections (1000s of documents): ~5-10 minutes  
- Large collections (100k+ documents): Could take hours

You can monitor the build progress in the Firebase Console.

## All Indexes Added

The `firestore.indexes.json` file now includes:

1. ✅ `purchasedProducts` with `userId` + `purchasedAt` (for listing user purchases)
2. ✅ `purchasedProducts` with `orderId` + `userId` (for order-specific queries)

## After Deployment

Once indexes are deployed and built:
1. The `/my-purchases` page should load successfully
2. Users will see their digital product purchases
3. Download buttons will work

---

**Status**: ⚠️ Indexes added to config, needs deployment
**Action Required**: Run `firebase deploy --only firestore:indexes`
