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
        const { error: dbError } = await supabase
            .from('early_access_signups')
            .insert({
                name,
                email,
                phone,
                subject,
                experience,
                reason,
                role,
                child_age,
                interests,
                needs_setup_help
            })

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
                const detailsHtml = role === 'parent'
                    ? `
                        <p><strong>Child's Age/Grade:</strong> ${child_age || 'N/A'}</p>
                        <p><strong>Needs Account Setup Help:</strong> ${needs_setup_help ? 'Yes' : 'No'}</p>
                        <p><strong>Interests:</strong> ${interests || 'N/A'}</p>
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
                        <h1>New ${role === 'parent' ? 'Parent' : 'Teacher'} Application</h1>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        ${detailsHtml}
                        <hr />
                        <p><em>Saved to database successfully.</em></p>
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
