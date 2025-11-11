"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AdRevenueData {
  summary: {
    totalRevenue: number
    revenueByPlacement: {
      homepage: number
      vendor_store: number
      category: number
      sponsored_product: number
    }
    revenueByModel: {
      cpm: number
      cpc: number
      cpa: number
    }
    metrics: {
      totalImpressions: number
      totalClicks: number
      totalConversions: number
      averageCPM: number
      averageCPC: number
      averageCPA: number
      overallCTR: number
      overallConversionRate: number
    }
    growth: {
      revenueGrowth: number
      impressionGrowth: number
      clickGrowth: number
    }
  }
  campaigns: {
    total: number
    active: number
    topPerforming: Array<{
      id: string
      campaignName: string
      revenue: {
        platformRevenue: number
        totalAdSpend: number
      }
      impressions: number
      clicks: number
    }>
  }
  dailyBreakdown: Array<{
    date: string
    revenue: number
    impressions: number
    clicks: number
  }>
  config: {
    platformCommissionRate: number
    placementRates: any
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdvertisingRevenuePage() {
  const [data, setData] = useState<AdRevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRevenueData()
  }, [period])

  const loadRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/advertising/revenue?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error loading revenue data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading revenue data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={loadRevenueData}>Try Again</Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>No revenue data available</p>
      </div>
    )
  }

  // Prepare chart data
  const placementData = Object.entries(data.summary.revenueByPlacement).map(([key, value]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value,
    percentage: ((value / data.summary.totalRevenue) * 100).toFixed(1)
  }))

  const modelData = Object.entries(data.summary.revenueByModel).map(([key, value]) => ({
    name: key.toUpperCase(),
    value: value,
    percentage: ((value / data.summary.totalRevenue) * 100).toFixed(1)
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Advertising Revenue</h1>
          <p className="text-muted-foreground">Platform revenue from advertising campaigns</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadRevenueData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.summary.growth.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {formatPercentage(Math.abs(data.summary.growth.revenueGrowth))} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.metrics.totalImpressions)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.summary.growth.impressionGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {formatPercentage(Math.abs(data.summary.growth.impressionGrowth))} from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.summary.metrics.totalClicks)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              CTR: {formatPercentage(data.summary.metrics.overallCTR)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CPM</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.metrics.averageCPM)}</div>
            <div className="text-xs text-muted-foreground">
              CPC: {formatCurrency(data.summary.metrics.averageCPC)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campaigns</TabsTrigger>
          <TabsTrigger value="settings">Revenue Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Placement */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Placement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={placementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {placementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={modelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Detailed Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Placement Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {placementData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Model Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {modelData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.name}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.value)}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Campaigns generating the most platform revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.campaigns.topPerforming.map((campaign, index) => (
                  <div key={campaign.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{campaign.campaignName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(campaign.impressions)} impressions • {formatNumber(campaign.clicks)} clicks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(campaign.revenue.platformRevenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        Total Spend: {formatCurrency(campaign.revenue.totalAdSpend)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Configuration</CardTitle>
              <CardDescription>Current platform revenue settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Platform Commission Rate</h3>
                <p className="text-2xl font-bold text-green-600">
                  {data.config.platformCommissionRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Platform takes {data.config.platformCommissionRate}% of total ad spend
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Placement Revenue Sharing</h3>
                <div className="space-y-3">
                  {Object.entries(data.config.placementRates).map(([placement, rates]: [string, any]) => (
                    <div key={placement} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium capitalize">{placement.replace('_', ' ')}</span>
                      <div className="text-right">
                        <div className="text-sm">Platform: {rates.platformShare}%</div>
                        <div className="text-sm text-muted-foreground">Vendor: {rates.vendorShare}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
