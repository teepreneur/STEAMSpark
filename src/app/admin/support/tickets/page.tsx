"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    LifeBuoy, Loader2, Clock, CheckCircle, AlertCircle, User
} from "lucide-react"
import { format, parseISO } from "date-fns"

interface Ticket {
    id: string
    subject: string
    description: string | null
    status: string | null
    priority: string | null
    created_at: string
    created_by: string
    user?: {
        full_name: string | null
        email: string | null
    }
}

export default function TicketsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <TicketsContent />
        </Suspense>
    )
}

function TicketsContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const statusFilter = searchParams.get('status')

    const [loading, setLoading] = useState(true)
    const [tickets, setTickets] = useState<Ticket[]>([])

    useEffect(() => {
        async function loadTickets() {
            setLoading(true)

            let query = supabase
                .from('support_tickets')
                .select(`
                    id, subject, description, status, priority, created_at, created_by,
                    user:profiles!support_tickets_created_by_fkey(full_name, email)
                `)
                .order('created_at', { ascending: false })

            if (statusFilter) {
                query = query.eq('status', statusFilter)
            }

            const { data, error } = await query

            if (!error) {
                setTickets(data || [])
            }
            setLoading(false)
        }
        loadTickets()
    }, [supabase, statusFilter])

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-red-100 text-red-700"><AlertCircle className="size-3 mr-1" />Open</Badge>
            case 'in_progress':
                return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="size-3 mr-1" />In Progress</Badge>
            case 'resolved':
                return <Badge className="bg-green-100 text-green-700"><CheckCircle className="size-3 mr-1" />Resolved</Badge>
            case 'closed':
                return <Badge className="bg-slate-100 text-slate-700">Closed</Badge>
            default:
                return <Badge variant="secondary">{status || 'Unknown'}</Badge>
        }
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
            <div>
                <h1 className="text-2xl font-bold">Support Tickets</h1>
                <p className="text-muted-foreground">
                    {tickets.length} tickets {statusFilter ? `(${statusFilter})` : ''}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <LifeBuoy className="size-12 mx-auto mb-4 opacity-50" />
                        <p>No support tickets found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-medium truncate">{ticket.subject}</h3>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                        {ticket.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {ticket.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="size-3" />
                                                {(ticket.user as any)?.full_name || 'Unknown'}
                                            </span>
                                            <span>
                                                {format(parseISO(ticket.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        View
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
