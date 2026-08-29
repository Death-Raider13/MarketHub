"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Upload, Shield, CheckCircle2, Clock, XCircle, Loader2, GraduationCap, FileCheck } from "lucide-react"
import { toast } from "sonner"

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

interface VerificationDoc {
  type: string
  url: string
  status: VerificationStatus
  uploadedAt: string
  reviewNote?: string
}

function VerificationContent() {
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('none')
  const [verificationDocs, setVerificationDocs] = useState<VerificationDoc[]>([])
  
  // Form state
  const [docType, setDocType] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      loadVerificationStatus()
    }
  }, [user])

  const loadVerificationStatus = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/creator/verification?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        setVerificationStatus(data.status || 'none')
        setVerificationDocs(data.documents || [])
      }
    } catch (error) {
      console.error("Error loading verification status:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and PDF files are allowed")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must not exceed 10MB")
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please login to continue")
      return
    }

    if (!docType) {
      toast.error("Please select a document type")
      return
    }

    if (!selectedFile) {
      toast.error("Please upload a verification document")
      return
    }

    if (!institutionName.trim()) {
      toast.error("Please enter your institution name")
      return
    }

    setUploading(true)

    try {
      // Upload file to Cloudinary
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'verification-docs')
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      )
      
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.secure_url) {
        throw new Error('File upload failed')
      }

      // Submit verification request
      const response = await fetch('/api/creator/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          documentType: docType,
          documentUrl: uploadData.secure_url,
          institutionName: institutionName.trim(),
          graduationYear: graduationYear.trim(),
          additionalNotes: additionalNotes.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Verification documents submitted! Our team will review within 24-48 hours. 🎓")
        setVerificationStatus('pending')
        setSelectedFile(null)
        setDocType("")
        setInstitutionName("")
        setGraduationYear("")
        setAdditionalNotes("")
        loadVerificationStatus()
      } else {
        toast.error(data.error || "Failed to submit verification")
      }
    } catch (error) {
      console.error("Error submitting verification:", error)
      toast.error("Failed to submit verification")
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified Educator</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Under Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Needs Resubmission</Badge>
      default:
        return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" /> Not Verified</Badge>
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold">Educator Verification</h1>
            <p className="text-muted-foreground mt-2">
              Verify your academic credentials to earn the &quot;Verified Educator&quot; badge and build trust with students.
            </p>
            <div className="mt-4">{getStatusBadge(verificationStatus)}</div>
          </div>

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
  )
}

export default function VerificationPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <VerificationContent />
    </ProtectedRoute>
  )
}
