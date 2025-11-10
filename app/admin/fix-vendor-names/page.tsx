"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

function FixVendorNamesContent() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFixVendorNames = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const response = await fetch('/api/admin/fix-vendor-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        toast.success(`Successfully updated ${data.updatedCount} products!`)
      } else {
        toast.error(data.error || 'Failed to fix vendor names')
      }
    } catch (error) {
      console.error('Error fixing vendor names:', error)
      toast.error('Failed to fix vendor names')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Fix Vendor Names</h1>
            <p className="text-muted-foreground">
              Update products with missing or generic vendor names
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Vendor Name Migration
              </CardTitle>
              <CardDescription>
                This tool will find all products with "Vendor" as the vendor name and update them 
                with the actual vendor names from their user profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>What this does:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Finds products with vendorName = "Vendor", "", or null</li>
                    <li>Looks up the actual vendor name from user profiles</li>
                    <li>Updates products with proper vendor names (storeName → businessName → displayName → email prefix)</li>
                    <li>Provides detailed results of the operation</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  onClick={handleFixVendorNames} 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing Vendor Names...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fix Vendor Names
                    </>
                  )}
                </Button>
              </div>

              {result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Migration Complete!</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {result.updatedCount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Products Updated
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.totalProcessed}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Processed
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {result.errorCount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Errors
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function FixVendorNamesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <FixVendorNamesContent />
    </ProtectedRoute>
  )
}
