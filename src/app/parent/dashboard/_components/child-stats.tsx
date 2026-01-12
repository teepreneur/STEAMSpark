"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Trophy, Clock, Target } from "lucide-react"

interface ChildStatsProps {
    childId: string | null
}

export function ChildStats({ childId }: ChildStatsProps) {
    const supabase = createClient()
    const [stats, setStats] = useState({
        completedSessions: 0,
        hoursLearned: 0,
        achievements: 0,
        activeGoals: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            if (!childId) {
                setLoading(false)
                return
            }

            setLoading(true)

            // Fetch bookings for this child
            const { data: bookings } = await supabase
                .from('bookings')
                .select('*')
                .eq('student_id', childId)

            const completedSessions = bookings?.filter(b => b.status === 'completed').length || 0
            const totalMinutes = completedSessions * 60 // Assuming 60 min sessions

            setStats({
                completedSessions,
                hoursLearned: Math.round(totalMinutes / 60 * 10) / 10,
                achievements: 0, // No achievements system yet
                activeGoals: 0   // No goals system yet
            })

            setLoading(false)
        }
        loadStats()
    }, [childId, supabase])

    if (!childId) {
        return null
    }

    const statItems = [
        {
            label: "Sessions Completed",
            value: stats.completedSessions,
            icon: BookOpen,
            color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
        },
        {
            label: "Hours Learned",
            value: stats.hoursLearned,
            icon: Clock,
            color: "bg-green-50 text-green-600 dark:bg-green-900/20"
        },
        {
            label: "Achievements",
            value: stats.achievements,
            icon: Trophy,
            color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20"
        },
        {
            label: "Active Goals",
            value: stats.activeGoals,
            icon: Target,
            color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item) => (
                <div key={item.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {loading ? "-" : item.value}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
