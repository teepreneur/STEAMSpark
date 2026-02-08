"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, MoreVertical, Calendar } from "lucide-react"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import Link from "next/link"

interface SessionWithBooking {
    id: string
    session_date: string
    session_time: string
    session_number: number
    status: string
    booking: {
        id: string
        status: string
        gigs: {
            title: string
            duration: number
            profiles: {
                full_name: string
            }
        }
        students: {
            name: string
        }
    }
}

export function ParentUpcomingSessions() {
    const supabase = createClient()
    const [sessions, setSessions] = useState<SessionWithBooking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadSessions() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Query individual sessions from booking_sessions
            const { data, error } = await supabase
                .from('booking_sessions')
                .select(`
                    id,
                    session_date,
                    session_time,
                    session_number,
                    status,
                    booking:bookings!inner (
                        id,
                        status,
                        parent_id,
                        gigs (
                            title,
                            duration,
                            profiles:teacher_id (full_name)
                        ),
                        students (name)
                    )
                `)
                .gte('session_date', new Date().toISOString().split('T')[0])
                .in('status', ['scheduled', 'confirmed'])
                .order('session_date', { ascending: true })
                .order('session_time', { ascending: true })
                .limit(10)

            console.log('[ParentUpcomingSessions] Query result:', { data, error, userId: user.id })

            if (error) {
                console.error('[ParentUpcomingSessions] Query error:', error)
            }

            if (data) {
                // Filter for current user's bookings (since we can't filter nested easily)
                const userSessions = data.filter((s: any) =>
                    s.booking?.parent_id === user.id
                ) as unknown as SessionWithBooking[]

                console.log('[ParentUpcomingSessions] Filtered sessions:', userSessions.length)
                setSessions(userSessions.slice(0, 5))
            }
            setLoading(false)
        }

        loadSessions()
    }, [supabase])

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr)
        if (isToday(date)) return "Today"
        if (isTomorrow(date)) return "Tomorrow"
        return format(date, "EEE")
    }

    const formatSessionTime = (time: string) => {
        if (!time) return "12:00 AM"
        const [hours, minutes] = time.split(':')
        const h = parseInt(hours)
        const period = h >= 12 ? 'PM' : 'AM'
        const hour12 = h % 12 || 12
        return `${hour12}:${minutes || '00'} ${period}`
    }

    if (loading) {
        return (
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold">Upcoming Sessions</h3>
                <div className="bg-card rounded-xl border shadow-sm p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                </div>
            </section>
        )
    }

    if (sessions.length === 0) {
        return (
            <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold">Upcoming Sessions</h3>
                <div className="bg-card rounded-xl border shadow-sm p-8 text-center">
                    <Calendar className="size-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-1">No upcoming sessions</p>
                    <p className="text-sm text-muted-foreground mb-4">Book a session with a tutor to get started</p>
                    <Button asChild>
                        <Link href="/parent/tutors">Find Tutors</Link>
                    </Button>
                </div>
            </section>
        )
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Upcoming Sessions</h3>
                <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="size-8 rounded-full h-8 w-8">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button size="icon" variant="outline" className="size-8 rounded-full h-8 w-8">
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm divide-y overflow-hidden">
                {sessions.filter(session => {
                    if (!session.session_date) return false
                    try {
                        const date = parseISO(session.session_date)
                        return true
                    } catch (e) {
                        return false
                    }
                }).map((session) => {
                    const date = parseISO(session.session_date)
                    const isUpcoming = isToday(date) || isTomorrow(date)
                    const bookingStatus = (session.booking as any)?.status
                    const gigTitle = (session.booking?.gigs as any)?.title || 'Session'
                    const teacherName = (session.booking?.gigs as any)?.profiles?.full_name || "Teacher"
                    const studentName = (session.booking?.students as any)?.name || "Student"

                    return (
                        <Link
                            key={session.id}
                            href={`/parent/sessions/${session.id}`}
                            className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg shrink-0 ${isUpcoming ? "bg-blue-50 dark:bg-blue-900/20 text-primary" : "bg-secondary text-muted-foreground"
                                }`}>
                                <span className="text-xs font-bold uppercase">{getDateLabel(session.session_date)}</span>
                                <span className="text-xl font-black">{format(date, "d")}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold truncate">{(session.booking?.gigs as any)?.title}</h4>
                                    <span className="text-xs text-muted-foreground">Session {session.session_number}</span>
                                    {bookingStatus === 'confirmed' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Confirmed</span>
                                    )}
                                    {bookingStatus === 'pending' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Pending</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock size={14} /> {formatSessionTime(session.session_time)} • {(session.booking?.gigs as any)?.profiles?.full_name || "Teacher"} • {(session.booking?.students as any)?.name}
                                </p>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                                {isToday(date) && bookingStatus === 'confirmed' && (
                                    <Button className="flex-1 sm:flex-none font-bold">View Session</Button>
                                )}
                                {!isToday(date) && (
                                    <Button variant="outline" className="flex-1 sm:flex-none font-bold">View Details</Button>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
