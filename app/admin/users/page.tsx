"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Settings,
  Store,
  Search,
  Ban,
  Eye,
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

function AdminUsersContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">User Management</h1>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/vendors">
                <Button variant="ghost" className="w-full justify-start">
                  <Store className="mr-2 h-4 w-4" />
                  Vendors
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="default" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link href="/admin/advertising">
                <Button variant="ghost" className="w-full justify-start">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Advertising
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </aside>

            {/* Users List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-10" />
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
                        {mockUsers.map((user) => (
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
                                <Button size="sm" variant="outline">
                                  <Ban className="mr-1 h-4 w-4" />
                                  Suspend
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminUsersContent />
    </ProtectedRoute>
  )
}
