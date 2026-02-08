import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// Create a transfer recipient in Paystack (required before sending money)
async function createTransferRecipient(details: {
    type: 'mobile_money' | 'nuban'
    name: string
    account_number: string
    bank_code: string
    currency?: string
}) {
    const response = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: details.type,
            name: details.name,
            account_number: details.account_number,
            bank_code: details.bank_code,
            currency: details.currency || 'GHS'
        })
    })
    return response.json()
}

// Initiate a transfer to a recipient
async function initiateTransfer(details: {
    source: string
    amount: number // in pesewas
    recipient: string // recipient_code from createTransferRecipient
    reason?: string
    reference?: string
}) {
    const response = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: details.source || 'balance',
            amount: details.amount,
            recipient: details.recipient,
            reason: details.reason || 'Teacher payout from STEAM Spark',
            reference: details.reference
        })
    })
    return response.json()
}

// Bank codes for Ghana (Paystack)
const BANK_CODES: Record<string, string> = {
    'GCB Bank': 'GCB',
    'Ecobank': 'ECO',
    'Fidelity Bank': 'FBN',
    'Stanbic Bank': 'STB',
    'Standard Chartered': 'SCB',
    'Zenith Bank': 'ZEN',
    'Access Bank': 'ABG',
    'CalBank': 'CAL',
    'Absa Bank': 'ABS',
    'UBA': 'UBA',
    'Republic Bank': 'REP',
    'First National Bank': 'FNB',
    // Mobile Money
    'MTN': 'MTN',
    'Vodafone': 'VOD',
    'AirtelTigo': 'ATL'
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { teacher_id, amount, earnings_ids } = body

        if (!teacher_id || !amount || !earnings_ids?.length) {
            return NextResponse.json(
                { error: 'Missing required fields: teacher_id, amount, earnings_ids' },
                { status: 400 }
            )
        }

        // Get teacher's payout details
        const { data: teacher, error: teacherError } = await supabase
            .from('profiles')
            .select('id, full_name, payout_method, momo_provider, momo_number, momo_name, bank_name, bank_account_number, bank_account_name, paystack_recipient_code')
            .eq('id', teacher_id)
            .single()

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
        }

        // Validate payout details
        const isMomo = teacher.payout_method === 'mobile_money'
        if (isMomo && (!teacher.momo_provider || !teacher.momo_number || !teacher.momo_name)) {
            return NextResponse.json({ error: 'Teacher has incomplete mobile money details' }, { status: 400 })
        }
        if (!isMomo && (!teacher.bank_name || !teacher.bank_account_number || !teacher.bank_account_name)) {
            return NextResponse.json({ error: 'Teacher has incomplete bank details' }, { status: 400 })
        }

        let recipientCode = teacher.paystack_recipient_code

        // Create Paystack recipient if not exists
        if (!recipientCode) {
            const bankCode = isMomo
                ? BANK_CODES[teacher.momo_provider!]
                : BANK_CODES[teacher.bank_name!] || teacher.bank_name

            const recipientDetails = {
                type: isMomo ? 'mobile_money' as const : 'nuban' as const,
                name: isMomo ? teacher.momo_name! : teacher.bank_account_name!,
                account_number: isMomo ? teacher.momo_number! : teacher.bank_account_number!,
                bank_code: bankCode || ''
            }

            const recipientResult = await createTransferRecipient(recipientDetails)

            if (!recipientResult.status || !recipientResult.data?.recipient_code) {
                console.error('Failed to create recipient:', recipientResult)
                return NextResponse.json({
                    error: recipientResult.message || 'Failed to create Paystack recipient'
                }, { status: 400 })
            }

            recipientCode = recipientResult.data.recipient_code

            // Save recipient code for future use
            await supabase
                .from('profiles')
                .update({ paystack_recipient_code: recipientCode })
                .eq('id', teacher_id)
        }

        // Generate unique reference
        const reference = `PAYOUT-${teacher_id.substring(0, 8)}-${Date.now()}`

        // Initiate the transfer (amount in pesewas)
        const transferResult = await initiateTransfer({
            source: 'balance',
            amount: Math.round(amount * 100), // Convert GHS to pesewas
            recipient: recipientCode,
            reason: `Teacher payout for ${earnings_ids.length} session(s)`,
            reference
        })

        if (!transferResult.status) {
            console.error('Transfer failed:', transferResult)
            return NextResponse.json({
                error: transferResult.message || 'Transfer failed'
            }, { status: 400 })
        }

        // Record the payout
        const { error: payoutError } = await supabase
            .from('teacher_payouts')
            .insert({
                teacher_id,
                amount,
                reference,
                paystack_transfer_code: transferResult.data?.transfer_code,
                status: transferResult.data?.status || 'pending',
                earnings_ids,
                payout_method: teacher.payout_method,
                payout_details: isMomo
                    ? `${teacher.momo_provider} - ${teacher.momo_number}`
                    : `${teacher.bank_name} - ${teacher.bank_account_number}`
            })

        if (payoutError) {
            console.error('Failed to record payout:', payoutError)
        }

        // Update earnings status
        await supabase
            .from('teacher_earnings')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                payout_reference: reference
            })
            .in('id', earnings_ids)

        // Notify the teacher
        await supabase.from('notifications').insert({
            user_id: teacher_id,
            type: 'payout',
            title: 'Payment Sent! 💸',
            message: `GHS ${amount.toFixed(2)} has been sent to your ${isMomo ? teacher.momo_provider : teacher.bank_name} account.`,
            action_url: '/teacher/earnings'
        })

        return NextResponse.json({
            success: true,
            message: 'Transfer initiated successfully',
            transfer_code: transferResult.data?.transfer_code,
            reference,
            status: transferResult.data?.status
        })

    } catch (error) {
        console.error('Payout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET endpoint to fetch pending payouts for a teacher
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const teacherId = searchParams.get('teacher_id')

        const supabase = await createClient()

        if (teacherId) {
            // Get specific teacher's pending earnings
            const { data: earnings } = await supabase
                .from('teacher_earnings')
                .select('*, booking:bookings(gig:gigs(title))')
                .eq('teacher_id', teacherId)
                .eq('status', 'released')
                .order('created_at', { ascending: false })

            return NextResponse.json({ earnings })
        }

        // Get all teachers with pending payouts
        const { data: pendingEarnings } = await supabase
            .from('teacher_earnings')
            .select(`
                id,
                teacher_id,
                amount,
                status,
                created_at,
                booking:bookings(gig:gigs(title))
            `)
            .eq('status', 'released')
            .order('created_at', { ascending: false })

        // Group by teacher
        const teacherPayouts: Record<string, { amount: number, earnings: any[] }> = {}
        pendingEarnings?.forEach(e => {
            if (!teacherPayouts[e.teacher_id]) {
                teacherPayouts[e.teacher_id] = { amount: 0, earnings: [] }
            }
            teacherPayouts[e.teacher_id].amount += e.amount
            teacherPayouts[e.teacher_id].earnings.push(e)
        })

        // Get teacher profiles
        const teacherIds = Object.keys(teacherPayouts)
        const { data: teachers } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, payout_method, momo_provider, momo_number, bank_name, bank_account_number')
            .in('id', teacherIds)

        const result = teachers?.map(t => ({
            ...t,
            pending_amount: teacherPayouts[t.id]?.amount || 0,
            pending_count: teacherPayouts[t.id]?.earnings.length || 0,
            earnings: teacherPayouts[t.id]?.earnings || []
        })) || []

        return NextResponse.json({ teachers: result })

    } catch (error) {
        console.error('Fetch payouts error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
