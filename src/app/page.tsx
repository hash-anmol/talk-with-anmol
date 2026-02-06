"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import profileImage from "@/../public/images/image.png";

const heroLine =
  "Founder of Luke AI. I build AI agents that solve real problems. Let's talk about AI, startups, and what you're building.";

export default function Home() {
  const remainingSlots = useQuery(api.bookings.getRemainingSlots);
  const confirmedCount = 4;
  const rating = "5.0/5";

  return (
    <div className="page-shell min-h-screen p-4 lg:p-8 flex flex-col items-center">
      {/* Banner */}
      <div className="mb-8 rounded-full bg-[#1f1a16]/5 px-6 py-2 text-xs font-medium text-[#1f1a16]/60 border border-[#1f1a16]/10 backdrop-blur-sm text-center">
        "Topmate took a cut of the session money, so instead I vibe coded Topmate killer in 1 day 🚀"
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch">
        
        {/* Left Panel - Sidebar (Orange Card) */}
        <aside className="brand-panel relative flex flex-col justify-between gap-8 overflow-hidden rounded-[3rem] px-10 py-16 shadow-2xl lg:col-span-4 min-h-[600px] lg:min-h-[850px]">
          <div>
            <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
              <div className="h-40 w-40 overflow-hidden rounded-full border-[6px] border-white/60 shadow-2xl shrink-0">
                <Image
                  src={profileImage}
                  alt="Anmol Malik"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/90">
                  Talk with the Founder of Luke AI
                </p>
                <h1 className="mt-2 text-5xl font-black text-white tracking-tight">Anmol Malik</h1>
              </div>
            </div>

            <p className="mt-8 text-lg font-medium leading-relaxed text-white/95 max-w-sm">
              {heroLine}
            </p>

            {/* 100% to Charity Badge */}
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/25 bg-white/20 px-6 py-4 backdrop-blur-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/25">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-white">100% Goes to Charity</p>
                <p className="text-xs font-medium text-white/80">Every single rupee is donated</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-4 lg:justify-start">
              <div className="card flex flex-1 flex-col items-center justify-center gap-1 border-none bg-white/95 p-4 text-center text-black shadow-lg hover:scale-105 transition-all duration-300 rounded-2xl">
                <span className="text-3xl font-black">{confirmedCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Bookings
                </span>
              </div>
              <div className="card flex flex-1 flex-col items-center justify-center gap-1 border-none bg-white/95 p-4 text-center text-black shadow-lg hover:scale-105 transition-all duration-300 rounded-2xl">
                <span className="text-3xl font-black">{rating}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Ratings
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/booking?type=quick" className="btn-primary flex items-center justify-center py-4 text-center text-lg font-black shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                Quick Chat
              </Link>
              <Link href="/session" className="btn-secondary flex items-center justify-center border-white/40 py-4 text-center text-base font-bold text-white hover:bg-white/10 transition-colors">
                Details
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content - Bento Grid */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 10-min Quick Call Card - PRIMARY FOCUS */}
            <section className="card fade-in flex flex-col justify-between border-none bg-gradient-to-br from-white to-emerald-50/90 p-8 shadow-[0_20px_50px_rgba(16,185,129,0.15)] ring-4 ring-emerald-500/40 relative rounded-[2.5rem] transform lg:scale-[1.02] lg:translate-y-2 z-10">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <span className="pill bg-emerald-100 text-emerald-800 px-4 py-2 font-black text-sm uppercase tracking-wider">Quick Call · 10 mins</span>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black text-white shadow-sm tracking-tighter">BEST VALUE</span>
                </div>
                <h2 className="mb-2 text-4xl font-black tracking-tight text-emerald-950">Quick Chat with Anmol</h2>
                <div className="text-sm font-black text-red-600 mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                  ONLY {remainingSlots?.quick ?? 7} CALLS LEFT
                </div>
                <p className="mb-8 text-base leading-relaxed text-[#4b4540] font-semibold">
                  Got a quick question about Luke AI or startups? 10 mins, <span className="bg-emerald-100 text-emerald-800 px-1 rounded-sm underline decoration-emerald-500/30 font-black tracking-tight">direct phone call only</span>.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest leading-none mb-1">Total Fee</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black text-emerald-600 tracking-tighter leading-none">₹250</span>
                      <span className="text-xl text-[#9b8b7b] line-through decoration-emerald-500/30 font-bold">₹500</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] font-bold text-[#9b8b7b] uppercase tracking-tighter">Limited slots</span>
                     <span className="text-[10px] font-bold text-[#9b8b7b] uppercase tracking-tighter tracking-widest">Donated to charity</span>
                  </div>
                </div>
                <Link href="/booking?type=quick" className="btn-primary bg-emerald-600 px-10 py-6 text-xl font-black shadow-[0_15px_35px_rgba(16,185,129,0.4)] hover:shadow-emerald-400/60 hover:bg-emerald-700 hover:-translate-y-2 transition-all active:scale-95 rounded-[1.5rem] text-center border-b-4 border-emerald-800 uppercase tracking-widest">
                  BOOK NOW 🚀
                </Link>
              </div>
            </section>

            {/* 45-min Session Card */}
            <section className="card fade-in flex flex-col justify-between border-none p-8 shadow-[0_20px_50px_rgba(30,26,22,0.05)] ring-4 ring-orange-500/20 relative rounded-[2.5rem] transform lg:scale-[1.02] lg:translate-y-2 opacity-95 hover:opacity-100 transition-all">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <span className="pill bg-orange-100 text-orange-800 px-4 py-2 text-xs font-black uppercase tracking-wider">Video Call · 45 mins</span>
                  <span className="text-sm font-bold text-orange-600">⭐ 5.0</span>
                </div>
                <h2 className="mb-4 text-4xl font-black tracking-tight text-[#1e1a16]">1:1 AI Strategy</h2>
                <div className="text-xs font-bold text-red-600/80 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                  only {remainingSlots?.strategy ?? 5} slots left
                </div>
                <p className="mb-8 text-base leading-relaxed text-[#6b5b4e] font-medium">
                  In-depth session for complex problems. Google Meet call. Map AI agents into your work with real tools.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#9b8b7b] uppercase tracking-widest leading-none mb-1">Total Fee</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-orange-600 leading-none tracking-tighter">₹600</span>
                      <span className="text-base text-[#9b8b7b] line-through font-bold">₹1200</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] font-bold text-[#9b8b7b] uppercase tracking-tighter">Verified session</span>
                  </div>
                </div>
                <Link href="/booking" className="btn-secondary px-10 py-6 text-lg font-black border-orange-200 text-orange-700 hover:bg-orange-50 rounded-[1.5rem] transition-all text-center uppercase tracking-widest">
                  Book Strategy
                </Link>
              </div>
            </section>
          </div>

          {/* Testimonial Section */}
          <div className="w-full">
            <div className="card bg-white/80 backdrop-blur-md p-10 rounded-[2.5rem] border-none shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/20"></div>
              <svg className="absolute top-6 right-8 h-16 w-16 text-black/5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V5C14.017 4.44772 14.4647 4 15.017 4H21.017C21.5693 4 22.017 4.44772 22.017 5V15C22.017 17.7614 19.7784 20 17.017 20H14.017V21ZM5 21V18C5 16.8954 5.89543 16 7 16H10C10.5523 16 11 15.5523 11 15V9C11 8.44772 10.5523 8 10 8H6C5.44772 8 5 7.55228 5 7V5C5 4.44772 5.44772 4 6 4H12C12.5523 4 13 4.44772 13 5V15C13 17.7614 10.7614 20 8 20H5V21Z" />
              </svg>
              <p className="text-2xl font-bold text-[#1e1a16] leading-relaxed relative z-10 italic pr-12">
                "Bhai Maine Kai creator Dekhe per Aap Jaisa Kahin Nahin Dekha thank u so Mach Meri help karne ke liye"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px w-10 bg-black/10"></div>
                <span className="text-sm font-black text-black/40 uppercase tracking-[0.2em]">xx_anish143</span>
              </div>
            </div>
          </div>

          {/* About Me */}
          <section className="card fade-in flex flex-col gap-6 p-10 rounded-[2.5rem] shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#1e1a16]">About me</h3>
                <p className="mt-3 text-base leading-relaxed text-[#6b5b4e] max-w-2xl font-medium">
                  I'm building <strong>Luke AI</strong> — helping creators automate workflows. I work with folks who want clarity on AI agents without the hype. I run an AI automation agency, SunbloomAI, where we build advanced Agentic systems.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <a className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E1306C]/10 text-[#E1306C] transition-all hover:scale-110 hover:rotate-3 shadow-sm" href="https://instagram.com/agenticanmol" target="_blank">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-black transition-all hover:scale-110 hover:-rotate-3 shadow-sm" href="https://x.com/quillzen" target="_blank">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0077B5]/10 text-[#0077B5] transition-all hover:scale-110 hover:rotate-3 shadow-sm" href="https://linkedin.com/in/anmol-malik-6a438730b/" target="_blank">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Charity Card */}
            <section className="card charity-card relative flex flex-col justify-between border-none p-8 shadow-xl rounded-[2.5rem]">
              <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-red-100/80 backdrop-blur-sm shadow-sm">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-black tracking-tight text-[#1e1a16]">Charity Ledger</h4>
                <p className="mt-3 text-sm leading-relaxed text-[#6b5b4e] font-medium">
                  100% of proceeds are donated. Publicly tracked and transparent. No NGO claims, just honest impact.
                </p>
              </div>
              <Link href="/charity" className="btn-secondary mt-8 inline-block w-full border-orange-200 bg-white/60 text-center text-sm font-bold text-orange-700 hover:bg-orange-50 py-3 rounded-xl transition-all">
                View Ledger
              </Link>
            </section>

            {/* Recording Card */}
            <section className="card flex flex-col justify-between border-none bg-indigo-50/40 p-8 shadow-xl rounded-[2.5rem]">
              <div>
                <h4 className="text-xl font-black tracking-tight text-[#1e1a16]">Session Recording</h4>
                <p className="mt-3 text-sm leading-relaxed text-[#6b5b4e] font-medium">
                  Keep a high-quality copy of our chat to share with your team or rewatch later.
                </p>
              </div>
              <Link href="/booking" className="btn-secondary mt-8 inline-block w-full border-indigo-200 bg-white/60 text-center text-sm font-bold text-indigo-700 hover:bg-indigo-50 py-3 rounded-xl transition-all">
                Add for ₹200
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
