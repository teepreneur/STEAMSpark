import { NextResponse } from 'next/server'

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
        const { email, amount, booking_id, callback_url } = body

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

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountInPesewas,
                currency: 'GHS',
                callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/parent/booking/verify`,
                metadata: {
                    booking_id,
                    custom_fields: [
                        {
                            display_name: "Booking ID",
                            variable_name: "booking_id",
                            value: booking_id
                        }
                    ]
                },
                channels: ['card', 'mobile_money', 'bank'] // Support all payment methods
            }),
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
