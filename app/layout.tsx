import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/firebase/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { FirebaseErrorHandler } from "@/components/firebase-error-handler"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "MarketHub - Multi-Vendor Marketplace",
  description: "Your trusted marketplace for quality products from verified sellers",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <WishlistProvider>
                <FirebaseErrorHandler />
                {children}
              </WishlistProvider>
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
