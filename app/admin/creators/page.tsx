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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface creator {
  id: string
  storeName: string
  email: string
  joinDate: Date
  products: number
  revenue: number
  verified: boolean
  status: "active" | "pending" | "suspended"
}

function AdmincreatorsContent() {
  const [creators, setcreators] = useState<creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCreator, setSelectedCreator] = useState<creator | null>(null)

  useEffect(() => {
    loadcreators()
  }, [])

  const loadcreators = async () => {
    try {
      setLoading(true)

      // Get all users with creator role
      const usersQuery = query(collection(db, "users"), where("role", "==", "creator"))
      const usersSnapshot = await getDocs(usersQuery)

      // Get all products to calculate creator stats
      const productsQuery = query(collection(db, "products"))
      const productsSnapshot = await getDocs(productsQuery)
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Get all orders to calculate revenue
      const ordersQuery = query(collection(db, "orders"))
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      const creatorsData: creator[] = usersSnapshot.docs.map(doc => {
        const userData = doc.data()
        const creatorId = doc.id

        // Calculate creator stats
        const creatorProducts = products.filter((product: any) => product.creatorId === creatorId)
        const creatorOrders = orders.filter((order: any) => order.creatorId === creatorId)
        const creatorRevenue = creatorOrders.reduce((sum: number, order: any) =>
          sum + (order.totalAmount || 0), 0
        )

        return {
          id: creatorId,
          storeName: userData.storeName || userData.displayName || "Unknown Store",
          email: userData.email || "",
          joinDate: userData.createdAt?.toDate() || new Date(),
          products: creatorProducts.length,
          revenue: creatorRevenue,
          verified: userData.emailVerified || false,
          status: userData.status || "pending"
        }
      })

      setcreators(creatorsData)

    } catch (error) {
      console.error("Error loading creators:", error)
      toast.error("Failed to load creators")

      // Fallback to mock data
      const mockcreators: creator[] = [
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
      setcreators(mockcreators)
    } finally {
      setLoading(false)
    }
  }

  const updatecreatorstatus = async (creatorId: string, newStatus: creator['status']) => {
    try {
      // Read current creator info for notifications before state changes
      const currentcreator = creators.find(v => v.id === creatorId) || null

      // Reflect status + verified on the user document
      await updateDoc(doc(db, "users", creatorId), {
        status: newStatus,
        verified: newStatus === "active",
        updatedAt: new Date(),
      })

      // Update local state
      setcreators(prev => prev.map(creator => (
        creator.id === creatorId ? { ...creator, status: newStatus } : creator
      )))

      // Best-effort email to applicant about decision
      try {
        const decision = newStatus === "active" ? "approved" : "rejected"
        const creatorEmail = currentcreator?.email
        const storeName = currentcreator?.storeName
        if (creatorEmail) {
          await fetch('/api/notifications/creator-decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creatorEmail, decision, storeName }),
          })
        }
      } catch (e) {
        console.warn('Failed to send creator decision email', e)
      }

      toast.success(`creator status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating creator status:", error)
      toast.error("Failed to update creator status")
    }
  }

  const filteredcreators = creators.filter(creator =>
    creator.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                creator Management
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor creator accounts and their performance
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
                    placeholder="Search creators..."
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
                  <p className="text-sm text-muted-foreground">Total creators</p>
                  <p className="text-2xl font-bold">{creators.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {creators.filter(v => v.status === 'pending').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Active creators</p>
                  <p className="text-2xl font-bold text-green-600">
                    {creators.filter(v => v.status === 'active').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* creators Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
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
                      ) : filteredcreators.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No creators found
                          </td>
                        </tr>
                      ) : (
                        filteredcreators.map((creator) => (
                          <tr key={creator.id} className="border-b border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedCreator(creator)}>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{creator.storeName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {creator.joinDate.toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{creator.email}</td>
                            <td className="p-4 text-sm">{creator.products}</td>
                            <td className="p-4 font-medium">₦{creator.revenue.toLocaleString()}</td>
                            <td className="p-4">
                              <Badge
                                variant={creator.status === "active" ? "default" :
                                  creator.status === "pending" ? "secondary" : "destructive"}
                                className="capitalize"
                              >
                                {creator.status}
                              </Badge>
                            </td>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedCreator(creator)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Review
                                </Button>
                                {creator.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => updatecreatorstatus(creator.id, "active")}
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updatecreatorstatus(creator.id, "suspended")}
                                    >
                                      <XCircle className="mr-1 h-4 w-4" />
                                      Reject
                                    </Button>
                                  </>
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

            {/* Creator Review Modal for Mobile Responsiveness */}
            <Dialog open={!!selectedCreator} onOpenChange={(open) => !open && setSelectedCreator(null)}>
              <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
                <DialogHeader className="pb-3 border-b shrink-0">
                  <DialogTitle className="text-xl font-bold">Creator Profile Review</DialogTitle>
                  <DialogDescription>
                    Review details for {selectedCreator?.storeName}
                  </DialogDescription>
                </DialogHeader>

                {selectedCreator && (
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase font-semibold">Store / Hub Name</Label>
                      <p className="font-bold text-base">{selectedCreator.storeName}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase font-semibold">Email Address</Label>
                      <p className="font-medium text-sm">{selectedCreator.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-xl border">
                      <div>
                        <Label className="text-xs text-muted-foreground">Products Uploaded</Label>
                        <p className="font-bold text-lg">{selectedCreator.products}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Revenue</Label>
                        <p className="font-bold text-lg text-emerald-600">₦{selectedCreator.revenue.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase font-semibold">Current Account Status</Label>
                      <div>
                        <Badge
                          variant={selectedCreator.status === "active" ? "default" :
                            selectedCreator.status === "pending" ? "secondary" : "destructive"}
                          className="capitalize font-bold px-3 py-1 text-xs"
                        >
                          {selectedCreator.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-3 border-t shrink-0 flex flex-col-reverse sm:flex-row gap-2 justify-end sticky bottom-0 bg-background z-10 mt-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10 font-semibold" onClick={() => setSelectedCreator(null)}>
                    Close
                  </Button>

                  {selectedCreator && selectedCreator.status !== "active" && (
                    <Button
                      onClick={() => {
                        updatecreatorstatus(selectedCreator.id, "active")
                        setSelectedCreator(null)
                      }}
                      className="w-full sm:w-auto h-11 sm:h-10 font-bold bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Creator
                    </Button>
                  )}

                  {selectedCreator && selectedCreator.status !== "suspended" && (
                    <Button
                      onClick={() => {
                        updatecreatorstatus(selectedCreator.id, "suspended")
                        setSelectedCreator(null)
                      }}
                      variant="destructive"
                      className="w-full sm:w-auto h-11 sm:h-10 font-bold"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject / Suspend
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdmincreatorsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdmincreatorsContent />
    </ProtectedRoute>
  )
}
