export interface Product {
  id: string
  creatorId: string
  creatorName: string
  name: string
  description: string
  price: number
  comparePrice?: number
  category: string
  subcategory?: string
  images: string[]
  stock: number
  sku: string
  rating: number
  reviewCount: number
  featured: boolean
  sponsored: boolean
  status: "active" | "inactive" | "pending" | "rejected"
  
  // Reputation & Analytics
  reputationScore?: number
  salesCount?: number
  viewCount?: number
  downloadCount?: number
  
  // Digital-First Fields (Physical removed)
  productType: "digital" | "service"
  type: "digital" | "service" // Alias for productType
  digitalFiles?: DigitalFile[]
  accessType?: "instant" | "scheduled" | "lifetime"
  accessDuration?: number // days (0 = lifetime)
  downloadLimit?: number // 0 = unlimited
  
  // Additional Product Information
  features?: string[] // Array of key features
  tags?: string[] // Array of tags for search/filtering
  specifications?: Record<string, string> // Key-value pairs for specs
  
  createdAt: Date
  updatedAt: Date
}

export interface DigitalFile {
  id: string
  fileName: string
  fileUrl: string // Firebase Storage URL
  fileSize: number // bytes
  fileType: string // pdf, zip, mp4, mp3, etc.
  uploadedAt: Date
}

export interface PurchasedProduct {
  id: string
  userId: string
  productId: string
  orderId: string
  product: Product
  purchasedAt: Date
  accessExpiresAt?: Date
  downloadCount: number
  downloadLinks?: SecureDownloadLink[]
  lastDownloadedAt?: Date
}

export interface SecureDownloadLink {
  fileId: string
  fileName: string
  url: string // Time-limited signed URL
  expiresAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  productCount: number
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  accuracyRating?: number
  deliveryRating?: number
  title: string
  comment: string
  images?: string[]
  helpful: number
  verified: boolean
  orderId?: string
  status: "pending" | "approved" | "spam"
  createdAt: Date
  updatedAt: Date
}

export interface CreatorReputation {
  creatorId: string
  score: number // 0-100
  level: "new" | "rising" | "pro" | "elite"
  badges: string[]
  totalSales: number
  averageRating: number
  reviewCount: number
  accuracyScore: number // 0-5
  deliveryScore: number // 0-5
  updatedAt: Date
}

export interface Advertisement {
  id: string
  creatorId: string
  type: "banner" | "sidebar" | "sponsored-product"
  title: string
  imageUrl: string
  linkUrl: string
  placement: string
  impressions: number
  clicks: number
  budget: number
  spent: number
  status: "active" | "paused" | "ended"
  startDate: Date
  endDate: Date
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  totalAmount: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "confirmed" | "paid" | "refunded"
  paymentStatus: "pending" | "completed" | "paid" | "refunded" | "failed"
  shippingAddress: Address
  paymentMethod: string
  affiliateCode?: string
  affiliateProductId?: string
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface PayoutRequest {
  id: string
  creatorId: string
  creatorName: string
  creatorEmail: string
  amount: number
  paymentMethod: "bank_transfer" | "mobile_money" | "paypal"
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode?: string
  }
  mobileMoneyDetails?: {
    provider: string
    phoneNumber: string
    accountName: string
  }
  paypalEmail?: string
  status: "pending" | "approved" | "processing" | "completed" | "rejected" | "cancelled"
  requestedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
  rejectionReason?: string
  transactionReference?: string
}

export interface CreatorBalance {
  creatorId: string
  availableBalance: number
  pendingBalance: number
  totalEarnings: number
  totalWithdrawn: number
  lastPayoutDate?: Date
  updatedAt: Date
}
