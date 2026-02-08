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

// Generate a formatted HTML receipt for email
function generateEmailReceipt({
    details,
    teacherName,
    formattedDate
}: {
    details: any,
    teacherName: string,
    formattedDate: string
}) {
    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #16a34a; margin: 0;">✅ Payment Confirmed!</h2>
                <p style="color: #64748b; margin-top: 8px;">Receipt #${details.reference}</p>
            </div>

            <p>Hi ${details.parentName},</p>
            <p>Great news! Your payment for <strong>${details.studentName}</strong>'s enrollment has been confirmed.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; margin-bottom: 16px;">PAYMENT DETAILS</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Course</td>
                        <td style="padding: 8px 0; color: #0f172a; text-align: right; font-weight: 500;">${details.gigTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Teacher</td>
                        <td style="padding: 8px 0; color: #0f172a; text-align: right; font-weight: 500;">${teacherName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Student</td>
                        <td style="padding: 8px 0; color: #0f172a; text-align: right; font-weight: 500;">${details.studentName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Total Sessions</td>
                        <td style="padding: 8px 0; color: #0f172a; text-align: right; font-weight: 500;">${details.totalSessions}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 16px; font-weight: 600;">Amount Paid</td>
                        <td style="padding: 8px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 16px; text-align: right; font-weight: 700; color: #16a34a; font-size: 18px;">GHS ${details.amountPaid.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <h3 style="color: #0f172a; margin-bottom: 16px;">📱 What's Next?</h3>
            <ul style="line-height: 1.6; color: #334155; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Your sessions are now <strong>confirmed</strong> in your dashboard</li>
                <li style="margin-bottom: 8px;">You can message <strong>${teacherName}</strong> directly from the app</li>
                <li style="margin-bottom: 8px;">You'll receive reminders 24hrs before each session</li>
            </ul>

            <div style="text-align: center; margin-top: 32px; margin-bottom: 20px;">
                <a href="https://app.steamsparkgh.com/parent/dashboard" style="background: #7c3aed; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Go to Dashboard
                </a>
            </div>
            
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">
                STEAM Spark - Igniting Young Minds<br/>
                Accra, Ghana
            </p>
        </div>
    `
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

            // Get full booking details
            const { data: bookingDetails, error: bookingFetchError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    gig:gigs(id, title, teacher_id),
                    student:students(name),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email, phone_number)
                `)
                .eq('id', bookingId)
                .single()

            if (bookingFetchError || !bookingDetails) {
                console.error('[Payment Verify] Error fetching booking:', bookingFetchError)
                throw new Error('Booking not found')
            }

            // Extract key info
            const teacherId = (bookingDetails.gig as any)?.teacher_id
            const parentId = (bookingDetails.parent as any)?.id
            const parentName = (bookingDetails.parent as any)?.full_name || 'Parent'
            const parentEmail = (bookingDetails.parent as any)?.email
            const parentPhone = (bookingDetails.parent as any)?.phone_number
            const gigTitle = (bookingDetails.gig as any)?.title || 'Course'
            const studentName = (bookingDetails.student as any)?.name || 'Student'
            const amountPaid = data.data.amount / 100
            const teacherAmount = bookingDetails.teacher_amount || 0
            const totalSessions = bookingDetails.total_sessions || 1

            // 1. UPDATE BOOKING & SESSIONS in a transaction-like manner
            // Update booking
            await supabase
                .from('bookings')
                .update({
                    status: 'confirmed',
                    payment_status: 'paid',
                    payment_reference: reference,
                    paid_at: data.data.paid_at
                })
                .eq('id', bookingId)

            // Update sessions
            await supabase
                .from('booking_sessions')
                .update({ status: 'confirmed' })
                .eq('booking_id', bookingId)

            // Create payment record
            await supabase.from('payments').insert({
                booking_id: bookingId,
                amount: amountPaid,
                currency: data.data.currency,
                status: 'success',
                paystack_reference: reference,
                paid_at: data.data.paid_at
            })

            console.log('[Payment Verify] ✅ Database records updated')

            // 2. TEACHER NOTIFICATION FLOW
            let teacherProfile: any = null
            if (teacherId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name, whatsapp_number, whatsapp_enabled')
                    .eq('id', teacherId)
                    .single()
                teacherProfile = profile

                // Create earnings record
                if (teacherAmount > 0) {
                    // Split earnings into 2 batches (50% upfront, 50% on completion) as per business logic
                    const halfEarnings = teacherAmount / 2

                    // Batch 1: Immediate/Mid-term
                    await supabase.from('teacher_earnings').insert({
                        teacher_id: teacherId,
                        booking_id: bookingId,
                        amount: halfEarnings,
                        sessions_required: Math.ceil(totalSessions / 2),
                        sessions_completed: 0,
                        status: 'held'
                    })

                    // Batch 2: Completion
                    await supabase.from('teacher_earnings').insert({
                        teacher_id: teacherId,
                        booking_id: bookingId,
                        amount: teacherAmount - halfEarnings, // Remaining amount
                        sessions_required: totalSessions,
                        sessions_completed: 0,
                        status: 'held'
                    })
                }

                // In-App Notification
                await supabase.from('notifications').insert({
                    user_id: teacherId,
                    type: 'payment_received',
                    title: 'New Student Enrolled! 💰',
                    message: `${parentName} just enrolled ${studentName} in "${gigTitle}".`,
                    action_url: `/teacher/students`
                })

                // Email Notification
                if (teacherProfile?.email && process.env.RESEND_API_KEY) {
                    resend.emails.send({
                        from: 'STEAM Spark <notifications@steamsparkgh.com>',
                        to: teacherProfile.email,
                        subject: `New Student: ${studentName}`,
                        html: `
                            <p>Hi ${teacherProfile.full_name},</p>
                            <p><strong>${parentName}</strong> has confirmed payment for <strong>${studentName}</strong>.</p>
                            <p>Class: ${gigTitle}</p>
                            <p>Sessions: ${totalSessions}</p>
                            <br/>
                            <a href="https://app.steamsparkgh.com/teacher/students">View Student Details</a>
                        `
                    }).catch(e => console.error('Teacher email failed:', e))
                }

                // WhatsApp Notification
                if (teacherProfile?.whatsapp_enabled && teacherProfile?.whatsapp_number) {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.steamsparkgh.com'
                    fetch(`${appUrl}/api/notifications/whatsapp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: teacherProfile.whatsapp_number,
                            templateType: 'payment_received',
                            variables: { gigTitle, studentName, amount: `GHS ${amountPaid}`, parentName }
                        })
                    }).catch(e => console.error('Teacher WhatsApp failed:', e))
                }
            }

            // 3. PARENT NOTIFICATION FLOW
            const formattedDate = new Date(data.data.paid_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            })

            // In-App Notification
            await supabase.from('notifications').insert({
                user_id: parentId,
                type: 'payment_confirmed',
                title: 'Payment Confirmed! 🎉',
                message: `Your sessions for ${studentName} are now confirmed.`,
                action_url: `/parent/dashboard`
            })

            // Email Receipt
            if (parentEmail && process.env.RESEND_API_KEY) {
                const emailHtml = generateEmailReceipt({
                    details: {
                        reference,
                        parentName,
                        studentName,
                        gigTitle,
                        totalSessions,
                        amountPaid
                    },
                    teacherName: teacherProfile?.full_name || 'Your Teacher',
                    formattedDate
                })

                resend.emails.send({
                    from: 'STEAM Spark <notifications@steamsparkgh.com>',
                    to: parentEmail,
                    subject: `Payment Receipt: ${gigTitle}`,
                    html: emailHtml
                }).catch(e => console.error('Parent email failed:', e))
            }

            // WhatsApp Notification (if parent has number)
            // Note: Currently we only have explicit whatsapp_number for teachers. 
            // For parents, we might check if their phone_number acts as WhatsApp or if we added a whatsapp_number field to their profile.
            // Assuming we added it based on previous tasks:
            if (bookingDetails.parent?.whatsapp_enabled && bookingDetails.parent?.whatsapp_number) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.steamsparkgh.com'
                fetch(`${appUrl}/api/notifications/whatsapp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: bookingDetails.parent.whatsapp_number,
                        templateType: 'booking_accepted', // Re-using acceptance template or creating a specific payment one
                        variables: {
                            parentName,
                            gigTitle,
                            teacherName: teacherProfile?.full_name || 'Teacher'
                        }
                    })
                }).catch(e => console.error('Parent WhatsApp failed:', e))
            }

            console.log('[Payment Verify] ✅ All notifications sent')

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
