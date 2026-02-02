"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Search, Filter, GraduationCap, CheckCircle, Clock,
    XCircle, Mail, Eye, MoreHorizontal, Loader2, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useAdminPaths } from "@/lib/admin-paths"

interface Teacher {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    bio: string | null
    subjects: string[] | null
    class_mode: string | null
    city: string | null
    country: string | null
    created_at: string
    verified_at: string | null
    cv_url: string | null
    id_url: string | null
    gig_count?: number
    booking_count?: number
}

export default function TeachersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <TeachersContent />
        </Suspense>
    )
}

function TeachersContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const filterParam = searchParams.get('filter')
    const { getPath } = useAdminPaths()

    const [loading, setLoading] = useState(true)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>(
        filterParam === 'unverified' ? 'unverified' : 'all'
    )

    useEffect(() => {
        async function loadTeachers() {
            setLoading(true)

            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'teacher')
                .order('created_at', { ascending: false })

            const { data: teachersData, error } = await query

            if (error) {
                console.error('Error loading teachers:', error)
                setLoading(false)
                return
            }

            // Enrich with gig and booking counts
            const enriched = await Promise.all(
                (teachersData || []).map(async (teacher) => {
                    const { count: gigCount } = await supabase
                        .from('gigs')
                        .select('*', { count: 'exact', head: true })
                        .eq('teacher_id', teacher.id)

                    const { count: bookingCount } = await supabase
                        .from('bookings')
                        .select('*, gig:gigs!inner(teacher_id)', { count: 'exact', head: true })
                        .eq('gig.teacher_id', teacher.id)
                        .eq('status', 'confirmed')

                    return {
                        ...teacher,
                        gig_count: gigCount || 0,
                        booking_count: bookingCount || 0
                    }
                })
            )

            setTeachers(enriched)
            setLoading(false)
        }
        loadTeachers()
    }, [supabase])

    // Filter teachers
    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = !searchQuery ||
            t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subjects?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesFilter = filter === 'all' ||
            (filter === 'verified' && t.verified_at) ||
            (filter === 'unverified' && !t.verified_at)

        return matchesSearch && matchesFilter
    })

    const getStatusBadge = (teacher: Teacher) => {
        if (teacher.verified_at) {
            return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Verified</Badge>
        }
        if (teacher.cv_url || teacher.id_url) {
            return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Pending Review</Badge>
        }
        return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Unverified</Badge>
    }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Teacher Management</h1>
                    <p className="text-muted-foreground">
                        {filteredTeachers.length} teachers • {teachers.filter(t => !t.verified_at).length} pending verification
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'verified', 'unverified'] as const).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="capitalize"
                        >
                            {f}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Teachers Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-sm">Teacher</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Subjects</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Gigs</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Bookings</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                        No teachers found
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    {teacher.avatar_url ? (
                                                        <img src={teacher.avatar_url} className="size-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="size-full flex items-center justify-center">
                                                            <GraduationCap className="size-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{teacher.full_name || 'Unnamed'}</p>
                                                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.subjects?.slice(0, 2).map((s, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                                ))}
                                                {(teacher.subjects?.length || 0) > 2 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{(teacher.subjects?.length || 0) - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {getStatusBadge(teacher)}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            {teacher.gig_count}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                            {teacher.booking_count}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {format(parseISO(teacher.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={getPath(`/admin/users/teachers/${teacher.id}`)}>
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
