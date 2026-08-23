"use client"

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/lib/firebase/protected-route'
import { Star, StarOff } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  creatorName: string
  status: string
  featured?: boolean
  imageUrl?: string
}

interface creator {
  id: string
  displayName: string
  storeName?: string
  email: string
  role: string
  featured?: boolean
  verified?: boolean
}

function FeaturedContentPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [creators, setcreators] = useState<creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)

      // Fetch products
      const productsQuery = query(
        collection(db, 'products'),
        limit(20)
      )
      const productsSnapshot = await getDocs(productsQuery)
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productsData)

      // Fetch creators
      const creatorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'creator'),
        limit(20)
      )
      const creatorsSnapshot = await getDocs(creatorsQuery)
      const creatorsData = creatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as creator[]
      setcreators(creatorsData)

    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        featured: !currentStatus,
        updatedAt: new Date()
      })

      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, featured: !currentStatus }
          : product
      ))

      toast.success(`Product ${!currentStatus ? 'featured' : 'unfeatured'} successfully`)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  const togglecreatorFeatured = async (creatorId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', creatorId), {
        featured: !currentStatus,
        verified: true, // Also mark as verified when featuring
        updatedAt: new Date()
      })

      setcreators(prev => prev.map(creator =>
        creator.id === creatorId
          ? { ...creator, featured: !currentStatus, verified: true }
          : creator
      ))

      toast.success(`creator ${!currentStatus ? 'featured' : 'unfeatured'} successfully`)
    } catch (error) {
      console.error('Error updating creator:', error)
      toast.error('Failed to update creator')
    }
  }

  const quickSetupFeatured = async () => {
    try {
      // Feature first 8 active products
      const activeProducts = products.filter(p => p.status === 'active' || p.status === 'approved').slice(0, 8)

      for (const product of activeProducts) {
        await updateDoc(doc(db, 'products', product.id), {
          featured: true,
          updatedAt: new Date()
        })
      }

      // Feature first 6 creators
      const activecreators = creators.slice(0, 6)

      for (const creator of activecreators) {
        await updateDoc(doc(db, 'users', creator.id), {
          featured: true,
          verified: true,
          updatedAt: new Date()
        })
      }

      toast.success('Quick setup completed! Featured content is now ready.')
      fetchContent() // Refresh data
    } catch (error) {
      console.error('Error in quick setup:', error)
      toast.error('Quick setup failed')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const featuredProducts = products.filter(p => p.featured)
  const featuredcreators = creators.filter(v => v.featured)

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Featured Content</h1>
        <Button onClick={quickSetupFeatured} className="bg-purple-600 hover:bg-purple-700">
          Quick Setup Featured Content
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Featured Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {featuredProducts.length}
            </div>
            <p className="text-gray-600">Currently featured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Featured creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {featuredcreators.length}
            </div>
            <p className="text-gray-600">Currently featured</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-gray-600 text-xs">{product.creatorName}</p>
                    <p className="text-purple-600 font-bold">₦{product.price?.toLocaleString()}</p>
                  </div>
                  {product.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant={product.featured ? "destructive" : "default"}
                  onClick={() => toggleProductFeatured(product.id, !!product.featured)}
                  className="w-full"
                >
                  {product.featured ? (
                    <>
                      <StarOff className="w-4 h-4 mr-1" />
                      Unfeature
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-1" />
                      Feature
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* creators Section */}
      <Card>
        <CardHeader>
          <CardTitle>creators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((creator) => (
              <div key={creator.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {creator.storeName || creator.displayName}
                    </h3>
                    <p className="text-gray-600 text-xs">{creator.email}</p>
                  </div>
                  {creator.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {creator.verified && (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={creator.featured ? "destructive" : "default"}
                  onClick={() => togglecreatorFeatured(creator.id, !!creator.featured)}
                  className="w-full"
                >
                  {creator.featured ? (
                    <>
                      <StarOff className="w-4 h-4 mr-1" />
                      Unfeature
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-1" />
                      Feature
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default function FeaturedContentPage() {
  return <ProtectedRoute requiredPermission="products.feature"><FeaturedContentPageContent /></ProtectedRoute>
}
