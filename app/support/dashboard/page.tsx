"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  MessageSquare,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Headphones,
  TrendingUp,
  Star,
  RefreshCw
} from "lucide-react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import Link from "next/link"

interface SupportStats {
  openTickets: number
  resolvedToday: number
  avgResponseTime: string
  customerSatisfaction: number
  pendingRefunds: number
  escalatedIssues: number
}

function SupportDashboardContent() {
  const [stats, setStats] = useState<SupportStats>({
    openTickets: 0,
    resolvedToday: 0,
    avgResponseTime: "2.5 hours",
    customerSatisfaction: 4.8,
    pendingRefunds: 0,
    escalatedIssues: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentTickets, setRecentTickets] = useState<any[]>([])

  useEffect(() => {
    loadSupportData()
  }, [])

  const loadSupportData = async () => {
    try {
      setLoading(true)

      // Get open support tickets
      const openTicketsQuery = query(
        collection(db, "support_tickets"),
        where("status", "in", ["open", "pending"])
      )
      const openTicketsSnapshot = await getDocs(openTicketsQuery)

      // Get today's resolved tickets
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const resolvedTodayQuery = query(
        collection(db, "support_tickets"),
        where("status", "==", "resolved"),
        where("updatedAt", ">=", today)
      )
      const resolvedTodaySnapshot = await getDocs(resolvedTodayQuery)

      // Get pending refunds from orders
      const pendingRefundsQuery = query(
        collection(db, "orders"),
        where("status", "==", "refund_requested")
      )
      const pendingRefundsSnapshot = await getDocs(pendingRefundsQuery)

      // Get escalated issues
      const escalatedQuery = query(
        collection(db, "support_tickets"),
        where("priority", "==", "urgent"),
        where("status", "!=", "resolved")
      )
      const escalatedSnapshot = await getDocs(escalatedQuery)

      // Get recent tickets
      const recentTicketsQuery = query(
        collection(db, "support_tickets"),
        orderBy("createdAt", "desc"),
        limit(5)
      )
      const recentTicketsSnapshot = await getDocs(recentTicketsQuery)

      const recentTicketsData = recentTicketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))

      // Calculate average response time (mock for now)
      const avgResponseTime = "2.5 hours"
      const customerSatisfaction = 4.8

      setStats({
        openTickets: openTicketsSnapshot.size,
        resolvedToday: resolvedTodaySnapshot.size,
        avgResponseTime,
        customerSatisfaction,
        pendingRefunds: pendingRefundsSnapshot.size,
        escalatedIssues: escalatedSnapshot.size
      })

      setRecentTickets(recentTicketsData)
    } catch (error) {
      console.error("Error loading support data:", error)
      
      // Fallback to mock data if queries fail
      setStats({
        openTickets: 23,
        resolvedToday: 15,
        avgResponseTime: "2.5 hours",
        customerSatisfaction: 4.8,
        pendingRefunds: 5,
        escalatedIssues: 2
      })

      setRecentTickets([
        {
          id: "1",
          customer: "John Doe",
          subject: "Order delivery issue",
          priority: "high",
          status: "open",
          createdAt: new Date(),
          type: "delivery"
        },
        {
          id: "2", 
          customer: "Jane Smith",
          subject: "Payment not processed",
          priority: "urgent",
          status: "open",
          createdAt: new Date(),
          type: "payment"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "View Open Tickets",
      description: `${stats.openTickets} tickets need attention`,
      href: "/admin/support/tickets",
      icon: MessageSquare,
      color: "bg-blue-500",
      urgent: stats.openTickets > 20
    },
    {
      title: "Process Refunds",
      description: `${stats.pendingRefunds} refunds pending`,
      href: "/admin/orders?filter=refunds",
      icon: RefreshCw,
      color: "bg-green-500",
      urgent: stats.pendingRefunds > 3
    },
    {
      title: "Escalated Issues",
      description: `${stats.escalatedIssues} issues escalated`,
      href: "/admin/support/escalated",
      icon: AlertCircle,
      color: "bg-red-500",
      urgent: stats.escalatedIssues > 0
    },
    {
      title: "Customer Feedback",
      description: "Review recent feedback",
      href: "/admin/support/feedback",
      icon: Star,
      color: "bg-purple-500",
      urgent: false
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Customer Support Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage customer inquiries and provide excellent support experience
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.openTickets}</div>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resolved Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Satisfaction Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.customerSatisfaction}/5</div>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Support Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${
                      action.urgent ? 'ring-2 ring-red-200 bg-red-50' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white`}>
                            <action.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{action.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {action.description}
                            </p>
                            {action.urgent && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tickets & Support Tools */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent tickets
                    </p>
                  ) : (
                    recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <p className="font-medium text-sm">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.customer} • {ticket.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Support Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Live Chat Support
                    </h4>
                    <p className="text-xs text-blue-600 mt-1">
                      Handle real-time customer inquiries
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Start Chat Session
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-green-800 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Templates
                    </h4>
                    <p className="text-xs text-green-600 mt-1">
                      Quick response templates for common issues
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">
                      View Templates
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Customer Lookup
                    </h4>
                    <p className="text-xs text-purple-600 mt-1">
                      Search customer accounts and order history
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Search Customers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SupportDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['support', 'moderator', 'admin', 'super_admin']}>
      <SupportDashboardContent />
    </ProtectedRoute>
  )
}
