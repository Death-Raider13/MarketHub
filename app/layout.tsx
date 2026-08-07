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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ferolibrary.com'),
  title: {
    default: "FeroLibrary | Nigeria's Most Trusted Academic Marketplace",
    template: "%s | FeroLibrary"
  },
  description: "Access verified past questions, study guides, and project templates. Guaranteed accuracy for academic success.",
  keywords: ["FeroLibrary", "Academic Resources", "JAMB", "WAEC", "University Notes", "Verified Study Guides"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "FeroLibrary | Nigeria's Most Trusted Academic Marketplace",
    description: "The trust-first academic marketplace for verified study materials.",
    url: "/",
    siteName: "FeroLibrary",
    locale: "en_NG",
    type: "website",
    images: [{ url: "/hero.png", width: 1200, height: 630, alt: "FeroLibrary Ecosystem" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "FeroLibrary | Nigeria's Most Trusted Academic Marketplace",
    description: "Access verified past questions, study guides, and project templates. Guaranteed accuracy for academic success.",
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
          defaultTheme="dark"
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
