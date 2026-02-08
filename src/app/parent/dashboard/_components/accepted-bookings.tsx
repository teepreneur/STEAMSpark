"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CreditCard, User, ChevronRight, CheckCircle, X, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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

const CANCELLATION_REASONS = [
    { id: "too_expensive", label: "Too expensive / Budget constraints" },
    { id: "found_alternative", label: "Found another tutor/course" },
    { id: "schedule_conflict", label: "Schedule no longer works" },
    { id: "changed_mind", label: "Changed my mind about the subject" },
    { id: "child_decision", label: "My child is no longer interested" },
    { id: "other", label: "Other reason" }
]

export function AcceptedBookings() {
    const supabase = createClient()
    const [bookings, setBookings] = useState<AcceptedBooking[]>([])
    const [loading, setLoading] = useState(true)

    // Cancellation dialog state
    const [cancelDialog, setCancelDialog] = useState<{
        isOpen: boolean
        bookingId: string
        gigTitle: string
        teacherName: string
    }>({ isOpen: false, bookingId: "", gigTitle: "", teacherName: "" })
    const [selectedReason, setSelectedReason] = useState("")
    const [additionalFeedback, setAdditionalFeedback] = useState("")
    const [cancelling, setCancelling] = useState(false)

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

    useEffect(() => {
        loadAcceptedBookings()
    }, [supabase])

    async function handleCancelBooking() {
        if (!selectedReason || !cancelDialog.bookingId) return

        setCancelling(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Get parent profile for name
            const { data: parentProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            const reasonLabel = CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason

            // Update booking status to cancelled
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    cancellation_reason: selectedReason,
                    cancellation_feedback: additionalFeedback || null,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: 'parent'
                })
                .eq('id', cancelDialog.bookingId)

            if (updateError) throw updateError

            // Create admin notification with the feedback
            await supabase.from('notifications').insert({
                user_id: user.id, // This will be filtered for admin views
                type: 'booking_cancelled',
                title: 'Booking Cancelled by Parent',
                message: `${parentProfile?.full_name || 'A parent'} cancelled booking for "${cancelDialog.gigTitle}" with ${cancelDialog.teacherName}.\n\nReason: ${reasonLabel}${additionalFeedback ? `\n\nAdditional feedback: ${additionalFeedback}` : ''}`,
                action_url: `/admin/bookings/${cancelDialog.bookingId}`,
                metadata: {
                    booking_id: cancelDialog.bookingId,
                    cancellation_reason: selectedReason,
                    cancellation_feedback: additionalFeedback,
                    gig_title: cancelDialog.gigTitle,
                    teacher_name: cancelDialog.teacherName,
                    is_admin_feedback: true
                }
            })

            // Also notify the teacher
            const booking = bookings.find(b => b.id === cancelDialog.bookingId)
            if (booking) {
                await supabase.from('notifications').insert({
                    user_id: (booking.gig as any).teacher_id,
                    type: 'booking_cancelled',
                    title: 'Booking Cancelled',
                    message: `${parentProfile?.full_name || 'The parent'} has cancelled the booking for "${cancelDialog.gigTitle}".`,
                    action_url: `/teacher/students`
                })
            }

            // Close dialog and refresh
            setCancelDialog({ isOpen: false, bookingId: "", gigTitle: "", teacherName: "" })
            setSelectedReason("")
            setAdditionalFeedback("")
            loadAcceptedBookings()

        } catch (err) {
            console.error('Cancellation error:', err)
        } finally {
            setCancelling(false)
        }
    }

    if (loading || bookings.length === 0) {
        return null
    }

    return (
        <>
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
                                            variant="outline"
                                            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                                            onClick={() => setCancelDialog({
                                                isOpen: true,
                                                bookingId: booking.id,
                                                gigTitle: gig?.title || "Course",
                                                teacherName: teacher?.full_name || "Teacher"
                                            })}
                                        >
                                            <X className="size-4" />
                                            Cancel
                                        </Button>
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

            {/* Cancellation Dialog */}
            <Dialog open={cancelDialog.isOpen} onOpenChange={(open) => {
                if (!open) {
                    setCancelDialog({ isOpen: false, bookingId: "", gigTitle: "", teacherName: "" })
                    setSelectedReason("")
                    setAdditionalFeedback("")
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            You're about to cancel your booking for <strong>{cancelDialog.gigTitle}</strong> with {cancelDialog.teacherName}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
                            <Label className="font-semibold">Why are you cancelling?</Label>
                            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                                {CANCELLATION_REASONS.map((reason) => (
                                    <div key={reason.id} className="flex items-center space-x-3">
                                        <RadioGroupItem value={reason.id} id={reason.id} />
                                        <Label htmlFor={reason.id} className="cursor-pointer font-normal">
                                            {reason.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="feedback">Additional feedback (optional)</Label>
                            <Textarea
                                id="feedback"
                                placeholder="Help us improve by sharing more details..."
                                value={additionalFeedback}
                                onChange={(e) => setAdditionalFeedback(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialog({ isOpen: false, bookingId: "", gigTitle: "", teacherName: "" })}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelBooking}
                            disabled={!selectedReason || cancelling}
                        >
                            {cancelling ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Cancelling...
                                </>
                            ) : (
                                "Cancel Booking"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
