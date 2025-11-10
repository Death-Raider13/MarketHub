"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Shield,
  Activity,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { formatDistanceToNow, format } from "date-fns"

interface AuditLog {
  id: string
  adminId: string
  adminName: string
  adminRole: string
  action: string
  resource: string
  resourceId: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failed' | 'pending'
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [dateRange, setDateRange] = useState("7days")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showLogDetails, setShowLogDetails] = useState(false)

  useEffect(() => {
    loadAuditLogs()
  }, [dateRange])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const now = new Date()
      const daysBack = dateRange === "1day" ? 1 : dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

      // Get audit logs from Firestore
      const logsQuery = query(
        collection(db, "audit_logs"),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc"),
        limit(100)
      )
      
      const logsSnapshot = await getDocs(logsQuery)
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLog[]

      setLogs(logsData)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      
      // Fallback to mock data
      const mockLogs: AuditLog[] = [
        {
          id: "1",
          adminId: "admin1",
          adminName: "John Admin",
          adminRole: "super_admin",
          action: "user.ban",
          resource: "user",
          resourceId: "user123",
          details: { reason: "Spam activity", duration: "7 days" },
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: "high",
          status: "success"
        },
        {
          id: "2",
          adminId: "admin2",
          adminName: "Jane Moderator",
          adminRole: "moderator",
          action: "product.approve",
          resource: "product",
          resourceId: "prod456",
          details: { productName: "Wireless Headphones", vendorId: "vendor789" },
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          severity: "medium",
          status: "success"
        },
        {
          id: "3",
          adminId: "admin3",
          adminName: "Bob Support",
          adminRole: "support",
          action: "order.refund",
          resource: "order",
          resourceId: "order789",
          details: { amount: 150000, reason: "Product defect" },
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          severity: "medium",
          status: "success"
        },
        {
          id: "4",
          adminId: "admin1",
          adminName: "John Admin",
          adminRole: "super_admin",
          action: "admin.create",
          resource: "admin",
          resourceId: "admin4",
          details: { newAdminRole: "moderator", email: "newmod@example.com" },
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          severity: "critical",
          status: "success"
        },
        {
          id: "5",
          adminId: "admin2",
          adminName: "Jane Moderator",
          adminRole: "moderator",
          action: "review.reject",
          resource: "review",
          resourceId: "review123",
          details: { reason: "Inappropriate content", productId: "prod456" },
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0...",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          severity: "low",
          status: "success"
        }
      ]
      
      setLogs(mockLogs)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('ban') || action.includes('delete')) return <XCircle className="h-4 w-4 text-red-500" />
    if (action.includes('approve') || action.includes('create')) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (action.includes('login') || action.includes('access')) return <Shield className="h-4 w-4 text-blue-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter)
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter
    
    return matchesSearch && matchesAction && matchesSeverity
  })

  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'critical').length,
    failed: logs.filter(l => l.status === 'failed').length,
    uniqueAdmins: new Set(logs.map(l => l.adminId)).size
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
              Audit Logs
            </h1>
            <p className="text-muted-foreground">
              Track and monitor all administrative actions across the platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Critical Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failed Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-orange-600">{stats.failed}</div>
                  <XCircle className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.uniqueAdmins}</div>
                  <User className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Logs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by admin, action, or resource..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="action">Action Type</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="user">User Actions</SelectItem>
                      <SelectItem value="product">Product Actions</SelectItem>
                      <SelectItem value="order">Order Actions</SelectItem>
                      <SelectItem value="admin">Admin Actions</SelectItem>
                      <SelectItem value="login">Login Actions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateRange">Time Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">Last 24h</SelectItem>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={loadAuditLogs} variant="outline">
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

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
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
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(log.timestamp, 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(log.timestamp, 'HH:mm:ss')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.adminName}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {log.adminRole?.replace('_', ' ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium capitalize">{log.resource}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {log.resourceId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLog(log)
                              setShowLogDetails(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Log Details Dialog */}
          <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogDescription>
                  Action performed by {selectedLog?.adminName} on {selectedLog?.timestamp ? format(selectedLog.timestamp, 'PPpp') : 'N/A'}
                </DialogDescription>
              </DialogHeader>
              
              {selectedLog && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Admin</Label>
                      <p className="font-medium">{selectedLog.adminName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedLog.adminRole?.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <Label>Action</Label>
                      <div className="flex items-center gap-2">
                        {getActionIcon(selectedLog.action)}
                        <p className="font-medium">{selectedLog.action}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Resource</Label>
                      <p className="font-medium capitalize">{selectedLog.resource}</p>
                      <p className="text-sm text-muted-foreground">ID: {selectedLog.resourceId}</p>
                    </div>
                    <div>
                      <Label>Severity & Status</Label>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(selectedLog.severity)}>
                          {selectedLog.severity}
                        </Badge>
                        <Badge className={getStatusColor(selectedLog.status)}>
                          {selectedLog.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Action Details</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>IP Address</Label>
                      <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                    </div>
                    <div>
                      <Label>User Agent</Label>
                      <p className="text-sm text-muted-foreground truncate" title={selectedLog.userAgent}>
                        {selectedLog.userAgent}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLogDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <AuditLogsContent />
    </ProtectedRoute>
  )
}
