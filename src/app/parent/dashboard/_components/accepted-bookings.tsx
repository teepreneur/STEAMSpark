"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CreditCard, User, Calendar, ChevronRight, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface AcceptedBooking {
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

export function AcceptedBookings() {
    const supabase = createClient()
    const [bookings, setBookings] = useState<AcceptedBooking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadAcceptedBookings() {
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
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })

            if (data) {
                setBookings(data as unknown as AcceptedBooking[])
            }
            setLoading(false)
        }

        loadAcceptedBookings()
    }, [supabase])

    if (loading || bookings.length === 0) {
        return null
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Ready for Payment</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {bookings.length}
                    </span>
                </div>
            </div>

            <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-green-100/50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800/50">
                    <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle className="size-4" />
                        These bookings have been accepted! Complete payment to start lessons.
                    </p>
                </div>

                <div className="divide-y divide-green-200 dark:divide-green-800/50">
                    {bookings.map((booking) => {
                        const gig = booking.gig as any
                        const teacher = gig?.profiles
                        const student = booking.student as any
                        const totalPrice = (gig?.price || 0) * (booking.total_sessions || 1)

                        return (
                            <div
                                key={booking.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-green-100/30 dark:hover:bg-green-900/20 transition-colors"
                            >
                                {/* Teacher Avatar */}
                                <div className="size-12 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center shrink-0">
                                    {teacher?.avatar_url ? (
                                        <img
                                            src={teacher.avatar_url}
                                            alt={teacher?.full_name || "Teacher"}
                                            className="size-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="size-6 text-green-600 dark:text-green-400" />
                                    )}
                                </div>

                                {/* Booking Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold truncate">{gig?.title}</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-400">
                                            Accepted ✓
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
                                        <span className="font-bold text-green-700 dark:text-green-400 text-sm">
                                            GHS {totalPrice.toFixed(2)}
                                        </span>
                                        <span>
                                            Accepted {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                                        asChild
                                    >
                                        <Link href={`/parent/booking/${booking.id}/payment`}>
                                            <CreditCard className="size-4" />
                                            Pay Now
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
