"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageCircle, Send, Loader2, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

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
  vendorId: string
  userId: string
  userName: string
  userEmail: string
  question: string
  answer: string | null
  answeredBy: string | null
  answeredAt: string | null
  helpful: number
  createdAt: string
  updatedAt: string
  replies?: Reply[]
}

interface ProductQAProps {
  productId: string
  vendorId: string
  productName?: string
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
    console.warn('Date formatting error:', error, 'for date:', dateString)
    return 'recently'
  }
}

export function ProductQA({ productId, vendorId, productName }: ProductQAProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [replyText, setReplyText] = useState<{[key: string]: string}>({})
  const [showReplyBox, setShowReplyBox] = useState<{[key: string]: boolean}>({})
  const [submittingReply, setSubmittingReply] = useState<{[key: string]: boolean}>({})
  const [helpfulLoading, setHelpfulLoading] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    loadQuestions()
  }, [productId])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      console.log('Loading questions for productId:', productId)
      const response = await fetch(`/api/products/${productId}/questions`)
      console.log('Questions response status:', response.status)
      
      const data = await response.json()
      console.log('Questions response data:', data)

      if (data.success) {
        const questions = data.questions || []
        console.log('Loaded', questions.length, 'questions')
        console.log('Sample question data:', questions[0])
        setQuestions(questions)
      } else {
        console.error('Failed to load questions:', data.error)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to ask a question')
      return
    }

    if (!questionText.trim()) {
      toast.error('Please enter your question')
      return
    }

    try {
      setSubmitting(true)

      console.log('Submitting question:', {
        productId,
        vendorId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Customer',
        userEmail: user.email || '',
        question: questionText.trim()
      })

      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Customer',
          userEmail: user.email || '',
          question: questionText.trim(),
          vendorId,
          productName: productName || 'Unknown Product'
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        toast.success('Question submitted successfully!')
        setQuestionText('')
        setShowQuestionDialog(false)
        // Reload questions to show the new one
        setTimeout(() => loadQuestions(), 1000)
      } else {
        throw new Error(data.error || 'Failed to submit question')
      }
    } catch (error) {
      console.error('Error submitting question:', error)
      toast.error('Failed to submit question. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async (questionId: string) => {
    if (!user) {
      toast.error('Please login to mark as helpful')
      return
    }

    try {
      setHelpfulLoading(prev => ({ ...prev, [questionId]: true }))

      const response = await fetch(`/api/products/${productId}/questions/${questionId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update the question's helpful count locally
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, helpful: data.helpfulCount }
            : q
        ))
        toast.success('Marked as helpful!')
      } else {
        throw new Error(data.error || 'Failed to mark as helpful')
      }
    } catch (error) {
      console.error('Error marking as helpful:', error)
      toast.error('Failed to mark as helpful')
    } finally {
      setHelpfulLoading(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const handleReply = async (questionId: string) => {
    if (!user) {
      toast.error('Please login to reply')
      return
    }

    const reply = replyText[questionId]?.trim()
    if (!reply) {
      toast.error('Please enter a reply')
      return
    }

    try {
      setSubmittingReply(prev => ({ ...prev, [questionId]: true }))

      const response = await fetch(`/api/products/${productId}/questions/${questionId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          message: reply,
          isVendor: user.uid === vendorId
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
                  userName: user.displayName || user.email?.split('@')[0] || 'User',
                  message: reply,
                  createdAt: new Date().toISOString(),
                  isVendor: user.uid === vendorId
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ask Question Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Questions & Answers</h3>
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogTrigger asChild>
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              Ask a Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                Ask anything about this product. The vendor will answer your question.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <Textarea
                placeholder="What would you like to know about this product?"
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuestionDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !questionText.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Question
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No questions yet</h3>
            <p className="mt-2 text-muted-foreground">Be the first to ask a question about this product</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((qa) => (
            <Card key={qa.id}>
              <CardContent className="p-6">
                {/* Question */}
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {qa.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{qa.userName}</span>
                      <span className="text-sm text-muted-foreground">
                        asked {formatDate(qa.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground mb-3">{qa.question}</p>

                    {/* Answer */}
                    {qa.answer && (
                      <div className="mt-4 pl-4 border-l-2 border-primary">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">Vendor</span>
                          {qa.answeredAt && qa.answeredAt !== null && (
                            <span className="text-sm text-muted-foreground">
                              answered {formatDate(qa.answeredAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground">{qa.answer}</p>
                      </div>
                    )}

                    {/* Helpful Button and Reply */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleHelpful(qa.id)}
                        disabled={helpfulLoading[qa.id]}
                      >
                        {helpfulLoading[qa.id] ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="mr-1 h-4 w-4" />
                        )}
                        Helpful ({qa.helpful})
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowReplyBox(prev => ({ ...prev, [qa.id]: !prev[qa.id] }))}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Reply
                      </Button>
                    </div>

                    {/* Reply Box */}
                    {showReplyBox[qa.id] && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <textarea
                          value={replyText[qa.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [qa.id]: e.target.value }))}
                          placeholder="Write your reply..."
                          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowReplyBox(prev => ({ ...prev, [qa.id]: false }))}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleReply(qa.id)}
                            disabled={submittingReply[qa.id]}
                          >
                            {submittingReply[qa.id] ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-4 w-4" />
                            )}
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {qa.replies && qa.replies.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          {qa.replies.length} {qa.replies.length === 1 ? 'Reply' : 'Replies'}
                        </div>
                        {qa.replies.map((reply) => (
                          <div key={reply.id} className="pl-4 border-l-2 border-muted">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
