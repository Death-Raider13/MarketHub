"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle2, FileVideo, ImageIcon, Loader2, LockKeyhole, PlayCircle, ShieldCheck, UploadCloud, X } from "lucide-react"
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
import Image from "next/image"

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
  const [tags, setTags] = useState("")
  const [files, setFiles] = useState<DigitalFile[]>([])
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileLabel = resourceType === "book" ? "Upload your book file" : "Upload your video file"
  const acceptedLabel = resourceType === "book" ? "PDF, EPUB, DOCX, ZIP or audiobook files" : "MP4, MOV, WEBM or other supported video files"

  const switchType = (type: ResourceType) => {
    setResourceType(type)
    setCategory(type === "book" ? "digital-ebooks" : "digital-video")
    setFiles([])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files
    if (!filesList || filesList.length === 0) return
    setUploadingImage(true)
    try {
      const uploadedUrls: string[] = []
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'market_hub')
        formData.append('folder', 'products')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxiclfxjm'}/image/upload`,
          { method: 'POST', body: formData }
        )
        const data = await response.json()
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url)
        }
      }
      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} cover image(s) uploaded successfully!`)
      }
    } catch (err) {
      console.error("Cover upload error:", err)
      toast.error("Failed to upload cover image")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeCoverImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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
          images,
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

  return <div className="flex min-h-screen flex-col bg-background"><Header /><main className="flex-1 bg-muted/20"><div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
    <div className="mb-8 flex items-start gap-4"><Button variant="outline" size="icon" asChild><Link href="/creator/products"><ArrowLeft className="h-5 w-5" /></Link></Button><div><Badge variant="outline" className="mb-3">Creator workspace</Badge><h1 className="text-3xl font-bold tracking-tight md:text-4xl">Add a resource</h1><p className="mt-2 max-w-2xl text-muted-foreground">Publish a book or educational video for students to discover and purchase securely.</p></div></div>
    <div className="mb-8 grid gap-4 md:grid-cols-3"><Card className="border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">3 free resources</p><p className="text-sm text-muted-foreground">Your first three uploads are free.</p></div></CardContent></Card><Card><CardContent className="flex gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /><div><p className="font-semibold">Piracy protection</p><p className="text-sm text-muted-foreground">Purchased digital files receive an invisible watermark.</p></div></CardContent></Card><Card><CardContent className="flex gap-3 p-5"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold">Secure delivery</p><p className="text-sm text-muted-foreground">Files are delivered after verified payment.</p></div></CardContent></Card></div>
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8"><Card><CardHeader><CardTitle>What are you publishing?</CardTitle><CardDescription>Choose the format that best describes the main resource.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => switchType("book")} className={`rounded-xl border p-5 text-left transition ${resourceType === "book" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "hover:border-primary/50"}`}><BookOpen className="mb-3 h-7 w-7 text-primary" /><p className="font-semibold">Book or document</p><p className="mt-1 text-sm text-muted-foreground">eBooks, study guides, past questions, and academic notes.</p></button><button type="button" onClick={() => switchType("video")} className={`rounded-xl border p-5 text-left transition ${resourceType === "video" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "hover:border-primary/50"}`}><FileVideo className="mb-3 h-7 w-7 text-primary" /><p className="font-semibold">Educational video</p><p className="mt-1 text-sm text-muted-foreground">Lectures, tutorials, exam preparation, and course videos.</p></button></CardContent></Card>
        <Card><CardHeader><CardTitle>Resource details</CardTitle><CardDescription>Give students enough information to understand what they are buying.</CardDescription></CardHeader><CardContent className="space-y-5"><div><label className="mb-2 block text-sm font-medium">Title <span className="text-destructive">*</span></label><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={resourceType === "book" ? "e.g. Complete MTH101 Study Guide" : "e.g. Biology 101: Cell Structure Lecture"} className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none ring-primary/20 focus:ring-2" /></div><div><label className="mb-2 block text-sm font-medium">Description <span className="text-destructive">*</span></label><textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={6} placeholder="Explain the topics covered, who the resource is for, and what the buyer will receive." className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 outline-none ring-primary/20 focus:ring-2" /></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium">Category <span className="text-destructive">*</span></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium">Price (₦) <span className="text-destructive">*</span></label><input required min="0" step="0.01" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="e.g. 2500" className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none ring-primary/20 focus:ring-2" /></div></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium">Author or instructor</label><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Optional" className="w-full rounded-lg border bg-background px-3 py-2.5" /></div><div><label className="mb-2 block text-sm font-medium">Tags</label><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="biology, 100 level, revision" className="w-full rounded-lg border bg-background px-3 py-2.5" /><p className="mt-1 text-xs text-muted-foreground">Separate tags with commas.</p></div></div></CardContent></Card>

        {/* Cover / Thumbnail Image Uploader */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Cover Image / Thumbnails (Recommended)
            </CardTitle>
            <CardDescription>
              Upload high quality cover images or course banners for display in the library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                    <Image src={imgUrl} alt={`Cover ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeCoverImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-foreground">
                {uploadingImage ? "Uploading Cover..." : "Click or drag images to upload cover thumbnail"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImage}
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary" />{fileLabel}</CardTitle><CardDescription>{acceptedLabel}. Your file is protected during buyer delivery.</CardDescription></CardHeader><CardContent><DigitalFileUpload onFilesUploaded={setFiles} existingFiles={files} maxFiles={5} maxSizePerFile={500} /><div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /><span>Upload the complete buyer file. {resourceType === "video" ? "Use a clear preview or introduction in the description so buyers know what to expect." : "Make sure the document is readable and includes the promised content."}</span></div></CardContent></Card>
      </div>
      <aside className="space-y-6"><Card className="sticky top-6"><CardHeader><CardTitle>Publishing checklist</CardTitle><CardDescription>Review before submitting.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><p className="flex gap-2"><CheckCircle2 className={`h-4 w-4 shrink-0 ${title ? "text-green-600" : "text-muted-foreground"}`} />Clear resource title</p><p className="flex gap-2"><CheckCircle2 className={`h-4 w-4 shrink-0 ${description ? "text-green-600" : "text-muted-foreground"}`} />Useful description</p><p className="flex gap-2"><CheckCircle2 className={`h-4 w-4 shrink-0 ${files.length ? "text-green-600" : "text-muted-foreground"}`} />Buyer file uploaded</p><p className="flex gap-2"><CheckCircle2 className={`h-4 w-4 shrink-0 ${price ? "text-green-600" : "text-muted-foreground"}`} />Price added</p><div className="border-t pt-4"><p className="mb-3 text-muted-foreground">Resources are reviewed before going live. You can manage them from your Products page.</p><Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}{isSubmitting ? "Submitting..." : "Submit resource"}</Button></div></CardContent></Card><Card className="bg-primary/5"><CardContent className="p-5 text-sm"><p className="font-semibold">Need upload access?</p><p className="mt-1 text-muted-foreground">You can pay for additional upload access before your three free resources are used.</p><Link href="/creator/verification" className="mt-3 inline-block font-medium text-primary hover:underline">View creator benefits →</Link></CardContent></Card></aside>
    </form>
  </div></main><Footer /></div>
}

export default function NewResourcePage() { return <ProtectedRoute allowedRoles={["creator"]}><NewResourceContent /></ProtectedRoute> }
