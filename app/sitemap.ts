import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const routes = [
    "/",
    "/products",
    "/vendors",
    "/categories",
    "/cart",
    "/checkout",
    "/help",
    "/contact",
    "/privacy",
    "/terms",
    "/returns",
    "/advertise",
    "/advertising",
  ]

  const now = new Date()

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }))
}
