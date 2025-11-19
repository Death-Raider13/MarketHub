"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/auth-context'
import { db } from '@/lib/firebase/config'
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { handleFirestoreError } from '@/lib/production-error-handler'

interface WishlistContextType {
  wishlistItems: Product[]
  isInWishlist: (productId: string) => boolean
  addToWishlist: (product: Product) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  loading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // Load wishlist from Firestore when user changes
  useEffect(() => {
    if (user) {
      loadWishlist()
    } else {
      setWishlistItems([])
    }
  }, [user])

  const loadWishlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      const wishlistQuery = query(
        collection(db, 'wishlists'),
        where('userId', '==', user.uid)
      )
      const wishlistSnapshot = await getDocs(wishlistQuery)
      
      const items: Product[] = []
      wishlistSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.product) {
          items.push(data.product)
        }
      })
      
      setWishlistItems(items)
    } catch (error) {
      // Use production error handler - don't show error to user for loading
      handleFirestoreError(error)
    } finally {
      setLoading(false)
    }
  }

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId)
  }

  const addToWishlist = async (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to wishlist')
      return
    }

    if (isInWishlist(product.id)) {
      toast.info('Item is already in your wishlist')
      return
    }

    try {
      // Add to Firestore
      const wishlistDocId = `${user.uid}_${product.id}`
      await setDoc(doc(db, 'wishlists', wishlistDocId), {
        userId: user.uid,
        productId: product.id,
        product: product,
        createdAt: new Date()
      })

      // Update local state
      setWishlistItems(prev => [...prev, product])
      toast.success('Added to wishlist!')
    } catch (error) {
      const errorMessage = handleFirestoreError(error)
      toast.error(errorMessage)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    if (!user) return

    try {
      // Remove from Firestore
      const wishlistDocId = `${user.uid}_${productId}`
      await deleteDoc(doc(db, 'wishlists', wishlistDocId))

      // Update local state
      setWishlistItems(prev => prev.filter(item => item.id !== productId))
      toast.success('Removed from wishlist')
    } catch (error) {
      const errorMessage = handleFirestoreError(error)
      toast.error(errorMessage)
    }
  }

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      loading
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
