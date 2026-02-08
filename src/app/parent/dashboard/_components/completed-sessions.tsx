"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle, Star, MessageSquare } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ReviewSubmission } from "@/components/reviews/review-submission"

interface CompletedSession {
    id: string
    session_date: string
    session_time: string
    status: string
    booking: {
        id: string
        teacher_id: string
        gigs: {
            title: string
            profiles: {
                full_name: string
            }
        }
        reviews: { id: string }[]
    }
}

export function CompletedSessions() {
    const supabase = createClient()
    const [sessions, setSessions] = useState<CompletedSession[]>([])
    const [loading, setLoading] = useState(true)
    const [reviewDialog, setReviewDialog] = useState<{
        isOpen: boolean
        teacherId: string
        teacherName: string
        bookingId: string
    }>({
        isOpen: false,
        teacherId: "",
        teacherName: "",
        bookingId: ""
    })

    useEffect(() => {
        loadCompletedSessions()
    }, [])

    async function loadCompletedSessions() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch sessions that are confirmed but in the past, or marked as completed
        // And check if a review already exists
        const { data, error } = await supabase
            .from('booking_sessions')
            .select(`
                id,
                session_date,
                session_time,
                status,
                booking:bookings!inner (
                    id,
                    teacher_id,
                    parent_id,
                    gigs (
                        title,
                        profiles:teacher_id (full_name)
                    ),
                    reviews:reviews!reviews_booking_id_fkey (id)
                )
            `)
            .eq('booking.parent_id', user.id)
            .lt('session_date', new Date().toISOString().split('T')[0])
            .order('session_date', { ascending: false })
            .limit(3)

        if (data) {
            setSessions(data as unknown as CompletedSession[])
        }
        setLoading(false)
    }

    if (loading || sessions.length === 0) return null

    return (
        <section className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Past Sessions</h3>
            <div className="bg-card rounded-xl border shadow-sm divide-y overflow-hidden">
                {sessions.map((session) => {
                    const hasReview = session.booking.reviews.length > 0
                    const teacherName = session.booking.gigs.profiles?.full_name || "Teacher"

                    return (
                        <div key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 bg-muted/50 text-muted-foreground">
                                <CheckCircle className="size-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate">{session.booking.gigs.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Completed on {format(parseISO(session.session_date), 'MMM d, yyyy')} with {teacherName}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {hasReview ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                        <Star className="size-3.5 fill-green-600" />
                                        Reviewed
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="gap-2 font-bold shadow-sm"
                                        onClick={() => setReviewDialog({
                                            isOpen: true,
                                            teacherId: session.booking.teacher_id,
                                            teacherName: teacherName,
                                            bookingId: session.booking.id
                                        })}
                                    >
                                        <Star className="size-4" />
                                        Rate Teacher
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <ReviewSubmission
                teacherId={reviewDialog.teacherId}
                teacherName={reviewDialog.teacherName}
                bookingId={reviewDialog.bookingId}
                isOpen={reviewDialog.isOpen}
                onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, isOpen: open }))}
                onSuccess={loadCompletedSessions}
            />
        </section>
    )
}
