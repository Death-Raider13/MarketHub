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
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  User,
  Search,
  Loader2,
  Package,
  ArrowLeft,
  Store
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
  lastMessage: Message | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
  productId?: string
  productName?: string
  orderId?: string
}

function CustomerMessagesContent() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/customer/messages?customerId=${user.uid}`)
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

  const loadMessages = async (conversation: Conversation) => {
    try {
      setLoadingMessages(true)
      setSelectedConversation(conversation)
      
      const response = await fetch(`/api/customer/messages/${conversation.id}?customerId=${user?.uid}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages || [])
        // Update the conversation's unread count to 0 since we're viewing it
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        )
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

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user) return

    try {
      setSendingMessage(true)

      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: user.uid,
          senderName: user.displayName || 'Customer',
          senderRole: 'customer',
          content: newMessage.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add the new message to the messages list
        const newMsg: Message = {
          id: data.messageId,
          conversationId: selectedConversation.id,
          senderId: user.uid,
          senderName: user.displayName || 'Customer',
          senderRole: 'customer',
          content: newMessage.trim(),
          timestamp: new Date(),
          read: false
        }
        
        setMessages(prev => [...prev, newMsg])
        setNewMessage("")
        
        // Update conversation in the list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, lastMessage: newMsg, updatedAt: new Date() }
              : conv
          )
        )
        
        toast.success('Message sent successfully!')
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

  const filteredConversations = conversations.filter(conv => 
    conv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                <h1 className="text-3xl font-bold">My Messages</h1>
                <p className="text-muted-foreground">
                  View conversations with vendors and get support
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
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No conversations found</p>
                        <p className="text-sm mt-1">Start by contacting a vendor from a product page</p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => loadMessages(conversation)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{conversation.vendorName}</span>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <Badge 
                              variant={conversation.status === 'open' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {conversation.status}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium text-sm mb-1 line-clamp-1">
                            {conversation.subject}
                          </h4>
                          
                          {conversation.productName && (
                            <div className="flex items-center gap-1 mb-2">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {conversation.productName}
                              </span>
                            </div>
                          )}
                          
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              <span className="font-medium">
                                {conversation.lastMessage.senderRole === 'customer' ? 'You' : conversation.vendorName}:
                              </span>{' '}
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages View */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                {selectedConversation ? (
                  <>
                    <CardHeader className="pb-4 border-b">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversation(null)}
                          className="lg:hidden"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            {selectedConversation.vendorName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {selectedConversation.subject}
                          </p>
                          {selectedConversation.productName && (
                            <div className="flex items-center gap-1 mt-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {selectedConversation.productName}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={selectedConversation.status === 'open' ? 'default' : 'secondary'}
                        >
                          {selectedConversation.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading messages...</span>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No messages yet</p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderRole === 'customer' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.senderRole === 'customer'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">
                                    {message.senderRole === 'customer' ? 'You' : message.senderName}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
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
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                              }
                            }}
                            rows={2}
                            className="flex-1 resize-none"
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={sendingMessage || !newMessage.trim()}
                            size="sm"
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
                  </>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                      <p>Choose a conversation from the list to view messages</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CustomerMessagesPage() {
  return (
    <ProtectedRoute>
      <CustomerMessagesContent />
    </ProtectedRoute>
  )
}
