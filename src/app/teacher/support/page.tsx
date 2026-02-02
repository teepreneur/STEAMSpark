"use client"

import { Suspense, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LifeBuoy, Loader2, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"

interface Ticket {
    id: string
    subject: string
    description: string | null
    status: string | null
    priority: string | null
    created_at: string
}

export default function TeacherSupportPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <SupportContent />
        </Suspense>
    )
}

function SupportContent() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [tickets, setTickets] = useState<Ticket[]>([])

    useEffect(() => {
        async function loadTickets() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data, error } = await supabase
                    .from('support_tickets')
                    .select('id, subject, description, status, priority, created_at')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false })

                if (!error) {
                    setTickets(data || [])
                }
            }
            setLoading(false)
        }
        loadTickets()
    }, [])

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Support</h1>
                    <p className="text-muted-foreground">
                        Get help with issues or questions
                    </p>
                </div>
                <Button asChild>
                    <Link href="/teacher/support/new">
                        <Plus className="size-4 mr-2" />
                        New Ticket
                    </Link>
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <LifeBuoy className="size-12 mx-auto mb-4 opacity-50" />
                        <p>No support tickets yet</p>
                        <Button asChild variant="link" className="mt-2">
                            <Link href="/teacher/support/new">Create your first ticket</Link>
                        </Button>
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
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Created {format(parseISO(ticket.created_at), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/teacher/support/${ticket.id}`}>
                                            View
                                        </Link>
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
