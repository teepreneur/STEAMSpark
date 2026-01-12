import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

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
                // Get booking details for teacher earnings
                const { data: bookingDetails } = await supabase
                    .from('bookings')
                    .select('teacher_amount, total_sessions, gigs(teacher_id)')
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

                // Create teacher earnings record (released per 2 completed sessions)
                if (bookingDetails && (bookingDetails.gigs as any)?.teacher_id) {
                    const teacherId = (bookingDetails.gigs as any).teacher_id
                    const teacherAmount = bookingDetails.teacher_amount || 0
                    const totalSessions = bookingDetails.total_sessions || 1

                    // Calculate earnings per 2 sessions
                    const earningsPerSession = teacherAmount / totalSessions
                    const numEarningBatches = Math.ceil(totalSessions / 2)

                    // Create earning records for every 2 sessions
                    const earningsRecords = []
                    for (let i = 0; i < numEarningBatches; i++) {
                        const sessionsInBatch = Math.min(2, totalSessions - i * 2)
                        earningsRecords.push({
                            teacher_id: teacherId,
                            booking_id: bookingId,
                            amount: earningsPerSession * sessionsInBatch,
                            sessions_required: (i + 1) * 2, // Release after 2, 4, 6, etc. sessions
                            sessions_completed: 0,
                            status: 'held'
                        })
                    }

                    await supabase.from('teacher_earnings').insert(earningsRecords)
                }

                // Create payment record
                await supabase.from('payments').insert({
                    booking_id: bookingId,
                    amount: data.data.amount / 100, // Convert from pesewas to cedis
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
