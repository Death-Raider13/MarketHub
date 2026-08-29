"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle2, Clock, DollarSign, FileText, FileVideo, Loader2, LockKeyhole, PlayCircle, ShieldCheck, UploadCloud, Zap } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { authenticatedFetch } from "@/lib/firebase/authenticated-fetch"
import { useAuth } from "@/lib/firebase/auth-context"
import { DigitalFileUpload } from "@/components/creator/digital-file-upload"
import type { DigitalFile } from "@/lib/types"
import { toast } from "sonner"

type ResourceType = "book" | "video"

const categories = [
  ["digital-ebooks", "Books & E-books"],
  ["digital-academic", "Academic Resources"],
  ["digital-study-guides", "Study Guides"],
  ["digital-past-questions", "Past Questions & CBT"],
  ["digital-courses", "Online Courses"],
  ["digital-video", "Educational Videos"],
  ["digital-audiobooks", "Audiobooks"],
  ["digital-professional", "Professional Development"],
] as const

function NewResourceContent() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [resourceType, setResourceType] = useState<ResourceType>("book")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("digital-ebooks")
  const [price, setPrice] = useState("")
  const [author, setAuthor] = useState("")
  const [institution, setInstitution] = useState("")
  const [tags, setTags] = useState("")
  const [files, setFiles] = useState<DigitalFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileLabel = resourceType === "book" ? "Upload your book file" : "Upload your video file"
  const acceptedLabel = resourceType === "book" ? "PDF, EPUB, DOCX, ZIP or audiobook files" : "MP4, MOV, WEBM or other supported video files"
  const defaultCategory = resourceType === "book" ? "digital-ebooks" : "digital-video"

  const switchType = (type: ResourceType) => {
    setResourceType(type)
    setCategory(type === "book" ? "digital-ebooks" : "digital-video")
    setFiles([])
  }

  const canSubmit = useMemo(() => Boolean(user && title.trim() && description.trim() && price && Number(price) >= 0 && files.length > 0 && category), [user, title, description, price, files, category])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return toast.error("Please sign in to publish a resource.")
    if (!canSubmit) return toast.error("Complete the required fields and upload at least one resource file.")

    setIsSubmitting(true)
    try {
      const response = await authenticatedFetch("/api/creator/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user.uid,
          creatorName: userProfile?.displayName || userProfile?.storeName || "Fero E-Library Creator",
          name: title.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          type: "digital",
          digitalFiles: files,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          status: "pending",
          isAcademic: true,
          author: author.trim() || null,
          accessDuration: 0,
          downloadLimit: 0,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 402 && data.code === "CREATOR_UPLOAD_ACCESS_REQUIRED") {
        toast.error(`Your three free uploads are used. Upload access costs ₦${Number(data.feeAmount || 4000).toLocaleString()}.`)
        router.push("/creator/verification")
        return
      }
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to publish resource")
      toast.success("Resource submitted for review.")
      router.push("/creator/products")
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while publishing your resource.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 px-4 relative overflow-hidden">
        {/* Ambience */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <Link href="/creator/dashboard" className="p-3 bg-muted/50 border border-border hover:bg-muted rounded-full transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                <Zap className="h-3 w-3" />
                Advanced Creator Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-1">Create <span className="text-primary text-gradient">Resource</span></h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Resource Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 md:p-10 border-border"
            >
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 block mb-4">Select Content Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "past_question", label: "Past Questions", icon: FileText },
                  { id: "course", label: "Full Course", icon: UploadCloud },
                  { id: "exam_prep", label: "Exam Prep (CBT)", icon: Clock },
                  { id: "study_guide", label: "Study Guide", icon: BookOpen },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setResourceType(t.id as any)}
                    className={`p-4 sm:p-6 rounded-[1.5rem] border flex flex-col items-center gap-3 sm:gap-4 transition-all duration-300 ${resourceType === t.id
                      ? "bg-primary border-primary shadow-[0_0_25px_rgba(79,70,229,0.3)] text-white transform -translate-y-1"
                      : "bg-muted/50 border-border hover:border-primary/20 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <t.icon className={`h-8 w-8 ${resourceType === t.id ? "text-white" : "text-primary/50"}`} />
                    <span className="text-[11px] font-black uppercase tracking-wider text-center">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">General Title</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete MTH101 Guide 2024" 
                    className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-12 pr-4 text-base focus:border-primary/50 outline-none transition-all font-medium" 
                  />
                </div>
              </div>
            </motion.div>

            {/* Dynamic Content Builder */}
            <AnimatePresence mode="wait">
              <motion.div
                key={resourceType}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-white/10 space-y-8 relative overflow-hidden"
              >
                <h3 className="text-xl font-black flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  {resourceType === 'video' ? 'Video Resource Settings' : 'Upload digital materials'}
                </h3>

                {/* Upload Standard */}
                {(resourceType === "book" || resourceType === "video") && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground mb-4">Securely upload your PDFs, DOCX, or ZIP files to be encrypted upon checkout.</p>
                    <DigitalFileUpload
                      onFilesUploaded={setFiles}
                      existingFiles={files}
                      maxFiles={5}
                      maxSizePerFile={250}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Price & Target Institution */}
            <div className="glass-card rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 md:p-10 border-white/10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Target Institution</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input 
                      type="text" 
                      required 
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. Federal University of Technology" 
                      className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-primary/50 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Market Pricing (₦)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input 
                      type="number" 
                      required 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 2500" 
                      min="500" 
                      className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-12 pr-4 text-base font-black font-mono focus:border-primary/50 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Short Outline / Description</label>
                <textarea 
                  required 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a quick overview of what students will gain from this material..." 
                  className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-sm font-medium focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none" 
                />
              </div>
            </div>

            {/* Quality Assurance Verification Frame */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 sm:p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-foreground text-lg mb-2">Automated Quality Assurance</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  By clicking publish, you consent to our 3-tier auditing protocol. Your resource will be securely encrypted, watermarked with buyer tracking, and queued for our Academic Verifiers to analyze accuracy before deployment.
                </p>
              </div>
            </motion.div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-black py-6 rounded-[2rem] transition-all shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {isSubmitting ? (
                <span className="animate-pulse flex items-center gap-3">
                  <UploadCloud className="h-6 w-6 animate-bounce" /> Securing Network Upload...
                </span>
              ) : (
                "Publish Resource to Library"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function NewResourcePage() { return <ProtectedRoute allowedRoles={["creator"]}><NewResourceContent /></ProtectedRoute> }
