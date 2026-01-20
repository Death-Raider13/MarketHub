'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const testEmail = async (type: 'order-confirmation' | 'service-booking') => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        if (result.downloadLinksGenerated) {
          toast.info(`Generated ${result.downloadLinksGenerated} download links`)
        }
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (error) {
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Email System Test</CardTitle>
          <CardDescription>
            Test the order confirmation and service booking email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Test Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📧 Order Confirmation Email</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tests the complete order confirmation email with digital download links and service booking confirmation
              </p>
              <Button 
                onClick={() => testEmail('order-confirmation')}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Order Confirmation Test'}
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🗓 Service Booking Email</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tests the service booking confirmation email sent to customers
              </p>
              <Button 
                onClick={() => testEmail('service-booking')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Service Booking Test'}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">✅ What's Fixed</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Digital product download links are now generated and included in emails</li>
              <li>• Service booking confirmation emails are sent to customers</li>
              <li>• Order confirmation emails include all product types (digital, physical, service)</li>
              <li>• Professional email templates with proper styling</li>
              <li>• Error handling to prevent payment failures if emails fail</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}