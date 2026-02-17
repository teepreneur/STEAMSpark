import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, phone, subject, experience, reason, role = 'teacher', child_age, interests, needs_setup_help } = body

        // Basic validation
        if (!name || !email || !phone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 1. Save to Database (Primary System of Record)
        const supabase = await createClient()
        let dbError;

        if (role === 'parent') {
            const { error } = await supabase
                .from('parent_early_access')
                .insert({
                    name,
                    email,
                    phone,
                    child_age,
                    interests,
                    needs_setup_help
                })
            dbError = error;
        } else {
            // Teacher (default)
            const { error } = await supabase
                .from('early_access_signups')
                .insert({
                    name,
                    email,
                    phone,
                    subject,
                    experience,
                    reason,
                    role: 'teacher' // Force role to teacher for legacy table
                })
            dbError = error;
        }

        if (dbError) {
            console.error('Database Error:', dbError)
            return NextResponse.json(
                { error: 'Failed to save application' },
                { status: 500 }
            )
        }

        // 2. Send Notification Email (Secondary)
        if (!process.env.RESEND_API_KEY) {
            console.log('⚠️ RESEND_API_KEY missing. Skipped email.')
        } else {
            try {
                // Determine email subject based on role
                const emailSubject = role === 'parent'
                    ? `New Parent Early Access: ${name}`
                    : `New Teacher Early Access: ${name}`;

                // Determine HTML content based on role
                const isParent = role === 'parent';
                const detailsHtml = isParent
                    ? `
                        <p><strong>Child's Age Group:</strong> ${child_age || 'Not specified'}</p>
                        <p><strong>Interests:</strong> ${interests || 'None selected'}</p>
                        <p><strong>Needs Account Setup Help:</strong> ${needs_setup_help ? '<span style="color:green; font-weight:bold;">YES</span>' : 'No'}</p>
                      `
                    : `
                        <p><strong>Subject Area:</strong> ${subject}</p>
                        <p><strong>Experience:</strong> ${experience}</p>
                        <p><strong>Why they want to join:</strong> ${reason}</p>
                      `;

                await resend.emails.send({
                    from: 'STEAM Spark <onboarding@resend.dev>',
                    to: ['triumphtetteh@gmail.com', 'hello@steamsparkgh.com'],
                    subject: emailSubject,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #2563eb;">New ${isParent ? 'Parent' : 'Teacher'} Application</h1>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <p><strong>Name:</strong> ${name}</p>
                                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                                <p><strong>Phone:</strong> ${phone}</p>
                                <hr style="border-top: 1px solid #cbd5e1; margin: 20px 0;" />
                                ${detailsHtml}
                            </div>
                            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                                Saved to database: <code>${isParent ? 'parent_early_access' : 'early_access_signups'}</code>
                            </p>
                        </div>
                    `
                })
            } catch (emailError) {
                console.error('Email Error:', emailError)
                // We don't fail the request if just the email fails, since DB saved ok.
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Server Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
