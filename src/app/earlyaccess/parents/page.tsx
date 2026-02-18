'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Sparkles, Users, Target, Rocket } from 'lucide-react'
import ParentInterestForm from './ParentInterestForm'

export default function ParentEarlyAccessPage() {
    const scrollToForm = (e: React.MouseEvent) => {
        e.preventDefault()
        const element = document.getElementById('join-waitlist')
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/apple-icon-v2.png"
                            alt="STEAM Spark Ghana"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg"
                        />
                        <span className="text-2xl font-bold text-slate-800">STEAM Spark Ghana</span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6">
                        <a href="/login" className="text-slate-600 hover:text-blue-500 font-medium">
                            Sign In
                        </a>
                        <button
                            onClick={scrollToForm}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                        >
                            Get Started
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 tracking-tight">
                            Shape the Future of{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                                STEAM Education
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            Join the first 100 families to access Ghana's revolutionary STEAM education platform.
                            Co-create the perfect learning experience for your child and give them a head start in the future of work.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={scrollToForm}
                                className="inline-flex items-center justify-center bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 transition-all group"
                            >
                                Claim Your Spot
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a
                                href="#benefits"
                                className="inline-flex items-center justify-center border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-200 hover:bg-blue-50 transition"
                            >
                                Learn More
                            </a>
                        </div>

                        <div className="mt-8 flex items-center space-x-6">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-indigo-300 border-2 border-white"
                                    />
                                ))}
                            </div>
                            <div className="text-sm text-slate-600">
                                <strong className="text-slate-800">87 spots left</strong> out of 100
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
                            <Image
                                src="/early-access-parent-hero.jpg"
                                alt="African mother and daughter learning robotics together"
                                width={600}
                                height={400}
                                className="w-full h-auto"
                                priority
                            />
                        </div>
                        {/* Floating badge */}
                        <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-slate-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-600">Early Adopters</div>
                                    <div className="text-lg font-bold text-slate-900">Founding Family Status</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="bg-white py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Why Join Early Access?
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            Be part of something bigger. Help us create the platform that will transform STEAM education for thousands of Ghanaian families.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Benefit 1 - Orange (Innovation/Impact) - MOVED TO FIRST */}
                        <div className="bg-orange-50/50 rounded-2xl p-8 border border-orange-100 hover:border-orange-200 transition-colors">
                            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">
                                Built Around Your Child
                            </h3>
                            <p className="text-slate-600 mb-6">
                                Don't just use a platform—build it with us. Your feedback ensures we create the exact tools, subjects, and features your child needs to thrive.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Priority feature requests',
                                    'Beta access to new tools',
                                    'Quarterly feedback sessions',
                                    'Founding Family badge'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Benefit 2 - Blue (Perks/Loyalty) - MOVED TO SECOND */}
                        <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 hover:border-blue-200 transition-colors">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Target className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">
                                Priority Access to Experts
                            </h3>
                            <p className="text-slate-600 mb-6">
                                Your child deserves the best. Get first priority when booking our highest-rated mentors and educators before the general public.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Early access to new features',
                                    'Exclusive community events',
                                    '10% discount on future fees',
                                    'Priority educator matching'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center text-slate-700">
                                        <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Benefit 3 - Green (Savings) - MOVED TO THIRD */}
                        <div className="bg-green-50/50 rounded-2xl p-8 border border-green-100 hover:border-green-200 transition-colors">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">
                                Zero Platform Fees
                            </h3>
                            <p className="text-slate-600 mb-6">
                                As a thank you for your early trust and impact, enjoy 1 year of waived booking fees. Invest 100% of your budget into your child's learning.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                                <div className="text-sm text-slate-500 mb-1">Regular Price</div>
                                <div className="text-2xl font-bold text-slate-400 line-through">GHS 480/year</div>
                                <div className="text-3xl font-bold text-green-500 mt-2">FREE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Your Journey
                        </h2>
                        <p className="text-xl text-slate-600">
                            From signup to your child's first robotics session in 3 simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-slate-200 z-0" />

                        {/* Step 1 */}
                        <div className="relative z-10">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-blue-500/20">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">Sign Up</h3>
                                <p className="text-slate-600">
                                    Create your free account using code <strong className="text-blue-500">SPARK100</strong>.
                                    Add your child's profile and learning goals.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative z-10">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-white border-2 border-blue-500 text-blue-500 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">Find Your Tutor</h3>
                                <p className="text-slate-600">
                                    Browse vetted educators by subject, price, and reviews.
                                    Book your first session with one click.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative z-10">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-white border-2 border-blue-600 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Watch Them Grow</h3>
                                <p className="text-slate-600">
                                    Track progress on your dashboard. See skills develop.
                                    Unlock achievements. Celebrate milestones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-24 bg-blue-500 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            7 Years of Proven Results
                        </h2>
                        <p className="text-xl text-blue-100">
                            Trusted by 150+ Ghanaian families
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { label: 'Years Operating', value: '7+' },
                            { label: 'Families Served', value: '150+' },
                            { label: 'Vetted Educators', value: '50+' },
                            { label: 'Competition Wins', value: '🏆 🏆' }
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                                <div className="text-blue-200">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-white/20 rounded-full" />
                            </div>
                            <div>
                                <p className="text-lg italic mb-4 leading-relaxed">
                                    "My daughter Ama went from not knowing what coding was to winning the Africa Code Challenge.
                                    The new platform makes it even easier to track her progress. I can finally see what she's learning!"
                                </p>
                                <div className="font-semibold">— Akosua M., Parent of Ama (Age 10)</div>
                                <div className="text-blue-200 text-sm">Continental Coding Champion 🏆</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: 'What happens after the 1-year free period?',
                                a: 'After your first year, the platform fee is only GHS 40/month (or GHS 480/year). But as a founding family, you\'ll get a permanent 10% discount, bringing it down to GHS 36/month.'
                            },
                            {
                                q: 'How much do tutoring sessions cost?',
                                a: 'Session prices vary by educator and subject, typically ranging from GHS 40-100/hour. You always see the price before booking. The "zero platform fees" benefit means you don\'t pay anything extra on top of the session cost.'
                            },
                            {
                                q: 'Can I cancel anytime?',
                                a: 'Yes! There\'s no long-term commitment. You can pause or stop using the platform anytime. Your 1-year zero-fee benefit remains active as long as you keep your account.'
                            },
                            {
                                q: 'What subjects are available?',
                                a: 'Robotics, Coding (Scratch, Python, HTML/CSS), Science Experiments, Advanced Mathematics, 3D Design, and more. All STEAM-focused subjects taught by vetted educators.'
                            },
                            {
                                q: 'How do I provide feedback?',
                                a: 'You\'ll receive monthly surveys via email and WhatsApp. We also host quarterly virtual sessions where founding families can chat directly with our team about improvements.'
                            }
                        ].map((faq, idx) => (
                            <details key={idx} className="group bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <summary className="flex justify-between items-center cursor-pointer font-semibold text-slate-800 text-lg">
                                    {faq.q}
                                    <ArrowRight className="w-5 h-5 text-blue-500 group-open:rotate-90 transition-transform" />
                                </summary>
                                <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            {/* Join Waitlist Section */}
            <section id="join-waitlist" className="py-24 bg-gradient-to-r from-blue-500 to-indigo-500 text-white scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <Rocket className="w-16 h-16 mb-6 text-blue-200" />
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Don't Miss This Opportunity
                            </h2>
                            <p className="text-xl mb-8 text-white/90 leading-relaxed">
                                Only <strong>87 spots left</strong>. Be among the first to experience the future of STEAM education in Ghana.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    '1 Year of Zero Platform Fees',
                                    'Concierge Account Setup',
                                    'Priority Access to Top Tutors'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3 text-lg">
                                        <div className="bg-white/20 p-1 rounded-full">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-8 text-sm text-white/80">
                                Questions? Email us at{' '}
                                <a href="mailto:hello@steamsparkgh.com" className="underline hover:text-white">
                                    hello@steamsparkgh.com
                                </a>
                            </p>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-1 rounded-2xl bg-white/20 blur opacity-50" />
                            <div className="relative">
                                <ParentInterestForm />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <Image
                                src="/apple-icon-v2.png"
                                alt="STEAM Spark Ghana"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-white font-semibold">STEAM Spark Ghana</span>
                        </div>
                        <div className="flex space-x-6">
                            <a href="/about" className="hover:text-white transition">
                                About
                            </a>
                            <a href="/contact" className="hover:text-white transition">
                                Contact
                            </a>
                            <a href="/privacy" className="hover:text-white transition">
                                Privacy
                            </a>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-sm">
                        © 2026 STEAM Spark. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
