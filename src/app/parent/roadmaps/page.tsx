"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    GraduationCap, Plus, Bot, Code, FlaskConical, Palette, Brain,
    Loader2, Map, ChevronRight, Calendar, Target, Trash2, MoreVertical
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Roadmap {
    id: string
    title: string
    subject: string
    career_goal: string
    description: string
    progress: number
    next_step: string
    status: string
    created_at: string
    estimated_duration: string
    student: {
        name: string
    }
}

const iconMap: Record<string, any> = {
    robotics: Bot,
    coding: Code,
    technology: Code,
    science: FlaskConical,
    art: Palette,
    engineering: Bot,
    default: Brain
}

const colorMap: Record<string, { bg: string, bar: string }> = {
    robotics: { bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30", bar: "bg-blue-500" },
    coding: { bg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30", bar: "bg-purple-500" },
    technology: { bg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30", bar: "bg-purple-500" },
    science: { bg: "bg-green-100 text-green-600 dark:bg-green-900/30", bar: "bg-green-500" },
    art: { bg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30", bar: "bg-pink-500" },
    engineering: { bg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30", bar: "bg-orange-500" },
    default: { bg: "bg-secondary text-muted-foreground", bar: "bg-muted-foreground" }
}

export default function RoadmapsPage() {
    const supabase = createClient()
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

    useEffect(() => {
        async function loadRoadmaps() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('roadmaps')
                .select(`
                    *,
                    student:students (name)
                `)
                .eq('parent_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setRoadmaps(data as Roadmap[])
            }
            setLoading(false)
        }

        loadRoadmaps()
    }, [supabase])

    const filteredRoadmaps = roadmaps.filter(r => {
        if (filter === 'active') return r.status === 'active'
        if (filter === 'completed') return r.status === 'completed'
        return true
    })

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm("Are you sure you want to delete this roadmap? This cannot be undone.")) return

        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id)

        if (!error) {
            setRoadmaps(roadmaps.filter(r => r.id !== id))
        } else {
            alert("Failed to delete roadmap")
        }
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                        <GraduationCap className="size-4" />
                        <span>AI Learning Paths</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2">
                        Learning Roadmaps
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Personalized AI-generated learning paths to guide your child towards their dream career.
                    </p>
                </div>
                <Button asChild className="gap-2 font-bold">
                    <Link href="/parent/roadmaps/new">
                        <Plus className="size-5" />
                        Create New Roadmap
                    </Link>
                </Button>
            </section>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize",
                            filter === f
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border hover:bg-secondary"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            )}

            {/* Empty State */}
            {!loading && roadmaps.length === 0 && (
                <div className="bg-card rounded-2xl border shadow-sm p-12 text-center">
                    <Map className="size-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Roadmaps Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create a personalized AI learning roadmap to guide your child towards their dream career in STEAM.
                    </p>
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/parent/roadmaps/new">
                            <Plus className="size-5" />
                            Create Your First Roadmap
                        </Link>
                    </Button>
                </div>
            )}

            {/* Roadmaps Grid */}
            {!loading && filteredRoadmaps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRoadmaps.map((roadmap) => {
                        const subjectKey = roadmap.subject?.toLowerCase() || 'default'
                        const Icon = iconMap[subjectKey] || iconMap.default
                        const colors = colorMap[subjectKey] || colorMap.default

                        return (
                            <Link
                                key={roadmap.id}
                                href={`/parent/roadmaps/${roadmap.id}`}
                                className="group bg-card rounded-xl border shadow-sm hover:shadow-lg hover:border-primary/50 transition-all overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-5 border-b bg-muted/30">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn("size-12 rounded-xl flex items-center justify-center", colors.bg)}>
                                            <Icon className="size-6" />
                                        </div>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                            roadmap.status === 'active'
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : roadmap.status === 'completed'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-secondary text-muted-foreground"
                                        )}>
                                            {roadmap.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                        {roadmap.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="font-medium">{(roadmap.student as any)?.name}</span>
                                        <span>•</span>
                                        <span className="capitalize">{roadmap.subject}</span>
                                    </p>
                                </div>

                                {/* Body */}
                                <div className="p-5">
                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-end justify-between mb-2">
                                            <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                            <span className="text-lg font-bold text-primary">{roadmap.progress}%</span>
                                        </div>
                                        <Progress value={roadmap.progress} className="h-2" />
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                        <span className="flex items-center gap-1">
                                            <Target className="size-3" />
                                            {roadmap.career_goal}
                                        </span>
                                    </div>

                                    {/* Next Step */}
                                    {roadmap.next_step && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                                            <span className="font-medium text-amber-800 dark:text-amber-300">
                                                Next: {roadmap.next_step}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Created {formatDistanceToNow(new Date(roadmap.created_at), { addSuffix: true })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                                <button className="size-8 rounded-full hover:bg-secondary flex items-center justify-center">
                                                    <MoreVertical className="size-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    onClick={(e) => handleDelete(roadmap.id, e)}
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete Roadmap
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
