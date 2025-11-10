"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createNotification, createAdminNotification } from "@/lib/notifications/service"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  Star,
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { formatDistanceToNow } from "date-fns"

interface Product {
  id: string
  vendorId: string
  vendorName: string
  name: string
  description: string
  price: number
  category: string
  images: string[]
  stock: number
  sku: string
  rating: number
  reviewCount: number
  featured: boolean
  sponsored: boolean
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

function ProductsManagementContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductDetails, setShowProductDetails] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      
      // Get products from Firestore
      const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        limit(100)
      )
      
      const productsSnapshot = await getDocs(productsQuery)
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[]

      setProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const productRef = doc(db, "products", productId)
      await updateDoc(productRef, {
        status: newStatus,
        updatedAt: new Date()
      })
      
      // Find the product to get vendor info
      const product = products.find(p => p.id === productId)
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus as any, updatedAt: new Date() }
          : product
      ))
      
      // Send notification to vendor
      if (product?.vendorId) {
        if (newStatus === 'approved') {
          await createNotification(product.vendorId, 'product_approved', {
            metadata: {
              productId: productId,
              productName: product.name,
              actionUrl: `/vendor/products/${productId}`
            }
          })
          toast.success(`Product "${product.name}" approved and vendor notified`)
        } else if (newStatus === 'rejected') {
          await createNotification(product.vendorId, 'product_rejected', {
            metadata: {
              productId: productId,
              productName: product.name,
              actionUrl: `/vendor/products/${productId}`
            }
          })
          toast.success(`Product "${product.name}" rejected and vendor notified`)
        }
      }
      
      console.log(`Product ${productId} status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating product status:", error)
      toast.error("Failed to update product status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    active: products.filter(p => p.status === 'active').length,
    rejected: products.filter(p => p.status === 'rejected').length
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Products Management
            </h1>
            <p className="text-muted-foreground">
              Review and manage products across the platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, vendor, SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={loadProducts} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] && (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.vendorName || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{product.category || 'N/A'}</TableCell>
                        <TableCell>₦{product.price?.toLocaleString() || '0'}</TableCell>
                        <TableCell>{product.stock || 0}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.createdAt ? formatDistanceToNow(product.createdAt, { addSuffix: true }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowProductDetails(true)
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {product.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateProductStatus(product.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateProductStatus(product.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Product Details Dialog */}
          <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
                <DialogDescription>
                  {selectedProduct?.name} by {selectedProduct?.vendorName}
                </DialogDescription>
              </DialogHeader>
              
              {selectedProduct && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Product Name</Label>
                      <p className="font-medium">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <Label>Vendor</Label>
                      <p className="font-medium">{selectedProduct.vendorName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">
                      {selectedProduct.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Price</Label>
                      <p className="font-medium">₦{selectedProduct.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <p className="font-medium">{selectedProduct.stock}</p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p className="font-medium capitalize">{selectedProduct.category}</p>
                    </div>
                  </div>
                  
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div>
                      <Label>Product Images</Label>
                      <div className="flex gap-2 mt-2">
                        {selectedProduct.images.slice(0, 3).map((image, index) => (
                          <Image
                            key={index}
                            src={image}
                            alt={`Product image ${index + 1}`}
                            width={80}
                            height={80}
                            className="rounded border object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProductDetails(false)}>
                  Close
                </Button>
                
                {selectedProduct?.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        updateProductStatus(selectedProduct.id, 'rejected')
                        setShowProductDetails(false)
                      }}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    
                    <Button
                      onClick={() => {
                        updateProductStatus(selectedProduct.id, 'approved')
                        setShowProductDetails(false)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}

export default function ProductsManagementPage() {
  return (
    <ProtectedRoute requiredPermission="products.view">
      <ProductsManagementContent />
    </ProtectedRoute>
  )
}
