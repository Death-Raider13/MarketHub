"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, CheckCircle, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function SupportFeedbackPage() {
  const searchParams = useSearchParams()
  const ticketNumber = searchParams.get('ticket')
  const initialRating = parseInt(searchParams.get('rating') || '0')
  
  const [rating, setRating] = useState(initialRating)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (initialRating > 0) {
      setRating(initialRating)
    }
  }, [initialRating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketNumber) {
      toast.error('Invalid ticket number')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setSubmitting(true)

      // Find the ticket by ticket number and update satisfaction rating
      const response = await fetch('/api/support/tickets', {
        method: 'GET',
      })

      const data = await response.json()
      
      if (data.success) {
        const ticket = data.tickets.find((t: any) => t.ticketNumber === ticketNumber)
        
        if (ticket) {
          // Update the ticket with satisfaction rating
          const updateResponse = await fetch(`/api/support/tickets/${ticket.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'rate_satisfaction',
              customerSatisfaction: rating,
            }),
          })

          const updateData = await updateResponse.json()

          if (updateData.success) {
            // If feedback provided, add it as a response
            if (feedback.trim()) {
              await fetch(`/api/support/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'add_response',
                  response: `Customer Feedback: ${feedback.trim()}`,
                  responderId: 'customer',
                  responderName: ticket.name,
                  responderRole: 'customer',
                }),
              })
            }

            setSubmitted(true)
            toast.success('Thank you for your feedback!')
          } else {
            toast.error('Failed to submit feedback')
          }
        } else {
          toast.error('Ticket not found')
        }
      } else {
        toast.error('Failed to find ticket')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 5: return 'Excellent'
      case 4: return 'Good'
      case 3: return 'Average'
      case 2: return 'Poor'
      case 1: return 'Very Poor'
      default: return 'Select Rating'
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">Thank You!</h2>
                <p className="text-muted-foreground">
                  Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our support service.
                </p>
                <Button asChild className="w-full">
                  <a href="/">Return to Homepage</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Rate Your Support Experience</CardTitle>
            {ticketNumber && (
              <p className="text-center text-sm text-muted-foreground">
                Ticket: {ticketNumber}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-2">
                <Label>How would you rate our support?</Label>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 transition-colors ${
                        star <= rating 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star 
                        className="h-8 w-8" 
                        fill={star <= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm font-medium">
                  {getRatingText(rating)}
                </p>
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <Label htmlFor="feedback">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us more about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={rating === 0 || submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  )
}