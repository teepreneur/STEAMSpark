import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for sending emails via Supabase
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { teacherEmail, teacherName, studentName, gigTitle, parentName } = await request.json()

        if (!teacherEmail || !studentName || !gigTitle) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // For now, we'll create a notification in the database
        // In production, integrate with email service like Resend, SendGrid, or Supabase Auth emails

        // Get teacher profile by email
        const { data: teacherProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', teacherEmail)
            .single()

        if (teacherProfile) {
            // Create in-app notification
            await supabaseAdmin.from('notifications').insert({
                user_id: teacherProfile.id,
                type: 'new_enrollment',
                title: 'New Enrollment Request',
                message: `${studentName} has requested to enroll in "${gigTitle}". Parent: ${parentName || 'Unknown'}. Please review and approve.`,
                action_url: '/teacher/students?filter=pending'
            })
        }

        // TODO: Integrate actual email sending
        // Example with Resend:
        // await resend.emails.send({
        //     from: 'STEAM Spark <noreply@steamspark.com>',
        //     to: teacherEmail,
        //     subject: `New Enrollment Request: ${gigTitle}`,
        //     html: `
        //         <h2>New Enrollment Request</h2>
        //         <p>Hi ${teacherName || 'Teacher'},</p>
        //         <p><strong>${studentName}</strong> has requested to enroll in your course "<strong>${gigTitle}</strong>".</p>
        //         <p>Parent: ${parentName || 'Unknown'}</p>
        //         <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/teacher/students?filter=pending">Review and Approve</a></p>
        //     `
        // })

        console.log(`[Notification] Pending enrollment notification sent to ${teacherEmail} for student ${studentName}`)

        return NextResponse.json({
            success: true,
            message: 'Notification sent successfully'
        })
    } catch (error) {
        console.error('Notification error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}
