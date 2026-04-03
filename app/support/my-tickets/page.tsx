"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Plus,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: any
  updatedAt: any
}

function MyTicketsContent() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const token = await user?.getIdToken()
      const response = await fetch('/api/support/my-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets || [])
      } else {
        toast.error('Failed to load your support tickets')
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Failed to load your support tickets')
    } finally {
      setLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <CheckCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to Help Center
                </Link>
              </div>
              <h1 className="text-3xl font-bold">My Support Tickets</h1>
              <p className="text-muted-foreground">Track and manage your requests to our support team</p>
            </div>
            
            <Button asChild>
              <Link href="/contact">
                <Plus className="mr-2 h-4 w-4" />
                Submit New Ticket
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="ml-3 text-muted-foreground">Loading your tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't submitted any support tickets yet. Need help?
                </p>
                <Button asChild>
                  <Link href="/contact">Create your first ticket</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-6 gap-4">
                      <div className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-full ${
                        ticket.status === 'open' ? 'bg-red-50 text-red-600' :
                        ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {getStatusIcon(ticket.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold truncate mb-2">{ticket.subject}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={getStatusColor(ticket.status)} variant="outline">
                            <span className="flex items-center gap-1">
                              <span className="sm:hidden">{getStatusIcon(ticket.status)}</span>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </Badge>
                          <Badge variant="secondary" className="font-normal">
                            {ticket.category}
                          </Badge>
                          {ticket.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">High Priority</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="shrink-0" asChild>
                        <Link href={`/support/my-tickets/${ticket.id}`}>
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <Card className="mt-12 border-blue-100 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Urgent issue?</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    If you haven't received a response within 48 hours for a critical issue, 
                    please contact our priority support on WhatsApp.
                  </p>
                  <Button variant="link" className="px-0 h-auto text-blue-700 font-bold" asChild>
                    <a href="https://wa.me/234XXXXXXXXXX" target="_blank" rel="noopener noreferrer">
                      WhatsApp Priority Support →
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <MyTicketsContent />
    </ProtectedRoute>
  )
}
