"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Star, ArrowRight, Users } from "lucide-react"
import Link from "next/link"

interface Teacher {
    id: string
    full_name: string
    subjects: string[] | null
    avatar_url: string | null
    gigs: { id: string }[]
}

export function RecommendedTutors() {
    const supabase = createClient()
    const [tutors, setTutors] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadTutors() {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    subjects,
                    avatar_url,
                    gigs (id)
                `)
                .eq('role', 'teacher')
                .limit(4)

            if (data) {
                // Filter to only show teachers with at least one gig
                const activeTutors = data.filter(t => t.gigs && t.gigs.length > 0)
                setTutors(activeTutors as unknown as Teacher[])
            }
            setLoading(false)
        }

        loadTutors()
    }, [supabase])

    if (loading) {
        return (
            <section>
                <h3 className="text-lg font-bold mb-4">Recommended Tutors</h3>
                <div className="flex flex-col gap-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-card p-4 rounded-xl border shadow-sm animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-full bg-muted" />
                                <div className="flex-1">
                                    <div className="h-4 bg-muted rounded w-24 mb-2" />
                                    <div className="h-3 bg-muted rounded w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    if (tutors.length === 0) {
        return (
            <section>
                <h3 className="text-lg font-bold mb-4">Recommended Tutors</h3>
                <div className="bg-card p-6 rounded-xl border shadow-sm text-center">
                    <Users className="size-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No tutors available yet</p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/parent/tutors">Browse All Tutors</Link>
                    </Button>
                </div>
            </section>
        )
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Recommended Tutors</h3>
                <Link href="/parent/tutors" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="flex flex-col gap-3">
                {tutors.map((tutor) => (
                    <Link
                        key={tutor.id}
                        href={`/parent/tutors?teacher=${tutor.id}`}
                        className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-4 group cursor-pointer hover:border-primary/50 transition-colors"
                    >
                        <div
                            className="size-14 rounded-full bg-cover bg-center shrink-0 bg-muted"
                            style={{
                                backgroundImage: tutor.avatar_url
                                    ? `url('${tutor.avatar_url}')`
                                    : `url('https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(tutor.full_name || 'T')}')`
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{tutor.full_name}</h4>
                            <p className="text-xs text-primary font-medium truncate">
                                {tutor.subjects?.slice(0, 2).join(", ") || "STEAM Educator"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="text-amber-400 fill-current" />
                                <span className="text-xs font-bold">New</span>
                                <span className="text-xs text-muted-foreground">({tutor.gigs?.length || 0} gigs)</span>
                            </div>
                        </div>
                        <Button size="icon" variant="ghost" className="rounded-full bg-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                            <ArrowRight size={18} />
                        </Button>
                    </Link>
                ))}
            </div>
        </section>
    )
}
