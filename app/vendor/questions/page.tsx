"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  User,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { db } from "@/lib/firebase/config"
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore"
import { notificationService } from "@/lib/notifications/service"

interface Reply {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
  isVendor: boolean
}

interface Question {
  id: string
  productId: string
  productName?: string
  vendorId: string
  userId: string
  userName: string
  userEmail: string
  question: string
  answer: string | null
  answeredBy: string | null
  answeredAt: Date | null
  status: 'pending' | 'approved' | 'rejected'
  helpful: number
  createdAt: Date
  updatedAt: Date
  replies?: Reply[]
}

function VendorQuestionsContent() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [replyText, setReplyText] = useState<{[key: string]: string}>({})
  const [showReplyBox, setShowReplyBox] = useState<{[key: string]: boolean}>({})
  const [submittingReply, setSubmittingReply] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    if (user) {
      loadQuestions()
    }
  }, [user, filter])

  // Get product filter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get('product')
    if (productId) {
      // Filter questions for specific product
      setQuestions(prev => prev.filter(q => q.productId === productId))
    }
  }, [])

  const loadQuestions = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Loading questions for vendor:', user.uid)
      
      // Use API to get questions with replies
      const response = await fetch(`/api/vendor/questions?vendorId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        let questionsData = data.questions || []
        
        // Apply filter
        let filteredQuestions = questionsData
        if (filter === 'pending') {
          filteredQuestions = questionsData.filter((q: Question) => !q.answer)
        } else if (filter === 'answered') {
          filteredQuestions = questionsData.filter((q: Question) => q.answer)
        }

        console.log('Loaded', filteredQuestions.length, 'questions for vendor')
        setQuestions(filteredQuestions)
      } else {
        console.error('Failed to load questions:', data.error)
        toast.error('Failed to load questions')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerQuestion = async (questionId: string) => {
    const answer = answerText[questionId]?.trim()
    
    if (!answer) {
      toast.error('Please enter an answer')
      return
    }

    try {
      setAnsweringId(questionId)

      // Find the question to get customer info
      const question = questions.find(q => q.id === questionId)
      
      await updateDoc(doc(db, 'questions', questionId), {
        answer: answer,
        answeredBy: user?.uid,
        answeredAt: new Date(),
        status: 'approved',
        updatedAt: new Date()
      })

      // Notify customer that their question was answered
      if (question?.userId) {
        try {
          await notificationService.createNotification(question.userId, 'question_answered', {
            metadata: {
              productId: question.productId,
              productName: question.productName,
              actionUrl: `/products/${question.productId}`
            }
          })
        } catch (notificationError) {
          console.error('Failed to send answer notification:', notificationError)
        }
      }

      toast.success('Answer posted successfully!')
      setAnswerText(prev => ({ ...prev, [questionId]: '' }))
      loadQuestions()
    } catch (error) {
      console.error('Error answering question:', error)
      toast.error('Failed to post answer')
    } finally {
      setAnsweringId(null)
    }
  }

  const handleReply = async (questionId: string) => {
    if (!user) return

    const reply = replyText[questionId]?.trim()
    if (!reply) {
      toast.error('Please enter a reply')
      return
    }

    try {
      setSubmittingReply(prev => ({ ...prev, [questionId]: true }))

      const response = await fetch(`/api/products/temp/questions/${questionId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Vendor',
          message: reply,
          isVendor: true
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add the reply to the question locally
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                replies: [...(q.replies || []), {
                  id: data.replyId,
                  userId: user.uid,
                  userName: user.displayName || user.email?.split('@')[0] || 'Vendor',
                  message: reply,
                  createdAt: new Date().toISOString(),
                  isVendor: true
                }]
              }
            : q
        ))
        setReplyText(prev => ({ ...prev, [questionId]: '' }))
        setShowReplyBox(prev => ({ ...prev, [questionId]: false }))
        toast.success('Reply added!')
      } else {
        throw new Error(data.error || 'Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    } finally {
      setSubmittingReply(prev => ({ ...prev, [questionId]: false }))
    }
  }

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return 'recently'
    }
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        return 'recently'
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'recently'
    }
  }

  const pendingCount = questions.filter(q => !q.answer).length
  const answeredCount = questions.filter(q => q.answer).length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Product Questions</h1>
            <p className="text-muted-foreground">
              Answer customer questions about your products
            </p>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                All Questions ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="answered">
                <CheckCircle className="h-4 w-4 mr-2" />
                Answered ({answeredCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="p-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : questions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground">
                      {filter === 'pending' 
                        ? 'No pending questions at the moment'
                        : filter === 'answered'
                        ? 'No answered questions yet'
                        : 'Customers haven\'t asked any questions about your products yet'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                questions.map((question) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {question.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{question.userName}</span>
                              <Badge variant={question.answer ? "default" : "secondary"}>
                                {question.answer ? 'Answered' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Asked {formatDate(question.createdAt?.toString())}
                            </p>
                            {question.productName && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Product: <span className="font-medium">{question.productName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Question */}
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="font-medium mb-1">Question:</p>
                        <p>{question.question}</p>
                      </div>

                      {/* Answer */}
                      {question.answer ? (
                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                          <p className="font-medium mb-1 text-primary">Your Answer:</p>
                          <p>{question.answer}</p>
                          {question.answeredAt && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Answered {formatDate(question.answeredAt?.toString())}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Type your answer here..."
                            rows={4}
                            value={answerText[question.id] || ''}
                            onChange={(e) => setAnswerText(prev => ({ ...prev, [question.id]: e.target.value }))}
                          />
                          <Button
                            onClick={() => handleAnswerQuestion(question.id)}
                            disabled={answeringId === question.id || !answerText[question.id]?.trim()}
                          >
                            {answeringId === question.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Post Answer
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Replies Section */}
                      {question.replies && question.replies.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            {question.replies.length} {question.replies.length === 1 ? 'Reply' : 'Replies'}
                          </div>
                          {question.replies.map((reply) => (
                            <div key={reply.id} className="pl-4 border-l-2 border-muted bg-muted/30 p-3 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${reply.isVendor ? 'text-primary' : ''}`}>
                                  {reply.userName}
                                  {reply.isVendor && (
                                    <span className="ml-1 text-xs bg-primary text-primary-foreground px-1 rounded">
                                      Vendor
                                    </span>
                                  )}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-foreground">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowReplyBox(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                        >
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Reply
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Helpful: {question.helpful}
                        </span>
                      </div>

                      {/* Reply Input */}
                      {showReplyBox[question.id] && (
                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                          <Textarea
                            value={replyText[question.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [question.id]: e.target.value }))}
                            placeholder="Write your reply..."
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowReplyBox(prev => ({ ...prev, [question.id]: false }))}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleReply(question.id)}
                              disabled={submittingReply[question.id] || !replyText[question.id]?.trim()}
                            >
                              {submittingReply[question.id] ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-4 w-4" />
                              )}
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function VendorQuestionsPage() {
  return (
    <ProtectedRoute>
      <VendorQuestionsContent />
    </ProtectedRoute>
  )
}
