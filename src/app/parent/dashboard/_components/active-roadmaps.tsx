"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Bot, Code, Brain, Palette, FlaskConical, Map } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Roadmap {
    id: string
    title: string
    subject: string
    progress: number
    next_step: string
    status: string
}

const iconMap: Record<string, any> = {
    robotics: Bot,
    coding: Code,
    science: FlaskConical,
    art: Palette,
    default: Brain
}

const colorMap: Record<string, { bg: string, bar: string }> = {
    robotics: { bg: "bg-blue-100 text-primary dark:bg-blue-900/30", bar: "bg-primary" },
    coding: { bg: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30", bar: "bg-yellow-500" },
    science: { bg: "bg-green-100 text-green-600 dark:bg-green-900/30", bar: "bg-green-500" },
    art: { bg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30", bar: "bg-purple-500" },
    default: { bg: "bg-secondary text-muted-foreground", bar: "bg-muted-foreground" }
}

export function ActiveRoadmaps() {
    const supabase = createClient()
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadRoadmaps() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Try to load from roadmaps table
            const { data, error } = await supabase
                .from('roadmaps')
                .select('*')
                .eq('parent_id', user.id)
                .eq('status', 'active')
                .limit(4)

            if (data && data.length > 0) {
                setRoadmaps(data)
            }
            setLoading(false)
        }

        loadRoadmaps()
    }, [supabase])

    if (loading) {
        return (
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold">Active Roadmaps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="p-5 border shadow-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-lg bg-muted" />
                                <div className="flex-1">
                                    <div className="h-4 bg-muted rounded w-24 mb-1" />
                                    <div className="h-3 bg-muted rounded w-16" />
                                </div>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full w-full" />
                        </Card>
                    ))}
                </div>
            </section>
        )
    }

    if (roadmaps.length === 0) {
        return (
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold">Active Roadmaps</h3>
                <Card className="p-8 border shadow-sm text-center">
                    <Map className="size-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-1">No active roadmaps yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create a personalized AI learning roadmap for your child
                    </p>
                    <Button asChild>
                        <Link href="/parent/roadmaps">Create Roadmap</Link>
                    </Button>
                </Card>
            </section>
        )
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Active Roadmaps</h3>
                <Link href="/parent/roadmaps" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmaps.map((map) => {
                    const subjectKey = map.subject?.toLowerCase() || 'default'
                    const Icon = iconMap[subjectKey] || iconMap.default
                    const colors = colorMap[subjectKey] || colorMap.default

                    return (
                        <Link key={map.id} href={`/parent/roadmaps/${map.id}`}>
                            <Card className="p-5 border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold">{map.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{map.subject} Level</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">Active</span>
                                </div>
                                <div className="flex items-end justify-between mb-1">
                                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                    <span className="text-sm font-bold">{map.progress}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${colors.bar}`} style={{ width: `${map.progress}%` }}></div>
                                </div>
                                {map.next_step && (
                                    <p className="mt-3 text-xs text-muted-foreground">Next: {map.next_step}</p>
                                )}
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
