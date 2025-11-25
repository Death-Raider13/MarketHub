import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/firebase/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { FirebaseErrorHandler } from "@/components/firebase-error-handler"
import { ProductionErrorBoundary } from "@/components/production-error-boundary"
import { validateEnvironmentVariables } from "@/lib/env-validation"
import { initializeProductionErrorHandling } from "@/lib/production-error-handler"

// Validate environment variables on app startup
validateEnvironmentVariables()

// Initialize production error handling
if (typeof window !== 'undefined') {
  initializeProductionErrorHandling()
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: {
    default: "MarketHub - Multi-Vendor Marketplace",
    template: "%s | MarketHub"
  },
  description: "MarketHub is Nigeria's multi-vendor marketplace for goods, services, and products from trusted sellers.",
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  keywords: [
    "MarketHub",
    "multivendor marketplace",
    "multi-vendor marketplace Nigeria",
    "buy products online Nigeria",
    "sell goods and services online",
    "Nigeria ecommerce market"
  ],
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon/favicon.ico"
    ],
    apple: "/favicon/apple-touch-icon.png"
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    title: "MarketHub - Multi-Vendor Marketplace",
    description: "MarketHub is Nigeria's multi-vendor marketplace for goods, services, and products from trusted sellers.",
    url: "/",
    siteName: "MarketHub",
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketHub - Multi-Vendor Marketplace",
    description: "MarketHub is Nigeria's multi-vendor marketplace for goods, services, and products from trusted sellers."
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ProductionErrorBoundary>
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
        </ProductionErrorBoundary>
      </body>
    </html>
  )
}
