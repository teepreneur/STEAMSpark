import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get payout history
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status') // pending, success, failed, or all
        const offset = (page - 1) * limit

        const supabase = await createClient()

        // Build query
        let query = supabase
            .from('teacher_payouts')
            .select(`
                *,
                teacher:profiles!teacher_payouts_teacher_id_fkey(id, full_name, avatar_url)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: payouts, error, count } = await query

        if (error) {
            console.error('Failed to fetch payout history:', error)
            return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
        }

        // Get summary stats
        const { data: stats } = await supabase
            .from('teacher_payouts')
            .select('status, amount')

        const summary = {
            total_payouts: stats?.length || 0,
            total_amount: stats?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
            pending: stats?.filter(p => p.status === 'pending').length || 0,
            success: stats?.filter(p => p.status === 'success').length || 0,
            failed: stats?.filter(p => p.status === 'failed').length || 0
        }

        return NextResponse.json({
            payouts,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            },
            summary
        })

    } catch (error) {
        console.error('Payout history error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
