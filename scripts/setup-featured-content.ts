/**
 * Setup Featured Content Script
 * This script helps you mark products and vendors as featured for the homepage
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, limit } from 'firebase/firestore'

// Firebase config (replace with your config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Mark random products as featured
 */
export async function setupFeaturedProducts(count: number = 8) {
  try {
    console.log(`Setting up ${count} featured products...`)
    
    // Get active products
    const productsQuery = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      limit(count * 2) // Get more than needed to have options
    )
    
    const snapshot = await getDocs(productsQuery)
    
    if (snapshot.empty) {
      console.log('No active products found. Trying with "approved" status...')
      
      // Try with approved status
      const approvedQuery = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        limit(count * 2)
      )
      
      const approvedSnapshot = await getDocs(approvedQuery)
      
      if (approvedSnapshot.empty) {
        console.log('No products found to feature.')
        return
      }
      
      // Mark first few as featured
      const products = approvedSnapshot.docs.slice(0, count)
      
      for (const productDoc of products) {
        await updateDoc(doc(db, 'products', productDoc.id), {
          featured: true,
          updatedAt: new Date()
        })
        console.log(`✅ Marked product "${productDoc.data().name}" as featured`)
      }
    } else {
      // Mark first few as featured
      const products = snapshot.docs.slice(0, count)
      
      for (const productDoc of products) {
        await updateDoc(doc(db, 'products', productDoc.id), {
          featured: true,
          updatedAt: new Date()
        })
        console.log(`✅ Marked product "${productDoc.data().name}" as featured`)
      }
    }
    
    console.log(`✅ Successfully set up ${count} featured products!`)
  } catch (error) {
    console.error('Error setting up featured products:', error)
  }
}

/**
 * Mark random vendors as featured
 */
export async function setupFeaturedVendors(count: number = 6) {
  try {
    console.log(`Setting up ${count} featured vendors...`)
    
    // Get vendor users
    const vendorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'vendor'),
      limit(count * 2)
    )
    
    const snapshot = await getDocs(vendorsQuery)
    
    if (snapshot.empty) {
      console.log('No vendors found to feature.')
      return
    }
    
    // Mark first few as featured
    const vendors = snapshot.docs.slice(0, count)
    
    for (const vendorDoc of vendors) {
      await updateDoc(doc(db, 'users', vendorDoc.id), {
        featured: true,
        verified: true, // Also mark as verified for better display
        updatedAt: new Date()
      })
      
      const vendorData = vendorDoc.data()
      const vendorName = vendorData.storeName || vendorData.displayName || 'Unknown Vendor'
      console.log(`✅ Marked vendor "${vendorName}" as featured`)
    }
    
    console.log(`✅ Successfully set up ${count} featured vendors!`)
  } catch (error) {
    console.error('Error setting up featured vendors:', error)
  }
}

/**
 * Create sample products if none exist
 */
export async function createSampleProducts() {
  try {
    console.log('Creating sample products...')
    
    const sampleProducts = [
      {
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 25000,
        category: 'Electronics',
        status: 'active',
        featured: true,
        vendorName: 'TechStore Nigeria',
        vendorId: 'sample-vendor-1',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        stock: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stylish Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 3500,
        category: 'Fashion',
        status: 'active',
        featured: true,
        vendorName: 'Fashion Hub',
        vendorId: 'sample-vendor-2',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Smart Watch Pro',
        description: 'Advanced smartwatch with health monitoring',
        price: 45000,
        category: 'Electronics',
        status: 'active',
        featured: true,
        vendorName: 'Gadget World',
        vendorId: 'sample-vendor-3',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        stock: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Leather Handbag',
        description: 'Elegant leather handbag for modern women',
        price: 15000,
        category: 'Fashion',
        status: 'active',
        featured: true,
        vendorName: 'Luxury Bags',
        vendorId: 'sample-vendor-4',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        stock: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    for (const product of sampleProducts) {
      const docRef = doc(collection(db, 'products'))
      await updateDoc(docRef, product)
      console.log(`✅ Created sample product: ${product.name}`)
    }
    
    console.log('✅ Sample products created successfully!')
  } catch (error) {
    console.error('Error creating sample products:', error)
  }
}

// Main execution function
async function main() {
  console.log('🚀 Setting up featured content for homepage...')
  
  // Setup featured products
  await setupFeaturedProducts(8)
  
  // Setup featured vendors  
  await setupFeaturedVendors(6)
  
  console.log('✅ Featured content setup complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Refresh your homepage to see featured products and vendors')
  console.log('2. Use the admin panel to manage featured content')
  console.log('3. Add more products and vendors as needed')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as setupFeaturedContent }
