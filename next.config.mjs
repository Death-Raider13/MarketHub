/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 180,
  eslint: {
    // Enable ESLint checks during builds for production safety
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable TypeScript error checking for production safety
    ignoreBuildErrors: false,
  },
  images: {
    // Enable image optimization for production
    unoptimized: false,
    domains: [
      'firebasestorage.googleapis.com', // Firebase Storage
      'res.cloudinary.com', // Cloudinary
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  }
}

export default nextConfig
