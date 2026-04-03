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
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

// Validate environment variables on app startup
validateEnvironmentVariables()

// Initialize production error handling
if (typeof window !== 'undefined') {
  initializeProductionErrorHandling()
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: {
    default: "FeroLibrary - The Trust-First Academic Marketplace",
    template: "%s | FeroLibrary"
  },
  description: "FeroLibrary is Nigeria's most trusted platform for high-quality, verified academic resources, study guides, and past questions.",
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ferolibrary.com'),
  keywords: [
    "FeroLibrary",
    "Academic Marketplace",
    "Verified Study Guides",
    "University Past Questions",
    "WAEC and JAMB resources",
    "Nigeria student materials"
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
    title: "FeroLibrary - The Trust-First Academic Marketplace",
    description: "FeroLibrary is Nigeria's most trusted platform for high-quality, verified academic resources, study guides, and past questions.",
    url: "/",
    siteName: "FeroLibrary",
    locale: "en_NG",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "FeroLibrary - The Trust-First Academic Marketplace",
    description: "FeroLibrary is Nigeria's most trusted platform for high-quality, verified academic resources, study guides, and past questions."
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
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
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
