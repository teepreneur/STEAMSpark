"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    DollarSign, TrendingUp, CreditCard, Loader2, Users,
    Wallet, Send, CheckCircle, AlertCircle, Smartphone, Building2,
    RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TeacherPayout {
    id: string
    full_name: string
    avatar_url: string | null
    payout_method: 'mobile_money' | 'bank'
    momo_provider: string | null
    momo_number: string | null
    bank_name: string | null
    bank_account_number: string | null
    pending_amount: number
    pending_count: number
    earnings: { id: string; amount: number }[]
}

export default function FinancePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [processingPayout, setProcessingPayout] = useState<string | null>(null)
    const [teachers, setTeachers] = useState<TeacherPayout[]>([])
    const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null)
    const [payoutError, setPayoutError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        platformFees: 0,
        teacherEarnings: 0,
        pendingPayouts: 0,
        transactionCount: 0
    })

    async function loadData() {
        setLoading(true)

        // Get completed payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, booking:bookings(teacher_amount, company_amount)')
            .eq('status', 'success')

        let totalRevenue = 0
        let teacherEarnings = 0
        let platformFees = 0

        payments?.forEach(p => {
            totalRevenue += p.amount || 0
            teacherEarnings += (p.booking as any)?.teacher_amount || 0
            platformFees += (p.booking as any)?.company_amount || 0
        })

        // Get pending teacher earnings (released but not paid)
        const { data: pendingEarnings } = await supabase
            .from('teacher_earnings')
            .select('amount')
            .eq('status', 'released')

        const pendingPayouts = pendingEarnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

        setStats({
            totalRevenue,
            platformFees,
            teacherEarnings,
            pendingPayouts,
            transactionCount: payments?.length || 0
        })

        // Fetch teachers with pending payouts
        const response = await fetch('/api/admin/payouts')
        const data = await response.json()
        if (data.teachers) {
            setTeachers(data.teachers)
        }

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    async function processPayout(teacher: TeacherPayout) {
        if (!teacher.earnings.length) return

        setProcessingPayout(teacher.id)
        setPayoutError(null)
        setPayoutSuccess(null)

        try {
            const response = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_id: teacher.id,
                    amount: teacher.pending_amount,
                    earnings_ids: teacher.earnings.map(e => e.id)
                })
            })

            const result = await response.json()

            if (result.success) {
                setPayoutSuccess(`Successfully sent GHS ${teacher.pending_amount.toFixed(2)} to ${teacher.full_name}`)
                // Refresh data
                await loadData()
            } else {
                setPayoutError(result.error || 'Payout failed')
            }
        } catch (error) {
            setPayoutError('Failed to process payout')
        } finally {
            setProcessingPayout(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const statCards = [
        { label: "Total Revenue", value: `GHS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-500" },
        { label: "Platform Fees (20%)", value: `GHS ${stats.platformFees.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-500" },
        { label: "Teacher Earnings", value: `GHS ${stats.teacherEarnings.toLocaleString()}`, icon: Users, color: "bg-purple-500" },
        { label: "Pending Payouts", value: `GHS ${stats.pendingPayouts.toLocaleString()}`, icon: Wallet, color: "bg-yellow-500" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Finance & Payouts</h1>
                    <p className="text-muted-foreground">
                        Manage platform revenue and teacher payouts
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2">
                    <RefreshCw className="size-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                <p className="text-2xl font-bold mt-1">{card.value}</p>
                            </div>
                            <div className={cn("size-12 rounded-xl flex items-center justify-center", card.color)}>
                                <card.icon className="size-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {payoutSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="size-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">{payoutSuccess}</span>
                    <button onClick={() => setPayoutSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">×</button>
                </div>
            )}
            {payoutError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="size-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-400">{payoutError}</span>
                    <button onClick={() => setPayoutError(null)} className="ml-auto text-red-600 hover:text-red-800">×</button>
                </div>
            )}

            {/* Pending Payouts Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Wallet className="size-5 text-primary" />
                        Pending Teacher Payouts
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Teachers with completed sessions ready for payout
                    </p>
                </div>

                {teachers.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-bold text-lg">All Caught Up!</h3>
                        <p className="text-muted-foreground">No pending payouts at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {teachers.map((teacher) => (
                            <div key={teacher.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Teacher Avatar */}
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    {teacher.avatar_url ? (
                                        <img
                                            src={teacher.avatar_url}
                                            alt={teacher.full_name}
                                            className="size-12 object-cover"
                                        />
                                    ) : (
                                        <Users className="size-6 text-primary" />
                                    )}
                                </div>

                                {/* Teacher Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold">{teacher.full_name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        {teacher.payout_method === 'mobile_money' ? (
                                            <>
                                                <Smartphone className="size-4" />
                                                <span>{teacher.momo_provider} • {teacher.momo_number}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Building2 className="size-4" />
                                                <span>{teacher.bank_name} • ****{teacher.bank_account_number?.slice(-4)}</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {teacher.pending_count} session{teacher.pending_count > 1 ? 's' : ''} completed
                                    </p>
                                </div>

                                {/* Amount & Action */}
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">
                                            GHS {teacher.pending_amount.toFixed(2)}
                                        </p>
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            Pending
                                        </Badge>
                                    </div>
                                    <Button
                                        onClick={() => processPayout(teacher)}
                                        disabled={processingPayout === teacher.id}
                                        className="gap-2"
                                    >
                                        {processingPayout === teacher.id ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="size-4" />
                                                Pay Now
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 How Payouts Work</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li>• Teacher earnings are held until sessions are marked complete</li>
                    <li>• Once released, they appear in the pending payouts list</li>
                    <li>• Click "Pay Now" to instantly transfer funds via Paystack</li>
                    <li>• Teachers receive a notification when payment is sent</li>
                </ul>
            </div>
        </div>
    )
}
