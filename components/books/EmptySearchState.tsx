"use client";

import Link from "next/link";
import { Sparkles, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptySearchStateProps {
  query?: string;
  category?: string;
}

export function EmptySearchState({ query, category }: EmptySearchStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 md:p-12 text-center rounded-3xl glass-card border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />
      
      <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
      </div>

      <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-4 leading-snug">
        Wow, you're the first to search for this!
      </h3>

      <p className="text-slate-300 text-sm md:text-base mb-8 max-w-lg mx-auto leading-relaxed">
        {query ? (
          <>No material found for <span className="text-cyan-400 font-bold">"{query}"</span>{category ? ` in ${category}` : ""}. How about creating it for others who will need it?</>
        ) : (
          <>Be a pioneer on Fero E-Library by publishing the very first summary or book in this section!</>
        )}
      </p>

      <Link 
        href={`/creator/products/new?title=${encodeURIComponent(query || "")}`}
      >
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6 py-6 text-sm gap-2 shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5">
          <PlusCircle className="w-5 h-5" />
          Create this Book
        </Button>
      </Link>
    </div>
  );
}
