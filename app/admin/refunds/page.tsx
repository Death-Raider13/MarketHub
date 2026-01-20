"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  CreditCard,
  FileText,
  Calendar,
  User,
  Package
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/lib/firebase/auth-context"

interface RefundRequest {
  id: string
  userId: string
  orderId: string
  vendorId?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'failed' | 'pending_manual_processing'
  amount: number
  paymentMethod?: string
  paymentReference?: string
  coinbaseChargeId?: string
  paystackRefundId?: string
  coinbaseRefundId?: string
  manualRefund?: boolean
  manualProcessingRequired?: boolean
  processingNotes?: string
  failureReason?: string
  resolutionNotes?: string
  processedBy?: string
  createdAt: Date
  updatedAt: Date
  refundedAt?: Date
  order?: {
    id: string
    orderNumber?: string
    customerName?: string
    customerEmail?: string
    totalAmount?: number
    paymentMethod?: string
    createdAt?: Date
  }
}

interface RefundStats {
  total: number
  pending: number
  approved: number
  refunded: number
  rejected: number
  failed: number
  totalAmount: number
  refundedAmount: number
}

function RefundsManagementContent() {
  const { user } = useAuth()
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null)
  const [showRefundDetails, setShowRefundDetails] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | 'process_refund' | 'mark_refunded' | 'mark_coinbase_completed'>('approve')
  const [rejectionReason, setRejectionReason] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState<RefundStats>({
    total: 0,
    pending: 0,
    approved: 0,
    refunded: 0,
    rejected: 0,
    failed: 0,
    totalAmount: 0,
    refundedAmount: 0
  })

  useEffect(() => {
    loadRefunds()
  }, [statusFilter])

  const loadRefunds = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/refunds?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setRefunds(data.refunds || [])
        calculateStats(data.refunds || [])
      } else {
        toast.error('Failed to load refunds')
        setRefunds([])
      }
    } catch (error) {
      console.error("Error loading refunds:", error)
      toast.error("Failed to load refunds")
      setRefunds([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (refundsList: RefundRequest[]) => {
    const stats = refundsList.reduce((acc, refund) => {
      acc.total++
      acc[refund.status as keyof RefundStats]++
      acc.totalAmount += refund.amount || 0
      if (refund.status === 'refunded') {
        acc.refundedAmount += refund.amount || 0
      }
      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      refunded: 0,
      rejected: 0,
      failed: 0,
      totalAmount: 0,
      refundedAmount: 0
    })

    setStats(stats)
  }

  const processRefund = async () => {
    if (!selectedRefund || !user) return

    try {
      setProcessing(true)

      const requestBody: any = {
        action: processAction,
        adminUserId: user.uid,
      }

      if (processAction === 'reject' && !rejectionReason.trim()) {
        toast.error('Rejection reason is required')
        return
      }

      if (processAction === 'reject') {
        requestBody.rejectionReason = rejectionReason.trim()
      }

      if (resolutionNotes.trim()) {
        requestBody.resolutionNotes = resolutionNotes.trim()
      }

      if (processAction === 'mark_refunded' || processAction === 'mark_coinbase_completed') {
        if (transactionId.trim()) {
          requestBody.transactionId = transactionId.trim()
        }
      }

      const response = await fetch(`/api/refunds/${selectedRefund.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Refund ${processAction.replace('_', ' ')} successfully`)
        setShowProcessDialog(false)
        setSelectedRefund(null)
        setRejectionReason("")
        setResolutionNotes("")
        setTransactionId("")
        loadRefunds()
      } else {
        toast.error(data.error || `Failed to ${processAction.replace('_', ' ')} refund`)
      }
    } catch (error) {
      console.error(`Error processing refund:`, error)
      toast.error(`Failed to ${processAction.replace('_', ' ')} refund`)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'refunded': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending_manual_processing': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'refunded': return <DollarSign className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      case 'pending_manual_processing': return <CreditCard className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.order?.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const openProcessDialog = (refund: RefundRequest, action: typeof processAction) => {
    setSelectedRefund(refund)
    setProcessAction(action)
    setRejectionReason("")
    setResolutionNotes("")
    setTransactionId("")
    setShowProcessDialog(true)
  }

  const getActionTitle = () => {
    switch (processAction) {
      case 'approve': return 'Approve Refund'
      case 'reject': return 'Reject Refund'
      case 'process_refund': return 'Process Refund'
      case 'mark_refunded': return 'Mark as Refunded'
      case 'mark_coinbase_completed': return 'Mark Coinbase Refund Complete'
      default: return 'Process Refund'
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Refunds Management
            </h1>
            <p className="text-muted-foreground">
              Process and manage customer refund requests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.refunded}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Refunded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    ₦{stats.refundedAmount.toLocaleString()}
                  </div>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Refunds</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by refund ID, order, customer, or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending_manual_processing">Manual Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={loadRefunds} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Refunds Table */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refund ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No refund requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRefunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell className="font-medium">
                            {refund.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {refund.order?.orderNumber || refund.orderId.slice(-8)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {refund.order?.createdAt ? 
                                  format(new Date(refund.order.createdAt), 'MMM dd, yyyy') : 
                                  'N/A'
                                }
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {refund.order?.customerName || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {refund.order?.customerEmail || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>₦{refund.amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {refund.paymentMethod || refund.order?.paymentMethod || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(refund.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(refund.status)}
                                {refund.status.replace('_', ' ')}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(refund.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRefund(refund)
                                  setShowRefundDetails(true)
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {refund.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => openProcessDialog(refund, 'approve')}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openProcessDialog(refund, 'reject')}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              
                              {refund.status === 'approved' && (
                                <Button
                                  size="sm"
                                  onClick={() => openProcessDialog(refund, 'process_refund')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <DollarSign className="h-3 w-3" />
                                </Button>
                              )}

                              {refund.status === 'pending_manual_processing' && refund.paymentMethod === 'coinbase' && (
                                <Button
                                  size="sm"
                                  onClick={() => openProcessDialog(refund, 'mark_coinbase_completed')}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  <CreditCard className="h-3 w-3" />
                                </Button>
                              )}

                              {['pending', 'approved'].includes(refund.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openProcessDialog(refund, 'mark_refunded')}
                                >
                                  Manual
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Refund Details Dialog */}
          <Dialog open={showRefundDetails} onOpenChange={setShowRefundDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Refund Request Details</DialogTitle>
                <DialogDescription>
                  Refund ID: {selectedRefund?.id}
                </DialogDescription>
              </DialogHeader>
              
              {selectedRefund && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedRefund.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedRefund.status)}
                          {selectedRefund.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <p className="font-medium">₦{selectedRefund.amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Order ID</Label>
                      <p className="font-medium">{selectedRefund.orderId}</p>
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <p className="font-medium">{selectedRefund.paymentMethod || 'Unknown'}</p>
                    </div>
                  </div>

                  {selectedRefund.order && (
                    <div>
                      <Label>Customer Information</Label>
                      <div className="mt-2 p-3 bg-muted rounded">
                        <p><strong>Name:</strong> {selectedRefund.order.customerName}</p>
                        <p><strong>Email:</strong> {selectedRefund.order.customerEmail}</p>
                        <p><strong>Order Total:</strong> ₦{selectedRefund.order.totalAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Refund Reason</Label>
                    <p className="mt-1 p-3 bg-muted rounded">{selectedRefund.reason}</p>
                  </div>

                  {selectedRefund.resolutionNotes && (
                    <div>
                      <Label>Resolution Notes</Label>
                      <p className="mt-1 p-3 bg-muted rounded">{selectedRefund.resolutionNotes}</p>
                    </div>
                  )}

                  {selectedRefund.failureReason && (
                    <div>
                      <Label>Failure Reason</Label>
                      <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                        {selectedRefund.failureReason}
                      </p>
                    </div>
                  )}

                  {selectedRefund.processingNotes && (
                    <div>
                      <Label>Processing Notes</Label>
                      <p className="mt-1 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800">
                        {selectedRefund.processingNotes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <Label>Created</Label>
                      <p>{format(new Date(selectedRefund.createdAt), 'PPpp')}</p>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <p>{format(new Date(selectedRefund.updatedAt), 'PPpp')}</p>
                    </div>
                  </div>

                  {selectedRefund.refundedAt && (
                    <div>
                      <Label>Refunded At</Label>
                      <p className="text-green-600 font-medium">
                        {format(new Date(selectedRefund.refundedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRefundDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Process Refund Dialog */}
          <AlertDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
                <AlertDialogDescription>
                  {processAction === 'reject' && 'Please provide a reason for rejecting this refund request.'}
                  {processAction === 'approve' && 'This will approve the refund request for processing.'}
                  {processAction === 'process_refund' && 'This will process the refund through the payment provider.'}
                  {processAction === 'mark_refunded' && 'Mark this refund as completed manually.'}
                  {processAction === 'mark_coinbase_completed' && 'Mark this Coinbase refund as completed after manual processing.'}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                {processAction === 'reject' && (
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Explain why this refund is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {(processAction === 'mark_refunded' || processAction === 'mark_coinbase_completed') && (
                  <div>
                    <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                    <Input
                      id="transaction-id"
                      placeholder="External transaction/reference ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="resolution-notes">Resolution Notes (Optional)</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Add any additional notes about this refund..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={processRefund}
                  disabled={processing || (processAction === 'reject' && !rejectionReason.trim())}
                  className={
                    processAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    processAction === 'approve' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                  }
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    getActionTitle()
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  )
}

export default function RefundsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'support']}>
      <RefundsManagementContent />
    </ProtectedRoute>
  )
}