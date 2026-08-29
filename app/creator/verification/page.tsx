"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { authenticatedFetch } from "@/lib/firebase/authenticated-fetch"
import { CheckCircle2, Clock, Crown, Loader2, Sparkles, UploadCloud, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

type Status = "none" | "pending" | "paid" | "verified"

function VerificationContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>("none")
  const [featured, setFeatured] = useState(false)
  const [resourceCount, setResourceCount] = useState(0)
  const [waitlistEligible, setWaitlistEligible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<"badge" | "uploads" | null>(null)

  const loadStatus = async () => {
    if (!user) return
    try {
      const [verificationResponse, productsResponse] = await Promise.all([
        authenticatedFetch(`/api/creator/verification?userId=${encodeURIComponent(user.uid)}`),
        authenticatedFetch(`/api/creator/products?creatorId=${encodeURIComponent(user.uid)}`),
      ])
      const verification = await verificationResponse.json()
      const products = await productsResponse.json()
      setStatus(verification.verificationPaymentStatus || verification.status || "none")
      setFeatured(Boolean(verification.featured))
      setWaitlistEligible(Boolean(verification.waitlistEligible))
      setResourceCount(Array.isArray(products.products) ? products.products.length : 0)
    } catch (error) {
      console.error("Error loading creator verification status:", error)
      toast.error("Could not load creator account status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [user])

  useEffect(() => {
    const reference = searchParams.get("reference")
    const paymentId = searchParams.get("paymentId")
    if (!reference || !paymentId || !user) return
    setPaying("badge")
    authenticatedFetch("/api/fees/verify", {
      method: "POST",
      body: JSON.stringify({ paymentId, reference }),
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Payment verification failed")
      toast.success("Payment confirmed. Your creator benefits are now active.")
      await loadStatus()
    }).catch((error) => toast.error(error.message || "Payment verification failed"))
      .finally(() => setPaying(null))
  }, [searchParams, user])

  const startPayment = async (kind: "badge" | "uploads") => {
    if (!user) return
    setPaying(kind)
    try {
      const feeType = kind === "badge"
        ? "creator_verification_featuring"
        : (waitlistEligible ? "creator_waitlist_additional_upload" : "creator_additional_upload")
      const createResponse = await authenticatedFetch("/api/fees/create", {
        method: "POST",
        body: JSON.stringify({ feeType }),
      })
      const created = await createResponse.json()
      const initResponse = await authenticatedFetch("/api/fees/initialize", {
        method: "POST",
        body: JSON.stringify({ paymentId: created.paymentId }),
      })
      const initialized = await initResponse.json()
      if (!initResponse.ok || !initialized.authorizationUrl) throw new Error(initialized.error || "Unable to start payment")
      window.location.assign(initialized.authorizationUrl)
    } catch (error: any) {
      toast.error(error?.message || "Unable to start payment")
      setPaying(null)
    }
  }

  if (loading) return <div className="min-h-screen"><Header /><main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main><Footer /></div>

  const badgePaid = status === "paid" || status === "verified"
  const uploadFee = waitlistEligible ? 3000 : 4000

          {verificationStatus === 'verified' ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-700">You&apos;re Verified! 🎉</h2>
                <p className="text-muted-foreground mt-2">
                  Your educator credentials have been verified. Your resources now display the &quot;Verified Educator&quot; badge, boosting student trust.
                </p>
              </CardContent>
            </Card>
          ) : verificationStatus === 'pending' ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-yellow-700">Under Review</h2>
                <p className="text-muted-foreground mt-2">
                  Your verification documents are being reviewed by our audit team. This typically takes 24-48 hours.
                </p>
                {verificationDocs.length > 0 && (
                  <div className="mt-6 space-y-3 text-left">
                    <h3 className="font-semibold text-sm">Submitted Documents:</h3>
                    {verificationDocs.map((doc, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted rounded-lg text-sm min-w-0">
                        <span className="flex items-center gap-2 min-w-0 truncate">
                          <FileCheck className="h-4 w-4 shrink-0" />
                          <span className="truncate">{doc.type}</span>
                        </span>
                        <div className="shrink-0">{getStatusBadge(doc.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {verificationStatus === 'rejected' && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-red-800">
                      ⚠️ Your previous submission was not approved. Please review the feedback below and resubmit with clearer documents.
                    </p>
                    {verificationDocs.filter(d => d.status === 'rejected').map((doc, i) => (
                      <div key={i} className="mt-2 p-2 bg-white rounded text-sm break-words">
                        <strong>{doc.type}:</strong> {doc.reviewNote || 'Document could not be verified. Please resubmit.'}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Upload Verification Document</CardTitle>
                  <CardDescription>
                    Submit one of the following: Student ID, School Certificate, Transcript, NYSC Certificate, or Professional License.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="docType">Document Type *</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger id="docType">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student-id">Student ID Card</SelectItem>
                        <SelectItem value="school-certificate">School Certificate (WAEC/NECO)</SelectItem>
                        <SelectItem value="university-degree">University Degree Certificate</SelectItem>
                        <SelectItem value="transcript">Academic Transcript</SelectItem>
                        <SelectItem value="nysc-certificate">NYSC Discharge/Exemption</SelectItem>
                        <SelectItem value="professional-license">Professional License / Certification</SelectItem>
                        <SelectItem value="admission-letter">Admission Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution Name *</Label>
                    <Input 
                      id="institutionName" 
                      placeholder="e.g., University of Lagos, FUTA, Covenant University" 
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year (or Expected)</Label>
                    <Input 
                      id="graduationYear" 
                      placeholder="e.g., 2024" 
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Document *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <FileCheck className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer space-y-2 block">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload (JPEG, PNG, PDF — max 10MB)</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleFileSelect}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional context about your academic background..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy Guarantee</h3>
                <p className="text-sm text-blue-800">
                  Your documents are encrypted and stored securely. They are only used for verification purposes and are never shared with third parties or other users.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
    <div className="mt-8 rounded-lg border bg-background p-5 text-sm text-muted-foreground"><Clock className="mr-2 inline h-4 w-4" />Payments are verified server-side through Paystack. Benefits are activated only after successful verification; the browser cannot mark an account as paid.</div>
  </div></main><Footer /></div>
}

export default function VerificationPage() { return <ProtectedRoute allowedRoles={["creator"]}><VerificationContent /></ProtectedRoute> }
