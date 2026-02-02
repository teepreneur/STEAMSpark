"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Loader2, Clock, CheckCircle, AlertCircle, ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
    id: string
    subject: string
    description: string | null
    status: string
    priority: string
    created_at: string
    resolution_notes: string | null
}

export default function TicketDetailPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <TicketDetailContent />
        </Suspense>
    )
}

function TicketDetailContent() {
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [ticket, setTicket] = useState<Ticket | null>(null)

    useEffect(() => {
        async function loadTicket() {
            setLoading(true)
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error("Error loading ticket:", error)
                toast({
                    title: "Error",
                    description: "Failed to load ticket",
                    variant: "destructive",
                })
            } else {
                setTicket(data)
            }
            setLoading(false)
        }
        loadTicket()
    }, [id, supabase, toast])

    const getStatusBadge = (status: string) => {
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
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-muted-foreground">Ticket not found</p>
                <Button asChild variant="outline">
                    <Link href="/parent/support">
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Support
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/parent/support">
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Ticket Details</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">{ticket.subject}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="size-4" />
                                {format(parseISO(ticket.created_at), 'PPP p')}
                            </span>
                            <Badge variant="outline" className="capitalize">
                                {ticket.priority} Priority
                            </Badge>
                        </div>
                    </div>
                    {getStatusBadge(ticket.status)}
                </div>

                <div className="space-y-2">
                    <h3 className="font-medium text-sm text-foreground">Description</h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
                    </div>
                </div>

                {ticket.resolution_notes && (
                    <div className="space-y-2 pt-4 border-t">
                        <h3 className="font-medium text-sm text-foreground">Resolution Notes</h3>
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-4 rounded-lg">
                            <p className="whitespace-pre-wrap text-sm">{ticket.resolution_notes}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
