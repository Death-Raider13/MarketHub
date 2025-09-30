export interface Product {
  id: string
  vendorId: string
  vendorName: string
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
  createdAt: Date
  updatedAt: Date
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
  rating: number
  comment: string
  images?: string[]
  helpful: number
  createdAt: Date
}

export interface Advertisement {
  id: string
  vendorId: string
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
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: Address
  paymentMethod: string
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
  vendorId: string
  vendorName: string
  vendorEmail: string
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
  status: "pending" | "approved" | "processing" | "completed" | "rejected"
  requestedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
  rejectionReason?: string
  transactionReference?: string
}

export interface VendorBalance {
  vendorId: string
  availableBalance: number
  pendingBalance: number
  totalEarnings: number
  totalWithdrawn: number
  lastPayoutDate?: Date
  updatedAt: Date
}
