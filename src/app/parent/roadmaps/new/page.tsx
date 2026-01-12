"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, ArrowRight, Sparkles, Loader2, CheckCircle,
    Bot, Code, FlaskConical, Palette, Cog, Rocket, GraduationCap,
    Gamepad2, Stethoscope, Building2, Leaf, Cpu
} from "lucide-react"

interface Child {
    id: string
    name: string
    age: number | null
    grade: string | null
}

const careerOptions = [
    { id: "robotics_engineer", label: "Robotics Engineer", icon: Bot, color: "bg-blue-100 text-blue-600" },
    { id: "software_developer", label: "Software Developer", icon: Code, color: "bg-purple-100 text-purple-600" },
    { id: "game_developer", label: "Game Developer", icon: Gamepad2, color: "bg-pink-100 text-pink-600" },
    { id: "data_scientist", label: "Data Scientist", icon: Cpu, color: "bg-indigo-100 text-indigo-600" },
    { id: "biotech_researcher", label: "Biotech Researcher", icon: FlaskConical, color: "bg-green-100 text-green-600" },
    { id: "doctor", label: "Medical Professional", icon: Stethoscope, color: "bg-red-100 text-red-600" },
    { id: "architect", label: "Architect/Engineer", icon: Building2, color: "bg-orange-100 text-orange-600" },
    { id: "environmental_scientist", label: "Environmental Scientist", icon: Leaf, color: "bg-emerald-100 text-emerald-600" },
    { id: "artist_designer", label: "Digital Artist/Designer", icon: Palette, color: "bg-yellow-100 text-yellow-600" },
    { id: "aerospace_engineer", label: "Aerospace Engineer", icon: Rocket, color: "bg-cyan-100 text-cyan-600" },
]

export default function NewRoadmapPage() {
    const router = useRouter()
    const supabase = createClient()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [children, setChildren] = useState<Child[]>([])
    const [selectedChild, setSelectedChild] = useState<Child | null>(null)
    const [selectedCareer, setSelectedCareer] = useState<string>("")
    const [customInterests, setCustomInterests] = useState("")
    const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null)

    // Load children on mount
    useEffect(() => {
        async function loadChildren() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: childrenData } = await supabase
                .from('students')
                .select('id, name, age, grade')
                .eq('parent_id', user.id)

            if (childrenData) {
                setChildren(childrenData)
                if (childrenData.length === 1) {
                    setSelectedChild(childrenData[0])
                }
            }
            setLoading(false)
        }

        loadChildren()
    }, [supabase, router])

    const handleGenerateRoadmap = async () => {
        if (!selectedChild || !selectedCareer) return

        setGenerating(true)
        setError(null)

        try {
            const careerLabel = careerOptions.find(c => c.id === selectedCareer)?.label || selectedCareer

            const response = await fetch('/api/ai/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    childName: selectedChild.name,
                    childAge: selectedChild.age || 10,
                    grade: selectedChild.grade || "Primary",
                    careerGoal: careerLabel,
                    interests: customInterests ? customInterests.split(',').map(i => i.trim()) : [],
                    currentLevel: "beginner"
                })
            })

            const data = await response.json()

            if (data.error) {
                setError(data.error)
            } else {
                setGeneratedRoadmap(data)
                setStep(3)
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate roadmap")
        } finally {
            setGenerating(false)
        }
    }

    const handleSaveRoadmap = async () => {
        if (!generatedRoadmap || !selectedChild) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data, error: insertError } = await supabase
                .from('roadmaps')
                .insert({
                    parent_id: user.id,
                    student_id: selectedChild.id,
                    title: generatedRoadmap.title,
                    subject: generatedRoadmap.subject,
                    career_goal: careerOptions.find(c => c.id === selectedCareer)?.label,
                    description: generatedRoadmap.description,
                    modules: generatedRoadmap.modules,
                    progress: 0,
                    next_step: generatedRoadmap.nextStep,
                    estimated_duration: generatedRoadmap.estimatedDuration,
                    status: 'active'
                })
                .select()
                .single()

            if (insertError) throw insertError

            router.push(`/parent/roadmaps/${data.id}`)
        } catch (err: any) {
            setError(err.message || "Failed to save roadmap")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    href="/parent/roadmaps"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="size-4" /> Back to Roadmaps
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mb-4">
                        <Sparkles className="size-8" />
                    </div>
                    <h1 className="text-3xl font-black mb-2">Create AI Learning Roadmap</h1>
                    <p className="text-muted-foreground">
                        Generate a personalized STEAM learning path for your child
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "size-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                step >= s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle className="size-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={cn(
                                    "w-12 h-0.5 rounded",
                                    step > s ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {/* Step 1: Select Child */}
                {step === 1 && (
                    <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <GraduationCap className="size-6 text-primary" />
                            Select Your Child
                        </h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-primary" />
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    No children registered yet. Add a child first.
                                </p>
                                <Button asChild>
                                    <Link href="/parent/children">Add Child</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => setSelectedChild(child)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                                                selectedChild?.id === child.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {child.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{child.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {child.age ? `${child.age} years` : "Age not set"}
                                                        {child.grade && ` • ${child.grade}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedChild}
                                        className="gap-2"
                                    >
                                        Next <ArrowRight className="size-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Select Career Goal */}
                {step === 2 && (
                    <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Rocket className="size-6 text-primary" />
                            Choose a Career Path
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            What does {selectedChild?.name} dream of becoming?
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {careerOptions.map((career) => (
                                <button
                                    key={career.id}
                                    onClick={() => setSelectedCareer(career.id)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:shadow-md",
                                        selectedCareer === career.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <div className={cn("size-12 rounded-lg flex items-center justify-center", career.color)}>
                                        <career.icon className="size-6" />
                                    </div>
                                    <span className="text-sm font-medium text-center leading-tight">
                                        {career.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Optional Interests */}
                        <div className="space-y-2 mb-6">
                            <Label>Additional Interests (Optional)</Label>
                            <Input
                                placeholder="e.g., Lego, space, animals, music"
                                value={customInterests}
                                onChange={(e) => setCustomInterests(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate multiple interests with commas
                            </p>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)}>
                                <ArrowLeft className="size-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleGenerateRoadmap}
                                disabled={!selectedCareer || generating}
                                className="gap-2"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        Generate Roadmap
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Save */}
                {step === 3 && generatedRoadmap && (
                    <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                                <CheckCircle className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Roadmap Generated!</h2>
                                <p className="text-sm text-muted-foreground">Review and save to begin learning</p>
                            </div>
                        </div>

                        {/* Roadmap Preview */}
                        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl p-6 mb-6">
                            <h3 className="text-xl font-bold mb-2">{generatedRoadmap.title}</h3>
                            <p className="text-muted-foreground mb-4">{generatedRoadmap.description}</p>

                            <div className="flex flex-wrap gap-3 mb-4">
                                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                                    {generatedRoadmap.subject}
                                </span>
                                <span className="px-3 py-1 bg-background/80 rounded-full text-sm font-medium">
                                    ⏱️ {generatedRoadmap.estimatedDuration}
                                </span>
                                <span className="px-3 py-1 bg-background/80 rounded-full text-sm font-medium">
                                    📚 {generatedRoadmap.modules?.length || 0} Modules
                                </span>
                            </div>

                            {/* Modules Preview */}
                            <div className="space-y-3">
                                {generatedRoadmap.modules?.slice(0, 3).map((module: any, idx: number) => (
                                    <div key={idx} className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-sm">{module.title}</span>
                                            {module.status === 'in_progress' && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">
                                                    START HERE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-8">
                                            {module.description}
                                        </p>
                                    </div>
                                ))}
                                {generatedRoadmap.modules?.length > 3 && (
                                    <p className="text-sm text-muted-foreground text-center">
                                        +{generatedRoadmap.modules.length - 3} more modules
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Next Step */}
                        {generatedRoadmap.nextStep && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    🚀 First Step: {generatedRoadmap.nextStep}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(2)}>
                                <ArrowLeft className="size-4 mr-2" /> Regenerate
                            </Button>
                            <Button onClick={handleSaveRoadmap} disabled={loading} className="gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="size-4" />
                                        Save & Start Learning
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
