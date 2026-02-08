"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    DollarSign, TrendingUp, Loader2, Users,
    Wallet, Send, CheckCircle, AlertCircle, Smartphone, Building2,
    RefreshCw, Banknote, History, Clock, XCircle
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

interface PayoutRecord {
    id: string
    teacher_id: string
    amount: number
    reference: string
    status: string
    payout_method: string
    payout_details: string
    created_at: string
    teacher: { id: string; full_name: string; avatar_url: string }
}

type TabType = 'pending' | 'history'

export default function FinancePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('pending')
    const [processingPayout, setProcessingPayout] = useState<string | null>(null)
    const [processingBulk, setProcessingBulk] = useState(false)
    const [teachers, setTeachers] = useState<TeacherPayout[]>([])
    const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([])
    const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null)
    const [payoutError, setPayoutError] = useState<string | null>(null)
    const [balance, setBalance] = useState<number | null>(null)
    const [balanceLoading, setBalanceLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        platformFees: 0,
        teacherEarnings: 0,
        pendingPayouts: 0
    })
    const [historySummary, setHistorySummary] = useState({
        total_payouts: 0,
        total_amount: 0,
        pending: 0,
        success: 0,
        failed: 0
    })

    async function loadBalance() {
        setBalanceLoading(true)
        try {
            const response = await fetch('/api/admin/payouts/balance')
            const data = await response.json()
            if (data.balance !== undefined) {
                setBalance(data.balance)
            }
        } catch (error) {
            console.error('Failed to load balance:', error)
        }
        setBalanceLoading(false)
    }

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

        // Get pending teacher earnings
        const { data: pendingEarnings } = await supabase
            .from('teacher_earnings')
            .select('amount')
            .eq('status', 'released')

        const pendingPayouts = pendingEarnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

        setStats({ totalRevenue, platformFees, teacherEarnings, pendingPayouts })

        // Fetch teachers with pending payouts
        const response = await fetch('/api/admin/payouts')
        const data = await response.json()
        if (data.teachers) {
            setTeachers(data.teachers)
        }

        // Fetch payout history
        const historyResponse = await fetch('/api/admin/payouts/history')
        const historyData = await historyResponse.json()
        if (historyData.payouts) {
            setPayoutHistory(historyData.payouts)
        }
        if (historyData.summary) {
            setHistorySummary(historyData.summary)
        }

        setLoading(false)
    }

    useEffect(() => {
        loadData()
        loadBalance()
    }, [])

    async function processPayout(teacher: TeacherPayout) {
        if (!teacher.earnings.length) return

        // Check balance first
        if (balance !== null && teacher.pending_amount > balance) {
            setPayoutError(`Insufficient balance. Need GHS ${teacher.pending_amount.toFixed(2)}, have GHS ${balance.toFixed(2)}`)
            return
        }

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
                await loadData()
                await loadBalance()
            } else {
                setPayoutError(result.error || 'Payout failed')
            }
        } catch {
            setPayoutError('Failed to process payout')
        } finally {
            setProcessingPayout(null)
        }
    }

    async function processBulkPayout() {
        if (teachers.length === 0) return

        const totalAmount = teachers.reduce((sum, t) => sum + t.pending_amount, 0)

        if (balance !== null && totalAmount > balance) {
            setPayoutError(`Insufficient balance for bulk payout. Need GHS ${totalAmount.toFixed(2)}, have GHS ${balance.toFixed(2)}`)
            return
        }

        if (!confirm(`This will pay ${teachers.length} teachers a total of GHS ${totalAmount.toFixed(2)}. Continue?`)) {
            return
        }

        setProcessingBulk(true)
        setPayoutError(null)
        setPayoutSuccess(null)

        try {
            const response = await fetch('/api/admin/payouts/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const result = await response.json()

            if (result.success) {
                setPayoutSuccess(`Successfully processed ${result.transfers_count} payouts totaling GHS ${result.total_amount.toFixed(2)}`)
                await loadData()
                await loadBalance()
            } else {
                setPayoutError(result.error || 'Bulk payout failed')
            }
        } catch {
            setPayoutError('Failed to process bulk payout')
        } finally {
            setProcessingBulk(false)
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
        { label: "Paystack Balance", value: balanceLoading ? "..." : `GHS ${(balance || 0).toLocaleString()}`, icon: Banknote, color: "bg-emerald-500" },
        { label: "Total Revenue", value: `GHS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-500" },
        { label: "Platform Fees (20%)", value: `GHS ${stats.platformFees.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-500" },
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
                <Button variant="outline" onClick={() => { loadData(); loadBalance() }} className="gap-2">
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

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                        activeTab === 'pending'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Wallet className="size-4 inline mr-2" />
                    Pending Payouts ({teachers.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                        activeTab === 'history'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <History className="size-4 inline mr-2" />
                    Payout History ({historySummary.total_payouts})
                </button>
            </div>

            {/* Pending Payouts Tab */}
            {activeTab === 'pending' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border">
                    <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Wallet className="size-5 text-primary" />
                                Pending Teacher Payouts
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Teachers with completed sessions ready for payout
                            </p>
                        </div>
                        {teachers.length > 0 && (
                            <Button
                                onClick={processBulkPayout}
                                disabled={processingBulk}
                                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                            >
                                {processingBulk ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-4" />
                                        Pay All ({teachers.length}) - GHS {teachers.reduce((sum, t) => sum + t.pending_amount, 0).toFixed(2)}
                                    </>
                                )}
                            </Button>
                        )}
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
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {teacher.avatar_url ? (
                                            <img src={teacher.avatar_url} alt={teacher.full_name} className="size-12 object-cover" />
                                        ) : (
                                            <Users className="size-6 text-primary" />
                                        )}
                                    </div>

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

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-primary">GHS {teacher.pending_amount.toFixed(2)}</p>
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                                        </div>
                                        <Button
                                            onClick={() => processPayout(teacher)}
                                            disabled={processingPayout === teacher.id || processingBulk}
                                            className="gap-2"
                                        >
                                            {processingPayout === teacher.id ? (
                                                <><Loader2 className="size-4 animate-spin" />Processing...</>
                                            ) : (
                                                <><Send className="size-4" />Pay Now</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {/* History Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold">{historySummary.total_payouts}</p>
                            <p className="text-sm text-muted-foreground">Total Payouts</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">GHS {historySummary.total_amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{historySummary.success}</p>
                            <p className="text-sm text-muted-foreground">Successful</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">{historySummary.pending}</p>
                            <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <History className="size-5 text-primary" />
                                Payout History
                            </h2>
                        </div>

                        {payoutHistory.length === 0 ? (
                            <div className="p-12 text-center">
                                <History className="size-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-bold text-lg">No Payout History</h3>
                                <p className="text-muted-foreground">Payouts will appear here after processing.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {payoutHistory.map((payout) => (
                                    <div key={payout.id} className="p-4 flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {payout.teacher?.avatar_url ? (
                                                <img src={payout.teacher.avatar_url} alt="" className="size-10 object-cover" />
                                            ) : (
                                                <Users className="size-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{payout.teacher?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-muted-foreground">{payout.payout_details}</p>
                                            <p className="text-xs text-muted-foreground">Ref: {payout.reference}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">GHS {payout.amount.toFixed(2)}</p>
                                            <Badge variant="outline" className={cn(
                                                payout.status === 'success' && "bg-green-50 text-green-700 border-green-200",
                                                payout.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                                payout.status === 'failed' && "bg-red-50 text-red-700 border-red-200"
                                            )}>
                                                {payout.status === 'success' && <CheckCircle className="size-3 mr-1" />}
                                                {payout.status === 'pending' && <Clock className="size-3 mr-1" />}
                                                {payout.status === 'failed' && <XCircle className="size-3 mr-1" />}
                                                {payout.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground w-24 text-right">
                                            {new Date(payout.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 How Payouts Work</h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li>• <strong>Balance Check:</strong> Paystack balance is shown above - ensure sufficient funds before paying</li>
                    <li>• <strong>Individual Payout:</strong> Click "Pay Now" to pay a specific teacher</li>
                    <li>• <strong>Bulk Payout:</strong> Click "Pay All" to pay all pending teachers at once</li>
                    <li>• <strong>Status Tracking:</strong> View payout history and status in the History tab</li>
                </ul>
            </div>
        </div>
    )
}
