"use client";

import React from "react";
import Link from "next/link";
import {
    Download,
    ArrowLeft,
    ChevronRight,
    Info
} from "lucide-react";

export default function TheoryOfChangePage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-indigo-100 print:bg-white print:p-0">
            {/* Navigation - Hidden in Print */}
            <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between print:hidden">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                        <span className="text-white font-black text-lg italic">S</span>
                    </div>
                    <span className="font-bold tracking-tight text-slate-800">STEAM Spark</span>
                </Link>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Download ToC
                    </button>
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Home
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 md:py-12 max-w-[1400px]">
                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 print:mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <span className="text-sm font-bold uppercase tracking-[0.2em]">STEAM Spark</span>
                            <span className="h-px w-8 bg-slate-200"></span>
                            <span className="text-sm font-medium">Impact Strategy</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Theory of Change // <span className="text-slate-400 font-medium">Overview</span></h1>
                    </div>
                    <div className="text-right hidden md:block print:block">
                        <p className="text-sm font-bold text-slate-500">Prepared for: <span className="text-slate-900">Mastercard Foundation EdTech Fellowship</span></p>
                        <p className="text-xs text-slate-400 mt-1 italic">Validated Impact Strategy 2024-2030</p>
                    </div>
                </header>

                {/* The Grid Infrastructure */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">

                    {/* COLUMN 1: THE PROBLEM (Coral/Red) */}
                    <div className="md:col-span-1 flex flex-col gap-3 print:gap-2">
                        <GridBlock
                            num="1"
                            title="The Core Problem"
                            desc="STEAM education in Africa is inaccessible for students and exploitative for educators, with agents taking up to 50% cuts."
                            color="bg-[#FF6B6B]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="2"
                            title="Target Audience"
                            desc="G1-12 students seeking project-based mastery and educators transitioning into educational entrepreneurs."
                            color="bg-[#FF8787]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="3"
                            title="The Multiplier"
                            desc="Solving teacher burnout directly increases the quality of delivery, creating a narrative of sustainable impact."
                            color="bg-[#FFA8A8]"
                            textColor="text-white"
                        />
                    </div>

                    {/* COLUMN 2: UNIQUE SOLUTION (Orange) */}
                    <div className="md:col-span-1 flex print:col-span-1">
                        <GridBlock
                            num="4"
                            title="Unique Solution: The Shopify for STEAM"
                            desc="An AI-powered marketplace where teachers own their brand, curriculums, and 80% of their earnings. We provide the 'Business-in-a-Box' infrastructure for tutors to become elite program owners."
                            color="bg-[#FF922B]"
                            textColor="text-white"
                            className="h-full"
                        />
                    </div>

                    {/* COLUMN 3: ACTIVITIES (Green) */}
                    <div className="md:col-span-1 flex flex-col gap-3 print:gap-2">
                        <GridBlock
                            num="5"
                            title="AI Marketplace Matching"
                            desc="Precision matching using LLMs to pair student interest with teacher expert niches."
                            color="bg-[#51CF66]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="5"
                            title="Personalized Roadmaps"
                            desc="Adaptive learning paths that evolve based on child performance and curiosity."
                            color="bg-[#69DB7C]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="5"
                            title="Teacher Business Tools"
                            desc="Automated scheduling, billing, and profile optimization suites for educators."
                            color="bg-[#8CE99A]"
                            textColor="text-white"
                        />
                    </div>

                    {/* COLUMN 4: SHORT TERM OUTCOMES (Cyan) */}
                    <div className="md:col-span-1 flex flex-col gap-3 print:gap-2">
                        <GridBlock
                            num="6"
                            title="Teacher Income Boost"
                            desc="Immediate increases in take-home pay via reduced platform commissions."
                            color="bg-[#22B8CF]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="6"
                            title="Student Engagement"
                            desc="Higher retention in STEM subjects through interactive, gamified projects."
                            color="bg-[#3BC9DB]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="6"
                            title="Data-Driven Clarity"
                            desc="Parents gain real-time visibility into specific skill competencies."
                            color="bg-[#66D9E8]"
                            textColor="text-white"
                        />
                    </div>

                    {/* COLUMN 5: LONG TERM OUTCOMES (Indigo) */}
                    <div className="md:col-span-1 flex flex-col gap-3 print:gap-2">
                        <GridBlock
                            num="7"
                            title="Educator Retention"
                            desc="Reduced stress and professional burnout, keeping top talent in education."
                            color="bg-[#5C7CFA]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="7"
                            title="STEAM Mastery"
                            desc="Students capable of winning international coding and robotics leagues."
                            color="bg-[#748FFC]"
                            textColor="text-white"
                        />
                        <GridBlock
                            num="7"
                            title="Workforce Readiness"
                            desc="Building 21st-century logic and digital literacy at the foundational level."
                            color="bg-[#91A7FF]"
                            textColor="text-white"
                        />
                    </div>

                    {/* COLUMN 6: DIRECT IMPACT (Purple) */}
                    <div className="md:col-span-1 flex print:col-span-1">
                        <GridBlock
                            num="8"
                            title="Direct Impact: Closing the Digital Divide"
                            desc="A self-sustaining ecosystem that democratizes high-quality STEAM education, ensuring African-led innovation is globally competitive and locally accessible to all income groups."
                            color="bg-[#845EF7]"
                            textColor="text-white"
                            className="h-full"
                        />
                    </div>

                </div>

                {/* Bottom Legend / Verification - Hidden in PDF/Print slightly or made minimal */}
                <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start border-t border-slate-200 pt-8 print:mt-6 print:pt-4">
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-500">
                            <Info className="w-4 h-4" /> Assumptions
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex gap-2">
                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                Teachers are motivated by long-term growth tools, not just quick gigs.
                            </li>
                            <li className="flex gap-2">
                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                Mobile money penetration allows for frictionless financial inclusion.
                            </li>
                        </ul>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-slate-500">
                            Historical Traction (The Evidence Bank)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Metric label="Manual History" value="7 Years" />
                            <Metric label="Families Trained" value="150+" />
                            <Metric label="Annual Revenue" value="$20K+" />
                            <Metric label="Competition Wins" value="Africa Code Challenge" />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-12 pb-12 text-center text-slate-400 text-xs font-medium print:mt-4 print:pb-0">
                <p>STEAM Spark Platform // 2026 Strategy Document // Generated for teepreneur/STEAMSpark</p>
            </footer>

            {/* Global Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: landscape;
            margin: 10mm;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          nav, button {
            display: none !important;
          }
          .GridBlock {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
        </div>
    );
}

function GridBlock({ num, title, desc, color, textColor, className = "" }: {
    num: string;
    title: string;
    desc: string;
    color: string;
    textColor: string;
    className?: string;
}) {
    return (
        <div className={`GridBlock group relative p-6 rounded-[2rem] ${color} ${textColor} flex flex-col shadow-sm transition-all hover:scale-[1.01] hover:shadow-xl ${className}`}>
            <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-xs font-bold mb-6 opacity-60">
                {num}
            </div>
            <h3 className="text-xl font-black leading-tight mb-4 tracking-tighter uppercase">{title}</h3>
            <p className="text-sm font-medium leading-relaxed opacity-90">{desc}</p>

            {/* Decorative pulse element (hidden in print) */}
            <div className="absolute bottom-6 right-6 w-2 h-2 bg-white/20 rounded-full animate-ping print:hidden"></div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-1 print:bg-white print:border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-lg font-black text-slate-900 leading-none">{value}</span>
        </div>
    );
}
