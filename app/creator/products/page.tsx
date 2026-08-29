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
  HelpCircle,
  Calendar,
  Wallet,
  Palette,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/lib/types"
import { toast } from "sonner"

const mockProducts: Product[] = [
  {
    id: "1",
    creatorId: "v1",
    creatorName: "TechStore Pro",
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
    productType: "digital",
    type: "digital",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    creatorId: "v1",
    creatorName: "TechStore Pro",
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
    productType: "digital",
    type: "digital",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

function CreatorProductsContent() {
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
        const response = await fetch(`/api/creator/products?creatorId=${user.uid}`)
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
      const response = await fetch(`/api/creator/products/${productId}`, {
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
      const response = await fetch(`/api/creator/products/${productId}`, {
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
      const response = await fetch(`/api/creator/products/${productId}`, {
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
        creatorId: user.uid,
        creatorName: product.creatorName,
        name: `${product.name} (Copy)`,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        category: product.category,
        images: product.images || [],
        stock: product.stock || 0,
        sku: `${product.sku}-COPY-${Date.now()}`,
        type: product.type || "digital",
        status: "active",
        rating: 0,
        reviewCount: 0,
        featured: false,
        sponsored: false,
      }

      const response = await fetch("/api/creator/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedProduct),
      })

      const data = await response.json()

      if (data.success) {
        toast.dismiss()
        toast.success("Product duplicated successfully! 🎉")
        // Reload products to show the new duplicate
        const response2 = await fetch(`/api/creator/products?creatorId=${user.uid}`)
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">My Products</h1>
            <Button asChild>
              <Link href="/creator/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 space-y-0 lg:space-y-2">
              <Link href="/creator/dashboard">
                <Button variant="default" className="w-full justify-start text-xs sm:text-sm truncate">
                  <LayoutDashboard className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </Button>
              </Link>
              <Link href="/creator/products">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <Package className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Products</span>
                </Button>
              </Link>
              <Link href="/creator/orders">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Orders</span>
                </Button>
              </Link>
              <Link href="/creator/services">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <Calendar className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Services</span>
                </Button>
              </Link>
              <Link href="/creator/messages">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <Mail className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Messages</span>
                </Button>
              </Link>
              <Link href="/creator/questions">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <HelpCircle className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Q&A</span>
                </Button>
              </Link>
              <Link href="/creator/analytics">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <TrendingUp className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Analytics</span>
                </Button>
              </Link>
              <Link href="/creator/hub">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate" id="sidebar-hub-settings">
                  <Palette className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Hub Settings</span>
                </Button>
              </Link>
              <Link href="/creator/hub-customize">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <Palette className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Customize Hub</span>
                </Button>
              </Link>
              <Link href="/creator/payouts">
                <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm truncate">
                  <Wallet className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Payouts</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                          {products.filter(p => p.stock !== null && p.stock < 20 && p.stock > 0).length}
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
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline">All Products</Button>
                      <Button variant="outline">Low Stock</Button>
                      <Button variant="outline">Inactive</Button>
                    </div>
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
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  <Image
                                    src={product.images[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate max-w-[140px] sm:max-w-[240px]" title={product.name}>{product.name}</p>
                                  <p className="text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[240px]">{product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-mono truncate max-w-[100px]">{product.sku}</td>
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
                                    product.stock === null ? "text-blue-600" :
                                    product.stock === 0 ? "text-red-600" :
                                    product.stock < 20 ? "text-orange-600" : 
                                    "text-green-600"
                                  }`}>
                                    {product.stock === null ? "∞ Unlimited" : product.stock}
                                  </span>
                                  {product.stock === 0 && (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                  {product.stock !== null && product.stock > 0 && product.stock < 20 && (
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
                                    <Link href={`/creator/products/${product.id}/edit`}>
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
                                    <Link href={`/creator/analytics?product=${product.id}`}>
                                      <BarChart3 className="mr-2 h-4 w-4" />
                                      View Analytics
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/creator/messages?product=${product.id}`}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Product Messages
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/creator/questions?product=${product.id}`}>
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

export default function CreatorProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <CreatorProductsContent />
    </ProtectedRoute>
  )
}
