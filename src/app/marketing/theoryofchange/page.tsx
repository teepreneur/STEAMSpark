"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    Lightbulb,
    Settings,
    BarChart3,
    Users,
    Target,
    Globe,
    ShieldCheck,
    ChevronRight,
    Download,
    ArrowLeft
} from "lucide-react";

export default function TheoryOfChangePage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-indigo-100 print:bg-white">
            {/* Navigation - Hidden in Print */}
            <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md print:hidden">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <Lightbulb className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">STEAM Spark</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 md:py-24 max-w-7xl">
                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center mb-24 print:mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        Impact Framework
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-slate-900 leading-[1.1]">
                        Our Theory <br /><span className="text-slate-400 font-medium">of Change</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
                        Democratizing world-class STEAM education across Africa, empowering a generation of innovative problem-solvers and educational entrepreneurs.
                    </p>
                </section>

                {/* The Logic Model (Vertical Flow) */}
                <section className="mb-32 print:mb-12">
                    <div className="text-center mb-16 print:mb-8">
                        <h2 className="text-3xl font-black tracking-tight uppercase text-slate-400 italic">The Impact Chain</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        {/* Step 1: Inputs (Coral) */}
                        <ImpactCard
                            step="1"
                            title="Inputs"
                            icon={<Settings className="w-6 h-6" />}
                            items={[
                                "$100k Pre-Seed Funding",
                                "AI Product Infrastructure",
                                "7-Year Pedagogical Data",
                                "Network of 50+ Educators"
                            ]}
                            color="bg-[#FF6B6B]"
                            textColor="text-white"
                            iconBg="bg-white/20"
                        />

                        {/* Step 2: Activities (Orange) */}
                        <ImpactCard
                            step="2"
                            title="Activities"
                            icon={<BarChart3 className="w-6 h-6" />}
                            items={[
                                "AI Marketplace Matching",
                                "Personalized learning Paths",
                                "Teacher Business Tools",
                                "Project-Based STEAM"
                            ]}
                            color="bg-[#FF922B]"
                            textColor="text-white"
                            iconBg="bg-white/20"
                        />

                        {/* Step 3: Outputs (Green) */}
                        <ImpactCard
                            step="3"
                            title="Outputs"
                            icon={<Users className="w-6 h-6" />}
                            items={[
                                "# of Vetted Educators",
                                "# of Students Enrolled",
                                "# of Successful Bookings",
                                "# of Completed Projects"
                            ]}
                            color="bg-[#51CF66]"
                            textColor="text-white"
                            iconBg="bg-white/20"
                        />

                        {/* Step 4: Outcomes (Cyan/Blue) */}
                        <ImpactCard
                            step="4"
                            title="Outcomes"
                            icon={<Target className="w-6 h-6" />}
                            items={[
                                "Increased Teacher Earnings",
                                "Improved Student Competency",
                                "Parental Visibility (Data)",
                                "Mindset Shift to Entrepreneur"
                            ]}
                            color="bg-[#22B8CF]"
                            textColor="text-white"
                            iconBg="bg-white/20"
                        />

                        {/* Step 5: Impact (Purple) */}
                        <ImpactCard
                            step="5"
                            title="Impact"
                            icon={<Globe className="w-6 h-6" />}
                            items={[
                                "Closing the Digital Divide",
                                "Reduced Educator Stress",
                                "Workforce Readiness",
                                "African-led Innovation"
                            ]}
                            color="bg-[#845EF7]"
                            textColor="text-white"
                            iconBg="bg-white/20"
                            isLast
                        />
                    </div>
                </section>

                {/* Narrative Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center print:hidden">
                    <div className="space-y-10">
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">The Narrative of Change</h2>
                        <div className="space-y-8 text-lg text-slate-500 leading-relaxed font-medium">
                            <p>
                                <strong className="text-slate-900 border-b-2 border-[#FF6B6B]">The Problem:</strong> Most EdTech solutions ignore the delivery agents—teachers. In Ghana, 67% of tutors face chronic stress due to late payments. This prevents quality instruction.
                            </p>
                            <p>
                                <strong className="text-slate-900 border-b-2 border-[#51CF66]">Our Intervention:</strong> We provide a <span className="text-blue-600 font-bold">Creator Economy model</span>. By reducing commissions from 50% to 20% and providing AI-powered tools, we turn tired tutors into motivated educational entrepreneurs.
                            </p>
                            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform"></div>
                                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">"The Logical Chain"</h3>
                                <p className="text-base text-slate-600 italic">
                                    If we empower educators with tools and fair earnings... they will create higher quality programs... which leads to student mastery... ultimately building a global-ready workforce.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[3rem] blur-2xl group-hover:opacity-100 transition-opacity opacity-50"></div>
                        <div className="relative bg-white border-2 border-slate-100 rounded-[3rem] p-10 overflow-hidden shadow-xl shadow-blue-500/5">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-slate-900 tracking-tight">Validated Impact</h4>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Evidence Bank</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <ImpactMetric label="Student Projects" value="140+" />
                                    <ImpactMetric label="Educators in Network" value="50+" />
                                    <ImpactMetric label="Families Served" value="150+" />
                                    <ImpactMetric label="Continental Wins" value="Africa Code Challenge" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Assumptions Table */}
                <section className="max-w-4xl mx-auto print:mt-12">
                    <div className="text-center mb-12">
                        <div className="w-12 h-1 bg-slate-200 mx-auto mb-6"></div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Assumptions & Risks</h2>
                        <p className="text-slate-500 font-medium">Strategic factors we monitor to ensure delivery.</p>
                    </div>
                    <div className="overflow-hidden bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-6">Category</th>
                                    <th className="px-8 py-6">Assumption</th>
                                    <th className="px-8 py-6">Mitigation Strategy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                                <AssumptionRow
                                    category="Technology"
                                    assumption="Mobile penetration continues to rise in Ghana."
                                    mitigation="Platform optimized for low-bandwidth mobile views."
                                    color="text-[#FF6B6B]"
                                />
                                <AssumptionRow
                                    category="Behavioral"
                                    assumption="Teachers want to own their 'brand'."
                                    mitigation="Focus on entrepreneurship coaching & tools."
                                    color="text-[#FF922B]"
                                />
                                <AssumptionRow
                                    category="Market"
                                    assumption="Parents prioritize STEAM outcomes."
                                    mitigation="Content marketing on competition & workforce readiness."
                                    color="text-[#51CF66]"
                                />
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Closing Action - Hidden in print */}
                <section className="mt-32 text-center py-20 bg-slate-900 rounded-[3rem] relative overflow-hidden print:hidden shadow-2xl shadow-blue-900/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-32 translate-x-32"></div>
                    <h2 className="text-3xl md:text-5xl font-black mb-8 text-white tracking-tight leading-tight">Ready to fuel the <br /><span className="text-blue-400">next generation?</span></h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-blue-500/40 tracking-tight"
                        >
                            Get Started Now
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="px-10 py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-black hover:bg-white/20 transition-all tracking-tight"
                        >
                            Download Full ToC
                        </button>
                    </div>
                </section>
            </main>

            <footer className="mt-24 pb-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest print:mt-12 print:text-black">
                <p>© {new Date().getFullYear()} STEAM Spark // Democratizing World-Class Education Across Africa</p>
            </footer>

            {/* Global Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: portrait;
            margin: 15mm;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          nav, section:last-of-type, .metric-icon-overlay {
            display: none !important;
          }
          .ImpactCard {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
        </div>
    );
}

function ImpactCard({ step, title, icon, items, color, textColor, iconBg, isLast = false }: {
    step: string;
    title: string;
    icon: React.ReactNode;
    items: string[];
    color: string;
    textColor: string;
    iconBg: string;
    isLast?: boolean;
}) {
    return (
        <div className="relative z-10 flex flex-col items-center">
            <div className={`ImpactCard w-full p-8 rounded-[2.5rem] ${color} ${textColor} flex flex-col shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-inner`}>
                        {icon}
                    </div>
                    <span className="text-3xl font-black opacity-20 select-none tracking-tighter italic">0{step}</span>
                </div>
                <h3 className="font-black text-2xl mb-6 tracking-tight uppercase leading-none">{title}</h3>
                <ul className="space-y-4">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm font-bold leading-relaxed">
                            <ChevronRight className="w-4 h-4 mt-1 opacity-50 shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {!isLast && (
                <div className="hidden md:flex absolute top-1/2 -right-4 translate-y-[-50%] z-20 w-8 h-8 rounded-full bg-white border-4 border-slate-50 items-center justify-center shadow-md print:hidden">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
            )}
        </div>
    );
}

function ImpactMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-5 border-b-2 border-slate-50 last:border-0 font-black tracking-tight">
            <span className="text-slate-400 uppercase text-xs tracking-widest leading-none">{label}</span>
            <span className="text-slate-900 leading-none lg:text-lg">{value}</span>
        </div>
    );
}

function AssumptionRow({ category, assumption, mitigation, color }: { category: string; assumption: string; mitigation: string; color: string }) {
    return (
        <tr className="group hover:bg-slate-50 transition-colors">
            <td className={`px-8 py-8 font-black text-xs uppercase tracking-[0.15em] ${color}`}>{category}</td>
            <td className="px-8 py-8 text-sm font-bold text-slate-900 leading-relaxed">{assumption}</td>
            <td className="px-8 py-8 text-sm font-medium text-slate-500 leading-relaxed italic">"{mitigation}"</td>
        </tr>
    );
}
