import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY is not set')
}

interface PaystackInitializeResponse {
    status: boolean
    message: string
    data: {
        authorization_url: string
        access_code: string
        reference: string
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, amount, booking_id, callback_url, teacher_amount } = body

        // Validate required fields
        if (!email || !amount || !booking_id) {
            return NextResponse.json(
                { error: 'Missing required fields: email, amount, booking_id' },
                { status: 400 }
            )
        }

        // Amount should be in pesewas (kobo equivalent for Ghana)
        // Paystack expects amount in smallest currency unit
        const amountInPesewas = Math.round(amount * 100)
        const teacherAmountPesewas = teacher_amount ? Math.round(teacher_amount * 100) : null

        // Prepare the payment payload
        const paymentPayload: Record<string, any> = {
            email,
            amount: amountInPesewas,
            currency: 'GHS',
            callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/parent/booking/verify`,
            metadata: {
                booking_id,
                teacher_amount: teacher_amount || null,
                platform_fee: amount - (teacher_amount || 0),
                custom_fields: [
                    {
                        display_name: "Booking ID",
                        variable_name: "booking_id",
                        value: booking_id
                    }
                ]
            },
            channels: ['card', 'mobile_money', 'bank'] // Support all payment methods
        }

        // If teacher_amount is provided, fetch teacher's subaccount and add split
        if (teacherAmountPesewas && booking_id) {
            try {
                const supabase = await createClient()

                // Get booking details to find teacher
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('gig:gigs(teacher_id)')
                    .eq('id', booking_id)
                    .single()

                if (booking?.gig) {
                    const teacherId = (booking.gig as any).teacher_id

                    // Get teacher's Paystack subaccount code
                    const { data: teacher } = await supabase
                        .from('profiles')
                        .select('paystack_subaccount_code')
                        .eq('id', teacherId)
                        .single()

                    // If teacher has a subaccount, add split payment
                    if (teacher?.paystack_subaccount_code) {
                        paymentPayload.split = {
                            type: 'flat',
                            bearer_type: 'account', // Platform bears any Paystack fees
                            subaccounts: [{
                                subaccount: teacher.paystack_subaccount_code,
                                share: teacherAmountPesewas // Flat amount to teacher in pesewas
                            }]
                        }
                        console.log(`[Payment] Split configured: ${teacherAmountPesewas} pesewas to teacher subaccount ${teacher.paystack_subaccount_code}`)
                    } else {
                        console.log(`[Payment] Teacher ${teacherId} has no subaccount, payment goes to main account`)
                    }
                }
            } catch (splitError) {
                console.error('Error setting up payment split:', splitError)
                // Continue without split - money goes to main account
            }
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentPayload),
        })

        const data: PaystackInitializeResponse = await response.json()

        if (!data.status) {
            return NextResponse.json(
                { error: data.message || 'Payment initialization failed' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference
        })

    } catch (error) {
        console.error('Paystack initialization error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
