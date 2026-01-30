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
    ChevronRight
} from "lucide-react";

export default function TheoryOfChangePage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            <Lightbulb className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">STEAM Spark</span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                        Back to Home
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 md:py-24">
                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                        Impact Strategy
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 leading-tight">
                        Our Theory of Change
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        Democratizing world-class STEAM education across Africa, empowering a generation of innovative problem-solvers and educational entrepreneurs.
                    </p>
                </section>

                {/* The Logic Model (Visual Chain) */}
                <section className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">The Impact Chain</h2>
                        <p className="text-muted-foreground">The logical progression from resources to sustainable change.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        {/* Connection Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary/5 to-primary/20 -translate-y-1/2 z-0"></div>

                        {/* Step 1: Inputs */}
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
                            color="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            iconColor="text-slate-500"
                        />

                        {/* Step 2: Activities */}
                        <ImpactCard
                            step="2"
                            title="Activities"
                            icon={<BarChart3 className="w-6 h-6" />}
                            items={[
                                "AI Marketplace Matching",
                                "Personalized Learning Paths",
                                "Teacher Business Tools",
                                "Project-Based STEAM"
                            ]}
                            color="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50"
                            iconColor="text-blue-500"
                        />

                        {/* Step 3: Outputs */}
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
                            color="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/50"
                            iconColor="text-indigo-500"
                        />

                        {/* Step 4: Outcomes */}
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
                            color="bg-primary/5 dark:bg-primary/10 border-primary/20"
                            iconColor="text-primary"
                        />

                        {/* Step 5: Impact */}
                        <ImpactCard
                            step="5"
                            title="Impact"
                            icon={<Globe className="w-6 h-6" />}
                            items={[
                                "Closing the Digital Divide",
                                "Reduced Educator Stress",
                                "Workforce Readiness"
                            ]}
                            color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50"
                            iconColor="text-emerald-500"
                            isLast
                        />
                    </div>
                </section>

                {/* Narrative Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl font-bold tracking-tight">The Narrative of Change</h2>
                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                            <p>
                                <strong className="text-foreground">The Problem:</strong> Most EdTech solutions ignore the delivery agents—teachers. In Ghana, 67% of tutors face chronic stress due to late payments. This prevents quality instruction.
                            </p>
                            <p>
                                <strong className="text-foreground">Our Intervention:</strong> We provide a <span className="text-primary font-semibold">Creator Economy model</span>. By reducing commissions from 50% to 20% and providing AI-powered tools, we turn tired tutors into motivated educational entrepreneurs.
                            </p>
                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xl font-bold text-foreground mb-4 italic">"The Logical Chain"</h3>
                                <p className="text-base">
                                    If we empower educators with tools and fair earnings... they will create higher quality programs... which leads to student mastery... ultimately building a global-ready workforce.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-3xl blur-2xl group-hover:opacity-75 transition-opacity opacity-50"></div>
                        <div className="relative bg-card border border-border rounded-3xl p-8 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Validated Impact</h4>
                                        <p className="text-sm text-muted-foreground">Based on 7 years of manual delivery</p>
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
                <section className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Assumptions & Risks</h2>
                        <p className="text-muted-foreground">Strategic factors we monitor to ensure delivery.</p>
                    </div>
                    <div className="overflow-hidden bg-card border border-border rounded-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">Category</th>
                                    <th className="px-6 py-4 font-bold">Assumption</th>
                                    <th className="px-6 py-4 font-bold">Mitigation Strategy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AssumptionRow
                                    category="Technology"
                                    assumption="Mobile penetration continues to rise in Ghana."
                                    mitigation="Platform optimized for low-bandwidth mobile views."
                                />
                                <AssumptionRow
                                    category="Behavioral"
                                    assumption="Teachers want to own their 'brand'."
                                    mitigation="Focus on entrepreneurship coaching & tools."
                                />
                                <AssumptionRow
                                    category="Market"
                                    assumption="Parents prioritize STEAM outcomes."
                                    mitigation="Content marketing on competition & workforce readiness."
                                />
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Closing Action */}
                <section className="mt-32 text-center py-20 bg-primary/5 rounded-[3rem] border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-8">Ready to spark the future?</h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-primary/30"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/marketing/investor/theory-of-change.md"
                            className="px-8 py-4 bg-white dark:bg-white/5 border border-border rounded-2xl font-bold hover:bg-muted transition-colors"
                        >
                            Download Full ToC
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border mt-24 py-12 text-center text-muted-foreground text-sm">
                <p>© {new Date().getFullYear()} STEAM Spark. Fueling Africa's next generation of inventors.</p>
            </footer>
        </div>
    );
}

function ImpactCard({ step, title, icon, items, color, iconColor, isLast = false }: {
    step: string;
    title: string;
    icon: React.ReactNode;
    items: string[];
    color: string;
    iconColor: string;
    isLast?: boolean;
}) {
    return (
        <div className="relative z-10">
            <div className={`p-6 rounded-3xl border ${color} h-full flex flex-col transition-all hover:scale-[1.02] hover:shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-black/20 flex items-center justify-center ${iconColor} shadow-sm`}>
                        {icon}
                    </div>
                    <span className="text-2xl font-black opacity-10 select-none">0{step}</span>
                </div>
                <h3 className="font-bold text-xl mb-4">{title}</h3>
                <ul className="space-y-3 mt-auto">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-primary/50 shrink-0" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {!isLast && (
                <div className="hidden md:flex absolute top-1/2 -right-4 translate-y-[-50%] z-20 w-8 h-8 rounded-full bg-white dark:bg-background border border-border items-center justify-center shadow-sm">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
        </div>
    );
}

function ImpactMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 font-medium">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground">{value}</span>
        </div>
    );
}

function AssumptionRow({ category, assumption, mitigation }: { category: string; assumption: string; mitigation: string }) {
    return (
        <tr className="group hover:bg-muted/30 transition-colors">
            <td className="px-6 py-4 font-bold text-sm text-primary">{category}</td>
            <td className="px-6 py-4 text-sm text-foreground">{assumption}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{mitigation}</td>
        </tr>
    );
}
