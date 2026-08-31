"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Layers, 
  Tag, 
  UserCheck, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"

const CREATOR_MODULES = [
  {
    id: 1,
    title: "MODULE 1: WHO IS A CREATOR ON FERO E-LIBRARY?",
    icon: UserCheck,
    summary: "Understanding your role as an educator and content provider.",
    text: "A Creator is a person who provides educational resources for purchase. This person can also be seen as an educator on Fero E-Library.",
    bullets: [
      "Educate and empower students across various academic levels.",
      "Publish high-quality study notes, past question solutions, and textbooks.",
      "Build a sustainable personal brand while earning consistent income."
    ]
  },
  {
    id: 2,
    title: "MODULE 2: WHAT RESOURCES ARE RECOMMENDED?",
    icon: Layers,
    summary: "Strict focus on academic and examination preparation materials.",
    text: "Fero E-Library is strictly open to 'academic resources' that'll help students better understand topics and prepare for examinations, as this is the gap we look forward to filling in academic learning.",
    bullets: [
      "Exam preparation packs (JAMB, WAEC, University Semester exams).",
      "Step-by-step topic summaries and solved practice questions.",
      "Digital textbooks, research guides, and video walkthroughs."
    ]
  },
  {
    id: 3,
    title: "MODULE 3: HOW TO CREATE EDUCATIONAL MATERIALS",
    icon: BookOpen,
    summary: "Creating clear, presentable, and high-value materials.",
    text: "These educational resources to be posted, both e-books and videos, should be as presentable as possible. E-books can be created with various methods, ranging from scanning your note with CamScanner to writing on Microsoft Word among many other methods.\n\nWhile creating e-books, the interest of the reader should be put in utmost consideration. In the case of explaining a topic, say a mathematics solution, all the steps should be followed, and it is also recommended to add write-ups for better understanding.\n\nYour responsibility as a creator here is to create the best possible materials that'll enhance learning and improve academic performance in students.",
    bullets: [
      "Ensure clean, legible text and clear page alignment.",
      "Provide step-by-step explanations for complex problems.",
      "Focus on clarity and reader engagement."
    ]
  },
  {
    id: 4,
    title: "MODULE 4: BUILDING YOUR PERSONAL BRAND",
    icon: Award,
    summary: "Thriving on trust, authenticity, and customer retention.",
    text: "Being a creator can be likened to having a book publishing business: you thrive on trust, and building that trust is your sole responsibility.\n\nThe easiest way to lose trust and recommendation from customers (and also lose access to our platform) is by posting materials that are reported to have misleading descriptions.\n\nYou should be intentional about building your brand to enable your customers to come back to learn from you, and also recommend you to their friends.",
    bullets: [
      "You must NOT use misleading descriptions for your materials.",
      "Give your customers a detailed outline of what they will learn from your material.",
      "Encourage your customers to leave genuine reviews on your products to boost trust.",
      "Your materials will carry watermarks to encourage originality.",
      "Use attractive, professional cover photos when uploading your books."
    ]
  },
  {
    id: 5,
    title: "MODULE 5: TAGGING PRICES",
    icon: Tag,
    summary: "Strategies for pricing your educational materials appropriately.",
    text: "One of the challenges faced by creators is tagging a price to their materials. Some overprice while some underprice. In this section, we should understand that there are different factors that affect price, and in this case, what should be considered is: the potential buyer and the value of the material being sold.\n\nWith an understanding of the nature of customers using Fero E-Library, prices are advised to be in the range of ₦2,000 to ₦10,000. If the value in your material is exceptional, you can tag a price higher than our advised range.\n\nYou must also keep in mind that setting a very low price for a well-packed material can cause it to be perceived as low value. Likewise, when selling the same material class as others, it is advisable to adopt the accepted market price, because setting a significantly higher price can deprive you of sales.",
    bullets: [
      "Advised price range: ₦2,000 to ₦10,000.",
      "Avoid underpricing high-value comprehensive bundles.",
      "Stay competitive with market benchmarks to maximize your sales volume."
    ]
  }
]

export default function CreatorGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-10">
          
          {/* Header Banner */}
          <div className="space-y-4 text-center">
            <Link 
              href="/creator/dashboard" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Creator Workspace
            </Link>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mx-auto">
              <Sparkles className="h-3.5 w-3.5" /> Official Documentation
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              FERO E-LIBRARY CREATORS GUIDE
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your complete blueprint for creating, pricing, and scaling high-impact educational resources on Nigeria&apos;s leading e-library.
            </p>
          </div>

          {/* Table of Contents */}
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {CREATOR_MODULES.map((m) => (
                  <li key={m.id}>
                    <a 
                      href={`#module-${m.id}`} 
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium py-1 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-primary">0{m.id}</span>
                      <span>{m.title.replace(`MODULE ${m.id}: `, '')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Modules List */}
          <div className="space-y-8">
            {CREATOR_MODULES.map((mod) => {
              const IconComp = mod.icon
              return (
                <Card id={`module-${mod.id}`} key={mod.id} className="border-border/80 shadow-sm scroll-mt-20 overflow-hidden">
                  <CardHeader className="bg-muted/40 border-b border-border/50 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary font-bold">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">
                        {mod.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {mod.summary}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <div className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                      {mod.text}
                    </div>

                    {mod.bullets && mod.bullets.length > 0 && (
                      <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Takeaways:</p>
                        <ul className="space-y-2 text-sm">
                          {mod.bullets.map((b, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium text-foreground/90">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Conclusion Card */}
            <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10">
              <CardHeader className="p-6 border-b border-emerald-500/20">
                <CardTitle className="text-xl font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" /> CONCLUSION
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                  In conclusion, Fero E-Library creators are advised to obey the set rules and follow the set guidelines. The aim is to provide students with educational resources that&apos;ll aid their academic success and also earn from it. This will be the biggest marketplace for educational materials, and we are glad to have you as a contributor to this.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="font-bold bg-primary hover:bg-primary/90 text-white rounded-xl">
                    <Link href="/creator/products/new">
                      Upload Your First Material <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="font-bold rounded-xl">
                    <Link href="/creator/dashboard">
                      Return to Creator Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
