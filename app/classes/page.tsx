"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveClass {
  id: string;
  title: string;
  subject: string;
  instructor: string;
  instructorTitle: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  platform: "Zoom" | "Google Meet";
  enrolledCount: number;
  image: string;
}

const SAMPLE_CLASSES: LiveClass[] = [
  {
    id: "class-1",
    title: "Mastering Special Needs Mathematics: Visual Problem Solving",
    subject: "Mathematics",
    instructor: "Dr. Adebayo Samuel",
    instructorTitle: "Senior Special Education Specialist",
    date: "Saturday, Sept 12, 2026",
    time: "4:00 PM WAT",
    duration: "90 Mins",
    price: 2500,
    platform: "Zoom",
    enrolledCount: 42,
    image: "/hero.png"
  },
  {
    id: "class-2",
    title: "Interactive Biology & Genetics for Dyslexic Learners",
    subject: "Biology",
    instructor: "Prof. Clara Nnamdi",
    instructorTitle: "Academic Learning Consultant",
    date: "Sunday, Sept 13, 2026",
    time: "5:00 PM WAT",
    duration: "60 Mins",
    price: 2000,
    platform: "Google Meet",
    enrolledCount: 38,
    image: "/student.png"
  }
];

export default function LiveClassesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  const subjects = ["All", "Mathematics", "Biology", "Chemistry", "Languages"];

  const filteredClasses = selectedSubject === "All"
    ? SAMPLE_CLASSES
    : SAMPLE_CLASSES.filter(c => c.subject === selectedSubject);

  return (
    <div className="min-h-screen bg-[#0B132B] text-white py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-cyan-300 text-xs font-semibold mb-4 uppercase tracking-wider">
            <Video className="w-3.5 h-3.5" /> Interactive Learning
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Online Live Virtual Classes
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Participate in live, accessible webinars delivered directly via Zoom and Google Meet with expert tutors.
          </p>
        </div>

        {/* Network Disclaimer Banner */}
        <div className="w-full p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs md:text-sm flex items-start gap-3 mb-10 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Connectivity Disclaimer: </span>
            Attendees are strictly responsible for maintaining their own stable internet connection during live sessions. Session links are delivered to your email upon enrollment.
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedSubject === subject
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredClasses.map(cls => (
            <div 
              key={cls.id}
              className="glass-card rounded-3xl p-6 md:p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                    {cls.subject}
                  </span>
                  <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                    <Video className="w-3.5 h-3.5" /> {cls.platform}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-3 text-white leading-snug">
                  {cls.title}
                </h3>

                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 overflow-hidden relative border border-indigo-500/30 shrink-0">
                    <Image src={cls.image} alt={cls.instructor} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{cls.instructor}</h4>
                    <p className="text-xs text-slate-400">{cls.instructorTitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{cls.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{cls.time} ({cls.duration})</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">Registration Fee</span>
                  <span className="text-2xl font-extrabold text-white">₦{cls.price.toLocaleString()}</span>
                </div>

                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-5 py-5 text-xs gap-2 shadow-lg shadow-indigo-600/30">
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
