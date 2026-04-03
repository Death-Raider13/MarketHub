"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  LifeBuoy
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Ticket {
  id: string
  ticketNumber: string
  name: string
  email: string
  subject: string
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: any
  updatedAt: any
}

export default function AdminSupportDashboard() {
  const { getCurrentToken, user, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      fetchTickets()
    }
  }, [filter, authLoading, user])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const token = await getCurrentToken()
      if (!token) {
        console.warn("No auth token available, skipping fetch")
        setLoading(false)
        return
      }
      const response = await fetch(`/api/admin/support?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTickets(data.tickets)
        setStats(data.stats)
      } else {
        toast.error("Failed to load support tickets")
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("An error occurred while fetching tickets")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-red-100 text-red-800 border-red-200">Open</Badge>
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>
      case 'resolved': return <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>
      case 'closed': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Closed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>
      case 'low': return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Low</Badge>
      default: return null
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <LifeBuoy className="h-8 w-8 text-primary" />
                Support Center
              </h1>
              <p className="text-muted-foreground">Manage and respond to customer inquiries</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase">Total Tickets</p>
                    <h3 className="text-2xl font-bold">{stats?.total || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 uppercase italic font-bold">Open Items</p>
                    <h3 className="text-2xl font-bold">{stats?.open || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 uppercase italic font-bold">Processing</p>
                    <h3 className="text-2xl font-bold">{stats?.inProgress || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 uppercase italic font-bold">Resolved</p>
                    <h3 className="text-2xl font-bold">{stats?.resolved || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets by ID, subject, or customer..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 bg-white p-1 rounded-lg border">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className="capitalize h-8"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-sm">Ticket</th>
                      <th className="px-6 py-4 font-semibold text-sm">Customer</th>
                      <th className="px-6 py-4 font-semibold text-sm">Assigned To</th>
                      <th className="px-6 py-4 font-semibold text-sm">Category</th>
                      <th className="px-6 py-4 font-semibold text-sm">Priority</th>
                      <th className="px-6 py-4 font-semibold text-sm">Status</th>
                      <th className="px-6 py-4 font-semibold text-sm">Last Activity</th>
                      <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex justify-center mb-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          </div>
                          Loading tickets...
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          No tickets found.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="min-w-0">
                              <span className="block text-xs font-mono text-muted-foreground mb-1">
                                {ticket.ticketNumber}
                              </span>
                              <p className="font-semibold truncate max-w-[200px]">{ticket.subject}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{ticket.name}</span>
                              <span className="text-[10px] text-muted-foreground">{ticket.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(ticket as any).staffName ? (
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                {(ticket as any).staffName}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic underline decoration-dotted">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="capitalize">
                              {ticket.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {getPriorityBadge(ticket.priority)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(ticket.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/support/${ticket.id}`} className="flex items-center gap-1">
                                Manage
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
