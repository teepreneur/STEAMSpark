"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createConciergeBooking(formData: {
    parentId: string
    studentId: string
    teacherId: string
    title: string
    subject: string
    price: number
    totalSessions: number
    sessionDuration: number
    startDate: string
    preferredTime: string
    preferredDays: string[]
}) {
    const supabase = await createClient()

    // 1. Create the Gig
    const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .insert({
            teacher_id: formData.teacherId,
            title: formData.title,
            subject: formData.subject,
            price: formData.price,
            total_sessions: formData.totalSessions,
            session_duration: formData.sessionDuration,
            status: 'active',
            class_type: 'online' // Default for concierge for now
        })
        .select()
        .single()

    if (gigError) {
        console.error('Gig creation error:', gigError)
        return { error: `Failed to create gig: ${gigError.message}` }
    }

    // 2. Create the Booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            gig_id: gig.id,
            parent_id: formData.parentId,
            student_id: formData.studentId,
            status: 'confirmed', // Concierge bookings are confirmed immediately
            total_sessions: formData.totalSessions,
            session_date: formData.startDate,
            preferred_time: formData.preferredTime,
            preferred_days: formData.preferredDays,
            scheduled_at: new Date().toISOString()
        })
        .select()
        .single()

    if (bookingError) {
        console.error('Booking creation error:', bookingError)
        // Cleanup gig if booking fails
        await supabase.from('gigs').delete().eq('id', gig.id)
        return { error: `Failed to create booking: ${bookingError.message}` }
    }

    // 3. Create Booking Sessions
    const sessions = Array.from({ length: formData.totalSessions }).map((_, i) => ({
        booking_id: booking.id,
        session_number: i + 1,
        status: 'scheduled' as const,
        session_date: formData.startDate, // Initial placeholder, real scheduling logic would be more complex
        session_time: formData.preferredTime
    }))

    const { error: sessionsError } = await supabase
        .from('booking_sessions')
        .insert(sessions)

    if (sessionsError) {
        console.error('Sessions creation error:', sessionsError)
        // Cleanup booking and gig if sessions fail
        await supabase.from('bookings').delete().eq('id', booking.id)
        await supabase.from('gigs').delete().eq('id', gig.id)
        return { error: `Failed to create sessions: ${sessionsError.message}` }
    }

    // 4. Log Admin Action
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('admin_logs').insert({
                admin_id: user.id,
                action: 'create_concierge_booking',
                target_type: 'booking',
                target_id: booking.id,
                details: {
                    parent_id: formData.parentId,
                    student_id: formData.studentId,
                    teacher_id: formData.teacherId,
                    gig_title: formData.title
                }
            })
        }
    } catch (logError) {
        console.error('Failed to log admin action:', logError)
    }

    revalidatePath('/admin/bookings')
    revalidatePath('/parent/dashboard')
    revalidatePath('/teacher/students')

    return { success: true, bookingId: booking.id }
}
