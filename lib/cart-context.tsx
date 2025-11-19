"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { Product, CartItem } from "./types"
import { useAuth } from '@/lib/firebase/auth-context'
interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])

  const getCartStorageKey = (userId?: string | null) => {
    return userId ? `cart_${userId}` : 'cart_guest'
  }

  // Load cart from localStorage whenever the authenticated user changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const userId = user?.uid
    const key = getCartStorageKey(userId)

    let savedCart: string | null = localStorage.getItem(key)

    // Migration / fallback: if no user-specific or guest key yet, fall back to legacy "cart" key
    if (!savedCart) {
      savedCart = localStorage.getItem('cart')
    }

    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    } else {
      // If nothing stored for this user, start with an empty cart
      setItems([])
    }
  }, [user?.uid])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const key = getCartStorageKey(user?.uid)
      const serialized = JSON.stringify(items)
      localStorage.setItem(key, serialized)

      // Keep the legacy "cart" key in sync for backwards compatibility
      localStorage.setItem('cart', serialized)
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [items, user?.uid])

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== 'undefined') {
      try {
        const key = getCartStorageKey(user?.uid)
        localStorage.removeItem(key)
        // Also remove legacy key to avoid stale data
        localStorage.removeItem('cart')
      } catch (error) {
        console.error('Error clearing cart from localStorage:', error)
      }
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
