"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Settings,
  Store,
  Search,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  storeName: string
  email: string
  joinDate: Date
  products: number
  revenue: number
  verified: boolean
  status: "active" | "pending" | "suspended"
}

function AdminVendorsContent() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setLoading(true)
      
      // Get all users with vendor role
      const usersQuery = query(collection(db, "users"), where("role", "==", "vendor"))
      const usersSnapshot = await getDocs(usersQuery)
      
      // Get all products to calculate vendor stats
      const productsQuery = query(collection(db, "products"))
      const productsSnapshot = await getDocs(productsQuery)
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Get all orders to calculate revenue
      const ordersQuery = query(collection(db, "orders"))
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const vendorsData: Vendor[] = usersSnapshot.docs.map(doc => {
        const userData = doc.data()
        const vendorId = doc.id
        
        // Calculate vendor stats
        const vendorProducts = products.filter((product: any) => product.vendorId === vendorId)
        const vendorOrders = orders.filter((order: any) => order.vendorId === vendorId)
        const vendorRevenue = vendorOrders.reduce((sum: number, order: any) => 
          sum + (order.totalAmount || 0), 0
        )
        
        return {
          id: vendorId,
          storeName: userData.storeName || userData.displayName || "Unknown Store",
          email: userData.email || "",
          joinDate: userData.createdAt?.toDate() || new Date(),
          products: vendorProducts.length,
          revenue: vendorRevenue,
          verified: userData.emailVerified || false,
          status: userData.status || "pending"
        }
      })
      
      setVendors(vendorsData)
      
    } catch (error) {
      console.error("Error loading vendors:", error)
      toast.error("Failed to load vendors")
      
      // Fallback to mock data
      const mockVendors: Vendor[] = [
        {
          id: "v1",
          storeName: "TechStore Pro",
          email: "tech@example.com",
          joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          products: 48,
          revenue: 24580,
          verified: true,
          status: "active",
        },
        {
          id: "v2",
          storeName: "Fashion Hub",
          email: "fashion@example.com",
          joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          products: 62,
          revenue: 18750,
          verified: true,
          status: "active",
        },
        {
          id: "v3",
          storeName: "Home Essentials",
          email: "home@example.com",
          joinDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          products: 0,
          revenue: 0,
          verified: false,
          status: "pending",
        },
      ]
      setVendors(mockVendors)
    } finally {
      setLoading(false)
    }
  }

  const updateVendorStatus = async (vendorId: string, newStatus: Vendor['status']) => {
    try {
      await updateDoc(doc(db, "users", vendorId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
      ))
      
      toast.success(`Vendor status updated to ${newStatus}`)
      
    } catch (error) {
      console.error("Error updating vendor status:", error)
      toast.error("Failed to update vendor status")
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vendor Management
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor vendor accounts and their performance
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search vendors..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold">{vendors.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {vendors.filter(v => v.status === 'pending').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Active Vendors</p>
                    <p className="text-2xl font-bold text-green-600">
                      {vendors.filter(v => v.status === 'active').length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendors Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Store Name</th>
                          <th className="p-4 text-left text-sm font-medium">Email</th>
                          <th className="p-4 text-left text-sm font-medium">Products</th>
                          <th className="p-4 text-left text-sm font-medium">Revenue</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center">
                              <div className="flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                              </div>
                            </td>
                          </tr>
                        ) : filteredVendors.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No vendors found
                            </td>
                          </tr>
                        ) : (
                          filteredVendors.map((vendor) => (
                            <tr key={vendor.id} className="border-b border-border">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{vendor.storeName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Joined {vendor.joinDate.toLocaleDateString()}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 text-sm">{vendor.email}</td>
                              <td className="p-4 text-sm">{vendor.products}</td>
                              <td className="p-4 font-medium">₦{vendor.revenue.toLocaleString()}</td>
                              <td className="p-4">
                                <Badge
                                  variant={vendor.status === "active" ? "default" : 
                                          vendor.status === "pending" ? "secondary" : "destructive"}
                                  className="capitalize"
                                >
                                  {vendor.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                  <div className="flex gap-2">
                                    {vendor.status === "pending" ? (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => updateVendorStatus(vendor.id, "active")}
                                        >
                                          <CheckCircle className="mr-1 h-4 w-4" />
                                          Approve
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => updateVendorStatus(vendor.id, "suspended")}
                                        >
                                          <XCircle className="mr-1 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </>
                                    ) : (
                                      <Button size="sm" variant="outline">
                                        <Eye className="mr-1 h-4 w-4" />
                                        View
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminVendorsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminVendorsContent />
    </ProtectedRoute>
  )
}
