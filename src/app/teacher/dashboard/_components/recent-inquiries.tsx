"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Bell, Check, X, Inbox, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Booking {
    id: string
    created_at: string
    status: string
    gigs: {
        title: string
    }
    students: {
        name: string
    }
    profiles: {
        id: string
        full_name: string
        email: string
    }
}

export function RecentInquiries() {
    const supabase = createClient()
    const [inquiries, setInquiries] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadInquiries() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get pending bookings for teacher's gigs
            const { data } = await supabase
                .from('bookings')
                .select(`
                    id,
                    created_at,
                    status,
                    parent_id,
                    gigs!inner (title, teacher_id),
                    students (name),
                    profiles:parent_id (id, full_name, email)
                `)
                .eq('gigs.teacher_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                setInquiries(data as unknown as Booking[])
            }
            setLoading(false)
        }

        loadInquiries()
    }, [supabase])

    const handleAccept = async (id: string) => {
        // Find the inquiry to get parent_id and gig title
        const inquiry = inquiries.find(i => i.id === id)
        if (!inquiry) return

        const { data: { user } } = await supabase.auth.getUser()
        const teacherName = user?.user_metadata?.full_name || "Your Teacher"

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'pending_payment' })
            .eq('id', id)

        if (!error) {
            // 1. Create in-app notification
            const parentId = inquiry.profiles?.id || (inquiry as any).parent_id
            if (parentId) {
                await supabase.from('notifications').insert({
                    user_id: parentId,
                    type: 'booking_accepted',
                    title: 'Booking Accepted!',
                    message: `Your booking for "${inquiry.gigs.title}" has been accepted. Complete payment to confirm sessions.`,
                    link: `/parent/booking/${id}/payment`,
                    read: false
                })
            }

            // 2. Call email notification API
            try {
                await fetch('/api/notifications/booking-accepted', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parentEmail: inquiry.profiles?.email,
                        parentName: inquiry.profiles?.full_name,
                        parentId: parentId,
                        studentName: inquiry.students?.name,
                        gigTitle: inquiry.gigs.title,
                        teacherName: teacherName,
                        bookingId: id
                    })
                })
            } catch (notifyError) {
                console.error('Failed to send email notification:', notifyError)
            }

            setInquiries(inquiries.filter(i => i.id !== id))
        }
    }

    const handleDecline = async (id: string) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', id)

        if (!error) {
            setInquiries(inquiries.filter(i => i.id !== id))
        }
    }

    if (loading) {
        return (
            <section className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="text-primary size-5" /> New Bookings
                    </h2>
                </div>
                <div className="bg-card rounded-xl border shadow-sm p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                </div>
            </section>
        )
    }

    if (inquiries.length === 0) {
        return (
            <section className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="text-primary size-5" /> New Bookings
                    </h2>
                </div>
                <div className="bg-card rounded-xl border shadow-sm p-6 text-center">
                    <Inbox className="size-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending bookings</p>
                    <p className="text-xs text-muted-foreground mt-1">New booking requests will appear here</p>
                </div>
            </section>
        )
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const colors = [
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    ]

    return (
        <section className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Bell className="text-primary size-5" /> New Bookings
                </h2>
                {inquiries.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {inquiries.length}
                    </span>
                )}
            </div>
            <div className="bg-card rounded-xl border shadow-sm flex flex-col divide-y">
                {inquiries.map((inquiry, index) => {
                    const parentName = (inquiry.profiles as any)?.full_name || "Parent"
                    const studentName = (inquiry.students as any)?.name || "Student"
                    const gigTitle = (inquiry.gigs as any)?.title || "Course"

                    return (
                        <Link
                            key={inquiry.id}
                            href={`/teacher/students/${inquiry.id}`}
                            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`size-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${colors[index % colors.length]}`}>
                                    {getInitials(parentName)}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold">{parentName}</p>
                                        <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Booking <span className="font-medium text-primary">{gigTitle}</span> for {studentName}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                            <AlertCircle size={12} /> Pending your review
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}

