'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAuditLogs, ACTION_DESCRIPTIONS, type AuditLog, type AuditAction } from '@/lib/admin/audit-log';
import { formatDistanceToNow } from 'date-fns';
import { Search, Download, Filter } from 'lucide-react';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100 };
      
      if (filterAction !== 'all') {
        filters.action = filterAction as AuditAction;
      }
      
      if (filterTarget !== 'all') {
        filters.targetType = filterTarget;
      }

      const data = await getAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.adminEmail.toLowerCase().includes(searchLower) ||
      log.targetId.toLowerCase().includes(searchLower) ||
      log.targetName?.toLowerCase().includes(searchLower) ||
      ACTION_DESCRIPTIONS[log.action].toLowerCase().includes(searchLower)
    );
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Success', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.adminEmail,
        ACTION_DESCRIPTIONS[log.action],
        log.targetType,
        log.targetId,
        log.success ? 'Yes' : 'No',
        log.ipAddress,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Track all administrative actions on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user.create">User Created</SelectItem>
              <SelectItem value="user.ban">User Banned</SelectItem>
              <SelectItem value="vendor.approve">Vendor Approved</SelectItem>
              <SelectItem value="vendor.reject">Vendor Rejected</SelectItem>
              <SelectItem value="product.approve">Product Approved</SelectItem>
              <SelectItem value="product.reject">Product Rejected</SelectItem>
              <SelectItem value="order.refund">Order Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTarget} onValueChange={setFilterTarget}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="ad">Advertisements</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadLogs}>
            <Filter className="mr-2 h-4 w-4" />
            Apply
          </Button>

          <Button variant="outline" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Logs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.adminEmail}</span>
                        <span className="text-xs text-muted-foreground">{log.adminRole}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ACTION_DESCRIPTIONS[log.action]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit">
                          {log.targetType}
                        </Badge>
                        <span className="mt-1 text-xs text-muted-foreground">
                          {log.targetName || log.targetId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="default">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredLogs.length} of {logs.length} logs</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
