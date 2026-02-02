"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search, Users, Eye, Loader2, Mail, Calendar
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useAdminPaths } from "@/lib/admin-paths"

interface Parent {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    city: string | null
    country: string | null
    created_at: string
    children_count?: number
    booking_count?: number
}

export default function ParentsPage() {
    const supabase = createClient()
    const { getPath } = useAdminPaths()

    const [loading, setLoading] = useState(true)
    const [parents, setParents] = useState<Parent[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        async function loadParents() {
            setLoading(true)

            const { data: parentsData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'parent')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error loading parents:', error)
                setLoading(false)
                return
            }

            // Enrich with counts
            const enriched = await Promise.all(
                (parentsData || []).map(async (parent) => {
                    const { count: childrenCount } = await supabase
                        .from('students')
                        .select('*', { count: 'exact', head: true })
                        .eq('parent_id', parent.id)

                    const { count: bookingCount } = await supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('parent_id', parent.id)

                    return {
                        ...parent,
                        children_count: childrenCount || 0,
                        booking_count: bookingCount || 0
                    }
                })
            )

            setParents(enriched)
            setLoading(false)
        }
        loadParents()
    }, [supabase])

    const filteredParents = parents.filter(p =>
        !searchQuery ||
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                <h1 className="text-2xl font-bold">Parent Management</h1>
                <p className="text-muted-foreground">
                    {parents.length} registered parents
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Parents Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                        <tr>
                            <th className="text-left py-3 px-4 font-medium text-sm">Parent</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Location</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Children</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Bookings</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredParents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                    No parents found
                                </td>
                            </tr>
                        ) : (
                            filteredParents.map((parent) => (
                                <tr key={parent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                {parent.avatar_url ? (
                                                    <img src={parent.avatar_url} className="size-full object-cover" alt="" />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center">
                                                        <Users className="size-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{parent.full_name || 'Unnamed'}</p>
                                                <p className="text-xs text-muted-foreground">{parent.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {[parent.city, parent.country].filter(Boolean).join(', ') || '-'}
                                    </td>
                                    <td className="py-3 px-4 font-medium">
                                        {parent.children_count}
                                    </td>
                                    <td className="py-3 px-4 font-medium">
                                        {parent.booking_count}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {format(parseISO(parent.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={getPath(`/admin/users/parents/${parent.id}`)}>
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
    )
}
