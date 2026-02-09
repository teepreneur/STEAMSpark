'use client'

import { useState } from 'react'
import { Loader2, ArrowRight, CheckCircle, Sparkles, BookOpen, Monitor, Calculator, Palette, Plus } from 'lucide-react'

export default function ParentInterestForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        child_age: '',
        interests: [] as string[],
        needs_setup_help: false
    })
    const [otherInterest, setOtherInterest] = useState('')

    const interestOptions = [
        { id: 'Coding', label: 'Coding', icon: Monitor },
        { id: 'Robotics', label: 'Robotics', icon: Sparkles },
        { id: 'Science', label: 'Science', icon: BookOpen },
        { id: 'Math', label: 'Math', icon: Calculator },
        { id: 'Art', label: 'Art/Design', icon: Palette },
        { id: 'Other', label: 'Other', icon: Plus }
    ]

    const toggleInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/early-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: 'parent',
                    interests: [
                        ...formData.interests.filter(i => i !== 'Other'),
                        ...(formData.interests.includes('Other') && otherInterest ? [otherInterest] : [])
                    ].join(', ') // Convert array to string for DB
                })
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    if (isSuccess) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">You're on the list!</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                    Thank you for joining the STEAM Spark family. We'll be in touch shortly to help you get started.
                </p>
                <button
                    onClick={() => {
                        setIsSuccess(false)
                        setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            child_age: '',
                            interests: [],
                            needs_setup_help: false
                        })
                        setOtherInterest('')
                    }}
                    className="text-blue-500 font-medium hover:text-blue-600 transition"
                >
                    Register another child
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-100 h-full">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Secure Early Access</h2>
                <p className="text-slate-600 mt-2">
                    Join 150+ founding families. We'll handle the account setup for you.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Parent's Name *</label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        placeholder="e.g. Akosua Mensah"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Phone *</label>
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
                        <label className="text-sm font-medium text-slate-700">Email *</label>
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
                    <label className="text-sm font-medium text-slate-700">Child's Age Group</label>
                    <select
                        name="child_age"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
                        value={formData.child_age}
                        onChange={handleChange}
                    >
                        <option value="">Select age range...</option>
                        <option value="4-6">4-6 years (Early Learners)</option>
                        <option value="7-9">7-9 years (Primary)</option>
                        <option value="10-12">10-12 years (Junior)</option>
                        <option value="13-15">13-15 years (Senior)</option>
                        <option value="16+">16+ years (Advanced)</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Interests (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {interestOptions.map((option) => {
                            const isSelected = formData.interests.includes(option.id)
                            const Icon = option.icon
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => toggleInterest(option.id)}
                                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                    {formData.interests.includes('Other') && (
                        <input
                            type="text"
                            placeholder="Please specify other interests..."
                            value={otherInterest}
                            onChange={(e) => setOtherInterest(e.target.value)}
                            className="w-full h-11 px-4 mt-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none animate-in fade-in slide-in-from-top-2 duration-200"
                        />
                    )}
                </div>

                <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                name="needs_setup_help"
                                checked={formData.needs_setup_help}
                                onChange={handleChange}
                                className="w-5 h-5 border-slate-300 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                        </div>
                        <div className="text-sm">
                            <span className="font-medium text-slate-800 block group-hover:text-blue-600 transition">
                                Help me set up my account
                            </span>
                            <span className="text-slate-500 text-xs">
                                We'll walk you through everything personally.
                            </span>
                        </div>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Request Access <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
