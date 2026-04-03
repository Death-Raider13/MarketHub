"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Star
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { format } from "date-fns"
import { toast } from "sonner"

interface TicketResponse {
  id: string
  message: string
  responderName: string
  responderRole: 'support' | 'admin' | 'customer'
  createdAt: any
}

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  message: string
  createdAt: any
  updatedAt: any
  customerSatisfaction?: number
}

function TicketDetailPageContent() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [responses, setResponses] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [newResponse, setNewResponse] = useState("")
  const [sending, setSending] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    if (user && id) {
      loadTicketDetails()
    }
  }, [user, id])

  const loadTicketDetails = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()
      const response = await fetch(`/api/support/my-tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setResponses(data.responses || [])
        if (data.ticket.customerSatisfaction) {
          setRating(data.ticket.customerSatisfaction)
        }
      } else {
        toast.error(data.error || 'Failed to load ticket details')
        router.push('/support/my-tickets')
      }
    } catch (error) {
      console.error('Error loading ticket details:', error)
      toast.error('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !user) return

    try {
      setSending(true)
      const token = await user.getIdToken()
      const response = await fetch(`/api/support/my-tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add_response',
          response: newResponse.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewResponse("")
        loadTicketDetails()
        toast.success("Response sent successfully")
      } else {
        toast.error(data.error || "Failed to send response")
      }
    } catch (error) {
      console.error("Error sending response:", error)
      toast.error("Failed to send response")
    } finally {
      setSending(false)
    }
  }

  const handleRateSatisfaction = async (value: number) => {
    try {
      setRating(value)
      const token = await user?.getIdToken()
      const response = await fetch(`/api/support/my-tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'rate_satisfaction',
          rating: value,
          comment: feedbackComment
        })
      })

      const data = await response.json()
      if (data.success) {
        setFeedbackSubmitted(true)
        toast.success("Thank you for your feedback!")
      }
    } catch (error) {
      console.error("Error rating satisfaction:", error)
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-6">
            <Link href="/support/my-tickets" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to My Tickets
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
                    {ticket.ticketNumber}
                  </span>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold">{ticket.subject}</h1>
              </div>
              
              <div className="text-sm text-muted-foreground bg-card p-3 rounded-lg border">
                <span className="block font-medium text-foreground">Category: {ticket.category}</span>
                <span>Created {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Original Message */}
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5 py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Initial Request
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {ticket.message}
                </p>
              </CardContent>
            </Card>

            {/* Conversation */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Conversation
              </h2>
              
              {responses.length === 0 ? (
                <div className="bg-muted p-8 rounded-xl text-center border-2 border-dashed">
                  <p className="text-muted-foreground">Waiting for a response from our support team...</p>
                </div>
              ) : (
                responses.map((response) => (
                  <div 
                    key={response.id}
                    className={`flex ${response.responderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      response.responderRole === 'customer' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-card border rounded-tl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-bold opacity-80 uppercase">
                          {response.responderRole === 'customer' ? 'You' : `${response.responderName} (Support)`}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {format(new Date(response.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {response.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Satisfaction Rating (if resolved) */}
            {ticket.status === 'resolved' && !feedbackSubmitted && !ticket.customerSatisfaction && (
              <Card className="bg-white border-primary/20 shadow-lg overflow-hidden">
                <div className="bg-primary/5 p-4 border-b">
                   <h3 className="font-bold text-center text-slate-800">Rate Your Experience</h3>
                </div>
                <CardContent className="p-6">
                  <p className="text-center text-sm text-slate-500 mb-6">How was your interaction with our support staff?</p>
                  <div className="flex justify-center gap-3 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className={`transition-all duration-200 transform hover:scale-125 ${
                          (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-200'
                        }`}
                      >
                        <Star className={`h-10 w-10 ${(hoverRating || rating) >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                       <Textarea 
                         placeholder="Any comments about the staff or resolution? (Optional)"
                         className="resize-none border-slate-200"
                         value={feedbackComment}
                         onChange={(e) => setFeedbackComment(e.target.value)}
                       />
                       <Button 
                         className="w-full font-bold h-11" 
                         onClick={() => handleRateSatisfaction(rating)}
                       >
                         Submit Detailed Feedback
                       </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(feedbackSubmitted || ticket.customerSatisfaction) && (
               <Card className="bg-green-50 border-green-100 shadow-sm">
                 <CardContent className="p-6 flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                       <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-center">
                       <h3 className="font-bold text-green-900">Feedback Submitted</h3>
                       <div className="flex justify-center gap-1 my-2">
                         {[1,2,3,4,5].map(s => (
                           <Star key={s} className={`h-4 w-4 ${s <= (rating || ticket.customerSatisfaction || 0) ? 'text-yellow-500 fill-current' : 'text-slate-300'}`} />
                         ))}
                       </div>
                       <p className="text-xs text-green-700">Thank you for helping us improve our support quality!</p>
                    </div>
                 </CardContent>
               </Card>
            )}

            {/* Reply Input */}
            {ticket.status !== 'closed' && (
              <Card className="border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Add a Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSendResponse}
                      disabled={!newResponse.trim() || sending}
                    >
                      {sending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {ticket.status === 'closed' && (
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center gap-2 text-muted-foreground border">
                <CheckCircle className="h-5 w-5" />
                <p>This ticket has been closed. If you still need help, please open a new ticket.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function TicketDetailPage() {
  return (
    <ProtectedRoute>
      <TicketDetailPageContent />
    </ProtectedRoute>
  )
}
