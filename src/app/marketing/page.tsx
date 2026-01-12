import {
    Atom, Rocket, Brain, Palette, Users, ChevronRight, GraduationCap,
    Heart, Shield, BarChart3, Calendar, CreditCard, Star, Check,
    Gamepad2, Award, Map, UserPlus, Smartphone, Tablet, Monitor,
    Home, MessageSquare, Settings, Plus, Play, Sparkles, ArrowRight
} from "lucide-react"

// App subdomain for all app-related links
const APP_URL = process.env.NODE_ENV === 'production'
    ? 'https://app.steamsparkgh.com'
    : ''

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1923] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-[#3899fa] selection:text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1a2733]/95 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3899fa] to-[#2b7cd4] text-white shadow-lg shadow-[#3899fa]/30">
                                <Atom className="size-5" />
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#1a2733]" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">STEAM Spark</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a className="text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-[#3899fa] transition-colors" href="#parents">Parents</a>
                            <a className="text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-[#3899fa] transition-colors" href="#teachers">Teachers</a>
                            <a className="text-sm font-bold text-slate-500 dark:text-slate-300 hover:text-[#3899fa] transition-colors" href="#students">Students</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <a
                                href={`${APP_URL}/login`}
                                className="hidden sm:flex h-10 items-center justify-center rounded-xl border-2 border-transparent px-4 text-sm font-bold text-slate-900 dark:text-white transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Login
                            </a>
                            <a
                                href={`${APP_URL}/`}
                                className="flex h-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-white px-5 text-sm font-bold text-white dark:text-slate-900 shadow-sm transition-all hover:bg-[#3899fa] hover:text-white dark:hover:bg-[#3899fa] dark:hover:text-white"
                            >
                                Sign Up
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 lg:pt-28 lg:pb-32 bg-[radial-gradient(rgba(56,153,250,0.1)_1px,transparent_1px)] bg-[length:24px_24px]">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-[#3899fa]/10 blur-3xl" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="flex flex-col gap-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 self-center lg:self-start rounded-full bg-white dark:bg-[#1a2733] border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-bold shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-slate-500 dark:text-slate-300">Accepting Early Access Sign-ups</span>
                            </div>
                            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                                Ignite their <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3899fa] via-emerald-400 to-amber-400">Curiosity</span>
                            </h1>
                            <p className="text-xl leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 font-medium">
                                The all-in-one STEAM platform connecting curious minds with expert mentors. Personalized learning paths in Science, Tech, Engineering, Arts, and Math.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full">
                                <a
                                    href={`${APP_URL}/`}
                                    className="w-full sm:w-auto flex h-14 items-center justify-center rounded-2xl bg-[#3899fa] px-8 text-lg font-bold text-white shadow-xl shadow-[#3899fa]/25 transition-all hover:scale-105 hover:bg-[#2b7cd4] ring-4 ring-[#3899fa]/10"
                                >
                                    Parents: Get Started
                                </a>
                                <a
                                    href={`${APP_URL}/`}
                                    className="w-full sm:w-auto flex h-14 items-center justify-center rounded-2xl bg-white dark:bg-[#1a2733] border-2 border-slate-100 dark:border-slate-700 px-8 text-lg font-bold text-slate-900 dark:text-white transition-all hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-400 dark:hover:text-emerald-400 shadow-lg shadow-slate-200/50 dark:shadow-none"
                                >
                                    Teachers: Join Now
                                </a>
                            </div>
                            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm font-semibold text-slate-500 dark:text-slate-500 mt-2">
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-emerald-400" />
                                    <span>Free to join</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-emerald-400" />
                                    <span>Vetted Tutors</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-emerald-400" />
                                    <span>Cancel anytime</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative lg:h-[600px] w-full flex items-center justify-center">
                            <div className="relative w-full max-w-lg aspect-square lg:aspect-auto lg:h-full">
                                <div className="absolute top-0 right-0 w-4/5 h-3/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1a2733] z-20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <div
                                        className="h-full w-full bg-cover bg-center"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2672&auto=format&fit=crop')" }}
                                    />
                                    <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-[#1a2733]/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                                        <Brain className="size-4 text-[#3899fa]" />
                                        <span>Python Level 1</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-10 left-0 w-3/5 h-2/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1a2733] z-30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <div
                                        className="h-full w-full bg-cover bg-center"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2622&auto=format&fit=crop')" }}
                                    />
                                    <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-[#1a2733]/90 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                                        <Rocket className="size-4 text-emerald-400" />
                                        <span>Home Lab</span>
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-1/4 h-16 w-16 bg-amber-400 rounded-2xl -rotate-12 flex items-center justify-center text-white shadow-lg z-40 animate-bounce">
                                    <Sparkles className="size-8" />
                                </div>
                                <div className="absolute bottom-20 right-10 h-14 w-14 bg-pink-400 rounded-full flex items-center justify-center text-white shadow-lg z-40">
                                    <Palette className="size-7" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white dark:bg-[#1a2733]" id="how-it-works">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-[#3899fa] font-bold tracking-wider uppercase text-sm">Simple Process</span>
                        <h2 className="text-3xl font-black sm:text-4xl mt-2 mb-4">Your STEAM Journey Starts Here</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-[#0f1923] border-2 border-transparent hover:border-[#3899fa]/20 hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 rounded-2xl bg-[#3899fa]/10 text-[#3899fa] flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform">1</div>
                            <h3 className="text-xl font-bold mb-3">Connect & Match</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Parents create profiles and get instantly matched with vetted tutors based on child&apos;s interests and learning style.</p>
                        </div>
                        <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-[#0f1923] border-2 border-transparent hover:border-emerald-400/20 hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform">2</div>
                            <h3 className="text-xl font-bold mb-3">Interactive Learning</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Students dive into gamified lessons, live video sessions, and hands-on projects that make learning sticky.</p>
                        </div>
                        <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-[#0f1923] border-2 border-transparent hover:border-amber-400/20 hover:shadow-xl transition-all group">
                            <div className="h-16 w-16 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-3xl font-black mb-6 group-hover:scale-110 transition-transform">3</div>
                            <h3 className="text-xl font-bold mb-3">Track & Grow</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Watch the progress unfold on your dashboard. Earn badges, certificates, and build a portfolio of skills.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Parents */}
            <section className="py-24 bg-slate-50 dark:bg-[#0f1923] overflow-hidden" id="parents">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 order-2 lg:order-1 relative">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 translate-y-8">
                                    <div className="rounded-3xl bg-white dark:bg-[#1a2733] p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                                        <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
                                            <Shield className="size-6" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-1">Safety First</h4>
                                        <p className="text-sm text-slate-500">100% ID Verified Tutors</p>
                                    </div>
                                    <div
                                        className="rounded-3xl overflow-hidden shadow-xl h-56 bg-cover bg-center border border-slate-100 dark:border-slate-700 relative group"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop')" }}
                                    >
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="text-white font-bold text-lg text-center px-4">AI-Powered Matching</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div
                                        className="rounded-3xl overflow-hidden shadow-xl h-56 bg-cover bg-center border border-slate-100 dark:border-slate-700 relative group"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2670&auto=format&fit=crop')" }}
                                    >
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="text-white font-bold text-lg text-center px-4">STEM Kits Included</span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl bg-white dark:bg-[#1a2733] p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-[#3899fa] flex items-center justify-center mb-4">
                                            <BarChart3 className="size-6" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-1">Real-time Data</h4>
                                        <p className="text-sm text-slate-500">Track every milestone</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-[#3899fa]/10 px-4 py-2 text-sm font-bold text-[#3899fa] mb-6">
                                <Users className="size-4" />
                                For Parents
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black mb-6">
                                Complete Visibility.<br />
                                Total Peace of Mind.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                We know education is an investment. STEAM Spark gives you the tools to ensure your child is safe, engaged, and actually learning.
                            </p>
                            <div className="space-y-6 mb-10">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white dark:bg-[#1a2733] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm text-[#3899fa]">
                                        <GraduationCap className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Curated Curriculum</h4>
                                        <p className="text-slate-500 dark:text-slate-400">Access world-class materials tailored to age groups (5-16 yrs).</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white dark:bg-[#1a2733] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm text-emerald-400">
                                        <Users className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Expert Tutor Matching</h4>
                                        <p className="text-slate-500 dark:text-slate-400">Find the perfect mentor who speaks your child&apos;s language.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white dark:bg-[#1a2733] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm text-amber-400">
                                        <Award className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Progress Tracking</h4>
                                        <p className="text-slate-500 dark:text-slate-400">Weekly reports and live session feedback directly to your phone.</p>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={`${APP_URL}/signup/parent`}
                                className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-white px-8 text-base font-bold text-white dark:text-slate-900 shadow-lg hover:bg-[#3899fa] hover:text-white dark:hover:bg-[#3899fa] dark:hover:text-white transition-colors"
                            >
                                Create Parent Account
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Teachers */}
            <section className="py-24 bg-white dark:bg-[#1a2733]" id="teachers">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-500 mb-6">
                                <GraduationCap className="size-4" />
                                For Teachers
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black mb-6">
                                Teach What You Love.<br />
                                Earn What You Deserve.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                Turn your passion for STEAM into a thriving career. We handle the admin work—scheduling, payments, and resources—so you can focus on inspiring the next generation.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mb-10">
                                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-400/50 transition-colors bg-slate-50 dark:bg-[#0f1923]">
                                    <Calendar className="size-10 text-emerald-400 mb-3" />
                                    <h4 className="font-bold text-lg mb-1">Flexibility</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Set your own hours and rates.</p>
                                </div>
                                <div className="p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-400/50 transition-colors bg-slate-50 dark:bg-[#0f1923]">
                                    <CreditCard className="size-10 text-emerald-400 mb-3" />
                                    <h4 className="font-bold text-lg mb-1">Secure Pay</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Guaranteed bi-weekly payouts.</p>
                                </div>
                            </div>
                            <a
                                href={`${APP_URL}/signup/teacher`}
                                className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-emerald-400 text-emerald-500 px-8 text-base font-bold hover:bg-emerald-400 hover:text-white transition-all"
                            >
                                Apply to Teach
                            </a>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="relative rounded-3xl bg-[#0f1923] p-6 sm:p-10 shadow-2xl border border-slate-800">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-white font-bold text-2xl">Teacher Dashboard</h3>
                                        <p className="text-slate-400 text-sm">Welcome back, Sarah</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-400 to-green-400 flex items-center justify-center text-white shadow-lg shadow-green-900/50">
                                        <Users className="size-5" />
                                    </div>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="bg-[#1a2733] border border-slate-700 rounded-2xl p-5 hover:border-emerald-400/50 transition-colors cursor-default">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Earnings</span>
                                            <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">+12% this week</span>
                                        </div>
                                        <div className="text-4xl font-mono text-white tracking-tight">GHS 845.00</div>
                                    </div>
                                    <div className="bg-[#1a2733] border border-slate-700 rounded-2xl p-5 hover:border-[#3899fa]/50 transition-colors">
                                        <div className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Next Session Starts in 15m</div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-xl bg-[#3899fa]/20 flex items-center justify-center text-[#3899fa]">
                                                <Brain className="size-6" />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-lg">Intro to Robotics</div>
                                                <div className="text-slate-400 text-sm">Today, 4:00 PM • 3 Students</div>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex gap-3">
                                            <button className="flex-1 bg-[#3899fa] hover:bg-[#2b7cd4] text-white text-sm font-bold py-2.5 rounded-xl transition-colors">Launch Class</button>
                                            <button className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">•••</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
                                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#3899fa]/20 blur-3xl pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Students */}
            <section className="py-24 bg-gradient-to-br from-[#3899fa] to-blue-600 text-white relative overflow-hidden" id="students">
                <Settings className="absolute top-10 left-10 size-36 text-white opacity-5 rotate-12" />
                <Rocket className="absolute bottom-10 right-10 size-36 text-white opacity-5 -rotate-12" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-block rounded-full bg-white/20 px-4 py-1 mb-6 border border-white/30 backdrop-blur-sm">
                        <span className="font-bold text-sm tracking-wide">STUDENT EXPERIENCE</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black mb-6">Learning That Feels Like Play</h2>
                    <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">
                        Forget boring textbooks. Dive into gamified challenges, earn digital badges, and unlock new levels of knowledge on your personal roadmap.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                            <Gamepad2 className="size-10 mb-3 text-amber-400 mx-auto" />
                            <h3 className="font-bold text-lg">Gamified</h3>
                            <p className="text-sm text-blue-100 opacity-80">Level up as you learn</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                            <Award className="size-10 mb-3 text-emerald-400 mx-auto" />
                            <h3 className="font-bold text-lg">Badges</h3>
                            <p className="text-sm text-blue-100 opacity-80">Showcase achievements</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                            <Map className="size-10 mb-3 text-pink-400 mx-auto" />
                            <h3 className="font-bold text-lg">Roadmaps</h3>
                            <p className="text-sm text-blue-100 opacity-80">Clear path to mastery</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                            <UserPlus className="size-10 mb-3 text-white mx-auto" />
                            <h3 className="font-bold text-lg">Friends</h3>
                            <p className="text-sm text-blue-100 opacity-80">Learn with peers</p>
                        </div>
                    </div>
                    <a
                        href={`${APP_URL}/`}
                        className="inline-flex bg-white text-[#3899fa] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                        Explore Student Features
                    </a>
                </div>
            </section>

            {/* Platform Showcase */}
            <section className="py-24 bg-slate-50 dark:bg-[#0f1923] relative overflow-hidden" id="app-showcase">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-40 left-10 w-72 h-72 bg-[#3899fa]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-40 right-10 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-pink-400 font-bold tracking-wider uppercase text-sm">Platform Preview</span>
                        <h2 className="text-3xl font-black sm:text-4xl mt-2 mb-6">Designed for the Entire Ecosystem</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
                            Seamless interfaces tailored to the unique needs of parents, students, and teachers. Manage, learn, and grow from any device.
                        </p>
                    </div>

                    {/* Device Previews */}
                    <div className="flex flex-col gap-24">
                        {/* Mobile Preview */}
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 flex justify-center lg:justify-end order-2 lg:order-1">
                                <div className="relative mx-auto border-slate-800 bg-slate-800 border-[14px] rounded-[2.5rem] h-[500px] w-[250px] shadow-xl">
                                    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-50 dark:bg-[#0f1923] flex flex-col">
                                        <div className="bg-white dark:bg-[#1a2733] p-4 pt-8 pb-3 shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Parent Portal</div>
                                                    <div className="text-sm font-bold">The Smith Family</div>
                                                </div>
                                                <div className="h-6 w-6 rounded-full bg-[#3899fa]/20 text-[#3899fa] flex items-center justify-center">
                                                    <MessageSquare className="size-3" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-3 space-y-3 overflow-hidden">
                                            <div className="bg-white dark:bg-[#1a2733] p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">👦</div>
                                                    <div>
                                                        <div className="font-bold text-xs">Noah</div>
                                                        <div className="text-[10px] text-slate-500">Grade 5 • Coding</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                                                    <div className="bg-[#3899fa] h-1.5 rounded-full" style={{ width: "75%" }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-500">
                                                    <span>Python Basics</span>
                                                    <span className="font-bold text-[#3899fa]">75%</span>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-[#3899fa] to-blue-600 p-3 rounded-xl shadow-lg text-white">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Star className="size-3 text-yellow-300" />
                                                    <span className="text-[10px] font-bold">New Match!</span>
                                                </div>
                                                <p className="text-[10px] opacity-90 mb-2">We found a Math tutor for Emma.</p>
                                                <button className="w-full py-1.5 bg-white text-[#3899fa] text-[10px] font-bold rounded-lg">View Profile</button>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-[#1a2733] p-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-400">
                                            <Home className="size-4 text-[#3899fa]" />
                                            <Calendar className="size-4" />
                                            <MessageSquare className="size-4" />
                                            <Users className="size-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-[#3899fa]/10 px-3 py-1 text-xs font-bold text-[#3899fa] mb-4">
                                    <Smartphone className="size-3" />
                                    Mobile
                                </div>
                                <h3 className="text-3xl font-bold mb-4">Parent Companion</h3>
                                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
                                    Stay connected to your child&apos;s education wherever you are. Approve tutors, view progress reports, and manage schedules directly from your pocket.
                                </p>
                                <ul className="mt-6 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                    <li className="flex items-center gap-2 justify-center lg:justify-start">
                                        <Check className="size-4 text-green-500" />
                                        Instant notifications for class updates
                                    </li>
                                    <li className="flex items-center gap-2 justify-center lg:justify-start">
                                        <Check className="size-4 text-green-500" />
                                        Easy one-tap payments
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white dark:bg-[#1a2733]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-black text-center mb-16">Trusted by the Community</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 dark:bg-[#0f1923] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-amber-400 mb-6">
                                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                            </div>
                            <p className="text-slate-500 dark:text-slate-300 mb-8 italic text-lg leading-relaxed">&quot;My daughter used to struggle with math, but the gamified approach here completely changed her perspective. She loves earning badges!&quot;</p>
                            <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                                <div>
                                    <div className="font-bold">Elena R.</div>
                                    <div className="text-sm text-slate-500">Parent of 2</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0f1923] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-amber-400 mb-6">
                                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                            </div>
                            <p className="text-slate-500 dark:text-slate-300 mb-8 italic text-lg leading-relaxed">&quot;As a retired engineer, I wanted to give back. The platform makes it so easy to schedule classes and connect with curious minds.&quot;</p>
                            <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500" />
                                <div>
                                    <div className="font-bold">Marcus T.</div>
                                    <div className="text-sm text-slate-500">Physics Tutor</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0f1923] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-amber-400 mb-6">
                                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
                            </div>
                            <p className="text-slate-500 dark:text-slate-300 mb-8 italic text-lg leading-relaxed">&quot;The robotics roadmap is awesome! I built my first moving robot last week. The live help from my tutor was super useful.&quot;</p>
                            <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
                                <div>
                                    <div className="font-bold">Leo K.</div>
                                    <div className="text-sm text-slate-500">Student (Age 12)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-slate-50 dark:bg-[#0f1923] border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4">Ready to Ignite the Spark?</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400">Join thousands of parents and educators transforming STEAM education.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <a
                            href={`${APP_URL}/signup/parent`}
                            className="group relative overflow-hidden rounded-3xl bg-blue-50 dark:bg-blue-900/10 p-10 text-center border-2 border-blue-100 dark:border-blue-900/30 hover:border-[#3899fa] transition-colors"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="h-16 w-16 rounded-2xl bg-[#3899fa] text-white flex items-center justify-center text-3xl shadow-lg shadow-[#3899fa]/30">
                                    <Heart className="size-8" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">I&apos;m a Parent</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Get personalized learning plans for your child.</p>
                            <span className="w-full h-12 rounded-xl bg-[#3899fa] font-bold text-white shadow-lg hover:bg-[#2b7cd4] transition-colors flex items-center justify-center">
                                Parent Sign Up
                            </span>
                        </a>
                        <a
                            href={`${APP_URL}/signup/teacher`}
                            className="group relative overflow-hidden rounded-3xl bg-green-50 dark:bg-green-900/10 p-10 text-center border-2 border-green-100 dark:border-green-900/30 hover:border-emerald-400 transition-colors"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="h-16 w-16 rounded-2xl bg-emerald-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-400/30">
                                    <GraduationCap className="size-8" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">I&apos;m an Educator</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Start teaching and earning on your schedule.</p>
                            <span className="w-full h-12 rounded-xl bg-white dark:bg-[#1a2733] border-2 border-emerald-400 font-bold text-emerald-500 shadow-lg hover:bg-emerald-400 hover:text-white transition-colors flex items-center justify-center">
                                Teacher Sign Up
                            </span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-[#1a2733] pt-20 pb-10 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
                        <div className="col-span-2 lg:col-span-2 pr-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3899fa] text-white">
                                    <Atom className="size-5" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight">STEAM Spark</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed mb-8 max-w-sm">
                                Empowering the next generation of innovators through accessible, engaging, and safe STEAM education. Join the revolution today.
                            </p>
                            <div className="flex gap-4">
                                <a className="h-10 w-10 rounded-full bg-slate-50 dark:bg-[#0f1923] flex items-center justify-center text-slate-400 hover:text-[#3899fa] hover:bg-white shadow-sm transition-all" href="#">
                                    <Rocket className="size-4" />
                                </a>
                                <a className="h-10 w-10 rounded-full bg-slate-50 dark:bg-[#0f1923] flex items-center justify-center text-slate-400 hover:text-[#3899fa] hover:bg-white shadow-sm transition-all" href="#">
                                    <MessageSquare className="size-4" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Platform</h4>
                            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-500">
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#how-it-works">How it Works</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#parents">For Parents</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#teachers">For Teachers</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Resources</h4>
                            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-500">
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Blog</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Community</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Help Center</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-500">
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">About Us</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Careers</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-[#3899fa] transition-colors" href="#">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-8 text-center text-sm text-slate-500 dark:text-slate-500">
                        <p>© {new Date().getFullYear()} STEAM Spark Ghana. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
