"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createChildProfile, verifyOnboardingLink } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Bot, Code, Calculator, FlaskConical, Palette, Cog, CheckCircle2, Loader2, Sparkles, GraduationCap, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const interests = [
    { id: "robotics", label: "Robotics", icon: Bot },
    { id: "coding", label: "Coding", icon: Code },
    { id: "math", label: "Math", icon: Calculator },
    { id: "science", label: "Science", icon: FlaskConical },
    { id: "arts", label: "Arts", icon: Palette },
    { id: "engineering", label: "Engineering", icon: Cog },
]

const grades = [
    { value: "prek", label: "Pre-K" },
    { value: "k", label: "Kindergarten" },
    { value: "1-3", label: "1st - 3rd Grade" },
    { value: "4-6", label: "4th - 6th Grade" },
    { value: "7-9", label: "7th - 9th Grade" },
    { value: "10-12", label: "10th - 12th Grade" },
]

const primaryGoals = [
    { value: "explore", label: "Explore new hobbies" },
    { value: "grades", label: "Improve school grades" },
    { value: "career", label: "Prepare for future career" },
    { value: "competition", label: "Prepare for competitions" },
    { value: "confidence", label: "Build confidence" },
    { value: "skills", label: "Develop specific skills" },
]

function OnboardingContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const parentId = searchParams.get("id")
    
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [parentName, setParentName] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])

    useEffect(() => {
        if (!parentId) {
            setError("Missing onboarding link details.")
            setVerifying(false)
            return
        }

        async function verify() {
            const result = await verifyOnboardingLink(parentId!)
            if (result.error) {
                setError(result.error)
            } else if (result.full_name) {
                setParentName(result.full_name)
            }
            setVerifying(false)
        }

        verify()
    }, [parentId])

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        // Add manual fields
        selectedInterests.forEach(i => formData.append('interests', i))
        formData.append('parent_id', parentId || '')

        const result = await createChildProfile(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl border-t-4 border-t-green-500">
                    <div className="mx-auto size-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="size-10 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Awesome!</h1>
                        <p className="text-muted-foreground mt-2">
                            {parentName}, your child's profile has been updated. Our STEAM Spark instructors are ready to help!
                        </p>
                    </div>
                    <Button className="w-full font-bold shadow-lg" onClick={() => router.push('/login')}>
                        Log In to your Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <Logo size={48} variant="full" />
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to the Family!</h1>
                        <p className="text-slate-500 font-medium max-w-md">
                            Hi <span className="text-primary font-bold">{parentName}</span>, let's build your learner's profile to find the best classes for them.
                        </p>
                    </div>
                </div>

                {error && (
                    <Card className="border-destructive/20 bg-destructive/5 text-destructive p-4 text-center">
                        {error}
                    </Card>
                )}

                {!error && (
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
                            <CardHeader className="bg-slate-900 text-white p-8">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary-foreground animate-pulse" />
                                    Learner Profile
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Tell us about your child so we can tailor their experience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Child's Name *</Label>
                                        <Input id="name" name="name" required placeholder="e.g. Ama" className="h-12 text-lg" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input id="age" name="age" type="number" min="3" max="18" placeholder="8" className="h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="grade">Grade</Label>
                                            <select name="grade" className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                <option value="">Select Grade</option>
                                                {grades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Interests */}
                                <div className="space-y-4">
                                    <Label className="text-base font-bold text-slate-900">What sparks their curiosity?</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {interests.map((interest) => (
                                            <button
                                                key={interest.id}
                                                type="button"
                                                onClick={() => toggleInterest(interest.id)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group",
                                                    selectedInterests.includes(interest.id)
                                                        ? "bg-primary/5 border-primary text-primary shadow-inner"
                                                        : "border-slate-100 hover:border-primary/50 text-slate-500 hover:text-slate-900 bg-white"
                                                )}
                                            >
                                                <interest.icon className={cn("size-6 group-hover:scale-110 transition-transform", selectedInterests.includes(interest.id) && "animate-bounce")} />
                                                <span className="text-xs font-black uppercase tracking-wider">{interest.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Goals */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="primary_goal" className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <Target className="size-5 text-green-500" />
                                            Primary Learning Goal
                                        </Label>
                                        <select name="primary_goal" className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                            <option value="">What's the main objective?</option>
                                            {primaryGoals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="goals" className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <GraduationCap className="size-5 text-primary" />
                                            Detailed Objectives & Notes
                                        </Label>
                                        <Textarea 
                                            id="goals" 
                                            name="goals" 
                                            placeholder="Tell us about what your child loves or what you want them to achieve..." 
                                            className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-base"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 p-8 border-t border-slate-100">
                                <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black shadow-xl hover:translate-y-[-2px] transition-all">
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-5 mr-2 animate-spin" />
                                            Saving Profile...
                                        </>
                                    ) : (
                                        <>
                                            Complete Profile
                                            <Sparkles className="size-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                )}
            </div>
        </div>
    )
}

export default function ChildOnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}
