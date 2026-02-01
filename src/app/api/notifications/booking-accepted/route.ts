import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

// Create admin client for sending emails via Supabase
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { parentEmail, parentName, studentName, gigTitle, teacherName, bookingId } = await request.json()

        if (!parentEmail || !gigTitle || !bookingId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // 1. Send Email Notification
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: 'STEAM Spark <notifications@steamspark.com>',
                    to: parentEmail,
                    subject: `Booking Accepted: ${gigTitle}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                            <h2 style="color: #2563eb;">Great news! Your booking has been accepted</h2>
                            <p>Hi ${parentName || 'Parent'},</p>
                            <p><strong>${teacherName || 'The teacher'}</strong> has accepted the booking for <strong>${studentName}</strong> in the course "<strong>${gigTitle}</strong>".</p>
                            <p>To confirm your sessions, please complete the payment using the link below:</p>
                            <div style="margin: 30px 0;">
                                <a href="${appUrl}/parent/booking/${bookingId}/payment" 
                                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    Complete Payment
                                </a>
                            </div>
                            <p style="color: #64748b; font-size: 14px;">If you have any questions, you can message the teacher directly from your dashboard.</p>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                            <p style="color: #94a3b8; font-size: 12px;">STEAM Spark - Empowering the next generation of innovators.</p>
                        </div>
                    `
                })
            } catch (emailError) {
                console.error('Email sending failed:', emailError)
            }
        }

        console.log(`[Notification] Booking accepted notification sent to ${parentEmail} for booking ${bookingId}`)

        return NextResponse.json({
            success: true,
            message: 'Notification sent successfully'
        })
    } catch (error) {
        console.error('Notification error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}
