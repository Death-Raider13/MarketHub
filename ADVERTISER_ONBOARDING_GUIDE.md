# 🎯 Advertiser Onboarding Guide

## How Advertisers Access the Advertising System

---

## 📍 **Discovery & Access Points**

### **1. Main Navigation (Header)**
**Location:** Every page on MarketHub

**Desktop:**
- Prominent "Advertise" button in header (next to "Switch to Selling")
- Always visible with Megaphone icon
- Styled in primary color to stand out

**Mobile:**
- "Advertise" link in mobile menu
- Highlighted in primary color
- Easy access from hamburger menu

**Code:**
```tsx
// components/layout/header.tsx
<Button variant="ghost" size="sm" asChild>
  <Link href="/advertise">
    <Megaphone className="mr-2 h-4 w-4" />
    Advertise
  </Link>
</Button>
```

---

### **2. Public Landing Page**
**URL:** `https://markethub.com/advertise`

**Features:**
- ✅ Hero section with value proposition
- ✅ Platform statistics (500K+ visitors, 1K+ stores)
- ✅ Why advertise section (6 key benefits)
- ✅ How it works (4 simple steps)
- ✅ Transparent pricing (CPM, CPC, CPA)
- ✅ Call-to-action buttons
- ✅ Sign-up form

**File:** `app/advertise/page.tsx`

---

### **3. Footer Links**
**Location:** Footer of every page

**Suggested Links:**
- "Advertise with Us"
- "Business Solutions"
- "Marketing Opportunities"

---

### **4. Vendor Dashboard**
**Location:** Vendor dashboard sidebar

**Purpose:** Vendors can also become advertisers to promote their products on other stores

---

## 🚀 **Onboarding Flow**

### **Step 1: Discovery**
```
User sees "Advertise" button
↓
Clicks to learn more
↓
Lands on /advertise page
```

### **Step 2: Landing Page**
```
Hero Section:
- "Reach Your Target Customers on MarketHub"
- Platform statistics
- "Get Started" CTA

Why Advertise:
- Targeted reach
- Engaged audience
- Flexible pricing
- Real-time analytics
- Quick setup
- Brand safety

How It Works:
1. Sign Up
2. Create Campaign
3. Launch
4. Track & Optimize

Pricing:
- CPM: ₦500-2000 per 1K views
- CPC: ₦20-100 per click
- CPA: ₦500-5000 per conversion
```

### **Step 3: Sign Up**
```
User clicks "Get Started"
↓
If logged in → Go to dashboard
If not logged in → Show signup form
↓
Signup Form:
- Business Name
- Email
- Phone Number
- Website (optional)
↓
Create Account
↓
Redirect to Advertiser Dashboard
```

### **Step 4: Dashboard Access**
```
URL: /advertiser/dashboard

First-time users see:
- Welcome message
- Quick start guide
- "Create Campaign" button
- Empty state with helpful tips
```

---

## 📱 **User Journey Examples**

### **Journey 1: New Business Owner**
```
1. Visits MarketHub homepage
2. Sees "Advertise" button in header
3. Clicks to learn more
4. Reads about targeting and pricing
5. Clicks "Get Started"
6. Fills signup form
7. Lands on dashboard
8. Creates first campaign
9. Launches ads
10. Tracks performance
```

### **Journey 2: Existing Vendor**
```
1. Already has vendor account
2. Sees "Advertise" in navigation
3. Clicks to advertise page
4. Already logged in
5. Directly goes to advertiser dashboard
6. Creates campaign to promote products
7. Ads appear on other vendor stores
```

### **Journey 3: Marketing Agency**
```
1. Hears about MarketHub ads
2. Googles "MarketHub advertising"
3. Finds /advertise page
4. Reviews pricing and features
5. Contacts sales team
6. Sets up agency account
7. Manages multiple client campaigns
```

---

## 🎨 **Landing Page Sections**

### **Hero Section**
```
Headline: "Reach Your Target Customers on MarketHub"
Subheadline: "Advertise your products and services to thousands 
              of engaged shoppers across Nigeria's fastest-growing 
              e-commerce marketplace."

Stats:
- 500K+ Monthly Visitors
- 1,000+ Active Stores
- 2.5% Avg CTR
- ₦50M+ Monthly GMV

CTAs:
- "Get Started" (primary)
- "View Pricing" (secondary)
```

### **Why Advertise Section**
```
6 Key Benefits:

1. Targeted Reach
   - Target by location, category, store type, device
   - Reach exactly who you want

2. Engaged Audience
   - High purchase intent
   - Actively browsing products

3. Flexible Pricing
   - CPM, CPC, or CPA
   - Set your budget

4. Real-Time Analytics
   - Track impressions, clicks, conversions
   - Optimize on the fly

5. Quick Setup
   - Launch in minutes
   - No complex setup

6. Brand Safety
   - Verified stores
   - Quality assurance
```

### **How It Works Section**
```
4 Simple Steps:

Step 1: Sign Up
- Create advertiser account in seconds

Step 2: Create Campaign
- Set budget, upload creative, choose targeting

Step 3: Launch
- Ads go live instantly on relevant stores

Step 4: Track & Optimize
- Monitor performance and optimize
```

### **Pricing Section**
```
3 Pricing Models:

CPM (Cost Per 1000 Impressions)
- ₦500 - ₦2,000 per 1,000 views
- Best for: Brand awareness
- Features: Guaranteed impressions, predictable costs

CPC (Cost Per Click) ⭐ Most Popular
- ₦20 - ₦100 per click
- Best for: Traffic generation
- Features: Only pay for clicks, higher engagement

CPA (Cost Per Action)
- ₦500 - ₦5,000 per conversion
- Best for: Performance marketing
- Features: Only pay for results, maximum ROI

Note: No setup fees • No monthly minimums • Cancel anytime
```

### **CTA Section**
```
Headline: "Ready to Start Advertising?"
Subheadline: "Join hundreds of businesses reaching their 
              target customers on MarketHub"

CTAs:
- "Get Started Now" (primary)
- "Contact Sales" (secondary)
```

---

## 🔗 **Access URLs**

### **Public Pages:**
- Landing Page: `/advertise`
- Pricing: `/advertise#pricing`
- Contact Sales: `/contact`

### **Authenticated Pages:**
- Dashboard: `/advertiser/dashboard`
- Create Campaign: `/advertiser/dashboard?tab=campaigns`
- Analytics: `/advertiser/dashboard?tab=analytics`
- Billing: `/advertiser/dashboard?tab=billing`

---

## 📊 **Signup Form**

### **Fields:**
```typescript
{
  businessName: string      // Required
  email: string            // Required
  phone: string            // Required
  website?: string         // Optional
}
```

### **Validation:**
- Business name: 3-100 characters
- Email: Valid email format
- Phone: Nigerian phone number format
- Website: Valid URL (if provided)

### **After Signup:**
1. Create advertiser account in Firebase
2. Send welcome email
3. Redirect to dashboard
4. Show onboarding tour (optional)

---

## 🎯 **Marketing Channels**

### **Organic Discovery:**
1. **Header Navigation** - Always visible
2. **Footer Links** - Every page
3. **Vendor Dashboard** - Cross-sell to vendors
4. **Blog Posts** - "How to advertise on MarketHub"
5. **Help Center** - Advertising guides

### **Paid Acquisition:**
1. **Google Ads** - "E-commerce advertising Nigeria"
2. **Social Media** - Facebook, Instagram, LinkedIn
3. **Email Marketing** - To existing vendors
4. **Partnerships** - Marketing agencies

### **Direct Outreach:**
1. **Sales Team** - Contact businesses directly
2. **Webinars** - "How to advertise effectively"
3. **Case Studies** - Success stories
4. **Referral Program** - Vendor referrals

---

## 📈 **Conversion Funnel**

```
Awareness (Top of Funnel)
├── See "Advertise" button
├── Google search
├── Social media
└── Word of mouth
    ↓
Interest (Middle of Funnel)
├── Visit /advertise page
├── Read benefits
├── Check pricing
└── Watch demo video (future)
    ↓
Decision (Bottom of Funnel)
├── Click "Get Started"
├── Fill signup form
├── Create account
└── Verify email
    ↓
Action (Conversion)
├── Access dashboard
├── Create first campaign
├── Add budget
└── Launch ads
    ↓
Retention
├── Monitor performance
├── Optimize campaigns
├── Add more budget
└── Become repeat advertiser
```

---

## 🎨 **Visual Design**

### **Landing Page Design:**
- Modern, clean layout
- Primary color accents
- High-quality images
- Clear CTAs
- Social proof (stats, testimonials)
- Mobile-responsive

### **Header Button:**
- Megaphone icon
- Primary color text
- Ghost variant (subtle)
- Hover effect
- Always visible on desktop

### **Mobile Menu:**
- Prominent placement
- Primary color highlight
- Easy to tap
- Clear icon

---

## 🔧 **Technical Implementation**

### **Files Created:**
```
✅ app/advertise/page.tsx
   - Public landing page
   - Signup form
   - Pricing section
   
✅ components/layout/header.tsx (Updated)
   - "Advertise" button in header
   - Mobile menu link
   
✅ app/advertiser/dashboard/page.tsx
   - Advertiser dashboard
   - Campaign management
```

### **Routes:**
```
Public:
- GET /advertise → Landing page
- POST /api/advertiser/signup → Create account

Authenticated:
- GET /advertiser/dashboard → Dashboard
- GET /advertiser/dashboard?tab=campaigns → Campaigns
- GET /advertiser/dashboard?tab=analytics → Analytics
- GET /advertiser/dashboard?tab=billing → Billing
```

---

## 📱 **Mobile Experience**

### **Mobile Landing Page:**
- Responsive design
- Touch-friendly buttons
- Simplified navigation
- Fast loading
- Easy signup form

### **Mobile Dashboard:**
- Optimized for small screens
- Swipeable tabs
- Simplified charts
- Quick actions
- Mobile-friendly forms

---

## 🎯 **Call-to-Actions**

### **Primary CTAs:**
1. **"Get Started"** - Main conversion button
2. **"Create Campaign"** - In dashboard
3. **"Launch Campaign"** - After setup

### **Secondary CTAs:**
1. **"View Pricing"** - Learn more
2. **"Contact Sales"** - Enterprise
3. **"Learn More"** - Education

### **Tertiary CTAs:**
1. **"Watch Demo"** - Video (future)
2. **"Read Case Study"** - Social proof
3. **"Download Guide"** - Lead magnet

---

## 📊 **Success Metrics**

### **Awareness:**
- Page views on /advertise
- Click-through rate on "Advertise" button
- Time on page
- Bounce rate

### **Conversion:**
- Signup completion rate
- Time to first campaign
- Campaign launch rate
- Budget added

### **Retention:**
- Active advertisers
- Repeat campaigns
- Budget increase rate
- Churn rate

---

## 🚀 **Launch Checklist**

### **Pre-Launch:**
- ✅ Landing page live
- ✅ Header navigation updated
- ✅ Mobile menu updated
- ✅ Signup form working
- ✅ Dashboard accessible
- ✅ Email notifications (future)

### **Post-Launch:**
- [ ] Monitor signup rate
- [ ] Track conversion funnel
- [ ] Gather user feedback
- [ ] A/B test CTAs
- [ ] Optimize landing page
- [ ] Add testimonials
- [ ] Create demo video
- [ ] Write case studies

---

## 💡 **Best Practices**

### **For Landing Page:**
1. Clear value proposition
2. Social proof (stats, testimonials)
3. Simple signup process
4. Transparent pricing
5. Strong CTAs
6. Mobile-optimized
7. Fast loading

### **For Onboarding:**
1. Welcome email
2. Onboarding tour
3. Sample campaign
4. Help documentation
5. Support chat
6. Success stories
7. Best practices guide

---

## 📞 **Support Channels**

### **Self-Service:**
- Help Center articles
- Video tutorials
- FAQs
- Best practices guide

### **Assisted:**
- Email support
- Live chat (future)
- Phone support (enterprise)
- Account manager (high-spend)

---

## 🎉 **Summary**

### **How Advertisers Access the System:**

1. **See "Advertise" button** in header (every page)
2. **Click to landing page** (/advertise)
3. **Learn about benefits** and pricing
4. **Click "Get Started"**
5. **Fill signup form** (business name, email, phone)
6. **Create account**
7. **Access dashboard** (/advertiser/dashboard)
8. **Create first campaign**
9. **Launch ads**
10. **Track performance**

### **Key Access Points:**
- ✅ Header navigation (desktop + mobile)
- ✅ Public landing page (/advertise)
- ✅ Footer links (future)
- ✅ Vendor dashboard (cross-sell)
- ✅ Direct URL sharing
- ✅ Google search
- ✅ Social media
- ✅ Email marketing

### **Conversion Path:**
```
Awareness → Interest → Decision → Action → Retention
    ↓          ↓          ↓         ↓         ↓
  Header    Landing    Signup   Campaign   Optimize
  Button     Page       Form     Launch    & Scale
```

---

**The advertising system is now fully accessible and ready for advertisers to discover, sign up, and start advertising!** 🎯✨

---

*Advertiser Onboarding Guide*
*Last Updated: January 15, 2025*
*Status: Complete* ✅
