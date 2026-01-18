import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, phone, subject, experience, reason } = body

        // Basic validation
        if (!name || !email || !phone || !subject) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if API key is configured
        if (!process.env.RESEND_API_KEY) {
            console.log('⚠️ RESEND_API_KEY missing. Logging submission:', body)
            return NextResponse.json({
                success: true,
                message: 'Submission received (Mode: Dev Log)'
            })
        }

        try {
            // Send email to admin
            const data = await resend.emails.send({
                from: 'STEAM Spark <onboarding@resend.dev>', // Update this once domain is verified
                to: ['steamsparkworld@gmail.com'],
                subject: `New Teacher Early Access: ${name}`,
                html: `
                    <h1>New Teacher Application</h1>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Subject Area:</strong> ${subject}</p>
                    <p><strong>Experience:</strong> ${experience}</p>
                    <p><strong>Why they want to join:</strong> ${reason}</p>
                `
            })

            return NextResponse.json({ success: true, data })
        } catch (emailError) {
            console.error('Resend Error:', emailError)
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            )
        }

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
