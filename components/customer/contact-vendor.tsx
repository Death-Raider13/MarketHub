"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Send, Loader2, User } from "lucide-react"
import { toast } from "sonner"

interface ContactVendorProps {
  vendorId: string
  vendorName: string
  productId?: string
  productName?: string
  orderId?: string
  trigger?: React.ReactNode
}

export function ContactVendor({
  vendorId,
  vendorName,
  productId,
  productName,
  orderId,
  trigger
}: ContactVendorProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: productName ? `Question about ${productName}` : '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please login to contact the vendor')
      return
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      // Create conversation
      const conversationResponse = await fetch('/api/customer/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          vendorName,
          customerId: user.uid,
          customerName: user.displayName || user.email?.split('@')[0] || 'Customer',
          customerEmail: user.email || 'no-email@example.com',
          subject: formData.subject.trim(),
          productId,
          productName,
          orderId
        })
      })

      const conversationData = await conversationResponse.json()

      if (!conversationData.success) {
        throw new Error(conversationData.error || 'Failed to create conversation')
      }

      // Send initial message
      const messageResponse = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationData.conversationId,
          senderId: user.uid,
          senderName: user.displayName || 'Customer',
          senderRole: 'customer',
          content: formData.message.trim()
        })
      })

      const messageData = await messageResponse.json()

      if (!messageData.success) {
        throw new Error(messageData.error || 'Failed to send message')
      }

      toast.success('Message sent successfully!')
      setFormData({ subject: productName ? `Question about ${productName}` : '', message: '' })
      setOpen(false)

    } catch (error) {
      console.error('Error contacting vendor:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="w-full">
      <MessageSquare className="mr-2 h-4 w-4" />
      Contact Vendor
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact {vendorName}
          </DialogTitle>
          <DialogDescription>
            Send a message to the vendor. They will be notified and can respond to your inquiry.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What is your question about?"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
            />
          </div>

          {productName && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Product:</strong> {productName}
              </p>
            </div>
          )}

          {orderId && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Order:</strong> #{orderId}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.subject.trim() || !formData.message.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
