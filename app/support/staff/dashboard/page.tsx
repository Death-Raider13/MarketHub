"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  LifeBuoy,
  User
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { ProtectedRoute } from "@/lib/firebase/protected-route"

function StaffDashboardContent() {
  const { getCurrentToken, userProfile, user, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
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
        setLoading(false)
        return
      }
      const response = await fetch(`/api/support/staff/tickets?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setTickets(data.tickets)
      } else {
        toast.error("Failed to load your assigned tickets")
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

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    active: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex-1 bg-muted/30 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <LifeBuoy className="h-8 w-8 text-primary" />
                Support Staff Workspace
              </h1>
              <p className="text-muted-foreground">Welcome back, {userProfile?.displayName}. Handle your assigned tickets here.</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">Assigned To Me</p>
                    <h3 className="text-2xl font-bold">{stats.total}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase opacity-70">Waiting</p>
                    <h3 className="text-2xl font-bold">{stats.open}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase opacity-70">In Treatment</p>
                    <h3 className="text-2xl font-bold">{stats.active}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase opacity-70">Resolved</p>
                    <h3 className="text-2xl font-bold">{stats.resolved}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
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
                placeholder="Search your assigned tickets..." 
                className="pl-10 h-10 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-white p-1 rounded-lg border shadow-sm overflow-x-auto">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className="capitalize h-8 px-4"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Ticket Details</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Customer</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Priority</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Status</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          <div className="flex justify-center mb-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          </div>
                          Finding your tickets...
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-500 font-medium">No assigned tickets found.</p>
                          <p className="text-xs text-slate-400 mt-1">Once the admin assigns a ticket to you, it will appear here.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="min-w-0">
                              <span className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                                #{ticket.ticketNumber}
                              </span>
                              <p className="font-bold text-slate-800 line-clamp-1">{ticket.subject}</p>
                              <span className="text-[10px] text-muted-foreground">
                                Recieved {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                {ticket.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-slate-700">{ticket.name}</span>
                                <span className="text-[10px] text-slate-400">{ticket.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px] h-5 capitalize">
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(ticket.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" className="h-8 rounded-full shadow-sm hover:shadow-md transition-all gap-1" asChild>
                              <Link href={`/support/staff/tickets/${ticket.id}`}>
                                Treat Request
                                <ChevronRight className="h-3 w-3" />
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
        </div>
      </main>
    </div>
  )
}

export default function StaffDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["support", "admin", "super_admin"]}>
      <StaffDashboardContent />
    </ProtectedRoute>
  )
}
