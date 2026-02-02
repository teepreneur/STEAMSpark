"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, BookOpen, User, GraduationCap, DollarSign,
    CheckCircle, Clock, XCircle, Loader2, Calendar, Mail,
    AlertTriangle, RefreshCcw
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { getAdminHref } from "@/lib/admin-paths"

interface BookingDetails {
    id: string
    status: string | null
    created_at: string
    total_sessions: number | null
    session_date: string | null
    preferred_days: string[] | null
    preferred_time: string | null
    meeting_link: string | null
    gig: {
        id: string
        title: string
        subject: string | null
        price: number
        session_duration: number | null
        teacher_id: string
    } | null
    parent: {
        id: string
        full_name: string | null
        email: string | null
    } | null
    student: {
        id: string
        name: string
        age: number | null
        grade: string | null
    } | null
    teacher?: {
        id: string
        full_name: string | null
        email: string | null
    } | null
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [booking, setBooking] = useState<BookingDetails | null>(null)
    const [adminNote, setAdminNote] = useState("")

    useEffect(() => {
        async function loadBooking() {
            setLoading(true)

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, status, created_at, total_sessions, session_date,
                    preferred_days, preferred_time, meeting_link,
                    gig:gigs(id, title, subject, price, session_duration, teacher_id),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email),
                    student:students(id, name, age, grade)
                `)
                .eq('id', id)
                .single()

            if (error || !data) {
                console.error('Error loading booking:', error)
                router.push(getAdminHref('/admin/bookings'))
                return
            }

            // Fetch teacher info
            let teacher = null
            if ((data as any).gig?.teacher_id) {
                const { data: teacherData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .eq('id', (data as any).gig.teacher_id)
                    .single()
                teacher = teacherData
            }

            setBooking({ ...data as any, teacher })
            setLoading(false)
        }
        loadBooking()
    }, [id, supabase, router])

    async function updateStatus(newStatus: string) {
        if (!booking) return
        setUpdating(true)

        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', booking.id)

        if (error) {
            alert(`Failed to update: ${error.message}`)
            setUpdating(false)
            return
        }

        // Log admin action
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action: `booking_status_${newStatus}`,
            target_type: 'booking',
            target_id: booking.id,
            details: {
                previous_status: booking.status,
                new_status: newStatus,
                admin_note: adminNote
            }
        })

        setBooking({ ...booking, status: newStatus })
        setAdminNote("")
        setUpdating(false)
    }

    async function forceConfirm() {
        // Force confirm - bypasses payment
        await updateStatus('confirmed')

        // Create booking sessions if not exists
        if (booking?.total_sessions) {
            const existingSessions = await supabase
                .from('booking_sessions')
                .select('id')
                .eq('booking_id', booking.id)

            if (!existingSessions.data?.length) {
                const sessions = Array.from({ length: booking.total_sessions }).map((_, i) => ({
                    booking_id: booking.id,
                    session_number: i + 1,
                    status: 'scheduled'
                }))
                await supabase.from('booking_sessions').insert(sessions)
            }
        }
    }

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="size-3 mr-1" />Confirmed</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="size-3 mr-1" />Pending</Badge>
            case 'pending_payment':
                return <Badge className="bg-blue-100 text-blue-700"><DollarSign className="size-3 mr-1" />Awaiting Payment</Badge>
            case 'completed':
                return <Badge className="bg-slate-100 text-slate-700"><CheckCircle className="size-3 mr-1" />Completed</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700"><XCircle className="size-3 mr-1" />Cancelled</Badge>
            default:
                return <Badge variant="secondary">{status || 'Unknown'}</Badge>
        }
    }

    if (loading || !booking) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const totalAmount = (booking.gig?.price || 0) * (booking.total_sessions || 1)

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Back link */}
            <Link
                href={getAdminHref("/admin/bookings")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Bookings
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{booking.gig?.title || 'Booking'}</h1>
                    <p className="text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}...</p>
                </div>
                {getStatusBadge(booking.status)}
            </div>

            {/* Admin Actions */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <AlertTriangle className="size-5 text-amber-600" />
                    Admin Actions
                </h2>

                <div className="space-y-4">
                    <Textarea
                        placeholder="Optional: Add a note for this action (logged for records)..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="bg-white dark:bg-slate-900"
                    />

                    <div className="flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                            <>
                                <Button
                                    onClick={() => updateStatus('pending_payment')}
                                    disabled={updating}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCircle className="size-4 mr-2" />
                                    Approve (Teacher Action)
                                </Button>
                                <Button
                                    onClick={() => updateStatus('cancelled')}
                                    disabled={updating}
                                    variant="outline"
                                    className="text-red-600 border-red-300"
                                >
                                    <XCircle className="size-4 mr-2" />
                                    Decline
                                </Button>
                            </>
                        )}

                        {booking.status === 'pending_payment' && (
                            <>
                                <Button
                                    onClick={forceConfirm}
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <DollarSign className="size-4 mr-2" />
                                    Force Confirm (Skip Payment)
                                </Button>
                                <Button
                                    onClick={() => updateStatus('cancelled')}
                                    disabled={updating}
                                    variant="outline"
                                    className="text-red-600 border-red-300"
                                >
                                    <XCircle className="size-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        )}

                        {booking.status === 'confirmed' && (
                            <>
                                <Button
                                    onClick={() => updateStatus('completed')}
                                    disabled={updating}
                                    className="bg-slate-600 hover:bg-slate-700"
                                >
                                    <CheckCircle className="size-4 mr-2" />
                                    Mark Completed
                                </Button>
                                <Button
                                    onClick={() => updateStatus('cancelled')}
                                    disabled={updating}
                                    variant="outline"
                                    className="text-red-600 border-red-300"
                                >
                                    <XCircle className="size-4 mr-2" />
                                    Cancel Booking
                                </Button>
                            </>
                        )}

                        {booking.status === 'cancelled' && (
                            <Button
                                onClick={() => updateStatus('pending')}
                                disabled={updating}
                                variant="outline"
                            >
                                <RefreshCcw className="size-4 mr-2" />
                                Reopen Booking
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Parent Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <User className="size-5" /> Parent
                    </h3>
                    <div className="space-y-2">
                        <p className="font-medium">{booking.parent?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="size-4" /> {booking.parent?.email}
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={getAdminHref(`/admin/users/parents/${booking.parent?.id}`)}>
                                View Profile
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Teacher Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <GraduationCap className="size-5" /> Teacher
                    </h3>
                    <div className="space-y-2">
                        <p className="font-medium">{booking.teacher?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="size-4" /> {booking.teacher?.email}
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={getAdminHref(`/admin/users/teachers/${booking.teacher?.id}`)}>
                                View Profile
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Student Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="size-5" /> Student
                    </h3>
                    {booking.student ? (
                        <div className="space-y-1">
                            <p className="font-medium">{booking.student.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Age: {booking.student.age || 'N/A'} • Grade: {booking.student.grade || 'N/A'}
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No student assigned</p>
                    )}
                </div>

                {/* Course Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="size-5" /> Pricing
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Per session</span>
                            <span>GHS {booking.gig?.price?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sessions</span>
                            <span>{booking.total_sessions || 1}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">GHS {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Calendar className="size-5" /> Schedule
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                            {booking.session_date
                                ? format(parseISO(booking.session_date), 'MMMM d, yyyy')
                                : 'Not scheduled'
                            }
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Preferred Days</p>
                        <p className="font-medium">
                            {booking.preferred_days?.join(', ') || 'Not specified'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                            {booking.preferred_time || 'Not specified'}
                        </p>
                    </div>
                </div>
                {booking.meeting_link && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Meeting Link</p>
                        <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline break-all">
                            {booking.meeting_link}
                        </a>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h3 className="font-bold mb-4">Booking Info</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Booking ID</p>
                        <p className="font-mono text-xs">{booking.id}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{format(parseISO(booking.created_at), 'MMMM d, yyyy, h:mm a')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
