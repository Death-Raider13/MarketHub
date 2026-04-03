# Ad Integration Guide

## 🎯 **How Approved Ads Automatically Display**

When an admin approves a campaign, it automatically becomes available for display in the designated positions based on the **placement type** selected during campaign creation. Here's how it works:

## 📍 **Placement Types & Integration**

### 1. **Homepage Banner**
- **Component**: `HomepageBanner`
- **Location**: Main homepage
- **Features**: 
  - Rotates through 4-5 approved homepage campaigns
  - Auto-rotation every 10 seconds
  - Manual navigation with arrows and dots
  - Priority-based selection (higher budget = higher priority)

**Integration Example:**
```tsx
// In your homepage (app/page.tsx or components/Homepage.tsx)
import { HomepageBanner } from "@/components/advertising/HomepageBanner"

export default function Homepage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="mb-8">
        <HomepageBanner 
          maxAds={5}
          autoRotate={true}
          rotationInterval={10}
          className="mb-6"
        />
      </section>
      
      {/* Rest of homepage content */}
    </div>
  )
}
```

### 2. **creator Store Ads**
- **Component**: `creatorstoreAds`
- **Location**: Individual creator store pages
- **Features**:
  - Shows ads targeted to specific creators OR general creator store ads
  - Multiple placement options: sidebar, banner, inline
  - Up to 3 ads per creator store
  - Dismissible ads with X button

**Integration Example:**
```tsx
// In creator store page (app/creator/[creatorId]/page.tsx)
import { creatorstoreAds } from "@/components/advertising/creatorstoreAds"

export default function creatorstorePage({ params }: { params: { creatorId: string } }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main content */}
      <div className="lg:col-span-3">
        {/* creator products, info, etc. */}
      </div>
      
      {/* Sidebar with ads */}
      <div className="lg:col-span-1">
        <creatorstoreAds 
          creatorId={params.creatorId}
          placement="sidebar"
          maxAds={3}
        />
      </div>
    </div>
  )
}
```

### 3. **Category Page Ads**
- **Component**: `CategoryPageAds`
- **Location**: Product category pages
- **Features**:
  - Shows ads targeted to specific categories
  - Multiple layouts: top banner, sidebar, grid
  - Up to 4 ads per category
  - Category-specific targeting

**Integration Example:**
```tsx
// In category page (app/category/[slug]/page.tsx)
import { CategoryPageAds } from "@/components/advertising/CategoryPageAds"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      {/* Category banner ads */}
      <CategoryPageAds 
        category={params.slug}
        placement="top"
        maxAds={2}
        className="mb-6"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Products grid */}
        <div className="lg:col-span-3">
          {/* Category products */}
        </div>
        
        {/* Sidebar ads */}
        <div className="lg:col-span-1">
          <CategoryPageAds 
            category={params.slug}
            placement="sidebar"
            maxAds={2}
          />
        </div>
      </div>
    </div>
  )
}
```

### 4. **Sponsored Products**
- **Component**: `SponsoredProducts`
- **Location**: Product listings, search results, category pages
- **Features**:
  - Integrates seamlessly with product grids
  - Multiple layouts: grid, list, carousel
  - Up to 6 sponsored products
  - Looks like regular products but marked as "Sponsored"

**Integration Example:**
```tsx
// In product listing or search results
import { SponsoredProducts } from "@/components/advertising/SponsoredProducts"

export default function ProductListing({ category }: { category: string }) {
  return (
    <div>
      {/* Regular products */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {/* Your existing products */}
      </div>
      
      {/* Sponsored products section */}
      <SponsoredProducts 
        category={category}
        layout="grid"
        maxAds={6}
        className="mb-8"
      />
      
      {/* More products */}
    </div>
  )
}
```

## 🔄 **How Multiple Ads Work**

### **Rotation Algorithm**
1. **Priority Calculation**: Based on budget, performance (CTR), and campaign age
2. **Weight Distribution**: Higher-performing ads get more impressions
3. **Budget Management**: Ads automatically stop when budget is exhausted
4. **Fair Rotation**: Ensures all ads get exposure based on their weight

### **Multiple Ads in Same Position**
- **Homepage**: Up to 5 ads rotate automatically
- **creator Stores**: Up to 3 ads can show simultaneously in different slots
- **Category Pages**: Up to 4 ads (2 banner + 2 sidebar)
- **Sponsored Products**: Up to 6 products mixed with regular products

## 📊 **Automatic Tracking**

### **What Gets Tracked Automatically**
- **Impressions**: When ad becomes visible on screen
- **Clicks**: When user clicks on ad
- **CTR**: Calculated automatically (clicks/impressions)
- **Budget Deduction**: Based on CPM or CPC model
- **Campaign Completion**: When budget is exhausted

### **Real-time Updates**
- Campaign stats update in real-time
- Budget decreases with each impression/click
- Campaigns automatically pause when budget runs out
- Advertisers get notifications about campaign status

## 🎛️ **Smart Targeting**

### **Automatic Targeting Logic**
```typescript
// Example: creator store ads
if (campaign.placement.type === 'creator_store') {
  // Show on ALL creator stores if no specific targeting
  if (campaign.placement.targetcreators.length === 0) {
    showOnAllcreatorstores = true
  } else {
    // Show only on specified creator stores
    showOnlyOn = campaign.placement.targetcreators
  }
}

// Example: Category ads
if (campaign.placement.type === 'category') {
  // Show on ALL category pages if no specific targeting
  if (campaign.placement.targetCategories.length === 0) {
    showOnAllCategories = true
  } else {
    // Show only on specified categories
    showOnlyOn = campaign.placement.targetCategories
  }
}
```

## 🚀 **Quick Integration Steps**

### **Step 1: Add to Homepage**
```tsx
// app/page.tsx
import { HomepageBanner } from "@/components/advertising/HomepageBanner"

// Add this component where you want the banner
<HomepageBanner maxAds={5} />
```

### **Step 2: Add to creator Stores**
```tsx
// app/creator/[creatorId]/page.tsx
import { creatorstoreAds } from "@/components/advertising/creatorstoreAds"

// Add to sidebar or any section
<creatorstoreAds creatorId={creatorId} placement="sidebar" />
```

### **Step 3: Add to Category Pages**
```tsx
// app/category/[slug]/page.tsx
import { CategoryPageAds } from "@/components/advertising/CategoryPageAds"

// Add banner ads at top
<CategoryPageAds category={categorySlug} placement="top" />
```

### **Step 4: Add Sponsored Products**
```tsx
// Any product listing page
import { SponsoredProducts } from "@/components/advertising/SponsoredProducts"

// Mix with regular products
<SponsoredProducts category={category} layout="grid" />
```

## 🔧 **Configuration Options**

### **HomepageBanner Props**
- `maxAds`: Number of ads to rotate (default: 5)
- `autoRotate`: Enable auto-rotation (default: true)
- `rotationInterval`: Seconds between rotations (default: 10)

### **creatorstoreAds Props**
- `creatorId`: Target creator ID (required)
- `placement`: 'sidebar' | 'banner' | 'inline' (default: 'sidebar')
- `maxAds`: Maximum ads to show (default: 3)

### **CategoryPageAds Props**
- `category`: Target category (required)
- `placement`: 'top' | 'sidebar' | 'grid' (default: 'top')
- `maxAds`: Maximum ads to show (default: 4)

### **SponsoredProducts Props**
- `category`: Target category (required)
- `layout`: 'grid' | 'list' | 'carousel' (default: 'grid')
- `maxAds`: Maximum sponsored products (default: 6)

## 📈 **Performance Features**

### **Automatic Optimization**
- **Budget Pacing**: Spreads budget evenly throughout campaign duration
- **Performance Boosting**: High-CTR ads get more impressions
- **Frequency Capping**: Prevents ad fatigue by limiting repeated impressions
- **Device Targeting**: Optimizes for desktop, tablet, or mobile

### **Real-time Analytics**
- Live impression and click tracking
- Automatic CTR calculation
- Budget utilization monitoring
- Campaign performance scoring

## 🎯 **Summary**

✅ **Approved campaigns automatically appear** in their designated positions
✅ **Multiple ads rotate intelligently** based on priority and performance  
✅ **Smart targeting** ensures relevant ads for each location
✅ **Real-time tracking** provides accurate analytics
✅ **Automatic budget management** prevents overspending
✅ **Seamless integration** with existing UI components

The system is designed to work automatically once campaigns are approved - no manual intervention needed! 🚀
