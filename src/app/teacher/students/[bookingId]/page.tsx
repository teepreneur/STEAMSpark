"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, Loader2, User, Calendar, Clock, BookOpen,
    Mail, Phone, MessageSquare, Check, X, AlertCircle, MapPin
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"

interface StudentDetails {
    booking_id: string
    status: string | null
    created_at: string
    preferred_days: string[] | null
    preferred_time: string | null
    total_sessions: number | null
    student: {
        id: string
        name: string
        age: number | null
        grade: string | null
        learning_goals: string | null
    }
    parent: {
        id: string
        full_name: string | null
        email: string | null
    }
    gig: {
        id: string
        title: string
        subject: string | null
        price: number
        session_duration: number | null
        total_sessions: number | null
    }
    sessions: {
        id: string
        session_date: string
        session_time: string
        session_number: number
        status: string
    }[]
    session_location_address?: string | null
    session_location_lat?: number | null
    session_location_lng?: number | null
}

function formatTime(time: string): string {
    const [hours] = time.split(':')
    const h = parseInt(hours)
    if (h === 0) return "12:00 AM"
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return "12:00 PM"
    return `${h - 12}:00 PM`
}

export default function StudentDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [studentData, setStudentData] = useState<StudentDetails | null>(null)
    const [showAcceptDialog, setShowAcceptDialog] = useState(false)
    const [meetingLink, setMeetingLink] = useState('')

    useEffect(() => {
        async function loadStudent() {
            setLoading(true)

            // Fetch booking with all related data
            const { data: booking, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    status,
                    created_at,
                    preferred_days,
                    preferred_time,
                    total_sessions,
                    session_location_address,
                    session_location_lat,
                    session_location_lng,
                    student:students(id, name, age, grade, learning_goals),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email),
                    gig:gigs!inner(id, title, subject, price, session_duration, total_sessions, class_type)
                `)
                .eq('id', bookingId)
                .single()

            if (error || !booking) {
                console.error("Error fetching booking:", error)
                router.push('/teacher/students')
                return
            }

            // Fetch session schedule
            const { data: sessions } = await supabase
                .from('booking_sessions')
                .select('*')
                .eq('booking_id', bookingId)
                .order('session_number', { ascending: true })

            // Handle missing student data with placeholder
            const studentData = booking.student || {
                id: booking.id,
                name: 'Student (Pending)',
                age: null,
                grade: null,
                learning_goals: null
            }

            setStudentData({
                booking_id: booking.id,
                status: booking.status,
                created_at: booking.created_at,
                preferred_days: booking.preferred_days,
                preferred_time: booking.preferred_time,
                total_sessions: booking.total_sessions,
                student: studentData as any,
                parent: booking.parent as any,
                gig: booking.gig as any,
                sessions: sessions || [],
                session_location_address: (booking as any).session_location_address,
                session_location_lat: (booking as any).session_location_lat,
                session_location_lng: (booking as any).session_location_lng
            })

            setLoading(false)
        }
        loadStudent()
    }, [bookingId, supabase, router])

    async function updateBookingStatus(newStatus: string) {
        if (!studentData) return
        setUpdating(true)

        // Update the booking status
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', studentData.booking_id)

        if (error) {
            console.error('Booking update error:', error)
            alert(`Failed to update status: ${error.message}`)
            setUpdating(false)
            return
        }

        // Try to save meeting link to booking (column may not exist yet)
        if (meetingLink.trim()) {
            try {
                await supabase
                    .from('bookings')
                    .update({ meeting_link: meetingLink.trim() })
                    .eq('id', studentData.booking_id)
            } catch (e) {
                console.log('Meeting link column may not exist yet:', e)
            }

            // Update all sessions with the meeting link
            await supabase
                .from('booking_sessions')
                .update({ meeting_link: meetingLink.trim() })
                .eq('booking_id', studentData.booking_id)
        }

        // Create in-app notification for parent when booking is accepted
        if (newStatus === 'pending_payment' && studentData.parent?.id) {
            await supabase.from('notifications').insert({
                user_id: studentData.parent.id,
                type: 'booking_accepted',
                title: 'Booking Accepted!',
                message: `Your booking for "${studentData.gig.title}" has been accepted. Complete payment to confirm your sessions.`,
                link: `/parent/booking/${studentData.booking_id}/payment`,
                read: false
            })

            // Call email notification API
            try {
                const { data: { user } } = await supabase.auth.getUser()
                const teacherName = user?.user_metadata?.full_name || "Your Teacher"

                await fetch('/api/notifications/booking-accepted', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parentEmail: studentData.parent.email,
                        parentName: studentData.parent.full_name,
                        parentId: studentData.parent.id,
                        studentName: studentData.student.name,
                        gigTitle: studentData.gig.title,
                        teacherName: teacherName,
                        bookingId: studentData.booking_id
                    })
                })
            } catch (notifyError) {
                console.error('Failed to send email notification:', notifyError)
            }
        }

        setStudentData({ ...studentData, status: newStatus })
        setShowAcceptDialog(false)
        setMeetingLink('')
        setUpdating(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!studentData) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Student not found</h1>
                <Button asChild>
                    <Link href="/teacher/students">Back to Classroom</Link>
                </Button>
            </div>
        )
    }

    const { student, parent, gig, sessions, status } = studentData
    const totalSessions = studentData.total_sessions || gig.total_sessions || 1
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const progress = Math.round((completedSessions / totalSessions) * 100)
    const isPending = status === 'pending' || status === 'pending_payment'

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">
            {/* Back Link */}
            <Link href="/teacher/students" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="size-4" /> Back to Classroom
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Student Info */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                                {student.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-foreground">{student.name}</h1>
                                <p className="text-muted-foreground">
                                    {student.grade || 'No grade'}
                                    {student.age && ` • Age ${student.age}`}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn(
                            "font-bold rounded-lg capitalize text-base px-4 py-1",
                            status === 'confirmed' ? "bg-green-100 text-green-700 border-transparent" :
                                isPending ? "bg-yellow-100 text-yellow-700 border-transparent" :
                                    status === 'completed' ? "bg-blue-100 text-blue-700 border-transparent" :
                                        status === 'cancelled' ? "bg-red-100 text-red-700 border-transparent" : ""
                        )}>
                            {status === 'pending_payment' ? 'Awaiting Payment' : status}
                        </Badge>
                    </div>

                    {/* Booking Request Summary - For Pending Bookings */}
                    {status === 'pending' && (
                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-orange-200 dark:border-orange-800">
                                <AlertCircle className="size-7 text-orange-600 shrink-0" />
                                <div>
                                    <h2 className="text-xl font-black text-orange-800 dark:text-orange-300">Booking Request</h2>
                                    <p className="text-orange-700 dark:text-orange-400 text-sm">Review the details below before accepting or declining</p>
                                </div>
                            </div>

                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Student</p>
                                    <p className="font-bold text-lg">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.grade || 'No grade'}{student.age && ` • Age ${student.age}`}</p>
                                </div>
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Course</p>
                                    <p className="font-bold text-lg">{gig.title}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{gig.subject}</p>
                                </div>
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Your Earnings</p>
                                    <p className="font-black text-2xl text-green-600">GHS {(gig.price * totalSessions).toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">{totalSessions} sessions × GHS {gig.price}/session</p>
                                </div>
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Preferred Days</p>
                                    <p className="font-bold">{studentData.preferred_days?.join(', ') || 'Not specified'}</p>
                                </div>
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Preferred Time</p>
                                    <p className="font-bold">{studentData.preferred_time ? formatTime(studentData.preferred_time) : 'Flexible'}</p>
                                </div>
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Session Duration</p>
                                    <p className="font-bold">{gig.session_duration || 1} hour(s)</p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                <p className="text-xs text-muted-foreground uppercase font-bold mb-2 flex items-center gap-2">
                                    <MapPin className="size-4" /> Session Location
                                </p>
                                {studentData.session_location_address ? (
                                    <div>
                                        <p className="font-bold">{studentData.session_location_address}</p>
                                        <p className="text-sm text-muted-foreground mt-1">In-person sessions at this location</p>
                                    </div>
                                ) : (
                                    <p className="font-bold text-primary">Online Sessions (You'll provide meeting link)</p>
                                )}
                            </div>

                            {/* Parent Info */}
                            <div className="bg-white dark:bg-card rounded-xl p-4 border flex items-center gap-4">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="size-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Parent/Guardian</p>
                                    <p className="font-bold">{parent?.full_name || 'Parent'}</p>
                                    <p className="text-sm text-muted-foreground">{parent?.email}</p>
                                </div>
                            </div>

                            {/* Learning Goals */}
                            {student.learning_goals && (
                                <div className="bg-white dark:bg-card rounded-xl p-4 border">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2 flex items-center gap-2">
                                        <BookOpen className="size-4" /> Learning Goals
                                    </p>
                                    <p className="text-foreground">{student.learning_goals}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                                <Button
                                    onClick={() => setShowAcceptDialog(true)}
                                    disabled={updating}
                                    size="lg"
                                    className="flex-1 bg-green-600 hover:bg-green-700 font-bold gap-2 h-12 text-base"
                                >
                                    <Check className="size-5" />
                                    Accept Booking
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => updateBookingStatus('cancelled')}
                                    disabled={updating}
                                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 font-bold gap-2 h-12 text-base"
                                >
                                    <X className="size-5" />
                                    Decline
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pending Payment Notice */}
                    {status === 'pending_payment' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <Clock className="size-6 text-blue-600 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Awaiting Payment</h3>
                                    <p className="text-blue-700 dark:text-blue-400 text-sm">
                                        You've accepted this booking. The parent has been notified to complete payment. Sessions will be confirmed once payment is received.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accept Dialog */}
                    {showAcceptDialog && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-3">Accept & Add Meeting Link</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Provide your Zoom or Google Meet link for online classes. Students will use this to join.
                            </p>
                            <Input
                                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                className="mb-4"
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => updateBookingStatus('pending_payment')}
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700 font-bold gap-2"
                                >
                                    {updating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                    Confirm Enrollment
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowAcceptDialog(false); setMeetingLink('') }}
                                >
                                    Cancel
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                For in-person classes, you can leave the link empty.
                            </p>
                        </div>
                    )}

                    {/* Learning Goals */}
                    {student.learning_goals && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <BookOpen className="size-5 text-primary" /> Learning Goals
                            </h3>
                            <p className="text-muted-foreground">{student.learning_goals}</p>
                        </div>
                    )}

                    {/* Enrolled Course */}
                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-bold text-lg mb-4">Enrolled Course</h3>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xl font-bold">{gig.title}</p>
                                <p className="text-muted-foreground capitalize">{gig.subject}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-primary">GHS {(gig.price * totalSessions).toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">{totalSessions} sessions × GHS {gig.price}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="size-4" />
                                {gig.session_duration || 1}h per session
                            </div>
                            {studentData.preferred_days && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="size-4" />
                                    {studentData.preferred_days.join(', ')}
                                </div>
                            )}
                            {studentData.preferred_time && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="size-4" />
                                    {formatTime(studentData.preferred_time)}
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Course Progress</span>
                                <span className="font-bold">{completedSessions}/{totalSessions} sessions</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all", progress >= 80 ? "bg-green-500" : "bg-primary")}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Session Location - For In-Person Bookings */}
                    {studentData.session_location_address && studentData.session_location_lat && studentData.session_location_lng && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin className="size-5 text-primary" />
                                Session Location
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-sm">{studentData.session_location_address}</p>
                                </div>
                                <div className="rounded-xl overflow-hidden border h-[250px]">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${studentData.session_location_lat},${studentData.session_location_lng}&zoom=15`}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This is where the in-person sessions will take place. Make sure you can travel to this location.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Session Schedule */}
                    {sessions.length > 0 && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-bold text-lg mb-4">Session Schedule</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "p-3 rounded-lg border",
                                            session.status === 'completed' ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                                                session.status === 'cancelled' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                                                    "bg-muted/50"
                                        )}
                                    >
                                        <span className="text-xs font-bold text-muted-foreground">Session {session.session_number}</span>
                                        <p className="font-bold text-sm">{format(parseISO(session.session_date), 'EEE, MMM d')}</p>
                                        <p className="text-xs text-muted-foreground">{formatTime(session.session_time)}</p>
                                        <Badge variant="outline" className={cn(
                                            "mt-2 text-xs",
                                            session.status === 'completed' ? "bg-green-100 text-green-700 border-transparent" :
                                                session.status === 'cancelled' ? "bg-red-100 text-red-700 border-transparent" :
                                                    "bg-muted text-muted-foreground"
                                        )}>
                                            {session.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Parent Contact & Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl border p-6 sticky top-8 flex flex-col gap-6">
                        <h3 className="font-bold text-lg">Parent Contact</h3>

                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                                <User className="size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-bold">{parent?.full_name || 'Parent'}</p>
                                <p className="text-sm text-muted-foreground">{parent?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full font-bold gap-2" asChild>
                                <Link href={`/teacher/messages?parent=${parent?.id}`}>
                                    <MessageSquare className="size-4" />
                                    Send Message
                                </Link>
                            </Button>
                            {parent?.email && (
                                <Button variant="outline" className="w-full font-bold gap-2" asChild>
                                    <a href={`mailto:${parent.email}`}>
                                        <Mail className="size-4" />
                                        Email Parent
                                    </a>
                                </Button>
                            )}
                        </div>

                        <hr className="border-border" />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Enrolled</span>
                                <span className="font-medium">{format(parseISO(studentData.created_at), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sessions</span>
                                <span className="font-medium">{completedSessions}/{totalSessions} completed</span>
                            </div>
                        </div>

                        {status === 'confirmed' && (
                            <>
                                <hr className="border-border" />
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-300 hover:bg-red-50 font-medium"
                                    onClick={() => updateBookingStatus('cancelled')}
                                    disabled={updating}
                                >
                                    Cancel Enrollment
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
