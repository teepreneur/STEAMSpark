"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2, User, Clock, CheckCircle, AlertCircle, ArrowLeft, Save
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { getAdminHref } from "@/lib/admin-paths"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Ticket {
    id: string
    subject: string
    description: string | null
    status: string
    priority: string
    created_at: string
    created_by: string
    resolution_notes: string | null
    user?: any
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
    const router = useRouter()
    const id = params.id as string
    const supabase = createClient()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [resolutionNotes, setResolutionNotes] = useState("")

    useEffect(() => {
        async function loadTicket() {
            setLoading(true)
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    user:profiles!support_tickets_created_by_fkey(full_name, email)
                `)
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
                setResolutionNotes(data.resolution_notes || "")
            }
            setLoading(false)
        }
        loadTicket()
    }, [id, supabase, toast])

    async function handleUpdate() {
        if (!ticket) return

        setUpdating(true)
        const { error } = await supabase
            .from('support_tickets')
            .update({
                status: ticket.status,
                priority: ticket.priority,
                resolution_notes: resolutionNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error("Error updating ticket:", error)
            toast({
                title: "Error",
                description: "Failed to update ticket",
                variant: "destructive",
            })
        } else {
            toast({
                title: "Success",
                description: "Ticket updated successfully",
            })
            router.refresh()
        }
        setUpdating(false)
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
                    <Link href={getAdminHref("/admin/support/tickets")}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Tickets
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href={getAdminHref("/admin/support/tickets")}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold flex-1">Ticket Details</h1>
                <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Main Ticket Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">{ticket.subject}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Clock className="size-4" />
                                <span>Created {format(parseISO(ticket.created_at), 'PPP p')}</span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="font-medium mb-2">User Information</h3>
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <User className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">{ticket.user?.full_name || 'Unknown User'}</p>
                                    <p className="text-sm text-muted-foreground">{ticket.user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resolution Notes */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-4">
                        <h3 className="font-medium">Resolution Notes</h3>
                        <Textarea
                            placeholder="Add internal notes or resolution details..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="min-h-[150px]"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status & Priority */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={ticket.status}
                                onValueChange={(value) => setTicket({ ...ticket, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select
                                value={ticket.priority}
                                onValueChange={(value) => setTicket({ ...ticket, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
