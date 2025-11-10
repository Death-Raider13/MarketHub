import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type { Product, Order, Review } from '@/lib/types'
import { onOrderPlaced, onOrderStatusChange } from '@/lib/notifications/triggers'

// Products
export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() } as Product
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function getProducts(constraints: QueryConstraint[] = []): Promise<Product[]> {
  try {
    const productsQuery = query(collection(db, 'products'), ...constraints)
    const querySnapshot = await getDocs(productsQuery)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product))
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function searchProducts(searchTerm: string, filters: any = {}): Promise<Product[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'active'),
      orderBy('name'),
    ]

    // Add category filter
    if (filters.category) {
      constraints.push(where('category', '==', filters.category))
    }

    // Add price range filter
    if (filters.minPrice !== undefined) {
      constraints.push(where('price', '>=', filters.minPrice))
    }
    if (filters.maxPrice !== undefined) {
      constraints.push(where('price', '<=', filters.maxPrice))
    }

    // Add rating filter
    if (filters.minRating) {
      constraints.push(where('rating', '>=', filters.minRating))
    }

    const products = await getProducts(constraints)

    // Client-side search filtering (Firestore doesn't support full-text search natively)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.vendorName.toLowerCase().includes(searchLower)
      )
    }

    return products
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return getProducts([where('featured', '==', true), where('status', '==', 'active'), limit(8)])
}

export async function getVendorProducts(vendorId: string): Promise<Product[]> {
  return getProducts([where('vendorId', '==', vendorId), where('status', '==', 'active')])
}

// Orders
export async function createOrder(orderData: Omit<Order, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Fire notification triggers asynchronously (don't block the response)
    try {
      const orderId = docRef.id
      const customerId = (orderData as any).userId
      const amount = orderData.total || 0

      // Notify customer that order was placed
      if (customerId) {
        onOrderPlaced(orderId, customerId, customerId, amount).catch((err) =>
          console.error('notify onOrderPlaced (customer) failed', err)
        )
      }

      // Notify each vendor involved in the order
      const items: any[] = (orderData as any).items || []
      const vendorIds = Array.from(new Set(items.map((i) => i.product?.vendorId).filter(Boolean)))
      vendorIds.forEach((vendorId) => {
        onOrderPlaced(orderId, customerId, vendorId, amount).catch((err) =>
          console.error('notify onOrderPlaced (vendor) failed', err)
        )
      })
    } catch (err) {
      console.error('Error triggering notifications after order creation:', err)
    }

    return docRef.id
  } catch (error) {
    console.error('Error creating order:', error)
    return null
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId))
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order
    }
    return null
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(ordersQuery)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order))
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return []
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  trackingNumber?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }
    await updateDoc(doc(db, 'orders', orderId), updateData)

    // Trigger notification to customer about status change
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId))
      if (orderDoc.exists()) {
        const order = orderDoc.data() as any
        const customerId = order.userId
        if (customerId) {
          onOrderStatusChange(orderId, customerId, status).catch((err) =>
            console.error('notify onOrderStatusChange failed', err)
          )
        }
      }
    } catch (err) {
      console.error('Error triggering order status notification:', err)
    }
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

// Reviews
export async function addReview(reviewData: Omit<Review, 'id'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding review:', error)
    return null
  }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(reviewsQuery)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Review))
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export async function updateReviewHelpful(reviewId: string, increment: boolean): Promise<boolean> {
  try {
    const reviewDoc = await getDoc(doc(db, 'reviews', reviewId))
    if (reviewDoc.exists()) {
      const currentHelpful = reviewDoc.data().helpful || 0
      await updateDoc(doc(db, 'reviews', reviewId), {
        helpful: increment ? currentHelpful + 1 : Math.max(0, currentHelpful - 1),
      })
      return true
    }
    return false
  } catch (error) {
    console.error('Error updating review helpful:', error)
    return false
  }
}

// Vendors
export async function getVendor(vendorId: string): Promise<any | null> {
  try {
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId))
    if (vendorDoc.exists()) {
      return { id: vendorDoc.id, ...vendorDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return null
  }
}

// Categories
export async function getCategories(): Promise<any[]> {
  try {
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name'))
    const querySnapshot = await getDocs(categoriesQuery)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Payouts
export async function createPayoutRequest(payoutData: any): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'payoutRequests'), {
      ...payoutData,
      requestedAt: new Date(),
      status: 'pending',
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating payout request:', error)
    return null
  }
}

export async function getVendorBalance(vendorId: string): Promise<any | null> {
  try {
    const balanceDoc = await getDoc(doc(db, 'vendorBalances', vendorId))
    if (balanceDoc.exists()) {
      return { id: balanceDoc.id, ...balanceDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error fetching vendor balance:', error)
    return null
  }
}

export async function updateVendorBalance(vendorId: string, balanceData: any): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'vendorBalances', vendorId), {
      ...balanceData,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error('Error updating vendor balance:', error)
    return false
  }
}
