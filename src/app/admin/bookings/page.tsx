"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Search, BookOpen, Eye, Loader2, Calendar, User,
    GraduationCap, DollarSign, CheckCircle, Clock, XCircle
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { getAdminHref } from "@/lib/admin-paths"

interface Booking {
    id: string
    status: string | null
    created_at: string
    total_sessions: number | null
    gig: {
        id: string
        title: string
        price: number
    } | null
    parent: {
        id: string
        full_name: string | null
        email: string | null
    } | null
    teacher: {
        id: string
        full_name: string | null
    } | null
    student: {
        name: string
    } | null
}

export default function BookingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <BookingsContent />
        </Suspense>
    )
}

function BookingsContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const statusParam = searchParams.get('status')

    const [loading, setLoading] = useState(true)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>(statusParam || 'all')

    useEffect(() => {
        async function loadBookings() {
            setLoading(true)

            const { data: bookingsData, error } = await supabase
                .from('bookings')
                .select(`
                    id, status, created_at, total_sessions,
                    gig:gigs(id, title, price, teacher_id),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email),
                    student:students(name)
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) {
                console.error('Error loading bookings:', error)
                setLoading(false)
                return
            }

            // Enrich with teacher info
            const enriched = await Promise.all(
                (bookingsData || []).map(async (booking: any) => {
                    let teacher = null
                    if (booking.gig?.teacher_id) {
                        const { data: teacherData } = await supabase
                            .from('profiles')
                            .select('id, full_name')
                            .eq('id', booking.gig.teacher_id)
                            .single()
                        teacher = teacherData
                    }
                    return { ...booking, teacher }
                })
            )

            setBookings(enriched as Booking[])
            setLoading(false)
        }
        loadBookings()
    }, [])

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = !searchQuery ||
            b.gig?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.parent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.parent?.email?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || b.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="size-3 mr-1" />Confirmed</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="size-3 mr-1" />Pending</Badge>
            case 'pending_payment':
                return <Badge className="bg-blue-100 text-blue-700"><DollarSign className="size-3 mr-1" />Awaiting Payment</Badge>
            case 'completed':
                return <Badge className="bg-slate-100 text-slate-700"><CheckCircle className="size-3 mr-1" />Completed</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700"><XCircle className="size-3 mr-1" />Cancelled</Badge>
            default:
                return <Badge variant="secondary">{status || 'Unknown'}</Badge>
        }
    }

    const statuses = ['all', 'pending', 'pending_payment', 'confirmed', 'completed', 'cancelled']

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Booking Management</h1>
                <p className="text-muted-foreground">
                    {filteredBookings.length} bookings
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by course or parent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {statuses.map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="capitalize"
                        >
                            {status === 'pending_payment' ? 'Awaiting Payment' : status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-sm">Course</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Parent</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Student</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Teacher</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Amount</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-3 px-4">
                                            <p className="font-medium truncate max-w-[200px]">
                                                {booking.gig?.title || 'Unknown Course'}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm">{booking.parent?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-muted-foreground">{booking.parent?.email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {booking.student?.name || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {booking.teacher?.full_name || 'Unknown'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            GHS {((booking.gig?.price || 0) * (booking.total_sessions || 1)).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {format(parseISO(booking.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={getAdminHref(`/admin/bookings/${booking.id}`)}>
                                                    <Eye className="size-4 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
