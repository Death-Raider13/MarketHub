'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { notificationService } from '@/lib/notifications/service';
import { NotificationTriggers } from '@/lib/notifications/triggers';
import { NotificationType, NotificationPriority } from '@/lib/notifications/types';
import { toast } from 'sonner';
import { Bell, Send, Users, AlertTriangle, Megaphone, Settings } from 'lucide-react';

function NotificationManagementContent() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const roles = [
    { value: 'customer', label: 'Customers', icon: '👤' },
    { value: 'vendor', label: 'Vendors', icon: '🏪' },
    { value: 'admin', label: 'Admins', icon: '👑' },
    { value: 'moderator', label: 'Moderators', icon: '🛡️' },
    { value: 'support', label: 'Support', icon: '🎧' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const handleRoleToggle = (roleValue: string) => {
    setTargetRoles(prev => 
      prev.includes(roleValue)
        ? prev.filter(r => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim() || targetRoles.length === 0) {
      toast.error('Please fill in all fields and select at least one role');
      return;
    }

    setSending(true);
    try {
      await notificationService.createRoleNotification(
        targetRoles,
        'system_maintenance', // Using as a generic system notification
        {
          title: title,
          message: message,
          priority: priority,
          metadata: {
            actionUrl: '/admin/notifications'
          }
        }
      );

      toast.success(`Notification sent to ${targetRoles.join(', ')} successfully!`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setTargetRoles([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleSystemMaintenance = async () => {
    const maintenanceDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    try {
      await NotificationTriggers.onSystemMaintenance(maintenanceDate, '2 hours');
      toast.success('System maintenance notification sent to all users');
    } catch (error) {
      toast.error('Failed to send maintenance notification');
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Notification Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Send system-wide notifications and manage communication with users
            </p>
          </div>

          <div className="grid gap-6">
            {/* Send Custom Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Custom Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter notification title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter notification message..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(value: NotificationPriority) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={option.color}>{option.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Roles</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {roles.map((role) => (
                        <Button
                          key={role.value}
                          variant={targetRoles.includes(role.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRoleToggle(role.value)}
                        >
                          <span className="mr-1">{role.icon}</span>
                          {role.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendNotification} 
                    disabled={sending}
                    className="w-full"
                  >
                    {sending ? 'Sending...' : 'Send Notification'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSystemMaintenance}
                    className="justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Send System Maintenance Alert
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle('Welcome to MarketHub!');
                      setMessage('Thank you for joining Nigeria\'s premier e-commerce platform. Start exploring amazing products from verified vendors.');
                      setPriority('medium');
                      setTargetRoles(['customer']);
                    }}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Welcome Message Template
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle('Security Alert');
                      setMessage('We\'ve detected unusual activity. Please review your account security settings.');
                      setPriority('urgent');
                      setTargetRoles(['customer', 'vendor']);
                    }}
                    className="justify-start"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Security Alert Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,234</div>
                    <div className="text-sm text-blue-600">Total Sent Today</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-green-600">Delivery Rate</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-orange-600">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">67%</div>
                    <div className="text-sm text-purple-600">Read Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NotificationManagementPage() {
  return (
    <ProtectedRoute requiredPermission="system.maintenance">
      <NotificationManagementContent />
    </ProtectedRoute>
  );
}
