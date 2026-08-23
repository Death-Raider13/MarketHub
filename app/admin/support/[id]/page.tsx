"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Mail,
  Calendar,
  Shield,
  Tag,
  Hash,
  FileText,
  Star
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Response {
  id: string
  message: string
  responderName: string
  responderRole: 'support' | 'admin' | 'customer'
  createdAt: any
  isInternal?: boolean
}

interface Ticket {
  id: string
  ticketNumber: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: any
  updatedAt: any
  userId?: string
}

function AdminTicketDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const { getCurrentToken, user, loading: authLoading } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchTicketDetail()
    }
  }, [id, authLoading, user])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [responses])

  const fetchTicketDetail = async () => {
    try {
      setLoading(true)
      const token = await getCurrentToken()
      if (!token) {
        setLoading(false)
        return
      }
      const response = await fetch(`/api/admin/support/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTicket(data.ticket)
        setResponses(data.responses)
        fetchStaffList()
      } else {
        toast.error("Ticket not found")
        router.push("/admin/support")
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      toast.error("Failed to load ticket details")
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffList = async () => {
    try {
      const token = await getCurrentToken()
      const response = await fetch('/api/admin/support/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const handleAssignTicket = async (staffId: string) => {
    const selectedStaff = staff.find(s => s.uid === staffId)
    if (!selectedStaff) return

    try {
      const token = await getCurrentToken()
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          action: 'assign',
          staffId,
          staffName: selectedStaff.displayName
        })
      })
      const data = await response.json()
      if (data.success) {
        setTicket(prev => prev ? { 
          ...prev, 
          assignedTo: staffId, 
          staffName: selectedStaff.displayName 
        } : null)
        toast.success(`Ticket assigned to ${selectedStaff.displayName}`)
      }
    } catch (error) {
      toast.error("Failed to assign ticket")
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const token = await getCurrentToken()
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await response.json()
      if (data.success) {
        setTicket(prev => prev ? { ...prev, status: newStatus as any } : null)
        toast.success(`Status updated to ${newStatus}`)
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleUpdatePriority = async (newPriority: string) => {
    try {
      const token = await getCurrentToken()
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priority: newPriority })
      })
      const data = await response.json()
      if (data.success) {
        setTicket(prev => prev ? { ...prev, priority: newPriority as any } : null)
        toast.success(`Priority updated to ${newPriority}`)
      }
    } catch (error) {
      toast.error("Failed to update priority")
    }
  }

  const handleSubmitReply = async () => {
    if (!replyMessage.trim()) return

    try {
      setIsSubmitting(true)
      const token = await getCurrentToken()
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add_response',
          response: replyMessage,
          isInternal
        })
      })
      const data = await response.json()
      if (data.success) {
        setReplyMessage("")
        setIsInternal(false)
        fetchTicketDetail() // Refresh to show new message
        toast.success(isInternal ? "Internal note added" : "Reply sent to customer")
      }
    } catch (error) {
      toast.error("Failed to send reply")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <AdminHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-hidden bg-muted/30 flex flex-col md:flex-row">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin/support">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground uppercase">{ticket.ticketNumber}</span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h1 className="text-xl font-bold truncate max-w-md">{ticket.subject}</h1>
                </div>
              </div>
            </header>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
              {/* Initial Message */}
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white border rounded-2xl rounded-tl-none p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b">
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                         <User className="h-4 w-4 text-primary" />
                       </div>
                       <span className="font-bold text-sm">{ticket.name}</span>
                       <Badge variant="outline" className="text-[10px]">Customer</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {ticket.message}
                  </p>
                </div>
              </div>

              {/* Resolution Report (if exists) */}
              {(ticket as any).report && (
                <Card className="bg-green-50 border-green-200 shadow-sm border-l-4 border-l-green-500 animate-in fade-in slide-in-from-top-4">
                  <CardHeader className="py-3 px-5 border-b border-green-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-green-800 flex items-center gap-2 uppercase tracking-wide">
                      <FileText className="h-4 w-4" />
                      Official Resolution Report
                    </CardTitle>
                    <span className="text-[10px] text-green-600 font-medium">
                      Submitted {(ticket as any).report.submittedAt ? format(new Date((ticket as any).report.submittedAt), 'MMM dd, HH:mm') : 'Recently'}
                    </span>
                  </CardHeader>
                  <CardContent className="p-5">
                    <p className="text-sm leading-relaxed text-green-900 whitespace-pre-wrap italic">
                      "{(ticket as any).report.content}"
                    </p>
                    <div className="mt-4 pt-3 border-t border-green-100 flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-green-200 flex items-center justify-center text-[10px] font-bold text-green-700">
                        {(ticket as any).report.submittedBy?.charAt(0)}
                      </div>
                      <span className="text-[10px] text-green-700 font-bold" title={(ticket as any).report.submittedBy}>
                        By {(ticket as any).report.submittedBy}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Feedback (if exists) */}
              {(ticket as any).feedback && (
                <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-500 animate-in fade-in slide-in-from-top-4 mb-4">
                  <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-indigo-800 flex items-center gap-2 uppercase tracking-wide">
                      <Star className="h-4 w-4 fill-indigo-500 text-indigo-500" />
                      Customer Feedback
                    </CardTitle>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= (ticket as any).feedback.rating ? 'text-yellow-500 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-700 italic">
                      {(ticket as any).feedback.comment || "The customer did not leave a written comment."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Received {(ticket as any).feedback.createdAt ? format(new Date((ticket as any).feedback.createdAt), 'MMM dd, HH:mm') : 'Recently'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Thread */}
              {responses.map((res) => (
                <div 
                  key={res.id}
                  className={`flex ${res.responderRole === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                    res.responderRole === 'customer' 
                      ? 'bg-white border rounded-tl-none' 
                      : res.isInternal 
                        ? 'bg-amber-50 border border-amber-200 rounded-tr-none'
                        : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-2 opacity-80">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold uppercase tracking-tight">
                           {res.responderRole === 'customer' ? res.responderName : `${res.responderName} (Staff)`}
                         </span>
                         {res.isInternal && <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] h-4">Internal Note</Badge>}
                      </div>
                      <span className="text-[10px]">
                        {format(new Date(res.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {res.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Area */}
            <footer className="bg-white border-t p-4 pr-6">
               <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="internal-note" 
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                    <Label htmlFor="internal-note" className="text-sm font-medium">Internal Note Only</Label>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {isInternal ? "User will NOT see this message" : "User will receive an email notification"}
                  </p>
               </div>
               <div className="relative">
                  <Textarea 
                    placeholder={isInternal ? "Add an internal note for staff..." : "Type your reply to the customer..."}
                    className={`min-h-[120px] pr-12 resize-none ${isInternal ? 'bg-amber-50/50 border-amber-200 focus-visible:ring-amber-300' : ''}`}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <Button 
                    className={`absolute right-3 bottom-3 h-9 w-9 p-0 rounded-full shadow-lg ${isInternal ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                    onClick={handleSubmitReply}
                    disabled={!replyMessage.trim() || isSubmitting}
                  >
                    {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
                  </Button>
               </div>
            </footer>
          </div>

          {/* Sidebar Area */}
          <aside className="w-full md:w-80 bg-white border-l h-full overflow-y-auto p-6 hidden lg:block">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4">
              <Shield className="h-5 w-5 text-indigo-600" />
              Ticket Management
            </h2>

            <div className="space-y-6">
              <section>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Assigned Staff</label>
                <Select 
                  value={(ticket as any).assignedTo || "unassigned"} 
                  onValueChange={handleAssignTicket}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" disabled>Select staff member</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.uid} value={s.uid}>{s.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(ticket as any).assignedByName && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    Assigned by {(ticket as any).assignedByName}
                  </p>
                )}
              </section>

              <section>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
                <Select value={ticket.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              <section>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Priority</label>
                <Select value={ticket.priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              <section className="pt-4 border-t">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Customer Information</label>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{ticket.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {ticket.userId || 'Guest'}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm truncate w-full" title={ticket.email}>{ticket.email}</p>
                   </div>
                   <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm italic">{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</p>
                   </div>
                   <div className="flex items-start gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <Badge variant="secondary">{ticket.category}</Badge>
                   </div>
                </div>
              </section>

              <div className="pt-6 border-t mt-auto">
                <Button variant="outline" className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700" asChild>
                  <Link href="/admin/support">
                    Close Management
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}


export default function AdminTicketDetail() {
  return <ProtectedRoute requiredPermission="support.view"><AdminTicketDetailContent /></ProtectedRoute>
}
