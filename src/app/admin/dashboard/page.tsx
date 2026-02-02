"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Users, GraduationCap, BookOpen, DollarSign,
    TrendingUp, Clock, AlertCircle, CheckCircle,
    ArrowRight, Loader2
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, subDays } from "date-fns"

interface DashboardStats {
    totalTeachers: number
    totalParents: number
    pendingVerifications: number
    activeBookings: number
    totalRevenue: number
    pendingTickets: number
}

interface RecentActivity {
    id: string
    type: 'signup' | 'booking' | 'payment' | 'ticket'
    title: string
    description: string
    created_at: string
}

// Inline path helper - no hooks needed
function getHref(basePath: string): string {
    if (typeof window === 'undefined') return basePath
    const isAdminSubdomain = window.location.hostname.includes('admin.') || window.location.hostname.startsWith('admin.')
    return isAdminSubdomain ? basePath : `/admin${basePath}`
}

export default function AdminDashboardPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalTeachers: 0,
        totalParents: 0,
        pendingVerifications: 0,
        activeBookings: 0,
        totalRevenue: 0,
        pendingTickets: 0
    })
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

    useEffect(() => {
        async function loadDashboard() {
            setLoading(true)
            console.log("Dashboard v2.1 Loading... (Fixed Loop)")

            if (!supabase) {
                console.error("Supabase client not initialized")
                setLoading(false)
                return
            }

            try {
                // Get teacher count
                const { count: teacherCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'teacher')

                // Get parent count
                const { count: parentCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'parent')

                // Get active bookings
                const { count: bookingCount } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['pending', 'pending_payment', 'confirmed'])

                // Get total revenue from payments
                const { data: payments } = await supabase
                    .from('payments')
                    .select('amount')
                    .eq('status', 'completed')

                const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

                // Get open support tickets
                const { count: ticketCount } = await supabase
                    .from('support_tickets')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open')

                // Try to get pending verifications (might fail if column missing)
                let pendingCount = 0
                try {
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('role', 'teacher')
                        .is('verified_at', null)
                    pendingCount = count || 0
                } catch (e) {
                    console.warn("Failed to fetch pending verifications", e)
                }

                setStats({
                    totalTeachers: teacherCount || 0,
                    totalParents: parentCount || 0,
                    pendingVerifications: pendingCount || 0,
                    activeBookings: bookingCount || 0,
                    totalRevenue,
                    pendingTickets: ticketCount || 0
                })

                // Get recent activity
                const sevenDaysAgo = subDays(new Date(), 7).toISOString()

                // Recent signups
                const { data: recentSignups } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, created_at')
                    .gte('created_at', sevenDaysAgo)
                    .order('created_at', { ascending: false })
                    .limit(5)

                // Recent bookings
                const { data: recentBookings } = await supabase
                    .from('bookings')
                    .select(`
                        id, created_at,
                        gig:gigs(title),
                        parent:profiles!bookings_parent_id_fkey(full_name)
                    `)
                    .gte('created_at', sevenDaysAgo)
                    .order('created_at', { ascending: false })
                    .limit(5)

                const activities: RecentActivity[] = [
                    ...(recentSignups || []).map(s => ({
                        id: `signup-${s.id}`,
                        type: 'signup' as const,
                        title: `New ${s.role} registered`,
                        description: s.full_name || 'Unnamed user',
                        created_at: s.created_at
                    })),
                    ...(recentBookings || []).map((b: any) => ({
                        id: `booking-${b.id}`,
                        type: 'booking' as const,
                        title: 'New booking',
                        description: `${b.parent?.full_name || 'A parent'} booked ${b.gig?.title || 'a course'}`,
                        created_at: b.created_at
                    }))
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 8)

                setRecentActivity(activities)

            } catch (error) {
                console.error("Dashboard load error:", error)
            } finally {
                setLoading(false)
            }
        }
        loadDashboard()
    }
        loadDashboard()
    }, []) // Empty dependency array to run once on mount

if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="size-8 animate-spin text-primary" />
        </div>
    )
}

const statCards = [
    { label: "Total Teachers", value: stats.totalTeachers, icon: GraduationCap, color: "bg-blue-500", href: getHref("/users/teachers") },
    { label: "Total Parents", value: stats.totalParents, icon: Users, color: "bg-green-500", href: getHref("/users/parents") },
    { label: "Pending Verifications", value: stats.pendingVerifications, icon: Clock, color: "bg-orange-500", href: getHref("/users/teachers?filter=unverified") },
    { label: "Active Bookings", value: stats.activeBookings, icon: BookOpen, color: "bg-purple-500", href: getHref("/bookings") },
    { label: "Total Revenue", value: `GHS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500", href: getHref("/finance") },
    { label: "Open Tickets", value: stats.pendingTickets, icon: AlertCircle, color: "bg-red-500", href: getHref("/support/tickets") },
]

return (
    <div className="space-y-8">
        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
                Overview of platform activity and key metrics
            </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
                <Link
                    key={card.label}
                    href={card.href}
                    className="bg-white dark:bg-slate-900 rounded-xl border p-6 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="text-2xl font-bold mt-1">{card.value}</p>
                        </div>
                        <div className={cn("size-12 rounded-xl flex items-center justify-center", card.color)}>
                            <card.icon className="size-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-primary">
                        View details
                        <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
                <div className="space-y-3">
                    <Button asChild className="w-full justify-start gap-3" variant="outline">
                        <Link href={getHref("/users/teachers?filter=unverified")}>
                            <Clock className="size-4" />
                            Review Pending Verifications ({stats.pendingVerifications})
                        </Link>
                    </Button>
                    <Button asChild className="w-full justify-start gap-3" variant="outline">
                        <Link href={getHref("/bookings?status=pending")}>
                            <BookOpen className="size-4" />
                            View Pending Bookings
                        </Link>
                    </Button>
                    <Button asChild className="w-full justify-start gap-3" variant="outline">
                        <Link href={getHref("/support/tickets?status=open")}>
                            <AlertCircle className="size-4" />
                            Handle Open Tickets ({stats.pendingTickets})
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h2 className="font-bold text-lg mb-4">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent activity</p>
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                                <div className={cn(
                                    "size-8 rounded-full flex items-center justify-center",
                                    activity.type === 'signup' && "bg-green-100 text-green-600",
                                    activity.type === 'booking' && "bg-blue-100 text-blue-600",
                                    activity.type === 'payment' && "bg-emerald-100 text-emerald-600",
                                    activity.type === 'ticket' && "bg-red-100 text-red-600"
                                )}>
                                    {activity.type === 'signup' && <Users className="size-4" />}
                                    {activity.type === 'booking' && <BookOpen className="size-4" />}
                                    {activity.type === 'payment' && <DollarSign className="size-4" />}
                                    {activity.type === 'ticket' && <AlertCircle className="size-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(parseISO(activity.created_at), 'MMM d')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
)
}
