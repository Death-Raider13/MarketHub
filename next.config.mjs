/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

export default nextConfig
