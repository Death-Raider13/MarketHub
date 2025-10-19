import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get vendor's products
    const productsSnapshot = await adminDb
      .collection('products')
      .where('vendorId', '==', vendorId)
      .get()

    const productIds = productsSnapshot.docs.map(doc => doc.id)

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          conversionFunnel: {
            storeVisits: 0,
            productViews: 0,
            addToCart: 0,
            checkout: 0,
            purchase: 0
          },
          conversionRates: {
            viewToCart: 0,
            cartToCheckout: 0,
            checkoutToPurchase: 0,
            overallConversion: 0
          },
          topPerformingProducts: [],
          revenueBySource: {},
          customerSegments: {},
          timeSeriesData: []
        }
      })
    }

    // Parallel queries for analytics data
    const [
      storeVisitsSnapshot,
      productViewsSnapshot,
      cartEventsSnapshot,
      checkoutEventsSnapshot,
      ordersSnapshot,
      reviewsSnapshot
    ] = await Promise.all([
      // Store visits (vendor store page views)
      adminDb.collection('analytics')
        .where('vendorId', '==', vendorId)
        .where('eventType', '==', 'store_visit')
        .where('timestamp', '>=', startDate)
        .get(),

      // Product views
      adminDb.collection('analytics')
        .where('vendorId', '==', vendorId)
        .where('eventType', '==', 'product_view')
        .where('timestamp', '>=', startDate)
        .get(),

      // Add to cart events
      adminDb.collection('analytics')
        .where('vendorId', '==', vendorId)
        .where('eventType', '==', 'add_to_cart')
        .where('timestamp', '>=', startDate)
        .get(),

      // Checkout events
      adminDb.collection('analytics')
        .where('vendorId', '==', vendorId)
        .where('eventType', '==', 'checkout_started')
        .where('timestamp', '>=', startDate)
        .get(),

      // Orders (purchases)
      adminDb.collection('orders')
        .where('vendorId', '==', vendorId)
        .where('status', 'in', ['completed', 'delivered'])
        .where('createdAt', '>=', startDate)
        .get(),

      // Reviews for customer satisfaction
      adminDb.collection('reviews')
        .where('productId', 'in', productIds.slice(0, 10)) // Firestore limit
        .where('createdAt', '>=', startDate)
        .get()
    ])

    // Process the data
    const storeVisits = storeVisitsSnapshot.size
    const productViews = productViewsSnapshot.size
    const addToCart = cartEventsSnapshot.size
    const checkout = checkoutEventsSnapshot.size
    const purchases = ordersSnapshot.size

    // Calculate conversion rates
    const conversionRates = {
      viewToCart: productViews > 0 ? (addToCart / productViews) * 100 : 0,
      cartToCheckout: addToCart > 0 ? (checkout / addToCart) * 100 : 0,
      checkoutToPurchase: checkout > 0 ? (purchases / checkout) * 100 : 0,
      overallConversion: storeVisits > 0 ? (purchases / storeVisits) * 100 : 0
    }

    // Top performing products
    const productPerformance = new Map<string, any>()
    
    productViewsSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const productId = data.productId
      if (!productPerformance.has(productId)) {
        productPerformance.set(productId, {
          productId,
          productName: data.productName || 'Unknown Product',
          views: 0,
          sales: 0,
          revenue: 0
        })
      }
      productPerformance.get(productId).views++
    })

    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data()
      order.items?.forEach((item: any) => {
        const productId = item.product?.id
        if (productId && productPerformance.has(productId)) {
          const perf = productPerformance.get(productId)
          perf.sales += item.quantity
          perf.revenue += item.product.price * item.quantity
        }
      })
    })

    const topPerformingProducts = Array.from(productPerformance.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by traffic source
    const revenueBySource: { [key: string]: number } = {}
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data()
      const source = order.trafficSource || 'direct'
      revenueBySource[source] = (revenueBySource[source] || 0) + (order.total || 0)
    })

    // Customer segments
    const customerSegments = {
      newCustomers: 0,
      returningCustomers: 0,
      averageOrderValue: 0,
      customerLifetimeValue: 0
    }

    const customerOrders = new Map<string, number>()
    let totalRevenue = 0

    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data()
      const customerId = order.userId
      totalRevenue += order.total || 0
      
      customerOrders.set(customerId, (customerOrders.get(customerId) || 0) + 1)
    })

    customerSegments.newCustomers = Array.from(customerOrders.values()).filter(count => count === 1).length
    customerSegments.returningCustomers = Array.from(customerOrders.values()).filter(count => count > 1).length
    customerSegments.averageOrderValue = purchases > 0 ? totalRevenue / purchases : 0

    // Time series data (daily breakdown)
    const timeSeriesData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayViews = productViewsSnapshot.docs.filter(doc => {
        const timestamp = doc.data().timestamp?.toDate()
        return timestamp >= date && timestamp < nextDate
      }).length

      const dayOrders = ordersSnapshot.docs.filter(doc => {
        const timestamp = doc.data().createdAt?.toDate()
        return timestamp >= date && timestamp < nextDate
      }).length

      const dayRevenue = ordersSnapshot.docs
        .filter(doc => {
          const timestamp = doc.data().createdAt?.toDate()
          return timestamp >= date && timestamp < nextDate
        })
        .reduce((sum, doc) => sum + (doc.data().total || 0), 0)

      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        views: dayViews,
        orders: dayOrders,
        revenue: dayRevenue,
        conversion: dayViews > 0 ? (dayOrders / dayViews) * 100 : 0
      })
    }

    // Customer satisfaction from reviews
    const reviewData = reviewsSnapshot.docs.map(doc => doc.data())
    const averageRating = reviewData.length > 0 
      ? reviewData.reduce((sum, review) => sum + review.rating, 0) / reviewData.length 
      : 0

    return NextResponse.json({
      success: true,
      analytics: {
        conversionFunnel: {
          storeVisits,
          productViews,
          addToCart,
          checkout,
          purchase: purchases
        },
        conversionRates: {
          viewToCart: Math.round(conversionRates.viewToCart * 100) / 100,
          cartToCheckout: Math.round(conversionRates.cartToCheckout * 100) / 100,
          checkoutToPurchase: Math.round(conversionRates.checkoutToPurchase * 100) / 100,
          overallConversion: Math.round(conversionRates.overallConversion * 100) / 100
        },
        topPerformingProducts,
        revenueBySource,
        customerSegments,
        timeSeriesData,
        customerSatisfaction: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviewData.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching conversion analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
