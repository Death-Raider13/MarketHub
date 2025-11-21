"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Mail,
  Loader2,
  Send,
  Star
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"

interface ServiceBooking {
  id: string
  orderId: string
  serviceId: string
  customerId: string
  vendorId: string
  serviceName: string
  serviceDescription: string
  
  // Scheduling
  scheduledDate?: string
  scheduledTime?: string
  duration?: number
  location?: string
  address?: string
  
  // Requirements
  requirements?: string
  customerNotes?: string
  vendorNotes?: string
  
  // Status
  status: 'pending_schedule' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  
  // Communication
  messages?: any[]
  
  // Completion
  completedAt?: string
  rating?: number
  review?: string
  
  createdAt: string
  updatedAt: string
}

function MyServicesContent() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [ratingBooking, setRatingBooking] = useState<ServiceBooking | null>(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (user) {
      loadServiceBookings()
    }
  }, [user])

  const loadServiceBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/services?customerId=${user?.uid}`)
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      } else {
        toast.error('Failed to load service bookings')
      }
    } catch (error) {
      console.error('Error loading service bookings:', error)
      toast.error('Failed to load service bookings')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (bookingId: string, message: string) => {
    try {
      setSendingMessage(true)
      const response = await fetch(`/api/services/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          senderId: user?.uid,
          senderType: 'customer'
        })
      })

      if (response.ok) {
        toast.success('Message sent successfully')
        setNewMessage("")
        loadServiceBookings() // Reload to get updated messages
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

  const submitRating = async (bookingId: string) => {
    try {
      setSubmittingRating(true)
      const response = await fetch(`/api/services/${bookingId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          review,
          customerId: user?.uid
        })
      })

      if (response.ok) {
        toast.success('Rating submitted successfully!')
        setRatingBooking(null)
        setRating(0)
        setReview("")
        loadServiceBookings() // Reload to update the booking
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_schedule: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Schedule' },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: 'Scheduled' },
      in_progress: { color: 'bg-orange-100 text-orange-800', icon: Clock, text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_schedule
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your service bookings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Service Bookings</h1>
          <p className="text-gray-600">Manage your scheduled services and communicate with providers</p>
        </div>

        <div className="space-y-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No service bookings found</h3>
                <p className="text-gray-600 mb-4">
                  You haven't booked any services yet.
                </p>
                <Button onClick={() => window.location.href = '/products?type=service'}>
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{booking.serviceName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{booking.serviceDescription}</p>
                      <p className="text-sm text-gray-600">
                        Booked {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  {/* Scheduling Information */}
                  {booking.scheduledDate && booking.scheduledTime && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled Appointment
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Date: </span>
                          {format(new Date(booking.scheduledDate), 'PPP')}
                        </div>
                        <div>
                          <span className="font-medium">Time: </span>
                          {booking.scheduledTime}
                        </div>
                        {booking.duration && (
                          <div>
                            <span className="font-medium">Duration: </span>
                            {booking.duration} minutes
                          </div>
                        )}
                        {booking.location && (
                          <div>
                            <span className="font-medium">Location: </span>
                            {booking.location.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                      {booking.address && (
                        <div className="mt-2">
                          <span className="font-medium">Address: </span>
                          <span className="text-sm">{booking.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requirements */}
                  {booking.requirements && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Service Requirements:</h4>
                      <p className="text-sm">{booking.requirements}</p>
                    </div>
                  )}

                  {/* Vendor Notes */}
                  {booking.vendorNotes && (
                    <div className="mb-4 p-3 bg-green-50 rounded">
                      <h4 className="font-medium mb-2">Provider Notes:</h4>
                      <p className="text-sm">{booking.vendorNotes}</p>
                    </div>
                  )}

                  {/* Customer Notes */}
                  {booking.customerNotes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-medium mb-2">Your Notes:</h4>
                      <p className="text-sm">{booking.customerNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {booking.status === 'pending_schedule' && (
                      <Button size="sm" variant="outline">
                        <Clock className="w-4 h-4 mr-2" />
                        Waiting for Schedule
                      </Button>
                    )}

                    {(booking.status === 'scheduled' || booking.status === 'in_progress') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedBooking(booking)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message Provider
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Communicate with Service Provider</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Messages */}
                            <div className="max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded">
                              {booking.messages && booking.messages.length > 0 ? (
                                booking.messages.map((msg, index) => (
                                  <div key={index} className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-lg ${
                                      msg.senderType === 'customer' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-white border'
                                    }`}>
                                      <p className="text-sm">{msg.message}</p>
                                      <p className="text-xs opacity-70 mt-1">
                                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-500">No messages yet</p>
                              )}
                            </div>

                            {/* Send Message */}
                            <div className="flex gap-2">
                              <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1"
                              />
                              <Button
                                onClick={() => sendMessage(booking.id, newMessage)}
                                disabled={!newMessage.trim() || sendingMessage}
                              >
                                {sendingMessage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {booking.status === 'completed' && booking.rating && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (booking.rating ?? 0)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">You rated this service</span>
                        {booking.review && (
                          <span className="text-sm text-gray-600">- "{booking.review}"</span>
                        )}
                      </div>
                    )}

                    {booking.status === 'completed' && !booking.rating && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setRatingBooking(booking)}>
                            <Star className="w-4 h-4 mr-2" />
                            Rate Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Rate Service</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">{booking.serviceName}</h4>
                              <p className="text-sm text-gray-600">{booking.serviceDescription}</p>
                            </div>
                            
                            {/* Star Rating */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Rating</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${
                                        star <= rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Review Text */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                              <Textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Share your experience with this service..."
                                rows={4}
                              />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => submitRating(booking.id)}
                                disabled={rating === 0 || submittingRating}
                                className="flex-1"
                              >
                                {submittingRating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Rating'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRatingBooking(null)
                                  setRating(0)
                                  setReview("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function MyServicesPage() {
  return (
    <ProtectedRoute>
      <MyServicesContent />
    </ProtectedRoute>
  )
}
