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

interface Question {
  id: string
  productId: string
  vendorId: string
  userId: string
  userName: string
  question: string
  answer: string | null
  answeredBy: string | null
  answeredAt: string | null
  helpful: number
  createdAt: string
  updatedAt: string
}

interface ProductQAProps {
  productId: string
  vendorId: string
}

export function ProductQA({ productId, vendorId }: ProductQAProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [questionText, setQuestionText] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [productId])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/questions`)
      const data = await response.json()

      if (data.success) {
        setQuestions(data.questions || [])
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

      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Customer',
          userEmail: user.email || '',
          question: questionText.trim(),
          vendorId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Question submitted! It will be visible once approved.')
        setQuestionText('')
        setShowQuestionDialog(false)
        loadQuestions()
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
                        asked {formatDistanceToNow(new Date(qa.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-foreground mb-3">{qa.question}</p>

                    {/* Answer */}
                    {qa.answer && (
                      <div className="mt-4 pl-4 border-l-2 border-primary">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">Vendor</span>
                          {qa.answeredAt && (
                            <span className="text-sm text-muted-foreground">
                              answered {formatDistanceToNow(new Date(qa.answeredAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground">{qa.answer}</p>
                      </div>
                    )}

                    {/* Helpful Button */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({qa.helpful})
                      </Button>
                    </div>
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
