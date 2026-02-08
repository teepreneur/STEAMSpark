import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const resend = new Resend(process.env.RESEND_API_KEY)

interface PaystackVerifyResponse {
    status: boolean
    message: string
    data: {
        status: string
        reference: string
        amount: number
        currency: string
        paid_at: string
        metadata: {
            booking_id?: string
        }
    }
}

// Generate a formatted receipt message
function generateReceiptMessage(details: {
    reference: string
    amount: number
    paidAt: string
    gigTitle: string
    studentName: string
    parentName: string
    totalSessions: number
    firstSessionDate?: string
    firstSessionTime?: string
}) {
    const formattedDate = new Date(details.paidAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    let firstSessionInfo = ''
    if (details.firstSessionDate) {
        const sessionDate = new Date(details.firstSessionDate).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
        firstSessionInfo = `\n\n🗓️ FIRST SESSION\n━━━━━━━━━━━━━━━━━━━━━\nDate: ${sessionDate}${details.firstSessionTime ? `\nTime: ${details.firstSessionTime}` : ''}\n━━━━━━━━━━━━━━━━━━━━━`
    }

    return `📧 PAYMENT CONFIRMATION

Hello! I've just completed payment for ${details.studentName}'s enrollment.

━━━━━━━━━━━━━━━━━━━━━
📋 RECEIPT
━━━━━━━━━━━━━━━━━━━━━
Course: ${details.gigTitle}
Student: ${details.studentName}
Sessions: ${details.totalSessions}
Amount Paid: GHS ${details.amount.toFixed(2)}
Reference: ${details.reference}
Date: ${formattedDate}
━━━━━━━━━━━━━━━━━━━━━${firstSessionInfo}

Looking forward to the classes! 🎉`
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const reference = searchParams.get('reference')

        if (!reference) {
            return NextResponse.json(
                { error: 'Missing reference parameter' },
                { status: 400 }
            )
        }

        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        const data: PaystackVerifyResponse = await response.json()

        if (!data.status) {
            return NextResponse.json(
                { error: data.message || 'Verification failed' },
                { status: 400 }
            )
        }

        // Check if payment was successful
        if (data.data.status === 'success') {
            const supabase = await createClient()
            const bookingId = data.data.metadata?.booking_id

            if (bookingId) {
                // Get full booking details including parent, teacher, and gig info
                const { data: bookingDetails } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        gig:gigs(id, title, teacher_id),
                        student:students(name),
                        parent:profiles!bookings_parent_id_fkey(id, full_name, email)
                    `)
                    .eq('id', bookingId)
                    .single()

                // Update booking status to confirmed
                const { error: bookingError } = await supabase
                    .from('bookings')
                    .update({
                        status: 'confirmed',
                        payment_status: 'paid',
                        payment_reference: reference,
                        paid_at: data.data.paid_at
                    })
                    .eq('id', bookingId)

                if (bookingError) {
                    console.error('Error updating booking:', bookingError)
                }

                // ========== UPDATE BOOKING SESSIONS TO CONFIRMED ==========
                const { error: sessionsError } = await supabase
                    .from('booking_sessions')
                    .update({ status: 'confirmed' })
                    .eq('booking_id', bookingId)

                if (sessionsError) {
                    console.error('Error updating sessions:', sessionsError)
                }

                // Create teacher earnings record
                if (bookingDetails && (bookingDetails.gig as any)?.teacher_id) {
                    const teacherId = (bookingDetails.gig as any).teacher_id
                    const teacherAmount = bookingDetails.teacher_amount || 0
                    const totalSessions = bookingDetails.total_sessions || 1

                    // Calculate earnings per 2 sessions
                    const earningsPerSession = teacherAmount / totalSessions
                    const numEarningBatches = Math.ceil(totalSessions / 2)

                    const earningsRecords = []
                    for (let i = 0; i < numEarningBatches; i++) {
                        const sessionsInBatch = Math.min(2, totalSessions - i * 2)
                        earningsRecords.push({
                            teacher_id: teacherId,
                            booking_id: bookingId,
                            amount: earningsPerSession * sessionsInBatch,
                            sessions_required: (i + 1) * 2,
                            sessions_completed: 0,
                            status: 'held'
                        })
                    }

                    await supabase.from('teacher_earnings').insert(earningsRecords)

                    // ========== AUTO-CREATE CONVERSATION & SEND PAYMENT MESSAGE ==========
                    const parentId = (bookingDetails.parent as any)?.id
                    const parentName = (bookingDetails.parent as any)?.full_name || 'Parent'
                    const gigTitle = (bookingDetails.gig as any)?.title || 'Course'
                    const studentName = (bookingDetails.student as any)?.name || 'Student'
                    const amountPaid = data.data.amount / 100 // Convert from pesewas

                    if (parentId && teacherId) {
                        // Check if conversation exists or create one
                        let conversationId: string | null = null

                        const { data: existingConvo } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('teacher_id', teacherId)
                            .eq('parent_id', parentId)
                            .single()

                        if (existingConvo) {
                            conversationId = existingConvo.id
                        } else {
                            // Create new conversation
                            const { data: newConvo } = await supabase
                                .from('conversations')
                                .insert({ teacher_id: teacherId, parent_id: parentId })
                                .select('id')
                                .single()

                            if (newConvo) conversationId = newConvo.id
                        }

                        // Send payment confirmation message
                        if (conversationId) {
                            // Get first scheduled session
                            const { data: firstSession } = await supabase
                                .from('booking_sessions')
                                .select('session_date, session_time')
                                .eq('booking_id', bookingId)
                                .order('session_date', { ascending: true })
                                .limit(1)
                                .single()

                            const receiptMessage = generateReceiptMessage({
                                reference,
                                amount: amountPaid,
                                paidAt: data.data.paid_at,
                                gigTitle,
                                studentName,
                                parentName,
                                totalSessions,
                                firstSessionDate: firstSession?.session_date,
                                firstSessionTime: firstSession?.session_time
                            })

                            await supabase.from('messages').insert({
                                conversation_id: conversationId,
                                sender_id: parentId,
                                content: receiptMessage
                            })

                            // Update conversation last_message_at
                            await supabase
                                .from('conversations')
                                .update({ last_message_at: new Date().toISOString() })
                                .eq('id', conversationId)
                        }
                    }

                    // ========== SEND RECEIPT EMAIL TO TEACHER ==========
                    const { data: teacherProfile } = await supabase
                        .from('profiles')
                        .select('email, full_name, whatsapp_number, whatsapp_enabled')
                        .eq('id', teacherId)
                        .single()

                    if (teacherProfile?.email && process.env.RESEND_API_KEY) {
                        const formattedDate = new Date(data.data.paid_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })

                        try {
                            await resend.emails.send({
                                from: 'STEAM Spark <notifications@steamsparkgh.com>',
                                to: teacherProfile.email,
                                subject: `Payment Received: ${gigTitle}`,
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                        <h2 style="color: #16a34a;">💰 Payment Received!</h2>
                                        <p>Hi ${teacherProfile.full_name || 'Teacher'},</p>
                                        <p>Great news! <strong>${parentName}</strong> has completed payment for <strong>${studentName}</strong>'s enrollment in your course.</p>
                                        
                                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="margin-top: 0; color: #166534;">📋 Receipt Details</h3>
                                            <p style="margin: 5px 0;"><strong>Course:</strong> ${gigTitle}</p>
                                            <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                                            <p style="margin: 5px 0;"><strong>Total Sessions:</strong> ${totalSessions}</p>
                                            <p style="margin: 5px 0;"><strong>Amount:</strong> GHS ${amountPaid.toFixed(2)}</p>
                                            <p style="margin: 5px 0;"><strong>Reference:</strong> ${reference}</p>
                                            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                                        </div>
                                        
                                        <p>You can now schedule sessions with the student. The parent has been notified and a conversation has been started.</p>
                                        
                                        <div style="margin: 30px 0;">
                                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.steamsparkgh.com'}/teacher/messages" 
                                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                                View Messages
                                            </a>
                                        </div>
                                        
                                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                                        <p style="color: #94a3b8; font-size: 12px;">STEAM Spark - Empowering the next generation of innovators.</p>
                                    </div>
                                `
                            })
                            console.log(`[Payment] Receipt email sent to teacher ${teacherProfile.email}`)
                        } catch (emailError) {
                            console.error('Failed to send receipt email:', emailError)
                        }
                    }

                    // ========== SEND WHATSAPP TO TEACHER ==========
                    if (teacherProfile?.whatsapp_enabled && teacherProfile?.whatsapp_number) {
                        try {
                            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.steamsparkgh.com'
                            await fetch(`${appUrl}/api/notifications/whatsapp`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: teacherProfile.whatsapp_number,
                                    templateType: 'payment_received',
                                    variables: {
                                        gigTitle,
                                        studentName,
                                        amount: `GHS ${amountPaid.toFixed(2)}`,
                                        parentName
                                    }
                                })
                            })
                            console.log(`[WhatsApp] Payment notification sent to teacher ${teacherProfile.whatsapp_number}`)
                        } catch (waError) {
                            console.error('Failed to send WhatsApp to teacher:', waError)
                        }
                    }

                    // ========== IN-APP NOTIFICATIONS ==========
                    // Notify teacher
                    await supabase.from('notifications').insert({
                        user_id: teacherId,
                        type: 'payment_received',
                        title: 'New Student Enrolled! 💰',
                        message: `${parentName} paid for ${studentName}'s enrollment in "${gigTitle}". GHS ${amountPaid.toFixed(2)} received.`,
                        action_url: `/teacher/students`
                    })

                    // Notify parent
                    await supabase.from('notifications').insert({
                        user_id: parentId,
                        type: 'payment_confirmed',
                        title: 'Payment Successful! 🎉',
                        message: `Your payment of GHS ${amountPaid.toFixed(2)} for "${gigTitle}" is confirmed. Sessions are now scheduled with ${teacherProfile?.full_name || 'your teacher'}.`,
                        action_url: `/parent/dashboard`
                    })

                    // ========== SEND CONFIRMATION EMAIL TO PARENT ==========
                    const parentEmail = (bookingDetails.parent as any)?.email
                    if (parentEmail && process.env.RESEND_API_KEY) {
                        const formattedDate = new Date(data.data.paid_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })

                        try {
                            await resend.emails.send({
                                from: 'STEAM Spark <notifications@steamsparkgh.com>',
                                to: parentEmail,
                                subject: `Payment Confirmed: ${gigTitle}`,
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                        <h2 style="color: #16a34a;">✅ Payment Confirmed!</h2>
                                        <p>Hi ${parentName},</p>
                                        <p>Great news! Your payment for <strong>${studentName}</strong>'s enrollment has been confirmed.</p>
                                        
                                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="margin-top: 0; color: #166534;">📋 Receipt</h3>
                                            <p style="margin: 5px 0;"><strong>Course:</strong> ${gigTitle}</p>
                                            <p style="margin: 5px 0;"><strong>Teacher:</strong> ${teacherProfile?.full_name || 'Your Teacher'}</p>
                                            <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                                            <p style="margin: 5px 0;"><strong>Total Sessions:</strong> ${totalSessions}</p>
                                            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> GHS ${amountPaid.toFixed(2)}</p>
                                            <p style="margin: 5px 0;"><strong>Reference:</strong> ${reference}</p>
                                            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                                        </div>
                                        
                                        <p>Your sessions are now scheduled! You can view them in your dashboard and message your teacher to coordinate.</p>
                                        
                                        <div style="margin: 30px 0;">
                                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.steamsparkgh.com'}/parent/dashboard" 
                                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                                View Dashboard
                                            </a>
                                        </div>
                                        
                                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                                        <p style="color: #94a3b8; font-size: 12px;">STEAM Spark - Empowering the next generation of innovators.</p>
                                    </div>
                                `
                            })
                            console.log(`[Payment] Confirmation email sent to parent ${parentEmail}`)
                        } catch (emailError) {
                            console.error('Failed to send confirmation email to parent:', emailError)
                        }
                    }
                }

                // Create payment record
                await supabase.from('payments').insert({
                    booking_id: bookingId,
                    amount: data.data.amount / 100,
                    currency: data.data.currency,
                    status: 'success',
                    paystack_reference: reference,
                    paid_at: data.data.paid_at
                })
            }

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified successfully',
                booking_id: bookingId
            })
        }

        return NextResponse.json({
            status: data.data.status,
            message: 'Payment not completed'
        })

    } catch (error) {
        console.error('Paystack verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

