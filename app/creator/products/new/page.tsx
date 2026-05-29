"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  ShieldCheck,
  BookOpen,
  DollarSign,
  Clock,
  Zap,
  Tag
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DigitalFileUpload } from "@/components/creator/digital-file-upload"
import type { DigitalFile } from "@/lib/types"

export default function NewResourcePage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  
  const [isUploading, setIsUploading] = useState(false)
  const [resourceType, setResourceType] = useState<"past_question" | "course" | "exam_prep" | "study_guide">("past_question")

  // Core Data
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [institution, setInstitution] = useState("")
  const [price, setPrice] = useState("")
  
  // Real file uploads
  const [digitalFiles, setDigitalFiles] = useState<DigitalFile[]>([])
  
  // Advanced features (mock data for now, saved as JSON string in actual description/file)
  const [questions, setQuestions] = useState([{ q: "", a: "", b: "", c: "", d: "", correct: "a" }])
  const [modules, setModules] = useState([{ title: "", duration: "" }])
  const [cbtDuration, setCbtDuration] = useState(30)

  // Handlers for dynamic builders
  const addQuestion = () => setQuestions([...questions, { q: "", a: "", b: "", c: "", d: "", correct: "a" }])
  const addModule = () => setModules([...modules, { title: "", duration: "" }])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please login to publish resources.")
      return
    }

    if (!name || !price || !institution) {
      toast.error("Please fill out the name, institution, and price.")
      return
    }

    if (resourceType === "past_question" || resourceType === "study_guide") {
      if (digitalFiles.length === 0) {
        toast.error("Please upload the required document files.")
        return
      }
    }

    setIsUploading(true)
    
    // Convert advanced structure into database format or tags
    const advancedContent = resourceType === 'exam_prep' ? JSON.stringify({ cbtDuration, questions }) : 
                            resourceType === 'course' ? JSON.stringify({ modules }) : ""
                            
    const finalDescription = advancedContent ? `${description}\n\n[FeroData:${advancedContent}]` : description

    try {
      const response = await fetch("/api/creator/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user.uid,
          creatorName: userProfile?.displayName || userProfile?.role || 'Verified Educator',
          name,
          description: finalDescription,
          price,
          category: resourceType,
          type: "digital",
          digitalFiles: digitalFiles,
          isAcademic: true,
          institution,
          verificationStatus: 'pending',
          images: ["https://res.cloudinary.com/dtg0cgylt/image/upload/v1727785461/hub-1_b3780l.png"] // Placeholder cover image
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Resource submitted for verification! It will be live shortly.")
        router.push("/creator/dashboard")
      } else {
        toast.error(data.error || "Failed to create resource.")
      }
    } catch (error) {
      console.error("Error creating resource:", error)
      toast.error("An error occurred during publishing.")
    } finally {
      setIsUploading(false)
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
              className="glass-card rounded-[2.5rem] p-8 md:p-10 border-border"
            >
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 block mb-4">Select Content Type</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className={`p-6 rounded-[1.5rem] border flex flex-col items-center gap-4 transition-all duration-300 ${resourceType === t.id
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                className="glass-card rounded-[2.5rem] p-8 md:p-10 border-white/10 space-y-8 relative overflow-hidden"
              >
                <h3 className="text-xl font-black flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  {resourceType === 'course' ? 'Curriculum Designer' :
                   resourceType === 'exam_prep' ? 'Interactive Question Builder' :
                   'Upload digital materials'}
                </h3>

                {/* Upload Standard */}
                {(resourceType === "past_question" || resourceType === "study_guide") && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground mb-4">Securely upload your PDFs, DOCX, or ZIP files to be encrypted upon checkout.</p>
                    <DigitalFileUpload
                      onFilesUploaded={setDigitalFiles}
                      existingFiles={digitalFiles}
                      maxFiles={5}
                      maxSizePerFile={250}
                    />
                  </div>
                )}

                {/* CBT Builder */}
                {resourceType === "exam_prep" && (
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20">
                      <span className="text-xs font-bold text-primary">CBT Engine Active. Simulating Real Environment.</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <input 
                          type="number" 
                          value={cbtDuration}
                          onChange={(e) => setCbtDuration(Number(e.target.value))}
                          className="w-16 bg-muted/30 border border-border rounded-lg px-2 py-1 text-xs text-center focus:border-primary font-mono" 
                        />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Mins</span>
                      </div>
                    </div>

                    {questions.map((q, i) => (
                      <div key={i} className="p-6 bg-muted/20 border border-border rounded-[1.5rem] space-y-4 relative group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Question {i + 1}</span>
                        </div>
                        <textarea 
                          placeholder="Type or paste the exam question here..." 
                          className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 px-4 text-sm font-medium focus:border-primary/50 outline-none resize-none min-h-[80px]"
                          value={q.q}
                          onChange={(e) => {
                            const n = [...questions]; n[i].q = e.target.value; setQuestions(n);
                          }}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          {['a','b','c','d'].map((opt) => (
                            <div key={opt} className={`relative flex items-center border rounded-xl overflow-hidden ${q.correct === opt ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                              <button 
                                type="button"
                                onClick={() => { const n = [...questions]; n[i].correct = opt; setQuestions(n); }}
                                className={`px-4 py-3 text-xs font-bold uppercase ${q.correct === opt ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground'}`}
                              >
                                {opt}
                              </button>
                              <input 
                                type="text" 
                                placeholder={`Option ${opt.toUpperCase()} text`} 
                                className="flex-1 bg-transparent py-3 px-3 text-xs outline-none"
                                value={(q as any)[opt]}
                                onChange={(e) => { const n = [...questions]; (n[i] as any)[opt] = e.target.value; setQuestions(n); }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addQuestion} className="w-full py-5 border-2 border-dashed border-border rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                      + Add Target Question
                    </button>
                  </div>
                )}

                {/* Course Builder */}
                {resourceType === "course" && (
                  <div className="space-y-6 relative z-10">
                    <div className="p-10 border-dashed border-2 border-primary/20 rounded-[1.5rem] bg-primary/5 text-center transition-all hover:bg-primary/10 cursor-pointer">
                      <UploadCloud className="h-10 w-10 mx-auto text-primary mb-4" />
                      <p className="text-sm font-bold mb-1">Upload Course Intro/Trailer Video</p>
                      <p className="text-xs text-muted-foreground">Used for previewing your content on the marketplace.</p>
                    </div>
                    <div className="space-y-4">
                      {modules.map((m, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-muted/20 border border-border rounded-2xl items-center flex-wrap sm:flex-nowrap">
                          <div className="bg-muted h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-muted-foreground">{i + 1}</div>
                          <input 
                            type="text" 
                            placeholder="Module Title (e.g. Advanced Calculus Intro)" 
                            className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm font-bold placeholder:text-muted-foreground/50" 
                            value={m.title}
                            onChange={(e) => { const n = [...modules]; n[i].title = e.target.value; setModules(n); }}
                          />
                          <input 
                            type="text" 
                            placeholder="Mins (e.g. 45)" 
                            className="w-24 bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-center" 
                            value={m.duration}
                            onChange={(e) => { const n = [...modules]; n[i].duration = e.target.value; setModules(n); }}
                          />
                        </div>
                      ))}
                      <button type="button" onClick={addModule} className="w-full py-5 border-2 border-dashed border-border rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                        + Add Course Module
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Price & Target Institution */}
            <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-white/10 space-y-8">
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
              className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left"
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
              disabled={isUploading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-black py-6 rounded-[2rem] transition-all shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {isUploading ? (
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
