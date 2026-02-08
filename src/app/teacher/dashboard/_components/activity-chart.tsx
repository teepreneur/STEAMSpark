"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart } from "lucide-react"

interface DayData {
    day: string
    count: number
    label: string
}

export function ActivityChart() {
    const supabase = createClient()
    const [weekData, setWeekData] = useState<DayData[]>([
        { day: 'Monday', count: 0, label: 'M' },
        { day: 'Tuesday', count: 0, label: 'T' },
        { day: 'Wednesday', count: 0, label: 'W' },
        { day: 'Thursday', count: 0, label: 'T' },
        { day: 'Friday', count: 0, label: 'F' },
        { day: 'Saturday', count: 0, label: 'S' },
        { day: 'Sunday', count: 0, label: 'S' }
    ])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadActivity() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                // Get current week start (Monday)
                const now = new Date()
                const dayOfWeek = now.getDay()
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
                const weekStart = new Date(now)
                weekStart.setDate(now.getDate() + mondayOffset)
                weekStart.setHours(0, 0, 0, 0)

                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)

                const formatDate = (d: Date) => d.toISOString().split('T')[0]

                const { data: sessions } = await supabase
                    .from('booking_sessions')
                    .select(`
                        id,
                        session_date,
                        status,
                        booking:bookings!inner (
                            gig:gigs!inner (teacher_id)
                        )
                    `)
                    .gte('session_date', formatDate(weekStart))
                    .lte('session_date', formatDate(weekEnd))
                    .in('status', ['scheduled', 'confirmed', 'completed'])

                // Filter for this teacher
                const teacherSessions = sessions?.filter((s: any) =>
                    s.booking?.gig?.teacher_id === user.id
                ) || []

                // Count sessions per day
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const dayCounts: Record<string, number> = {}

                teacherSessions.forEach((s: any) => {
                    const date = new Date(s.session_date + 'T00:00:00')
                    const dayName = dayNames[date.getDay()]
                    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
                })

                // Create week data array
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

                const data = days.map((day, i) => ({
                    day,
                    count: dayCounts[day] || 0,
                    label: dayLabels[i]
                }))

                setWeekData(data)
            } catch (error) {
                console.error('[ActivityChart] Error loading activity:', error)
            }
            setLoading(false)
        }

        loadActivity()
    }, [supabase])

    // Calculate max for scaling bars
    const maxCount = Math.max(...weekData.map(d => d.count), 1)

    // Get today's day name
    const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]

    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <BarChart className="text-primary size-5" />
                <h2 className="text-lg font-bold">Weekly Activity</h2>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading...</div>
                    </div>
                ) : weekData.every(d => d.count === 0) ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center">
                        <BarChart className="size-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No sessions this week</p>
                        <p className="text-xs text-muted-foreground">Sessions will appear here when booked</p>
                    </div>
                ) : (
                    <div className="flex items-end justify-between h-40 gap-2 sm:gap-4">
                        {weekData.map((day, i) => {
                            const height = day.count > 0 ? `${(day.count / maxCount) * 100}%` : '5%'
                            const isToday = todayName === day.day

                            return (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                    <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.count}
                                    </div>
                                    <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg h-full relative overflow-hidden group-hover:bg-primary/30 transition-colors">
                                        <div
                                            className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-green-500' : 'bg-primary'}`}
                                            style={{ height }}
                                        ></div>
                                    </div>
                                    <span className={`text-xs font-medium ${isToday ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}>
                                        {day.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </section>
    )
}
