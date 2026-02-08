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

        console.log(`[Payment Verify] Starting verification for reference: ${reference}`)

        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        const data: PaystackVerifyResponse = await response.json()
        console.log(`[Payment Verify] Paystack response status: ${data.status}, payment status: ${data.data?.status}`)

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

            if (!bookingId) {
                console.error('[Payment Verify] No booking_id in payment metadata!')
                return NextResponse.json({
                    status: 'success',
                    message: 'Payment verified but no booking linked'
                })
            }

            console.log(`[Payment Verify] Processing booking: ${bookingId}`)

            // Get full booking details including parent, teacher, and gig info
            const { data: bookingDetails, error: bookingFetchError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    gig:gigs(id, title, teacher_id),
                    student:students(name),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email)
                `)
                .eq('id', bookingId)
                .single()

            if (bookingFetchError) {
                console.error('[Payment Verify] Error fetching booking:', bookingFetchError)
            }

            console.log(`[Payment Verify] Booking details loaded. Teacher ID: ${(bookingDetails?.gig as any)?.teacher_id}`)

            // ========== 1. UPDATE BOOKING STATUS ==========
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
                console.error('[Payment Verify] Error updating booking:', bookingError)
            } else {
                console.log('[Payment Verify] ✅ Booking status updated to confirmed')
            }

            // ========== 2. UPDATE SESSIONS STATUS ==========
            const { error: sessionsError, data: updatedSessions } = await supabase
                .from('booking_sessions')
                .update({ status: 'confirmed' })
                .eq('booking_id', bookingId)
                .select()

            if (sessionsError) {
                console.error('[Payment Verify] Error updating sessions:', sessionsError)
            } else {
                console.log(`[Payment Verify] ✅ Updated ${updatedSessions?.length || 0} sessions to confirmed`)
            }

            // ========== 3. CREATE PAYMENT RECORD ==========
            const { error: paymentError } = await supabase.from('payments').insert({
                booking_id: bookingId,
                amount: data.data.amount / 100,
                currency: data.data.currency,
                status: 'success',
                paystack_reference: reference,
                paid_at: data.data.paid_at
            })

            if (paymentError) {
                console.error('[Payment Verify] Error creating payment record:', paymentError)
            } else {
                console.log('[Payment Verify] ✅ Payment record created')
            }

            // Extract key info (with defaults)
            const teacherId = (bookingDetails?.gig as any)?.teacher_id
            const parentId = (bookingDetails?.parent as any)?.id
            const parentName = (bookingDetails?.parent as any)?.full_name || 'Parent'
            const parentEmail = (bookingDetails?.parent as any)?.email
            const gigTitle = (bookingDetails?.gig as any)?.title || 'Course'
            const studentName = (bookingDetails?.student as any)?.name || 'Student'
            const amountPaid = data.data.amount / 100
            const teacherAmount = bookingDetails?.teacher_amount || 0
            const totalSessions = bookingDetails?.total_sessions || 1

            console.log(`[Payment Verify] Teacher: ${teacherId}, Parent: ${parentId}, Amount: ${amountPaid}`)

            // ========== 4. CREATE TEACHER EARNINGS ==========
            if (teacherId && teacherAmount > 0) {
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

                const { error: earningsError } = await supabase.from('teacher_earnings').insert(earningsRecords)
                if (earningsError) {
                    console.error('[Payment Verify] Error creating earnings:', earningsError)
                } else {
                    console.log(`[Payment Verify] ✅ Created ${earningsRecords.length} teacher earnings records`)
                }
            }

            // ========== 5. CREATE/UPDATE CONVERSATION & SEND MESSAGE ==========
            if (parentId && teacherId) {
                try {
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
                        const { data: newConvo } = await supabase
                            .from('conversations')
                            .insert({ teacher_id: teacherId, parent_id: parentId })
                            .select('id')
                            .single()

                        if (newConvo) conversationId = newConvo.id
                    }

                    if (conversationId) {
                        // Get first scheduled session for the message
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

                        await supabase
                            .from('conversations')
                            .update({ last_message_at: new Date().toISOString() })
                            .eq('id', conversationId)

                        console.log('[Payment Verify] ✅ Conversation message sent')
                    }
                } catch (convoError) {
                    console.error('[Payment Verify] Error with conversation:', convoError)
                }
            }

            // ========== 6. GET TEACHER PROFILE FOR NOTIFICATIONS ==========
            let teacherProfile: any = null
            if (teacherId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name, whatsapp_number, whatsapp_enabled')
                    .eq('id', teacherId)
                    .single()
                teacherProfile = profile
            }

            // ========== 7. SEND RECEIPT EMAIL TO TEACHER ==========
            if (teacherProfile?.email && process.env.RESEND_API_KEY) {
                try {
                    const formattedDate = new Date(data.data.paid_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })

                    await resend.emails.send({
                        from: 'STEAM Spark <notifications@steamsparkgh.com>',
                        to: teacherProfile.email,
                        subject: `New Booking Payment: ${gigTitle}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #16a34a;">💰 Payment Received!</h2>
                                <p>Hi ${teacherProfile.full_name},</p>
                                <p>${parentName} has just paid for ${studentName}'s enrollment in <strong>${gigTitle}</strong>.</p>
                                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                                    <p style="margin: 5px 0;"><strong>Sessions:</strong> ${totalSessions}</p>
                                    <p style="margin: 5px 0;"><strong>Your Earnings:</strong> GHS ${teacherAmount.toFixed(2)}</p>
                                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                                </div>
                                <p>View your student list at <a href="https://app.steamsparkgh.com/teacher/students">your dashboard</a>.</p>
                            </div>
                        `
                    })
                    console.log('[Payment Verify] ✅ Teacher email sent')
                } catch (emailError) {
                    console.error('[Payment Verify] Failed to send teacher email:', emailError)
                }
            }

            // ========== 8. SEND WHATSAPP TO TEACHER ==========
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
                    console.log('[Payment Verify] ✅ WhatsApp sent to teacher')
                } catch (waError) {
                    console.error('[Payment Verify] Failed to send WhatsApp:', waError)
                }
            }

            // ========== 9. IN-APP NOTIFICATIONS (MOVED OUTSIDE NESTED IFS) ==========
            // Notify teacher (if we have teacherId)
            if (teacherId) {
                const { error: teacherNotifError } = await supabase.from('notifications').insert({
                    user_id: teacherId,
                    type: 'payment_received',
                    title: 'New Student Enrolled! 💰',
                    message: `${parentName} paid for ${studentName}'s enrollment in "${gigTitle}". GHS ${amountPaid.toFixed(2)} received.`,
                    action_url: `/teacher/students`
                })
                if (teacherNotifError) {
                    console.error('[Payment Verify] Error creating teacher notification:', teacherNotifError)
                } else {
                    console.log('[Payment Verify] ✅ Teacher notification created')
                }
            } else {
                console.warn('[Payment Verify] ⚠️ No teacherId - skipping teacher notification')
            }

            // Notify parent (if we have parentId)
            if (parentId) {
                const teacherName = teacherProfile?.full_name || 'your teacher'
                const { error: parentNotifError } = await supabase.from('notifications').insert({
                    user_id: parentId,
                    type: 'payment_confirmed',
                    title: 'Payment Successful! 🎉',
                    message: `Your payment of GHS ${amountPaid.toFixed(2)} for "${gigTitle}" is confirmed. Sessions are now scheduled with ${teacherName}.`,
                    action_url: `/parent/dashboard`
                })
                if (parentNotifError) {
                    console.error('[Payment Verify] Error creating parent notification:', parentNotifError)
                } else {
                    console.log('[Payment Verify] ✅ Parent notification created')
                }
            } else {
                console.warn('[Payment Verify] ⚠️ No parentId - skipping parent notification')
            }

            // ========== 10. SEND CONFIRMATION EMAIL TO PARENT ==========
            if (parentEmail && process.env.RESEND_API_KEY) {
                try {
                    const formattedDate = new Date(data.data.paid_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })

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

                                <h3 style="color: #1d4ed8;">📱 What's Next?</h3>
                                <ul style="line-height: 1.8;">
                                    <li>Your sessions are now confirmed in your dashboard</li>
                                    <li>You can message your teacher directly from the app</li>
                                    <li>You'll receive reminders before each session</li>
                                </ul>

                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="https://app.steamsparkgh.com/parent/dashboard" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                        View Your Dashboard
                                    </a>
                                </div>
                            </div>
                        `
                    })
                    console.log('[Payment Verify] ✅ Parent confirmation email sent')
                } catch (emailError) {
                    console.error('[Payment Verify] Failed to send parent email:', emailError)
                }
            }

            console.log('[Payment Verify] ✅ Payment verification complete!')

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
        console.error('[Payment Verify] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
