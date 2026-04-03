"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  User,
  Mail,
  Calendar,
  Shield,
  Tag,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"

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

function StaffTicketDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const { getCurrentToken, userProfile, user, loading: authLoading } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState("")
  const [reportContent, setReportContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
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
      // Note: We use the admin detail API as it returns responses and ticket data. 
      // The auth check in the API allows 'support' role.
      const response = await fetch(`/api/admin/support/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setTicket(data.ticket)
        setResponses(data.responses)
      } else {
        toast.error("Ticket not found or unauthorized")
        router.push("/support/staff/dashboard")
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      toast.error("Failed to load ticket details")
    } finally {
      setLoading(false)
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
          isInternal: false
        })
      })
      const data = await response.json()
      if (data.success) {
        setReplyMessage("")
        fetchTicketDetail()
        toast.success("Reply sent to customer")
      }
    } catch (error) {
      toast.error("Failed to send reply")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!reportContent.trim()) {
      toast.error("Please provide a resolution report")
      return
    }

    try {
      setIsResolving(true)
      const token = await getCurrentToken()
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'submit_report',
          reportContent: reportContent
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Ticket resolved and report filed")
        router.push("/support/staff/dashboard")
      }
    } catch (error) {
      toast.error("Failed to resolve ticket")
    } finally {
      setIsResolving(false)
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
        <Header />
        <div className="flex-1 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden bg-muted/30 flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" asChild>
                    <Link href="/support/staff/dashboard">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">TICKET #{ticket.ticketNumber}</span>
                      <Badge className={`${getStatusColor(ticket.status)} text-[9px] px-1.5 h-4 font-bold border-none`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h1 className="text-lg font-extrabold truncate max-w-md text-slate-900 tracking-tight">{ticket.subject}</h1>
                  </div>
                </div>

                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" className="bg-green-600 hover:bg-green-700 h-9 font-bold shadow-sm shadow-green-200">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Resolve & Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Finalize Resolution</DialogTitle>
                        <DialogDescription className="text-sm">
                          Provide a detailed report explaining how the issue was resolved. This will be sent to the administration and the customer.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea 
                          placeholder="Explain what was done to solve this..."
                          className="min-h-[150px] rounded-xl border-slate-200"
                          value={reportContent}
                          onChange={(e) => setReportContent(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleResolveTicket} 
                          disabled={!reportContent.trim() || isResolving}
                          className="w-full bg-green-600 hover:bg-green-700 font-bold h-11 rounded-xl"
                        >
                          {isResolving ? "Filing Report..." : "Complete & File Report"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
             </header>

             {/* Thread Area */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-tl-none p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                           <User className="h-3 w-3 text-primary" />
                         </div>
                         <span className="font-bold text-xs">{ticket.name}</span>
                         <Badge variant="outline" className="text-[9px] h-4">Initial Complaint</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {ticket.message}
                    </p>
                  </div>
                </div>

                {responses.map((res) => (
                  <div 
                    key={res.id}
                    className={`flex ${res.responderRole === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                      res.responderRole === 'customer' 
                        ? 'bg-white border border-slate-200 rounded-tl-none' 
                        : res.isInternal 
                          ? 'bg-amber-50 border border-amber-200 rounded-tr-none'
                          : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-2 opacity-80">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold uppercase tracking-tight">
                             {res.responderRole === 'customer' ? res.responderName : `You (${res.responderName})`}
                           </span>
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
             {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
               <footer className="bg-white border-t p-4 pr-6">
                <div className="relative">
                    <Textarea 
                      placeholder="Type your response to the customer..."
                      className="min-h-[100px] pr-12 resize-none border-slate-200 focus-visible:ring-primary shadow-inner"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <Button 
                      className="absolute right-3 bottom-3 h-9 w-9 p-0 rounded-full shadow-lg"
                      onClick={handleSubmitReply}
                      disabled={!replyMessage.trim() || isSubmitting}
                    >
                      {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
               </footer>
             )}
          </div>

          {/* Sidebar Area */}
          <aside className="w-full md:w-72 bg-white border-l h-full overflow-y-auto p-6 hidden lg:block">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              Ticket Info
            </h2>

            <div className="space-y-6">
              <section className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 mb-2 block">Quick Facts</label>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-slate-500">Priority:</span>
                     <Badge variant="outline" className="text-[10px] capitalize">{ticket.priority}</Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-slate-500">Category:</span>
                     <span className="text-xs font-bold text-slate-700">{ticket.category}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Created:</span>
                      <span className="text-[10px] font-medium text-slate-600 italic">{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</span>
                   </div>
                </div>
              </section>

              <section className="pt-4 border-t">
                <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 mb-4 block">Customer Details</label>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                        {ticket.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{ticket.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">ID: {ticket.userId || 'Guest'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <p className="text-xs truncate w-full font-medium" title={ticket.email}>{ticket.email}</p>
                   </div>
                </div>
              </section>

              <div className="pt-8 mt-auto">
                 <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 italic">
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                       <strong>Policy Tip:</strong> Always be polite and professional. Check the previous interaction history if available.
                    </p>
                 </div>
              </div>
            </div>
          </aside>
      </main>
    </div>
  )
}

export default function StaffTicketDetail() {
  return (
    <ProtectedRoute allowedRoles={["support", "admin", "super_admin"]}>
      <StaffTicketDetailContent />
    </ProtectedRoute>
  )
}
