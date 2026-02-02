"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DollarSign, TrendingUp, CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FinancePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        transactionCount: 0
    })

    useEffect(() => {
        async function loadFinance() {
            setLoading(true)

            // Get completed payments
            const { data: completedPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'completed')

            const totalRevenue = completedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            const completedCount = completedPayments?.length || 0

            // Get pending payments
            const { data: pendingPayments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'pending')

            const pendingTotal = pendingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

            setStats({
                totalRevenue,
                pendingPayments: pendingTotal,
                completedPayments: completedCount,
                transactionCount: (completedPayments?.length || 0) + (pendingPayments?.length || 0)
            })
            setLoading(false)
        }
        loadFinance()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const cards = [
        { label: "Total Revenue", value: `GHS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-500" },
        { label: "Pending Payments", value: `GHS ${stats.pendingPayments.toLocaleString()}`, icon: CreditCard, color: "bg-yellow-500" },
        { label: "Completed Payments", value: stats.completedPayments, icon: TrendingUp, color: "bg-blue-500" },
        { label: "Total Transactions", value: stats.transactionCount, icon: CreditCard, color: "bg-purple-500" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Finance Overview</h1>
                <p className="text-muted-foreground">
                    Platform revenue and payment statistics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
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

            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">
                    Detailed transaction history, payout management, and financial reports coming soon.
                </p>
            </div>
        </div>
    )
}
