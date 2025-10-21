"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  User,
  Search,
  Filter,
  Loader2,
  Star,
  Package
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'vendor'
  content: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  id: string
  vendorId: string
  vendorName: string
  customerId: string
  customerName: string
  customerEmail: string
  subject: string
  status: 'open' | 'closed' | 'pending'
  priority: 'low' | 'medium' | 'high'
  lastMessage: Message
  unreadCount: number
  createdAt: Date
  updatedAt: Date
  productId?: string
  productName?: string
  orderId?: string
}

function VendorMessagesContent() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Get product filter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get('product')
    if (productId) {
      setSearchQuery(`product:${productId}`)
    }
  }, [])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vendor/messages?vendorId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations || [])
      } else {
        toast.error('Failed to load conversations')
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/vendor/messages/${conversationId}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages || [])
        // Mark messages as read
        await markAsRead(conversationId)
      } else {
        toast.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/vendor/messages/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      })
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    try {
      setSendingMessage(true)
      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: user.uid,
          senderName: user.displayName || 'Vendor',
          senderRole: 'vendor',
          content: newMessage.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage("")
        loadMessages(selectedConversation.id)
        loadConversations() // Refresh to update last message
        toast.success('Message sent!')
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const updateConversationStatus = async (conversationId: string, status: string) => {
    try {
      const response = await fetch(`/api/vendor/messages/${conversationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadConversations()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null)
        }
        toast.success(`Conversation marked as ${status}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.productName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading messages...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Customer Messages</h1>
                <p className="text-muted-foreground">
                  Manage customer inquiries and support requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {totalUnread} unread
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversations ({filteredConversations.length})
                  </CardTitle>
                  
                  {/* Search and Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No conversations found</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation)
                            loadMessages(conversation.id)
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{conversation.customerName}</h4>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.subject}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                conversation.status === 'open' ? 'default' :
                                conversation.status === 'pending' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {conversation.status}
                            </Badge>
                          </div>
                          
                          {conversation.productName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <Package className="h-3 w-3" />
                              {conversation.productName}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </span>
                            <span className="ml-2 flex-shrink-0">
                              {formatDistanceToNow(new Date(conversation.updatedAt))} ago
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {selectedConversation.customerName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedConversation.status}
                          onChange={(e) => updateConversationStatus(selectedConversation.id, e.target.value)}
                          className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Messages */}
                  <CardContent className="flex-1 flex flex-col p-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Loading messages...</span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No messages in this conversation</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderRole === 'vendor' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.senderRole === 'vendor'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.senderName}
                                </span>
                                <span className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(message.timestamp))} ago
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 min-h-[80px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="self-end"
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                    <p>Choose a conversation from the left to view messages</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorMessagesPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorMessagesContent />
    </ProtectedRoute>
  )
}
