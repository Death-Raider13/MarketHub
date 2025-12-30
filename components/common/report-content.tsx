"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Flag, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface ReportContentProps {
  type: 'product' | 'vendor' | 'review' | 'message' | 'user'
  itemId: string
  itemTitle: string
  itemUrl?: string
  trigger?: React.ReactNode
  onReportSubmitted?: () => void
}

const reportCategories = {
  product: [
    { value: 'counterfeit', label: 'Counterfeit/Fake Product' },
    { value: 'misleading', label: 'Misleading Description' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'copyright', label: 'Copyright Violation' },
    { value: 'dangerous', label: 'Dangerous/Unsafe Product' },
    { value: 'other', label: 'Other' }
  ],
  vendor: [
    { value: 'fraud', label: 'Fraudulent Activity' },
    { value: 'not_delivering', label: 'Not Delivering Products' },
    { value: 'poor_service', label: 'Poor Customer Service' },
    { value: 'fake_business', label: 'Fake Business' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' }
  ],
  review: [
    { value: 'fake_reviews', label: 'Fake Reviews' },
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate', label: 'Inappropriate Language' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'misleading', label: 'Misleading Information' },
    { value: 'other', label: 'Other' }
  ],
  message: [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'scam', label: 'Scam/Fraud' },
    { value: 'other', label: 'Other' }
  ],
  user: [
    { value: 'harassment', label: 'Harassment' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'spam', label: 'Spam Behavior' },
    { value: 'inappropriate', label: 'Inappropriate Behavior' },
    { value: 'fraud', label: 'Fraudulent Activity' },
    { value: 'other', label: 'Other' }
  ]
}

export function ReportContent({
  type,
  itemId,
  itemTitle,
  itemUrl,
  trigger,
  onReportSubmitted
}: ReportContentProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    reason: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please log in to report content')
      return
    }

    if (!formData.category || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reportedItemId: itemId,
          reportedItemTitle: itemTitle,
          reportedItemUrl: itemUrl,
          reportedBy: {
            id: user.uid,
            name: user.displayName || user.email || 'Anonymous',
            email: user.email || ''
          },
          category: formData.category,
          reason: formData.reason,
          description: formData.description
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Report submitted successfully. We will review it shortly.')
        setOpen(false)
        setFormData({ category: '', reason: '', description: '' })
        onReportSubmitted?.()
      } else {
        toast.error(data.error || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  const categories = reportCategories[type] || reportCategories.product

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Report {type}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and trustworthy marketplace by reporting inappropriate content or behavior.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>What are you reporting?</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{itemTitle}</p>
              <p className="text-xs text-muted-foreground capitalize">{type}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              placeholder="Brief reason for reporting"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional context or details about this report..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> False reports may result in account restrictions. 
              All reports are reviewed by our moderation team.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.category || !formData.reason}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="mr-2 h-4 w-4" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}