"use client"

import { useEffect, useState } from "react"
import {
    RefreshCcw, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight,
    X, Video, MessageSquare, Edit, Loader2, User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from "date-fns"
import { AvailabilityManager } from "./_components/availability-manager"

function formatTime(time: string): string {
    const [hours] = time.split(':')
    const h = parseInt(hours)
    if (h === 0) return "12:00 AM"
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return "12:00 PM"
    return `${h - 12}:00 PM`
}

interface SessionWithDetails {
    id: string
    booking_id: string
    session_date: string
    session_time: string
    session_number: number
    status: string
    booking: {
        id: string
        gig_id: string
        student_id: string
        parent_id: string
        gig: {
            id: string
            title: string
            subject: string | null
            price: number
            session_duration: number | null
        } | null
        student: {
            id: string
            name: string
        } | null
    }
}

export default function TeacherCalendarPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [sessions, setSessions] = useState<SessionWithDetails[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null)

    useEffect(() => {
        async function loadSessions() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch sessions for teacher's gigs
            // We join sessions -> bookings -> gigs to filter by teacher_id
            const { data, error } = await supabase
                .from('booking_sessions')
                .select(`
                    id,
                    booking_id,
                    session_date,
                    session_time,
                    session_number,
                    status,
                    booking:bookings!inner(
                        id,
                        gig_id,
                        student_id,
                        parent_id,
                        gig:gigs!inner(id, title, subject, price, session_duration, teacher_id),
                        student:students(id, name)
                    )
                `)
                .eq('booking.gig.teacher_id', user.id)

            if (data) {
                setSessions(data as any)
                // Select the first upcoming session by default
                const upcoming = data.find((s: any) => s.session_date && new Date(s.session_date) >= new Date())
                if (upcoming) setSelectedSession(upcoming as any)
            } else if (error) {
                console.error("Error fetching sessions:", error)
            }
            setLoading(false)
        }
        loadSessions()
    }, [supabase])

    // Calendar helpers
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Pad with days from previous/next month to fill grid
    const startDayOfWeek = monthStart.getDay()
    const endDayOfWeek = monthEnd.getDay()

    const previousMonthPadding = Array.from({ length: startDayOfWeek }, (_, i) => {
        const d = new Date(monthStart)
        d.setDate(d.getDate() - (startDayOfWeek - i))
        return d
    })

    const nextMonthPadding = Array.from({ length: 6 - endDayOfWeek }, (_, i) => {
        const d = new Date(monthEnd)
        d.setDate(d.getDate() + i + 1)
        return d
    })

    const allDays = [...previousMonthPadding, ...days, ...nextMonthPadding]

    // Get sessions for a specific day
    const getSessionsForDay = (day: Date) => {
        return sessions.filter(s => {
            if (!s.session_date) return false
            return isSameDay(parseISO(s.session_date), day)
        })
    }

    // Calculate stats
    const upcomingSessions = sessions.filter(s =>
        s.session_date && new Date(s.session_date) >= new Date() &&
        (s.status === 'scheduled' || s.status === 'pending')
    ).length

    const totalHours = sessions
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + ((s.booking.gig?.session_duration || 1)), 0)

    const pendingRequests = sessions.filter(s =>
        s.status === 'pending' || s.status === 'pending_payment'
    ).length

    // Subject color mapping
    const getSubjectColor = (subject: string | null) => {
        const colors: Record<string, string> = {
            'science': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-500',
            'technology': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-500',
            'engineering': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-500',
            'art': 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-500',
            'math': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-500',
        }
        return colors[subject || ''] || 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border-gray-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col xl:flex-row h-auto xl:h-[calc(100vh-80px)] overflow-visible xl:overflow-hidden gap-6">
            {/* Left Panel: Calendar & Stats */}
            <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2">
                {/* Headline & Stats */}
                <div className="flex flex-col gap-6 shrink-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Schedule</h1>
                        <Button variant="outline" className="gap-2 font-bold">
                            <RefreshCcw className="size-4" /> Sync Calendar
                        </Button>
                    </div>

                    {/* Quick Stats Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-primary">
                                    <Calendar className="size-5" />
                                </div>
                                {upcomingSessions > 0 && (
                                    <span className="text-xs font-bold text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 px-2 py-1 rounded-lg">Active</span>
                                )}
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Upcoming Sessions</p>
                                <h3 className="text-2xl font-bold text-foreground">{upcomingSessions}</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                    <Clock className="size-5" />
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Hours Taught</p>
                                <h3 className="text-2xl font-bold text-foreground">{totalHours}</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                    <AlertCircle className="size-5" />
                                </div>
                                {pendingRequests > 0 && (
                                    <span className="text-xs font-bold text-primary bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">Action needed</span>
                                )}
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Pending Requests</p>
                                <h3 className="text-2xl font-bold text-foreground">{pendingRequests}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Container */}
                <div className="flex flex-col flex-1 bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[500px]">
                    {/* Calendar Toolbar */}
                    <div className="flex flex-col gap-4 p-4 border-b border-border">
                        {/* Top Row: View Tabs + Navigation */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                <button className="px-3 py-1.5 text-sm font-medium rounded-md shadow-sm bg-background text-foreground transition-all">Month</button>
                                <button className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-all">Week</button>
                                <button className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-all">Day</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full size-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <h2 className="text-base sm:text-lg font-bold text-foreground min-w-[140px] sm:min-w-[160px] text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
                                <Button variant="ghost" size="icon" className="rounded-full size-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                        {/* Bottom Row: Manage Availability - Full width on mobile */}
                        <div className="flex justify-end">
                            <AvailabilityManager />
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] h-full overflow-hidden min-h-0 bg-background">
                        {/* Day Headers */}
                        <div className="contents text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="py-2 sm:py-3 text-center border-b border-r border-border last:border-r-0">
                                    <span className="sm:hidden">{day}</span>
                                    <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        {allDays.map((day, index) => {
                            const daySessions = getSessionsForDay(day)
                            const isCurrentMonth = isSameMonth(day, currentMonth)
                            const dayIsToday = isToday(day)

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-1 sm:p-2 min-h-[60px] sm:min-h-[90px] border-b border-r border-border bg-card",
                                        !isCurrentMonth && "bg-muted/30",
                                        dayIsToday && "ring-2 ring-primary ring-inset z-10",
                                        daySessions.length > 0 && "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            !isCurrentMonth && "text-muted-foreground",
                                            dayIsToday && "size-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayIsToday && <span className="text-[10px] text-muted-foreground font-medium">Today</span>}
                                    </div>

                                    <div className="mt-1 flex flex-col gap-0.5 sm:gap-1">
                                        {daySessions.slice(0, 2).map((session, sessionIndex) => (
                                            <div
                                                key={session.id}
                                                onClick={() => setSelectedSession(session)}
                                                className={cn(
                                                    "px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded font-medium border-l-2 truncate cursor-pointer",
                                                    getSubjectColor(session.booking.gig?.subject || null),
                                                    sessionIndex > 0 && "hidden sm:block"
                                                )}
                                            >
                                                <span className="hidden sm:inline">{session.session_time && formatTime(session.session_time)} • </span>
                                                {session.booking.gig?.title?.slice(0, 10)}
                                            </div>
                                        ))}
                                        {daySessions.length > 1 && (
                                            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                                <span className="sm:hidden">+{daySessions.length - 1}</span>
                                                <span className="hidden sm:inline">{daySessions.length > 2 ? `+${daySessions.length - 2} more` : ''}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel: Session Detail Sidebar - Always overlay except on xl+ screens */}
            {selectedSession && (
                <>
                    {/* Overlay backdrop - hidden on xl+ */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                        onClick={() => setSelectedSession(null)}
                    />
                    <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border flex flex-col overflow-y-auto shadow-2xl z-50 xl:relative xl:inset-auto xl:w-[400px] xl:z-auto xl:shadow-sm xl:rounded-none animate-in slide-in-from-right xl:animate-none">
                        <div className="p-6 flex flex-col gap-6 h-full">
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <h2 className="text-xl font-bold text-foreground">Session Details</h2>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedSession(null)}>
                                    <X className="size-5" />
                                </Button>
                            </div>

                            {/* Session Card */}
                            <div className={cn("border rounded-xl p-5 flex flex-col gap-4", getSubjectColor(selectedSession.booking.gig?.subject || null).replace('border-l-2', ''))}>
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                                            {selectedSession.status === 'scheduled' ? 'Scheduled' : 'Completed'} (Session {selectedSession.session_number})
                                        </span>
                                        <h3 className="text-lg font-bold text-foreground">{selectedSession.booking.gig?.title}</h3>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                            <Clock className="size-4" />
                                            {selectedSession.session_date
                                                ? `${format(parseISO(selectedSession.session_date), 'MMM d, yyyy')} • ${formatTime(selectedSession.session_time)}`
                                                : 'Date TBD'
                                            }
                                        </div>
                                    </div>
                                    <div className="bg-card p-2 rounded-lg shadow-sm border border-border">
                                        <Video className="text-primary size-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Student Profile */}
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Student</h4>
                                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className="relative">
                                        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                                            <User className="size-6 text-muted-foreground" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-bold text-base group-hover:text-primary transition-colors">
                                            {selectedSession.booking.student?.name || 'Unknown Student'}
                                        </span>
                                        <span className="text-sm text-muted-foreground capitalize">
                                            {selectedSession.booking.gig?.subject || 'General'} • GHS {selectedSession.booking.gig?.price || 0}
                                        </span>
                                    </div>
                                    <ChevronRight className="ml-auto text-muted-foreground group-hover:text-primary size-5" />
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="flex flex-col gap-3 flex-1">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Details</h4>
                                <div className="bg-muted/30 p-4 rounded-xl border border-border text-sm leading-relaxed text-foreground">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Duration</span>
                                            <span className="font-medium">{selectedSession.booking.gig?.session_duration || 1} hour(s)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Price</span>
                                            <span className="font-medium">GHS {selectedSession.booking.gig?.price || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status</span>
                                            <span className={cn("font-medium capitalize",
                                                selectedSession.status === 'scheduled' && "text-green-600",
                                                selectedSession.status === 'pending' && "text-yellow-600"
                                            )}>
                                                {selectedSession.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border">
                                <Button className="w-full h-14 text-base font-bold shadow-lg gap-3" size="lg">
                                    <Video className="size-5" /> Start Video Call
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="secondary" className="gap-2 font-bold">
                                        <MessageSquare className="size-4" /> Message
                                    </Button>
                                    <Button variant="secondary" className="gap-2 font-bold">
                                        <Edit className="size-4" /> Reschedule
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </div>
    )
}
