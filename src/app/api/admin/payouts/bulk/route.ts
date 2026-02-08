import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

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

// Create a transfer recipient in Paystack
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

// Initiate bulk transfers
async function initiateBulkTransfer(transfers: Array<{
    amount: number
    recipient: string
    reason?: string
    reference?: string
}>) {
    const response = await fetch('https://api.paystack.co/transfer/bulk', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: 'balance',
            transfers: transfers.map(t => ({
                amount: t.amount,
                recipient: t.recipient,
                reason: t.reason || 'Teacher payout from STEAM Spark',
                reference: t.reference
            }))
        })
    })
    return response.json()
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Check balance first
        const balanceResponse = await fetch('https://api.paystack.co/balance', {
            headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` }
        })
        const balanceData = await balanceResponse.json()
        const ghsBalance = balanceData.data?.find((b: any) => b.currency === 'GHS')
        const availableBalance = ghsBalance ? ghsBalance.balance / 100 : 0

        // 2. Get all pending earnings grouped by teacher
        const { data: pendingEarnings } = await supabase
            .from('teacher_earnings')
            .select('id, teacher_id, amount')
            .eq('status', 'released')

        if (!pendingEarnings?.length) {
            return NextResponse.json({
                success: false,
                message: 'No pending payouts found'
            })
        }

        // Group by teacher
        const teacherPayouts: Record<string, { amount: number; earnings: string[] }> = {}
        let totalAmount = 0

        pendingEarnings.forEach(e => {
            if (!teacherPayouts[e.teacher_id]) {
                teacherPayouts[e.teacher_id] = { amount: 0, earnings: [] }
            }
            teacherPayouts[e.teacher_id].amount += e.amount
            teacherPayouts[e.teacher_id].earnings.push(e.id)
            totalAmount += e.amount
        })

        // Check if we have enough balance
        if (totalAmount > availableBalance) {
            return NextResponse.json({
                success: false,
                error: `Insufficient balance. Need GHS ${totalAmount.toFixed(2)}, have GHS ${availableBalance.toFixed(2)}`
            }, { status: 400 })
        }

        // 3. Get teacher details and prepare recipients
        const teacherIds = Object.keys(teacherPayouts)
        const { data: teachers } = await supabase
            .from('profiles')
            .select('id, full_name, payout_method, momo_provider, momo_number, momo_name, bank_name, bank_account_number, bank_account_name, paystack_recipient_code')
            .in('id', teacherIds)

        if (!teachers?.length) {
            return NextResponse.json({ error: 'No teachers found' }, { status: 404 })
        }

        // 4. Prepare transfers array (create recipients if needed)
        const transfers: Array<{
            amount: number
            recipient: string
            reason: string
            reference: string
            teacher_id: string
            earnings_ids: string[]
        }> = []

        const skipped: Array<{ teacher: string; reason: string }> = []

        for (const teacher of teachers) {
            const payout = teacherPayouts[teacher.id]
            if (!payout) continue

            const isMomo = teacher.payout_method === 'mobile_money'

            // Validate payout details
            if (isMomo && (!teacher.momo_provider || !teacher.momo_number || !teacher.momo_name)) {
                skipped.push({ teacher: teacher.full_name, reason: 'Incomplete mobile money details' })
                continue
            }
            if (!isMomo && (!teacher.bank_name || !teacher.bank_account_number || !teacher.bank_account_name)) {
                skipped.push({ teacher: teacher.full_name, reason: 'Incomplete bank details' })
                continue
            }

            let recipientCode = teacher.paystack_recipient_code

            // Create recipient if needed
            if (!recipientCode) {
                const bankCode = isMomo
                    ? BANK_CODES[teacher.momo_provider!]
                    : BANK_CODES[teacher.bank_name!] || teacher.bank_name

                const recipientResult = await createTransferRecipient({
                    type: isMomo ? 'mobile_money' : 'nuban',
                    name: isMomo ? teacher.momo_name! : teacher.bank_account_name!,
                    account_number: isMomo ? teacher.momo_number! : teacher.bank_account_number!,
                    bank_code: bankCode || ''
                })

                if (!recipientResult.status || !recipientResult.data?.recipient_code) {
                    skipped.push({
                        teacher: teacher.full_name,
                        reason: recipientResult.message || 'Failed to create recipient'
                    })
                    continue
                }

                recipientCode = recipientResult.data.recipient_code

                // Save recipient code
                await supabase
                    .from('profiles')
                    .update({ paystack_recipient_code: recipientCode })
                    .eq('id', teacher.id)
            }

            const reference = `BULK-${teacher.id.substring(0, 8)}-${Date.now()}`

            transfers.push({
                amount: Math.round(payout.amount * 100), // Convert to pesewas
                recipient: recipientCode,
                reason: `Bulk payout for ${payout.earnings.length} session(s)`,
                reference,
                teacher_id: teacher.id,
                earnings_ids: payout.earnings
            })
        }

        if (transfers.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No valid transfers to process',
                skipped
            }, { status: 400 })
        }

        // 5. Initiate bulk transfer
        const bulkResult = await initiateBulkTransfer(
            transfers.map(t => ({
                amount: t.amount,
                recipient: t.recipient,
                reason: t.reason,
                reference: t.reference
            }))
        )

        if (!bulkResult.status) {
            return NextResponse.json({
                success: false,
                error: bulkResult.message || 'Bulk transfer failed'
            }, { status: 400 })
        }

        // 6. Record all payouts
        const payoutRecords = transfers.map(t => {
            const teacher = teachers.find(te => te.id === t.teacher_id)
            const isMomo = teacher?.payout_method === 'mobile_money'
            return {
                teacher_id: t.teacher_id,
                amount: t.amount / 100, // Convert back to GHS
                reference: t.reference,
                status: 'pending',
                earnings_ids: t.earnings_ids,
                payout_method: teacher?.payout_method,
                payout_details: isMomo
                    ? `${teacher?.momo_provider} - ${teacher?.momo_number}`
                    : `${teacher?.bank_name} - ${teacher?.bank_account_number}`
            }
        })

        await supabase.from('teacher_payouts').insert(payoutRecords)

        // 7. Update all earnings to paid
        const allEarningsIds = transfers.flatMap(t => t.earnings_ids)
        await supabase
            .from('teacher_earnings')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString()
            })
            .in('id', allEarningsIds)

        // 8. Notify all teachers
        const notifications = transfers.map(t => {
            const teacher = teachers.find(te => te.id === t.teacher_id)
            const isMomo = teacher?.payout_method === 'mobile_money'
            return {
                user_id: t.teacher_id,
                type: 'payout',
                title: 'Payment Sent! 💸',
                message: `GHS ${(t.amount / 100).toFixed(2)} has been sent to your ${isMomo ? teacher?.momo_provider : teacher?.bank_name} account.`,
                action_url: '/teacher/earnings'
            }
        })

        await supabase.from('notifications').insert(notifications)

        return NextResponse.json({
            success: true,
            message: `Successfully initiated ${transfers.length} payouts`,
            total_amount: transfers.reduce((sum, t) => sum + t.amount / 100, 0),
            transfers_count: transfers.length,
            skipped
        })

    } catch (error) {
        console.error('Bulk payout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
