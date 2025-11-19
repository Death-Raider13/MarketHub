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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Edit,
  Play,
  Square,
  Settings
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

function VendorServicesContent() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [schedulingService, setSchedulingService] = useState<string | null>(null)
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    location: "customer_location",
    address: "",
    vendorNotes: ""
  })

  useEffect(() => {
    if (user) {
      loadServiceBookings()
    }
  }, [user])

  const loadServiceBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vendor/services?vendorId=${user?.uid}`)
      
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

  const scheduleService = async (bookingId: string) => {
    if (schedulingService === bookingId) {
      return // Prevent multiple submissions
    }
    
    try {
      setSchedulingService(bookingId)
      const requestData = {
        ...scheduleForm,
        vendorId: user?.uid
      }
      
      const response = await fetch(`/api/vendor/services/${bookingId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        toast.success('Service scheduled successfully!')
        setScheduleForm({
          scheduledDate: "",
          scheduledTime: "",
          duration: 60,
          location: "customer_location",
          address: "",
          vendorNotes: ""
        })
        loadServiceBookings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to schedule service')
      }
    } catch (error) {
      console.error('Error scheduling service:', error)
      toast.error('Failed to schedule service')
    } finally {
      setSchedulingService(null)
    }
  }

  const updateServiceStatus = async (bookingId: string, status: string, notes?: string) => {
    try {
      setUpdatingStatus(bookingId)
      const response = await fetch(`/api/vendor/services/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          vendorId: user?.uid,
          notes
        })
      })

      if (response.ok) {
        toast.success(`Service status updated to ${status.replace('_', ' ')}`)
        loadServiceBookings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const sendMessage = async (bookingId: string, message: string) => {
    try {
      setSendingMessage(true)
      const requestData = {
        message,
        senderId: user?.uid,
        senderType: 'vendor'
      }
      
      const response = await fetch(`/api/services/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        toast.success('Message sent successfully')
        setNewMessage("")
        loadServiceBookings()
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_schedule: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Needs Scheduling' },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: 'Scheduled' },
      in_progress: { color: 'bg-orange-100 text-orange-800', icon: Play, text: 'In Progress' },
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
          <h1 className="text-3xl font-bold mb-2">Service Management</h1>
          <p className="text-gray-600">Manage your service bookings, schedule appointments, and communicate with customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Schedule</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending_schedule').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'scheduled').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'in_progress').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No service bookings found</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any service bookings yet. When customers book your services, they'll appear here.
                </p>
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

                  {/* Customer Requirements */}
                  {booking.requirements && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-medium mb-2">Customer Requirements:</h4>
                      <p className="text-sm">{booking.requirements}</p>
                    </div>
                  )}

                  {/* Customer Notes */}
                  {booking.customerNotes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Customer Notes:</h4>
                      <p className="text-sm">{booking.customerNotes}</p>
                    </div>
                  )}

                  {/* Scheduling Information */}
                  {booking.scheduledDate && booking.scheduledTime && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
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

                  {/* Your Notes */}
                  {booking.vendorNotes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded">
                      <h4 className="font-medium mb-2">Your Notes:</h4>
                      <p className="text-sm">{booking.vendorNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Schedule Service */}
                    {booking.status === 'pending_schedule' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Schedule Service: {booking.serviceName}</DialogTitle>
                            <DialogDescription>
                              Set the appointment details for this service booking.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="scheduledDate">Date</Label>
                                <Input
                                  id="scheduledDate"
                                  type="date"
                                  value={scheduleForm.scheduledDate}
                                  onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="scheduledTime">Time</Label>
                                <Input
                                  id="scheduledTime"
                                  type="time"
                                  value={scheduleForm.scheduledTime}
                                  onChange={(e) => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                  id="duration"
                                  type="number"
                                  value={scheduleForm.duration}
                                  onChange={(e) => setScheduleForm({...scheduleForm, duration: parseInt(e.target.value)})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="location">Location</Label>
                                <Select value={scheduleForm.location} onValueChange={(value) => setScheduleForm({...scheduleForm, location: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="customer_location">Customer Location</SelectItem>
                                    <SelectItem value="vendor_location">My Location</SelectItem>
                                    <SelectItem value="online">Online/Remote</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="address">Address (if applicable)</Label>
                              <Input
                                id="address"
                                value={scheduleForm.address}
                                onChange={(e) => setScheduleForm({...scheduleForm, address: e.target.value})}
                                placeholder="Enter address if needed"
                              />
                            </div>
                            <div>
                              <Label htmlFor="vendorNotes">Notes for Customer</Label>
                              <Textarea
                                id="vendorNotes"
                                value={scheduleForm.vendorNotes}
                                onChange={(e) => setScheduleForm({...scheduleForm, vendorNotes: e.target.value})}
                                placeholder="Any additional information for the customer..."
                              />
                            </div>
                            <Button 
                              onClick={() => scheduleService(booking.id)} 
                              className="w-full"
                              disabled={schedulingService === booking.id}
                            >
                              {schedulingService === booking.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Scheduling...
                                </>
                              ) : (
                                'Schedule Service'
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Start Service */}
                    {booking.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateServiceStatus(booking.id, 'in_progress')}
                        disabled={updatingStatus === booking.id}
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Start Service
                      </Button>
                    )}

                    {/* Complete Service */}
                    {booking.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateServiceStatus(booking.id, 'completed')}
                        disabled={updatingStatus === booking.id}
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Mark Complete
                      </Button>
                    )}

                    {/* Message Customer */}
                    {(booking.status === 'scheduled' || booking.status === 'in_progress') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message Customer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Communicate with Customer</DialogTitle>
                            <DialogDescription>
                              Send messages to discuss service details with your customer.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Messages */}
                            <div className="max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded">
                              {booking.messages && booking.messages.length > 0 ? (
                                booking.messages.map((msg, index) => (
                                  <div key={index} className={`flex ${msg.senderType === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-lg ${
                                      msg.senderType === 'vendor' 
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

                    {/* Cancel Service */}
                    {['pending_schedule', 'scheduled'].includes(booking.status) && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => updateServiceStatus(booking.id, 'cancelled')}
                        disabled={updatingStatus === booking.id}
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-2" />
                        )}
                        Cancel
                      </Button>
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

export default function VendorServicesPage() {
  return (
    <ProtectedRoute>
      <VendorServicesContent />
    </ProtectedRoute>
  )
}
