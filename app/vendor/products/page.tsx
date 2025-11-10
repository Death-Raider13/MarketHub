"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Archive,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  BarChart3,
  Loader2,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Store as StoreIcon,
  Mail,
  HelpCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { toast } from "sonner"

const mockProducts: Product[] = [
  {
    id: "1",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium audio experience",
    price: 199.99,
    comparePrice: 299.99,
    category: "electronics",
    images: ["/diverse-people-listening-headphones.png"],
    stock: 45,
    sku: "WH-1000",
    rating: 4.5,
    reviewCount: 128,
    featured: true,
    sponsored: false,
    status: "active",
    productType: "physical",
    type: "physical",
    requiresShipping: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Smart LED Desk Lamp",
    description: "Adjustable brightness",
    price: 49.99,
    category: "home",
    images: ["/modern-desk-lamp.png"],
    stock: 12,
    sku: "DL-3000",
    rating: 4.3,
    reviewCount: 45,
    featured: false,
    sponsored: false,
    status: "pending",
    productType: "physical",
    type: "physical",
    requiresShipping: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

function VendorProductsContent() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockValue, setStockValue] = useState<number>(0)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load products from Firestore
  useEffect(() => {
    async function loadProducts() {
      if (!user) return

      try {
        const response = await fetch(`/api/vendor/products?vendorId=${user.uid}`)
        const data = await response.json()

        if (data.products) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error("Error loading products:", error)
        toast.error("Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [user])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { variant: "default" as const, icon: CheckCircle2, color: "text-green-600" }
      case "pending":
        return { variant: "secondary" as const, icon: Clock, color: "text-orange-600" }
      case "inactive":
        return { variant: "secondary" as const, icon: XCircle, color: "text-gray-600" }
      case "rejected":
        return { variant: "destructive" as const, icon: XCircle, color: "text-red-600" }
      default:
        return { variant: "secondary" as const, icon: XCircle, color: "text-gray-600" }
    }
  }

  const handleStatusToggle = async (productId: string, currentStatus: string) => {
    if (currentStatus === "pending" || currentStatus === "rejected") {
      toast.error("Cannot change status of pending or rejected products")
      return
    }

    const newStatus = currentStatus === "active" ? "inactive" : "active"

    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? {...p, status: newStatus as any} : p
        ))
        toast.success(`Product ${newStatus === "active" ? "activated" : "deactivated"}`)
      } else {
        toast.error("Failed to update product status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update product status")
    }
  }

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? {...p, stock: newStock} : p
        ))
        setEditingStock(null)
        toast.success("Stock updated successfully")
      } else {
        toast.error("Failed to update stock")
      }
    } catch (error) {
      console.error("Error updating stock:", error)
      toast.error("Failed to update stock")
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        setDeleteConfirm(null)
        toast.success("Product archived successfully")
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const handleDuplicate = async (product: Product) => {
    if (!user) return

    try {
      toast.loading("Duplicating product...")
      
      // Create a copy of the product with modified name and reset stats
      const duplicatedProduct = {
        vendorId: user.uid,
        vendorName: product.vendorName,
        name: `${product.name} (Copy)`,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        category: product.category,
        images: product.images || [],
        stock: product.stock || 0,
        sku: `${product.sku}-COPY-${Date.now()}`,
        productType: product.productType || "physical",
        requiresShipping: product.requiresShipping !== false,
        status: "active",
        rating: 0,
        reviewCount: 0,
        featured: false,
        sponsored: false,
      }

      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedProduct),
      })

      const data = await response.json()

      if (data.success) {
        toast.dismiss()
        toast.success("Product duplicated successfully! 🎉")
        // Reload products to show the new duplicate
        const response2 = await fetch(`/api/vendor/products?vendorId=${user.uid}`)
        const data2 = await response2.json()
        if (data2.products) {
          setProducts(data2.products)
        }
      } else {
        toast.dismiss()
        toast.error(data.error || "Failed to duplicate product")
      }
    } catch (error) {
      console.error("Error duplicating product:", error)
      toast.dismiss()
      toast.error("Failed to duplicate product")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Products</h1>
            <Button asChild>
              <Link href="/vendor/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/vendor/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/vendor/products">
                <Button variant="default" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/vendor/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/vendor/analytics">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/vendor/store-customize">
                <Button variant="ghost" className="w-full justify-start">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Store Settings
                </Button>
              </Link>
            </aside>

            {/* Products List */}
            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading products...</span>
                </div>
              ) : (
                <>
              {/* Stats Overview */}
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{products.length}</p>
                      </div>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                          {products.filter(p => p.status === "active").length}
                        </p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Low Stock</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {products.filter(p => p.stock < 20 && p.stock > 0).length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                          {products.filter(p => p.stock === 0).length}
                        </p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline">All Products</Button>
                    <Button variant="outline">Low Stock</Button>
                    <Button variant="outline">Inactive</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Product</th>
                          <th className="p-4 text-left text-sm font-medium">SKU</th>
                          <th className="p-4 text-left text-sm font-medium">Price</th>
                          <th className="p-4 text-left text-sm font-medium">Stock</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={`${product.id}-${product.status}`} className="border-b border-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  <Image
                                    src={product.images[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">{product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{product.sku}</td>
                            <td className="p-4 text-sm font-medium">
                              ₦{typeof product.price === 'number' ? product.price.toLocaleString() : parseFloat(product.price || '0').toLocaleString()}
                            </td>
                            <td className="p-4">
                              {editingStock === product.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={stockValue}
                                    onChange={(e) => setStockValue(Number(e.target.value))}
                                    className="w-20 h-8"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setProducts(products.map(p => 
                                        p.id === product.id ? {...p, stock: stockValue} : p
                                      ))
                                      setEditingStock(null)
                                    }}
                                    className="h-8"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingStock(null)}
                                    className="h-8"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingStock(product.id)
                                    setStockValue(product.stock)
                                  }}
                                  className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors"
                                >
                                  <span className={`text-sm font-medium ${
                                    product.stock === 0 ? "text-red-600" :
                                    product.stock < 20 ? "text-orange-600" : 
                                    "text-green-600"
                                  }`}>
                                    {product.stock}
                                  </span>
                                  {product.stock === 0 && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                  {product.stock > 0 && product.stock < 20 && (
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  )}
                                  <span className="text-xs text-muted-foreground">(click to edit)</span>
                                </button>
                              )}
                            </td>
                            <td className="p-4">
                              {product.status === "pending" || product.status === "rejected" ? (
                                <Badge
                                  variant={getStatusBadge(product.status).variant}
                                  className="capitalize"
                                >
                                  {(() => {
                                    const StatusIcon = getStatusBadge(product.status).icon
                                    return <StatusIcon className="mr-1 h-3 w-3" />
                                  })()}
                                  {product.status}
                                </Badge>
                              ) : (
                                <button
                                  onClick={() => handleStatusToggle(product.id, product.status)}
                                  className="group"
                                  title="Click to toggle status"
                                >
                                  <Badge
                                    variant={getStatusBadge(product.status).variant}
                                    className="capitalize cursor-pointer group-hover:opacity-80 transition-opacity"
                                  >
                                    {(() => {
                                      const StatusIcon = getStatusBadge(product.status).icon
                                      return <StatusIcon className="mr-1 h-3 w-3" />
                                    })()}
                                    {product.status}
                                  </Badge>
                                </button>
                              )}
                              {product.status === "pending" && (
                                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                              )}
                              {product.status === "rejected" && (
                                <p className="text-xs text-red-600 mt-1">Admin rejected</p>
                              )}
                            </td>
                            <td className="p-4">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 z-[9999]">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/products/${product.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Product
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/vendor/products/${product.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingStock(product.id)
                                      setStockValue(product.stock)
                                    }}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    Update Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/vendor/analytics?product=${product.id}`}>
                                      <BarChart3 className="mr-2 h-4 w-4" />
                                      View Analytics
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/vendor/messages?product=${product.id}`}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Product Messages
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/vendor/questions?product=${product.id}`}>
                                      <HelpCircle className="mr-2 h-4 w-4" />
                                      Product Q&A
                                    </Link>
                                  </DropdownMenuItem>
                                  {(product.status === "active" || product.status === "inactive") && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusToggle(product.id, product.status)}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      {product.status === "active" ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDuplicate(product)}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Product
                                  </DropdownMenuItem>
                                  {deleteConfirm === product.id ? (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(product.id)}
                                        className="text-destructive font-medium"
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Confirm Delete
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setDeleteConfirm(null)}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => setDeleteConfirm(product.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Product
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorProductsContent />
    </ProtectedRoute>
  )
}
