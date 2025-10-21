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
}

function VendorQuestionsContent() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')

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
      let q = query(
        collection(db, 'questions'),
        where('vendorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      const questionsSnapshot = await getDocs(q)
      const questionsData = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        answeredAt: doc.data().answeredAt?.toDate()
      })) as Question[]

      // Apply filter
      let filteredQuestions = questionsData
      if (filter === 'pending') {
        filteredQuestions = questionsData.filter(q => !q.answer)
      } else if (filter === 'answered') {
        filteredQuestions = questionsData.filter(q => q.answer)
      }

      setQuestions(filteredQuestions)
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

      await updateDoc(doc(db, 'questions', questionId), {
        answer: answer,
        answeredBy: user?.uid,
        answeredAt: new Date(),
        status: 'approved',
        updatedAt: new Date()
      })

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
                              Asked {formatDistanceToNow(question.createdAt, { addSuffix: true })}
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
                              Answered {formatDistanceToNow(question.answeredAt, { addSuffix: true })}
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
    <ProtectedRoute requireVendor>
      <VendorQuestionsContent />
    </ProtectedRoute>
  )
}
