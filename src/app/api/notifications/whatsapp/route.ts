import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null

// Message templates for different notification types
const templates = {
    booking_accepted: (vars: { gigTitle: string, teacherName: string, paymentLink: string }) =>
        `🎉 Great news! Your booking for "${vars.gigTitle}" with ${vars.teacherName} has been accepted!\n\nComplete your payment to confirm: ${vars.paymentLink}\n\nQuestions? Reply to this message.`,

    payment_received: (vars: { gigTitle: string, studentName: string, amount: string, parentName: string }) =>
        `💰 Payment received!\n\n${vars.parentName} has paid ${vars.amount} for "${vars.gigTitle}" (Student: ${vars.studentName}).\n\nYou can now message them directly in the app to coordinate sessions.`,

    session_reminder: (vars: { gigTitle: string, studentName: string, time: string }) =>
        `⏰ Reminder: You have a session in 1 hour!\n\n"${vars.gigTitle}" with ${vars.studentName} at ${vars.time}.\n\nGood luck with your session!`,

    new_message: (vars: { senderName: string, preview: string }) =>
        `💬 New message from ${vars.senderName}:\n\n"${vars.preview}"\n\nReply in the STEAM Spark app.`
}

type TemplateType = keyof typeof templates

export async function POST(req: NextRequest) {
    try {
        const { to, templateType, variables } = await req.json()

        if (!to || !templateType) {
            return NextResponse.json(
                { error: 'Missing required fields: to, templateType' },
                { status: 400 }
            )
        }

        if (!client) {
            console.error('Twilio client not configured - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
            return NextResponse.json(
                { error: 'WhatsApp notifications not configured' },
                { status: 500 }
            )
        }

        // Get the template function
        const templateFn = templates[templateType as TemplateType]
        if (!templateFn) {
            return NextResponse.json(
                { error: `Unknown template type: ${templateType}` },
                { status: 400 }
            )
        }

        // Generate message body
        const messageBody = templateFn(variables)

        // Format the destination number
        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

        // Send WhatsApp message via Twilio
        const message = await client.messages.create({
            from: twilioWhatsAppNumber,
            to: toNumber,
            body: messageBody
        })

        console.log(`WhatsApp message sent: ${message.sid} to ${to}`)

        return NextResponse.json({
            success: true,
            messageSid: message.sid,
            status: message.status
        })

    } catch (error: any) {
        console.error('WhatsApp send error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to send WhatsApp message' },
            { status: 500 }
        )
    }
}
