"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Download, Wallet, TrendingUp, DollarSign,
    ShieldCheck, ChevronLeft, ChevronRight, Loader2,
    BookOpen, CheckCircle, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

interface Earning {
    id: string
    booking_id: string
    amount: number
    sessions_required: number
    sessions_completed: number
    status: 'held' | 'available' | 'withdrawn'
    released_at: string | null
    created_at: string
    booking?: {
        gigs?: {
            title: string
            subject: string | null
        }
        students?: {
            name: string
        }
    }
}

interface EarningsSummary {
    available: number
    held: number
    withdrawn: number
    total: number
}

export default function EarningsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [earnings, setEarnings] = useState<Earning[]>([])
    const [summary, setSummary] = useState<EarningsSummary>({
        available: 0,
        held: 0,
        withdrawn: 0,
        total: 0
    })

    useEffect(() => {
        async function loadEarnings() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch earnings with booking details
            const { data, error } = await supabase
                .from('teacher_earnings')
                .select(`
                    *,
                    booking:bookings(
                        gigs(title, subject),
                        students(name)
                    )
                `)
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setEarnings(data as Earning[])

                // Calculate summary
                const summary = data.reduce((acc, e) => {
                    acc.total += Number(e.amount)
                    if (e.status === 'available') acc.available += Number(e.amount)
                    if (e.status === 'held') acc.held += Number(e.amount)
                    if (e.status === 'withdrawn') acc.withdrawn += Number(e.amount)
                    return acc
                }, { available: 0, held: 0, withdrawn: 0, total: 0 })

                setSummary(summary)
            }

            setLoading(false)
        }

        loadEarnings()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground">Financial Overview</h1>
                    <p className="text-muted-foreground text-base font-normal">Track your earnings and manage payouts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="font-bold gap-2">
                        <Download className="size-5" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Available Balance */}
                <div className="flex flex-col justify-between gap-2 rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="size-16 text-primary" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Available Balance</p>
                        <p className="text-3xl font-bold leading-tight text-foreground">GHS {summary.available.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 gap-1 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle className="size-3.5" /> Ready
                        </Badge>
                        <span className="text-muted-foreground text-xs">for withdrawal</span>
                    </div>
                </div>

                {/* Withdrawal Action Card */}
                <div className="flex flex-col justify-center items-start gap-3 rounded-xl p-6 bg-gradient-to-br from-primary to-blue-600 shadow-md text-white">
                    <p className="text-white/90 text-sm font-medium">Ready to cash out?</p>
                    <Button
                        variant="secondary"
                        className="w-full font-bold gap-2 text-primary hover:text-primary"
                        disabled={summary.available <= 0}
                    >
                        <DollarSign className="size-5" /> Request Withdrawal
                    </Button>
                    <div className="flex items-center gap-2 mt-1 opacity-80 text-xs">
                        <ShieldCheck className="size-4" />
                        <span>Secure transfer to your bank</span>
                    </div>
                </div>

                {/* Total Earned */}
                <div className="flex flex-col justify-center gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Total Earned</p>
                    <p className="text-3xl font-bold leading-tight text-foreground">GHS {summary.total.toFixed(2)}</p>
                </div>

                {/* Pending/Held */}
                <div className="flex flex-col justify-center gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-1">Held (Pending Sessions)</p>
                    <p className="text-3xl font-bold leading-tight text-foreground">GHS {summary.held.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Released after every 2 completed sessions</p>
                </div>
            </div>

            {/* Earnings Table */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-foreground text-xl font-bold">Earnings History</h3>
                </div>

                {earnings.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center">
                        <Wallet className="size-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No earnings yet</h3>
                        <p className="text-muted-foreground">Complete sessions to start earning!</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Course / Student</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Sessions</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {earnings.map((earning) => (
                                        <tr key={earning.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                                                {format(parseISO(earning.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                                                        <BookOpen className="size-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium block">{earning.booking?.gigs?.title || 'Course'}</span>
                                                        <span className="text-xs text-muted-foreground">{earning.booking?.students?.name || 'Student'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                <span className={cn(
                                                    "font-medium",
                                                    earning.sessions_completed >= earning.sessions_required ? "text-green-600" : "text-muted-foreground"
                                                )}>
                                                    {earning.sessions_completed}/{earning.sessions_required} done
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-green-600">
                                                +GHS {Number(earning.amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {earning.status === 'available' && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 gap-1 pl-1 pr-2 py-0.5">
                                                        <span className="size-1.5 rounded-full bg-green-600"></span> Available
                                                    </Badge>
                                                )}
                                                {earning.status === 'held' && (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50 gap-1 pl-1 pr-2 py-0.5">
                                                        <Clock className="size-3" /> Held
                                                    </Badge>
                                                )}
                                                {earning.status === 'withdrawn' && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50 gap-1 pl-1 pr-2 py-0.5">
                                                        <CheckCircle className="size-3" /> Withdrawn
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {earnings.length > 10 && (
                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Showing {earnings.length} earnings</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" disabled className="h-8 w-8"><ChevronLeft className="size-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="size-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">How Earnings Work</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Earnings are <strong>held</strong> until sessions are completed</li>
                    <li>• After every <strong>2 completed sessions</strong>, that portion becomes available</li>
                    <li>• Available funds can be withdrawn to your bank account</li>
                </ul>
            </div>
        </div>
    )
}
