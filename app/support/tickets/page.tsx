"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Send,
  UserCheck,
  Star
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface SupportTicket {
  id: string
  ticketNumber: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  userId?: string
  orderId?: string
  productId?: string
  assignedTo?: string
  assignedBy?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  firstResponseAt?: Date
  lastResponseAt?: Date
  responseCount: number
  customerSatisfaction?: number
  tags: string[]
  internalNotes: Array<{
    note: string
    addedBy: string
    addedByName: string
    addedAt: Date
  }>
  source: string
}

interface TicketResponse {
  id: string
  message: string
  responderId: string
  responderName: string
  responderRole: 'support' | 'admin' | 'customer'
  createdAt: Date
  isInternal: boolean
}

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  avgResponseTime: number
  satisfactionScore: number
}

function SupportTicketsContent() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([])
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [newResponse, setNewResponse] = useState("")
  const [sendingResponse, setSendingResponse] = useState(false)
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    avgResponseTime: 0,
    satisfactionScore: 0
  })

  useEffect(() => {
    loadTickets()
  }, [statusFilter, priorityFilter, categoryFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('limit', '100')

      const response = await fetch(`/api/support/tickets?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets || [])
        calculateStats(data.tickets || [])
      } else {
        toast.error('Failed to load support tickets')
        setTickets([])
      }
    } catch (error) {
      console.error("Error loading tickets:", error)
      toast.error("Failed to load support tickets")
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ticketsList: SupportTicket[]) => {
    const stats = ticketsList.reduce((acc, ticket) => {
      acc.total++
      if (ticket.status === 'open') acc.open++
      else if (ticket.status === 'in_progress') acc.inProgress++
      else if (ticket.status === 'resolved') acc.resolved++
      
      return acc
    }, {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      avgResponseTime: 0,
      satisfactionScore: 0
    })

    // Calculate average response time
    const responseTimes = ticketsList
      .filter(t => t.firstResponseAt && t.createdAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime()
        const responded = new Date(t.firstResponseAt!).getTime()
        return (responded - created) / (1000 * 60 * 60) // hours
      })

    stats.avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    // Calculate satisfaction score
    const satisfactionScores = ticketsList
      .filter(t => t.customerSatisfaction)
      .map(t => t.customerSatisfaction!)

    stats.satisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0

    setStats(stats)
  }

  const loadTicketDetails = async (ticket: SupportTicket) => {
    try {
      setSelectedTicket(ticket)
      setShowTicketDetails(true)

      const response = await fetch(`/api/support/tickets/${ticket.id}`)
      const data = await response.json()

      if (data.success) {
        setSelectedTicket(data.ticket)
        setTicketResponses(data.responses || [])
      } else {
        toast.error('Failed to load ticket details')
      }
    } catch (error) {
      console.error('Error loading ticket details:', error)
      toast.error('Failed to load ticket details')
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          status,
          responderId: user?.uid,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Ticket status updated to ${status}`)
        loadTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket)
        }
      } else {
        toast.error(data.error || 'Failed to update ticket status')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const assignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          assignedTo,
          responderId: user?.uid,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ticket assigned successfully')
        loadTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket)
        }
      } else {
        toast.error(data.error || 'Failed to assign ticket')
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
      toast.error('Failed to assign ticket')
    }
  }

  const sendResponse = async () => {
    if (!selectedTicket || !newResponse.trim() || !user) return

    try {
      setSendingResponse(true)

      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_response',
          response: newResponse.trim(),
          responderId: user.uid,
          responderName: user.displayName || user.email?.split('@')[0] || 'Support',
          responderRole: 'support',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Response sent successfully')
        setNewResponse("")
        loadTicketDetails(selectedTicket) // Reload to get updated responses
      } else {
        toast.error(data.error || 'Failed to send response')
      }
    } catch (error) {
      console.error('Error sending response:', error)
      toast.error('Failed to send response')
    } finally {
      setSendingResponse(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <CheckCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Support Tickets
            </h1>
            <p className="text-muted-foreground">
              Manage and respond to customer support requests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">{stats.open}</div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.avgResponseTime.toFixed(1)}h
                  </div>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Satisfaction Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.satisfactionScore.toFixed(1)}/5
                  </div>
                  <Star className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Tickets</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by ticket number, customer, subject..."
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
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={loadTickets} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
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
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No support tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {ticket.ticketNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.name}</div>
                              <div className="text-sm text-muted-foreground">{ticket.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={ticket.subject}>
                              {ticket.subject}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(ticket.status)}
                                {ticket.status.replace('_', ' ')}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadTicketDetails(ticket)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {ticket.status === 'open' && (
                                <Button
                                  size="sm"
                                  onClick={() => assignTicket(ticket.id, user?.uid || '')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <UserCheck className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details Dialog */}
          <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ticket Details</DialogTitle>
                <DialogDescription>
                  {selectedTicket?.ticketNumber} - {selectedTicket?.subject}
                </DialogDescription>
              </DialogHeader>
              
              {selectedTicket && (
                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer</Label>
                      <p className="font-medium">{selectedTicket.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTicket.email}</p>
                    </div>
                    <div>
                      <Label>Status & Priority</Label>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {selectedTicket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div>
                    <Label>Original Message</Label>
                    <div className="mt-2 p-3 bg-muted rounded border">
                      <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Responses */}
                  <div>
                    <Label>Conversation</Label>
                    <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                      {ticketResponses.map((response) => (
                        <div
                          key={response.id}
                          className={`p-3 rounded border ${
                            response.responderRole === 'customer' 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {response.responderName} ({response.responderRole})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(response.createdAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Response */}
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <div>
                      <Label htmlFor="response">Add Response</Label>
                      <Textarea
                        id="response"
                        placeholder="Type your response to the customer..."
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={sendResponse}
                          disabled={!newResponse.trim() || sendingResponse}
                        >
                          {sendingResponse ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Sending...
                            </div>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Response
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Ticket Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <Label>Created</Label>
                      <p>{format(new Date(selectedTicket.createdAt), 'PPpp')}</p>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <p>{format(new Date(selectedTicket.updatedAt), 'PPpp')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTicketDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}

export default function SupportTicketsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'support']}>
      <SupportTicketsContent />
    </ProtectedRoute>
  )
}