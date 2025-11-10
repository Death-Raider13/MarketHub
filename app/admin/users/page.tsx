"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { usePermissions } from "@/hooks/use-permissions"
import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"
import { createNotification, createAdminNotification } from "@/lib/notifications/service"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Settings,
  Store,
  Eye,
  Ban,
  CheckCircle,
  Search,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import type { UserRole } from "@/lib/firebase/auth-context"

interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  joinDate: Date
  orders: number
  status: "active" | "suspended"
}

function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { canManageUserRole } = usePermissions()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Get all users
      const usersQuery = query(collection(db, "users"))
      const usersSnapshot = await getDocs(usersQuery)
      
      // Get all orders to calculate user order counts
      const ordersQuery = query(collection(db, "orders"))
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const usersData: User[] = usersSnapshot.docs.map(doc => {
        const userData = doc.data()
        const userId = doc.id
        
        // Calculate user order count
        const userOrders = orders.filter((order: any) => order.userId === userId)
        
        return {
          id: userId,
          email: userData.email || "",
          displayName: userData.displayName || userData.storeName || "Unknown User",
          role: userData.role || "customer",
          joinDate: userData.createdAt?.toDate() || new Date(),
          orders: userOrders.length,
          status: userData.status || "active"
        }
      })
      
      setUsers(usersData)
      
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
      
      // Fallback to mock data
      const mockUsers: User[] = [
        {
          id: "u1",
          email: "john@example.com",
          displayName: "John Doe",
          role: "customer",
          joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          orders: 24,
          status: "active",
        },
        {
          id: "u2",
          email: "jane@example.com",
          displayName: "Jane Smith",
          role: "customer",
          joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          orders: 12,
          status: "active",
        },
        {
          id: "u3",
          email: "vendor@example.com",
          displayName: "TechStore Pro",
          role: "vendor",
          joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          orders: 0,
          status: "active",
        },
      ]
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, newStatus: User['status']) => {
    try {
      // Find the target user
      const targetUser = users.find(u => u.id === userId)
      if (!targetUser) {
        toast.error("User not found")
        return
      }
      
      // Check hierarchical permissions
      if (!canManageUserRole(targetUser.role as any, 'users.ban')) {
        toast.error(`Cannot manage ${targetUser.role} accounts`)
        return
      }
      
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      
      // Send notification to user about status change
      if (newStatus === 'suspended') {
        await createNotification(userId, 'vendor_suspended', {
          metadata: {
            actionUrl: '/account/status'
          }
        })
        toast.success(`User suspended and notified`)
      } else if (newStatus === 'active') {
        await createNotification(userId, 'account_verified', {
          metadata: {
            actionUrl: '/dashboard'
          }
        })
        toast.success(`User activated and notified`)
      } else {
        toast.success(`User status updated to ${newStatus}`)
      }
      
    } catch (error) {
      console.error("Error updating user status:", error)
      toast.error("Failed to update user status")
    }
  }

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage user accounts, roles, and permissions
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
                      placeholder="Search users..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">User</th>
                          <th className="p-4 text-left text-sm font-medium">Email</th>
                          <th className="p-4 text-left text-sm font-medium">Role</th>
                          <th className="p-4 text-left text-sm font-medium">Orders</th>
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
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{user.displayName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {user.joinDate.toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{user.email}</td>
                            <td className="p-4">
                              <Badge variant="secondary" className="capitalize">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">{user.orders}</td>
                            <td className="p-4">
                              <Badge
                                variant={user.status === "active" ? "default" : "destructive"}
                                className="capitalize"
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                                {canManageUserRole(user.role as any, 'users.ban') ? (
                                  user.status === "active" ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateUserStatus(user.id, "suspended")}
                                    >
                                      <Ban className="mr-1 h-4 w-4" />
                                      Suspend
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateUserStatus(user.id, "active")}
                                    >
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Activate
                                    </Button>
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {user.role === 'super_admin' ? 'Super Admin' : 
                                     user.role === 'admin' ? 'Same Level' : 'Protected'}
                                  </Badge>
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

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredPermission="users.view">
      <AdminUsersContent />
    </ProtectedRoute>
  )
}
