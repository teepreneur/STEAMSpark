"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Clock, MessageSquare, User, Calendar, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface PendingBooking {
    id: string
    created_at: string
    preferred_days: string[] | null
    preferred_time: string | null
    total_sessions: number | null
    gig: {
        id: string
        title: string
        price: number
        teacher_id: string
        profiles: {
            full_name: string
            avatar_url: string | null
        }
    }
    student: {
        name: string
    }
}

export function PendingBookings() {
    const supabase = createClient()
    const [bookings, setBookings] = useState<PendingBooking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadPendingBookings() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    created_at,
                    preferred_days,
                    preferred_time,
                    total_sessions,
                    gig:gigs (
                        id,
                        title,
                        price,
                        teacher_id,
                        profiles:teacher_id (full_name, avatar_url)
                    ),
                    student:students (name)
                `)
                .eq('parent_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (data) {
                setBookings(data as unknown as PendingBooking[])
            }
            setLoading(false)
        }

        loadPendingBookings()
    }, [supabase])

    // Don't show anything if loading or no pending bookings
    if (loading) {
        return null
    }

    if (bookings.length === 0) {
        return null
    }

    const formatPreferredDays = (days: string[] | null) => {
        if (!days || days.length === 0) return "Flexible"
        return days.slice(0, 3).join(", ") + (days.length > 3 ? ` +${days.length - 3}` : "")
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Pending Requests</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {bookings.length}
                    </span>
                </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50">
                    <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Clock className="size-4" />
                        These bookings are awaiting teacher approval
                    </p>
                </div>

                <div className="divide-y divide-amber-200 dark:divide-amber-800/50">
                    {bookings.map((booking) => {
                        const gig = booking.gig as any
                        const teacher = gig?.profiles
                        const student = booking.student as any
                        const teacherName = teacher?.full_name || "Teacher"
                        const gigTitle = gig?.title || "Course"

                        return (
                            <div
                                key={booking.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                            >
                                {/* Teacher Avatar */}
                                <div className="size-12 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
                                    {teacher?.avatar_url ? (
                                        <img
                                            src={teacher.avatar_url}
                                            alt={teacher?.full_name || "Teacher"}
                                            className="size-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="size-6 text-amber-600 dark:text-amber-400" />
                                    )}
                                </div>

                                {/* Booking Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold truncate">{gig?.title}</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400">
                                            Awaiting Approval
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium">{teacher?.full_name || "Teacher"}</span>
                                        {" • "}
                                        <span>{student?.name}</span>
                                        {" • "}
                                        <span>{booking.total_sessions || 1} session{(booking.total_sessions || 1) > 1 ? 's' : ''}</span>
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {formatPreferredDays(booking.preferred_days)}
                                            {booking.preferred_time && ` at ${booking.preferred_time}`}
                                        </span>
                                        <span>
                                            Submitted {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30"
                                        asChild
                                    >
                                        <Link href={`/parent/messages?teacher=${gig?.teacher_id}`}>
                                            <MessageSquare className="size-4" />
                                            <span className="hidden sm:inline">Message</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        asChild
                                    >
                                        <Link href={`/parent/tutors/${gig?.id}`}>
                                            <ChevronRight className="size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
