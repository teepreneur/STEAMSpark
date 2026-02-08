"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    ArrowLeft, Check, Play, Lock, Flag, Loader2, Share2, Edit,
    BookOpen, Clock, Target, ChevronRight, Lightbulb, User, GraduationCap,
    Copy, MessageCircle, ExternalLink, CheckCircle, FileText, Download
} from "lucide-react"
import { MaterialsList, Material } from "@/components/materials/materials-list"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface RecommendedCourse {
    courseTitle: string
    teacher: string
    reason: string
    courseId?: string | null
    price?: number | null
}

interface RoadmapModule {
    id: number
    title: string
    description: string
    skills: string[]
    project: string
    estimatedWeeks: number
    status: 'completed' | 'in_progress' | 'locked'
    prerequisites: string[]
    recommendedCourses?: RecommendedCourse[]
}

interface Roadmap {
    id: string
    title: string
    subject: string
    career_goal: string
    description: string
    modules: RoadmapModule[]
    progress: number
    next_step: string
    estimated_duration: string
    status: string
    created_at: string
    student: {
        name: string
        age: number | null
    }
}

export default function RoadmapDetailPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
    const [materials, setMaterials] = useState<Material[]>([])
    const [enrolledGigIds, setEnrolledGigIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMaterials, setLoadingMaterials] = useState(true)
    const [copied, setCopied] = useState(false)

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/parent/roadmaps/${params.id}`
        : ''

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleNativeShare = async () => {
        if (navigator.share && roadmap) {
            try {
                await navigator.share({
                    title: roadmap.title,
                    text: `Check out ${(roadmap.student as any)?.name}'s learning roadmap: ${roadmap.title}`,
                    url: shareUrl,
                })
            } catch (err) {
                // User cancelled or share failed, fallback to copy
                handleCopyLink()
            }
        } else {
            handleCopyLink()
        }
    }

    const handleShareWithTeacher = () => {
        // Navigate to messages with pre-filled content about the roadmap
        if (roadmap) {
            // Use simple text without emojis to avoid encoding issues
            const messageText = [
                "Hi! I'd like to share my child's learning roadmap with you:",
                "",
                `Roadmap: ${roadmap.title}`,
                `Goal: ${roadmap.career_goal}`,
                `Progress: ${roadmap.progress}%`,
                "",
                `View it here: ${shareUrl}`
            ].join('\n')

            // Use btoa for safer encoding
            const encodedMessage = encodeURIComponent(messageText)
            router.push(`/parent/messages?text=${encodedMessage}`)
        }
    }

    useEffect(() => {
        async function loadRoadmap() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('roadmaps')
                .select(`
                    *,
                    student:students (name, age)
                `)
                .eq('id', params.id)
                .eq('parent_id', user.id)
                .single()

            if (data) {
                setRoadmap(data as Roadmap)
                // Now fetch materials related to this roadmap
                fetchRelatedMaterials(data as Roadmap)
            }
            setLoading(false)
        }

        async function fetchRelatedMaterials(roadmapData: Roadmap) {
            setLoadingMaterials(true)
            try {
                // 1. Fetch public materials
                // Since materials don't have subject directly, we can fetch all public materials
                // or those linked to gigs with matching subject
                const { data: publicMaterials } = await supabase
                    .from('materials')
                    .select('*, gig:gigs(subject)')
                    .eq('visibility', 'public')

                const filteredPublic = publicMaterials?.filter(m =>
                    (m.gig as any)?.subject === roadmapData.subject || !m.gig_id
                ) || []

                // 2. Fetch materials for gigs this student is enrolled in
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('gig_id')
                    .eq('student_id', (roadmapData as any).student_id)
                    .in('status', ['confirmed', 'completed'])

                const enrolledGigIds = bookings?.map(b => b.gig_id) || []

                let enrolledMaterials: any[] = []
                if (enrolledGigIds.length > 0) {
                    const { data } = await supabase
                        .from('materials')
                        .select('*, gig:gigs(subject)')
                        .in('gig_id', enrolledGigIds)
                        .in('visibility', ['enrolled_students', 'public'])

                    if (data) enrolledMaterials = data
                }

                // Store enrolled gig IDs for download all feature
                setEnrolledGigIds(enrolledGigIds)

                // Combine and deduplicate
                const allMaterials = [...filteredPublic, ...enrolledMaterials]
                const uniqueMaterials = allMaterials.filter((m, index, self) =>
                    index === self.findIndex((t) => t.id === m.id)
                )

                setMaterials(uniqueMaterials as Material[])
            } catch (err) {
                console.error('Error fetching materials:', err)
            } finally {
                setLoadingMaterials(false)
            }
        }

        loadRoadmap()
    }, [params.id, supabase, router])

    const handleModuleAction = async (moduleIndex: number, action: 'start' | 'complete') => {
        if (!roadmap) return

        const updatedModules = [...roadmap.modules]

        if (action === 'complete') {
            updatedModules[moduleIndex].status = 'completed'
            // Unlock next module
            if (moduleIndex + 1 < updatedModules.length) {
                updatedModules[moduleIndex + 1].status = 'in_progress'
            }
        } else if (action === 'start') {
            updatedModules[moduleIndex].status = 'in_progress'
        }

        // Calculate progress
        const completedCount = updatedModules.filter(m => m.status === 'completed').length
        const newProgress = Math.round((completedCount / updatedModules.length) * 100)

        // Find next step
        const inProgressModule = updatedModules.find(m => m.status === 'in_progress')
        const nextStep = inProgressModule ? `Complete: ${inProgressModule.title}` : 'All modules completed!'

        const { error } = await supabase
            .from('roadmaps')
            .update({
                modules: updatedModules,
                progress: newProgress,
                next_step: nextStep,
                status: newProgress === 100 ? 'completed' : 'active'
            })
            .eq('id', roadmap.id)

        if (!error) {
            setRoadmap({
                ...roadmap,
                modules: updatedModules,
                progress: newProgress,
                next_step: nextStep
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!roadmap) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Roadmap not found</p>
                <Button asChild>
                    <Link href="/parent/roadmaps">Go Back</Link>
                </Button>
            </div>
        )
    }

    const completedModules = roadmap.modules?.filter(m => m.status === 'completed').length || 0
    const totalModules = roadmap.modules?.length || 0

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Back Button */}
                <Link
                    href="/parent/roadmaps"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="size-4" /> Back to Roadmaps
                </Link>

                {/* Header Section */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                            <GraduationCap className="size-4" />
                            <span>{(roadmap.student as any)?.name}'s Learning Path</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">
                            {roadmap.title}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            {roadmap.description}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Share2 className="size-4" /> Share
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                                    {copied ? (
                                        <><CheckCircle className="size-4 mr-2 text-green-500" /> Copied!</>
                                    ) : (
                                        <><Copy className="size-4 mr-2" /> Copy Link</>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                                    <ExternalLink className="size-4 mr-2" /> Share via...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleShareWithTeacher} className="cursor-pointer">
                                    <MessageCircle className="size-4 mr-2" /> Share with Teacher
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Progress Card */}
                        <div className="bg-card rounded-xl border p-6 shadow-sm">
                            <h3 className="font-bold mb-4">Overall Progress</h3>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-4xl font-black text-primary">{roadmap.progress}%</span>
                                <span className="text-sm text-muted-foreground">
                                    {completedModules}/{totalModules} modules
                                </span>
                            </div>
                            <Progress value={roadmap.progress} className="h-3" />
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-card rounded-xl border p-6 shadow-sm">
                            <h3 className="font-bold mb-4">Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Target className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Career Goal</p>
                                        <p className="font-medium">{roadmap.career_goal}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium">{roadmap.estimated_duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                                        <BookOpen className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Subject Area</p>
                                        <p className="font-medium capitalize">{roadmap.subject}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next Step Card */}
                        {roadmap.next_step && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="size-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">Next Step</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400">{roadmap.next_step}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Timeline */}
                    <div className="lg:col-span-8">
                        <div className="bg-card rounded-xl border p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">Learning Modules</h2>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full dark:bg-green-900/30 dark:text-green-400">
                                        ✓ Completed
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                        ▶ Current
                                    </span>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Timeline Line */}
                                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />

                                <div className="space-y-6">
                                    {roadmap.modules?.map((module, idx) => {
                                        const isCompleted = module.status === 'completed'
                                        const isInProgress = module.status === 'in_progress'
                                        // We keep the status for logic, but we don't "lock" the view anymore
                                        const isPlanned = module.status === 'locked'

                                        return (
                                            <div key={idx} className="relative pl-14">
                                                {/* Status Node */}
                                                <div className={cn(
                                                    "absolute left-0 size-10 rounded-full flex items-center justify-center z-10",
                                                    isCompleted && "bg-green-500 text-white",
                                                    isInProgress && "bg-primary text-white ring-4 ring-primary/20",
                                                    isPlanned && "bg-blue-50 text-blue-500 border-2 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                                                )}>
                                                    {isCompleted && <Check className="size-5" />}
                                                    {isInProgress && <Play className="size-5" />}
                                                    {isPlanned && <span className="text-xs font-bold">{idx + 1}</span>}
                                                </div>

                                                {/* Module Card */}
                                                <div className={cn(
                                                    "rounded-xl p-5 border transition-all hover:shadow-md",
                                                    isCompleted && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30",
                                                    isInProgress && "bg-card border-primary shadow-lg ring-1 ring-primary/10",
                                                    isPlanned && "bg-card border-border"
                                                )}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-lg">{module.title}</h4>
                                                                {isCompleted && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded uppercase">
                                                                        <Check className="size-2.5" /> Done
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-xs font-bold uppercase tracking-wider",
                                                                isCompleted && "text-green-600",
                                                                isInProgress && "text-primary",
                                                                isPlanned && "text-muted-foreground"
                                                            )}>
                                                                {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Planned Step"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/50">
                                                            ~{module.estimatedWeeks} {module.estimatedWeeks === 1 ? 'week' : 'weeks'}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                                        {module.description}
                                                    </p>

                                                    {/* Skills */}
                                                    {module.skills?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            {module.skills.map((skill, i) => (
                                                                <span key={i} className="text-[10px] font-semibold bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-md">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Project */}
                                                    {module.project && (
                                                        <div className="text-sm bg-muted/20 rounded-lg p-4 border border-border/50 mb-4">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-base">🛠️</span>
                                                                <span className="font-bold text-xs uppercase tracking-tight text-muted-foreground">Capstone Project</span>
                                                            </div>
                                                            <p className="text-foreground/90">{module.project}</p>
                                                        </div>
                                                    )}

                                                    {/* Learning Materials Section */}
                                                    <div className="mt-12 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                                                    <FileText className="size-6" />
                                                                </div>
                                                                <div>
                                                                    <h2 className="text-2xl font-bold">Learning Materials</h2>
                                                                    <p className="text-muted-foreground text-sm font-medium">Resources to help you master this journey</p>
                                                                </div>
                                                            </div>
                                                            {materials.length > 0 && enrolledGigIds.length > 0 && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-2"
                                                                    onClick={() => {
                                                                        const firstGigId = enrolledGigIds[0]
                                                                        window.open(`/api/materials/download-all?gig_id=${firstGigId}`, '_blank')
                                                                    }}
                                                                >
                                                                    <Download className="size-4" />
                                                                    Download All
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {loadingMaterials ? (
                                                            <div className="flex justify-center py-10">
                                                                <Loader2 className="size-8 animate-spin text-primary opacity-20" />
                                                            </div>
                                                        ) : (
                                                            <MaterialsList
                                                                materials={materials}
                                                                isTeacher={false}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Recommended Tutors */}
                                                    {(module as any).recommendedCourses?.length > 0 && (
                                                        <div className="mt-4 bg-gradient-to-br from-primary/[0.03] to-purple-500/[0.03] rounded-xl p-5 border border-primary/20">
                                                            <p className="text-sm font-black text-primary mb-4 flex items-center gap-2">
                                                                <BookOpen className="size-4" /> Recommended Courses
                                                            </p>
                                                            <div className="space-y-3">
                                                                {(module as any).recommendedCourses.map((course: RecommendedCourse, i: number) => (
                                                                    <div key={i} className="bg-card rounded-lg p-4 border shadow-sm hover:border-primary/40 transition-colors group/course">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                                    <p className="font-bold text-sm truncate">{course.courseTitle}</p>
                                                                                    {course.price && (
                                                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-800">
                                                                                            GHS {course.price}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                                                                    <User className="size-3" />
                                                                                    <span>by {course.teacher}</span>
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground/80 italic leading-snug">"{course.reason}"</p>
                                                                            </div>
                                                                            {course.courseId && (
                                                                                <Link
                                                                                    href={`/parent/tutors?gig=${course.courseId}`}
                                                                                    className="shrink-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                                                                                    title="View Course"
                                                                                >
                                                                                    <ChevronRight className="size-4" />
                                                                                </Link>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    {isInProgress && (
                                                        <Button
                                                            className="mt-6 w-full sm:w-auto gap-2 font-bold shadow-lg shadow-primary/20"
                                                            onClick={() => handleModuleAction(idx, 'complete')}
                                                        >
                                                            <Check className="size-4" /> Mark Module as Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Final Goal Node */}
                                    <div className="relative pl-14">
                                        <div className={cn(
                                            "absolute left-0 size-10 rounded-full flex items-center justify-center z-10",
                                            roadmap.progress === 100
                                                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                                : "bg-muted text-muted-foreground border border-border"
                                        )}>
                                            <Flag className="size-5" />
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
                                            <h4 className="font-bold text-lg">🎯 Goal: {roadmap.career_goal}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Complete all modules to unlock this achievement!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
