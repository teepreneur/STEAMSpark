"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getURL } from "@/lib/utils/url"
import {
    User, ShieldCheck, GraduationCap, CalendarDays, Rocket,
    Mail, Lock, CloudUpload, X, Plus, ArrowLeft, ArrowRight, Loader2, Check
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const steps = [
    { id: 1, label: "Account Info", icon: User },
    { id: 2, label: "Verify Credentials", icon: ShieldCheck },
    { id: 3, label: "Your Expertise", icon: GraduationCap },
    { id: 4, label: "Schedule", icon: CalendarDays },
    { id: 5, label: "First Gig", icon: Rocket },
]

const allSubjects = [
    "Robotics", "Python Coding", "JavaScript", "Physics", "Chemistry",
    "Biology", "Art & Design", "3D Modeling", "Electronics", "Mathematics",
    "Engineering", "Music", "Creative Writing", "Data Science", "AI/ML"
]

export default function TeacherSignupPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [submitted, setSubmitted] = useState(false)
    const totalSteps = 5

    // Step 1: Account Info
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Step 2: Credentials (file names only for UI)
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

    // Step 3: Expertise
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Robotics", "Python Coding"])
    const [bio, setBio] = useState("")
    const [subjectInput, setSubjectInput] = useState("")

    // Step 4: Schedule (simplified)
    const [availableDays, setAvailableDays] = useState<string[]>(["monday", "wednesday", "friday"])

    // Step 5: First Gig (Optional, simplified)
    const [gigTitle, setGigTitle] = useState("")
    const [gigPrice, setGigPrice] = useState("45")

    const addSubject = () => {
        if (subjectInput.trim() && !selectedSubjects.includes(subjectInput.trim())) {
            setSelectedSubjects([...selectedSubjects, subjectInput.trim()])
            setSubjectInput("")
        }
    }

    const removeSubject = (subject: string) => {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subject))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const names = Array.from(e.target.files).map(f => f.name)
            setUploadedFiles([...uploadedFiles, ...names])
        }
    }

    const handleNext = () => {
        if (currentStep < 5) setCurrentStep(currentStep + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        try {
            // 1. Sign up user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${getURL()}/auth/callback?next=/login`,
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        role: 'teacher'
                    }
                }
            })

            if (signUpError) throw signUpError
            if (!authData.user) throw new Error("Signup failed")

            // 2. Wait for trigger to create profile
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 3. Update teacher profile with full details
            await supabase.from('profiles').update({
                full_name: `${firstName} ${lastName}`,
                role: 'teacher',
                bio: bio,
                subjects: selectedSubjects,
                verification_status: 'pending'
            }).eq('id', authData.user.id)

            // 4. Create first gig if provided
            if (gigTitle) {
                await supabase.from('gigs').insert({
                    teacher_id: authData.user.id,
                    title: gigTitle,
                    price: parseFloat(gigPrice) || 45,
                    status: 'draft',
                    subject: selectedSubjects[0] || 'General'
                })
            }

            setSubmitted(true)
            // Scroll to top for confirmation view
            window.scrollTo(0, 0)

        } catch (err: any) {
            setError(err.message || "An error occurred during signup")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            {/* Sidebar */}
            <aside className="w-full md:w-80 shrink-0 bg-card border-r border-border flex flex-col justify-between p-6 relative">
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden opacity-[0.03] pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary" />
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-lg bg-primary rotate-45" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center mb-10">
                        <Logo size={32} variant="full" />
                    </Link>

                    {/* Stepper */}
                    <div className="flex flex-col gap-6 flex-1">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-lg font-bold">Teacher Signup</h1>
                            <p className="text-muted-foreground text-sm">Create your educator profile</p>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            {steps.map((step) => (
                                <button
                                    key={step.id}
                                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                                    disabled={step.id > currentStep}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                                        currentStep === step.id
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : step.id < currentStep
                                                ? "text-muted-foreground hover:bg-muted cursor-pointer"
                                                : "text-muted-foreground/50 cursor-not-allowed"
                                    )}
                                >
                                    {step.id < currentStep ? (
                                        <Check className="size-5 text-green-500" />
                                    ) : (
                                        <step.icon className="size-5" />
                                    )}
                                    <p className="text-sm font-medium">{step.id}. {step.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            Need help? <a className="text-primary hover:underline" href="#">Contact Support</a>
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-background">
                <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
                    <Link href="/" className="flex items-center">
                        <Logo size={24} variant="full" />
                    </Link>
                    <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
                </div>

                <div className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-12 lg:p-16">
                    {/* Headline */}
                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">Let's get your profile live.</h1>
                        <p className="text-muted-foreground text-lg">Join thousands of STEAM educators sparking curiosity worldwide.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step Content */}
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-primary/5 rounded-3xl border border-primary/10">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <Mail className="size-10 text-primary animate-bounce" />
                            </div>
                            <h1 className="text-3xl font-bold mb-4">Check your email</h1>
                            <p className="text-lg text-muted-foreground max-w-md mb-8">
                                We've sent a confirmation link to <span className="text-foreground font-bold">{email}</span>.
                                Please click the link to verify your account and complete your signup.
                            </p>
                            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                                <Button size="lg" className="w-full font-bold shadow-xl" asChild>
                                    <Link href="/login">Go to Login</Link>
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive it? <button onClick={handleSubmit} className="text-primary hover:underline font-medium">Click to resend</button>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-10">
                            {/* STEP 1: Account Info */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold border-b border-border pb-2">Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input className="pl-12" placeholder="jane.doe@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Create Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input className="pl-12" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Credentials */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border pb-2">
                                        <h3 className="text-lg font-semibold">Credentials</h3>
                                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                            <Lock className="size-3" /> Encrypted & Secure
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group relative">
                                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} multiple />
                                        <div className="size-12 rounded-full bg-card shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <CloudUpload className="size-6 text-primary" />
                                        </div>
                                        <p className="font-medium mb-1">Click to upload or drag and drop</p>
                                        <p className="text-sm text-muted-foreground mb-4">Resume, Teaching Certification, or Portfolio (PDF, JPG)</p>
                                        <span className="text-primary text-sm font-semibold">Browse Files</span>
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {uploadedFiles.map((file, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {file}
                                                    <button onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}>
                                                        <X className="size-4 hover:text-red-500" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-sm text-muted-foreground italic">
                                        Tip: Uploading credentials increases your profile visibility and trust score.
                                    </p>
                                </div>
                            )}

                            {/* STEP 3: Expertise */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold border-b border-border pb-2">Expertise & Skills</h3>

                                    <div className="space-y-3">
                                        <Label>Subjects You Teach</Label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedSubjects.map((subject) => (
                                                <span key={subject} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                                                    {subject}
                                                    <button onClick={() => removeSubject(subject)}>
                                                        <X className="size-4 hover:text-red-500" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="Type to search subjects (e.g. Physics, Art, Math)..."
                                                value={subjectInput}
                                                onChange={(e) => setSubjectInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                                                list="subjects-list"
                                            />
                                            <datalist id="subjects-list">
                                                {allSubjects.filter(s => !selectedSubjects.includes(s)).map(s => (
                                                    <option key={s} value={s} />
                                                ))}
                                            </datalist>
                                            <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary" onClick={addSubject}>
                                                <Plus className="size-4 mr-1" /> Add
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Bio / About You</Label>
                                        <Textarea
                                            placeholder="Tell students about your teaching style and experience..."
                                            rows={4}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Schedule */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold border-b border-border pb-2">Your Availability</h3>
                                    <p className="text-muted-foreground">Select the days you're typically available. You can refine this later in settings.</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                                                className={cn(
                                                    "p-3 rounded-lg border text-center capitalize font-medium transition-all",
                                                    availableDays.includes(day)
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: First Gig */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold border-b border-border pb-2">Create Your First Gig (Optional)</h3>
                                    <p className="text-muted-foreground">Set up your first class offering. You can skip this and do it later from your dashboard.</p>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Gig Title</Label>
                                            <Input
                                                placeholder="e.g., Intro to Robotics with Python"
                                                value={gigTitle}
                                                onChange={(e) => setGigTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hourly Rate ($)</Label>
                                            <Input
                                                type="number"
                                                placeholder="45"
                                                value={gigPrice}
                                                onChange={(e) => setGigPrice(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between pt-6 mt-4 border-t border-border">
                                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
                                    <ArrowLeft className="size-4 mr-2" /> Back
                                </Button>

                                {currentStep < 5 ? (
                                    <Button onClick={handleNext}>
                                        Continue <ArrowRight className="size-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Complete Signup <Check className="size-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-center pb-8">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link className="text-primary font-medium hover:underline" href="/login">Log in</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
