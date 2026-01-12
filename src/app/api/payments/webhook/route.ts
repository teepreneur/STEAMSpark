import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: Request) {
    try {
        const body = await request.text()
        const signature = request.headers.get('x-paystack-signature')

        // Verify webhook signature
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY!)
            .update(body)
            .digest('hex')

        if (hash !== signature) {
            console.error('Invalid Paystack webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const event = JSON.parse(body)
        const supabase = await createClient()

        // Handle different event types
        switch (event.event) {
            case 'charge.success':
                const { reference, metadata, amount, currency, paid_at } = event.data
                const bookingId = metadata?.booking_id

                if (bookingId) {
                    // Update booking status
                    await supabase
                        .from('bookings')
                        .update({
                            status: 'confirmed',
                            payment_reference: reference,
                            paid_at
                        })
                        .eq('id', bookingId)

                    // Upsert payment record
                    await supabase.from('payments').upsert({
                        booking_id: bookingId,
                        amount: amount / 100,
                        currency,
                        status: 'success',
                        paystack_reference: reference,
                        paid_at
                    }, { onConflict: 'paystack_reference' })

                    console.log(`Payment confirmed for booking ${bookingId}`)
                }
                break

            case 'charge.failed':
                const failedBookingId = event.data.metadata?.booking_id
                if (failedBookingId) {
                    await supabase
                        .from('bookings')
                        .update({ status: 'payment_failed' })
                        .eq('id', failedBookingId)
                }
                break

            default:
                console.log(`Unhandled Paystack event: ${event.event}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
