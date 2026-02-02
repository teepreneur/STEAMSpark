"use client"

import { useEffect, useState, useMemo } from "react"
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
import { useAdminPaths } from "@/lib/admin-paths"

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

export default function AdminDashboardPage() {
    const supabase = createClient()
    const { getPath } = useAdminPaths()
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

            // Fetch teachers count
            const { count: teacherCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'teacher')

            // Fetch parents count
            const { count: parentCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'parent')

            // Fetch pending verifications (teachers without verified status)
            const { count: pendingVerifyCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'teacher')
                .is('verified_at', null)

            // Fetch active bookings
            const { count: activeBookingsCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'pending_payment', 'confirmed'])

            // Fetch total revenue from payments
            const { data: payments } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'completed')

            const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

            // Fetch pending support tickets
            const { count: pendingTicketsCount } = await supabase
                .from('support_tickets')
                .select('*', { count: 'exact', head: true })
                .in('status', ['open', 'in_progress'])

            setStats({
                totalTeachers: teacherCount || 0,
                totalParents: parentCount || 0,
                pendingVerifications: pendingVerifyCount || 0,
                activeBookings: activeBookingsCount || 0,
                totalRevenue,
                pendingTickets: pendingTicketsCount || 0
            })

            // Fetch recent signups
            const { data: recentSignups } = await supabase
                .from('profiles')
                .select('id, full_name, role, created_at')
                .gte('created_at', subDays(new Date(), 7).toISOString())
                .order('created_at', { ascending: false })
                .limit(5)

            // Fetch recent bookings
            const { data: recentBookings } = await supabase
                .from('bookings')
                .select(`
                    id, status, created_at,
                    gig:gigs(title),
                    parent:profiles!bookings_parent_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5)

            // Combine into activity feed
            const activity: RecentActivity[] = [
                ...(recentSignups || []).map(s => ({
                    id: s.id,
                    type: 'signup' as const,
                    title: `New ${s.role} signup`,
                    description: s.full_name || 'Unknown user',
                    created_at: s.created_at
                })),
                ...(recentBookings || []).map((b: any) => ({
                    id: b.id,
                    type: 'booking' as const,
                    title: `New booking: ${b.gig?.title || 'Course'}`,
                    description: `By ${b.parent?.full_name || 'Parent'} - ${b.status}`,
                    created_at: b.created_at
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)

            setRecentActivity(activity)
            setLoading(false)
        }
        loadDashboard()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const statCards = useMemo(() => [
        { label: "Total Teachers", value: stats.totalTeachers, icon: GraduationCap, color: "bg-blue-500", href: getPath("/admin/users/teachers") },
        { label: "Total Parents", value: stats.totalParents, icon: Users, color: "bg-green-500", href: getPath("/admin/users/parents") },
        { label: "Pending Verifications", value: stats.pendingVerifications, icon: Clock, color: "bg-orange-500", href: getPath("/admin/users/teachers?filter=unverified") },
        { label: "Active Bookings", value: stats.activeBookings, icon: BookOpen, color: "bg-purple-500", href: getPath("/admin/bookings") },
        { label: "Total Revenue", value: `GHS ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500", href: getPath("/admin/finance") },
        { label: "Open Tickets", value: stats.pendingTickets, icon: AlertCircle, color: "bg-red-500", href: getPath("/admin/support/tickets") },
    ], [stats, getPath])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of STEAM Spark platform activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className="bg-white dark:bg-slate-900 rounded-xl border p-6 hover:shadow-lg transition-shadow group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-black mt-1">{stat.value}</p>
                            </div>
                            <div className={cn("size-12 rounded-xl flex items-center justify-center", stat.color)}>
                                <stat.icon className="size-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            View details <ArrowRight className="size-4 ml-1" />
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
                            <Link href={getPath("/admin/users/teachers?filter=unverified")}>
                                <Clock className="size-4" />
                                Review Pending Verifications ({stats.pendingVerifications})
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start gap-3" variant="outline">
                            <Link href={getPath("/admin/bookings?status=pending")}>
                                <BookOpen className="size-4" />
                                View Pending Bookings
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start gap-3" variant="outline">
                            <Link href={getPath("/admin/support/tickets?status=open")}>
                                <AlertCircle className="size-4" />
                                Handle Open Tickets ({stats.pendingTickets})
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h2 className="font-bold text-lg mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No recent activity</p>
                        ) : (
                            recentActivity.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className={cn(
                                        "size-8 rounded-full flex items-center justify-center shrink-0",
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
                                        <p className="font-medium text-sm truncate">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {format(parseISO(activity.created_at), 'MMM d')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
