import { NextResponse } from 'next/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// Get Paystack account balance
export async function GET() {
    try {
        const response = await fetch('https://api.paystack.co/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        })

        const data = await response.json()

        if (!data.status) {
            return NextResponse.json({
                error: data.message || 'Failed to fetch balance'
            }, { status: 400 })
        }

        // Find GHS balance (Paystack returns array of currency balances)
        const ghsBalance = data.data?.find((b: any) => b.currency === 'GHS')

        return NextResponse.json({
            balance: ghsBalance ? ghsBalance.balance / 100 : 0, // Convert from pesewas to GHS
            currency: 'GHS',
            available: ghsBalance ? ghsBalance.balance / 100 : 0
        })

    } catch (error) {
        console.error('Balance check error:', error)
        return NextResponse.json(
            { error: 'Failed to check balance' },
            { status: 500 }
        )
    }
}
