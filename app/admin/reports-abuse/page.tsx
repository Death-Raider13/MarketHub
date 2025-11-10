"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  AlertTriangle,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  User,
  Package,
  Search,
  Filter,
  MoreVertical,
  Ban,
  Trash2,
  RefreshCw,
  Send
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface AbuseReport {
  id: string
  type: 'product' | 'vendor' | 'review' | 'message'
  reportedBy: {
    id: string
    name: string
    email: string
  }
  reportedItem: {
    id: string
    title: string
    description?: string
    url?: string
  }
  category: string
  reason: string
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  updatedAt: Date
  assignedTo?: string
  resolution?: string
  evidence?: string[]
}

const mockReports: AbuseReport[] = [
  {
    id: "report1",
    type: "product",
    reportedBy: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com"
    },
    reportedItem: {
      id: "prod1",
      title: "Fake iPhone 15 Pro",
      description: "Counterfeit product being sold as genuine",
      url: "/products/prod1"
    },
    category: "Counterfeit",
    reason: "Selling fake products",
    description: "This vendor is selling counterfeit iPhones and claiming they are genuine Apple products. The images show clear signs of being fake.",
    status: "pending",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    evidence: ["screenshot1.jpg", "comparison.jpg"]
  },
  {
    id: "report2",
    type: "vendor",
    reportedBy: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com"
    },
    reportedItem: {
      id: "vendor1",
      title: "TechStore Pro",
      description: "Vendor not delivering products",
      url: "/vendors/vendor1"
    },
    category: "Fraud",
    reason: "Not delivering products after payment",
    description: "I paid for a laptop 3 weeks ago but haven't received it. The vendor is not responding to messages.",
    status: "investigating",
    priority: "medium",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    assignedTo: "admin1"
  },
  {
    id: "report3",
    type: "review",
    reportedBy: {
      id: "user3",
      name: "Mike Johnson",
      email: "mike@example.com"
    },
    reportedItem: {
      id: "review1",
      title: "Fake positive review",
      description: "Suspicious review pattern",
      url: "/products/prod2/reviews"
    },
    category: "Fake Reviews",
    reason: "Fake positive reviews",
    description: "This product has multiple 5-star reviews posted within minutes of each other, all with similar writing patterns.",
    status: "resolved",
    priority: "low",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedTo: "admin2",
    resolution: "Removed fake reviews and warned vendor"
  }
]

function AdminReportsAbuseContent() {
  const [reports, setReports] = useState<AbuseReport[]>(mockReports)
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [resolution, setResolution] = useState("")

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // In a real app, you would load from Firestore
      // const reportsQuery = query(
      //   collection(db, "abuse_reports"),
      //   orderBy("createdAt", "desc"),
      //   limit(100)
      // )
      // const snapshot = await getDocs(reportsQuery)
      // const reportsData = snapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data(),
      //   createdAt: doc.data().createdAt?.toDate() || new Date(),
      //   updatedAt: doc.data().updatedAt?.toDate() || new Date()
      // })) as AbuseReport[]
      
      // For now, using mock data
      setReports(mockReports)
      
    } catch (error) {
      console.error("Error loading reports:", error)
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, status: AbuseReport['status'], resolution?: string) => {
    try {
      // In a real app, update Firestore
      // await updateDoc(doc(db, "abuse_reports", reportId), {
      //   status,
      //   resolution,
      //   updatedAt: new Date()
      // })

      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, resolution, updatedAt: new Date() }
          : report
      ))

      toast.success(`Report ${status}`)
      setSelectedReport(null)
      setResolution("")
      
    } catch (error) {
      console.error("Error updating report:", error)
      toast.error("Failed to update report")
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter
    const matchesType = typeFilter === "all" || report.type === typeFilter
    const matchesSearch = searchTerm === "" || 
      report.reportedItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedBy.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesPriority && matchesType && matchesSearch
  })

  const getStatusColor = (status: AbuseReport['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: AbuseReport['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: AbuseReport['type']) => {
    switch (type) {
      case 'product': return <Package className="h-4 w-4" />
      case 'vendor': return <User className="h-4 w-4" />
      case 'review': return <MessageSquare className="h-4 w-4" />
      case 'message': return <MessageSquare className="h-4 w-4" />
      default: return <Flag className="h-4 w-4" />
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Abuse Reports
              </h1>
              <p className="text-muted-foreground">
                Manage and investigate reported content and behavior
              </p>
            </div>
            
            <Button onClick={loadReports} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Reports ({filteredReports.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reports found matching your criteria
                </div>
              ) : (
                <div className="divide-y">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getTypeIcon(report.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{report.reportedItem.title}</h3>
                              <Badge variant="outline" className="capitalize">
                                {report.type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {report.reason}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Reported by {report.reportedBy.name}</span>
                              <span>{formatDistanceToNow(report.createdAt, { addSuffix: true })}</span>
                              {report.assignedTo && <span>Assigned to {report.assignedTo}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Report Details</DialogTitle>
                              </DialogHeader>
                              
                              {selectedReport && (
                                <div className="space-y-4">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="text-sm font-medium">Reported Item</label>
                                      <p className="text-sm text-muted-foreground">{selectedReport.reportedItem.title}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Category</label>
                                      <p className="text-sm text-muted-foreground">{selectedReport.category}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Reported By</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedReport.reportedBy.name} ({selectedReport.reportedBy.email})
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Priority</label>
                                      <Badge className={getPriorityColor(selectedReport.priority)}>
                                        {selectedReport.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p>
                                  </div>
                                  
                                  {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium">Evidence</label>
                                      <div className="flex gap-2 mt-1">
                                        {selectedReport.evidence.map((file, index) => (
                                          <Badge key={index} variant="outline">{file}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                                    <div className="space-y-3 pt-4 border-t">
                                      <Textarea
                                        placeholder="Resolution notes..."
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                      />
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => updateReportStatus(selectedReport.id, 'resolved', resolution)}
                                          className="flex-1"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Resolve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => updateReportStatus(selectedReport.id, 'dismissed', resolution)}
                                          className="flex-1"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Dismiss
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedReport.resolution && (
                                    <div className="pt-4 border-t">
                                      <label className="text-sm font-medium">Resolution</label>
                                      <p className="text-sm text-muted-foreground mt-1">{selectedReport.resolution}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'investigating')}>
                                <Clock className="h-4 w-4 mr-2" />
                                Start Investigation
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'resolved')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReportStatus(report.id, 'dismissed')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Dismiss
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default function AdminReportsAbusePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AdminReportsAbuseContent />
    </ProtectedRoute>
  )
}
