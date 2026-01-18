'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle, ArrowRight, Crown, Wallet, Feather, HeartHandshake, Rocket } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function TeacherEarlyAccessClient() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        experience: '',
        reason: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/early-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setIsSuccess(true)
            } else {
                alert('Something went wrong. Please try again.')
            }
        } catch (error) {
            alert('Error submitting form. Please check your connection.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">You're on the list!</h2>
                    <p className="text-slate-600 mb-6">
                        Thanks for joining the STEAM Spark revolution. We'll be in touch soon with your early access invite.
                    </p>
                    <a href="https://steamsparkgh.com" className="text-blue-600 font-medium hover:underline">
                        Back to Home
                    </a>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Logo size={28} variant="full" />
                    <span className="text-xs font-semibold tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        EARLY ACCESS
                    </span>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">

                    {/* Left Column: Content */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                                <span className="text-blue-600">Own</span> Your <br />
                                STEAM Story.
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                Join Ghana's first platform built BY educators, FOR educators.
                                Create your own programs, set your rates, and get paid on time—every time.
                            </p>
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-2">
                                    <Rocket className="w-4 h-4 text-slate-400" />
                                    Limited spots available
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>Launch: April 2026</span>
                            </div>
                        </div>

                        {/* Value Props Grid */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors group">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" /> Ownership
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Create and own your teaching programs. No rigid curriculums.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-green-200 transition-colors group">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" /> Earnings
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Set your own rates. Get paid directly with no delays.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors group">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Feather className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" /> Freedom
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Teach your way within our proven framework.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-colors group">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <HeartHandshake className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" /> Impact
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Shape the next generation of innovators in Ghana.
                                </p>
                            </div>
                        </div>

                        {/* Campaign Visual */}
                        <div className="relative aspect-square w-full max-w-md hidden lg:block rounded-2xl overflow-hidden shadow-2xl skew-y-3 transform lg:translate-x-12">
                            <Image
                                src="/marketing-assets/campaign-launch.png"
                                alt="Own Your STEAM Story"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-100 sticky top-24">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Join the Waitlist</h2>
                            <p className="text-slate-500 mt-2">
                                We're accepting 50 pioneering educators for early access. Secure your spot.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                    placeholder="e.g. Kwame Mensah"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        placeholder="024..."
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        placeholder="you@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Primary Subject Area</label>
                                <select
                                    name="subject"
                                    required
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
                                    value={formData.subject}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>Select a subject...</option>
                                    <option value="Robotics">Robotics / Electronics</option>
                                    <option value="Coding">Coding / Programming</option>
                                    <option value="Science">Science / Experiments</option>
                                    <option value="Math">Mathematics</option>
                                    <option value="Art">Creative Arts / Design</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                                <select
                                    name="experience"
                                    required
                                    className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
                                    value={formData.experience}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>Select experience...</option>
                                    <option value="0-1">0-1 years</option>
                                    <option value="1-3">1-3 years</option>
                                    <option value="3-5">3-5 years</option>
                                    <option value="5+">5+ years</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Request Early Access <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-slate-400 mt-4">
                                By joining, you agree to receive updates about STEAM Spark.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    )
}
