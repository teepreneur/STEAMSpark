"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, Loader2, Calendar, Clock, User, BookOpen,
    MessageSquare, CheckCircle, Send, Video, AlertTriangle, Headphones
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"

interface SessionData {
    id: string
    session_date: string
    session_time: string
    session_number: number
    status: string
    meeting_link: string | null
    booking: {
        id: string
        student: {
            name: string
        }
        gig: {
            title: string
            subject: string | null
            teacher_id: string
            profiles: {
                full_name: string | null
            }
        }
    }
}

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
}

function formatTime(time: string): string {
    const [hours] = time.split(':')
    const h = parseInt(hours)
    if (h === 0) return "12:00 AM"
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return "12:00 PM"
    return `${h - 12}:00 PM`
}

export default function ParentSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params)
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<SessionData | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Messaging state
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)

    // Complaint state
    const [showComplaintForm, setShowComplaintForm] = useState(false)
    const [complaintType, setComplaintType] = useState('session_issue')
    const [complaintDescription, setComplaintDescription] = useState('')
    const [submittingComplaint, setSubmittingComplaint] = useState(false)
    const [complaintSubmitted, setComplaintSubmitted] = useState(false)

    useEffect(() => {
        async function loadSession() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data, error } = await supabase
                .from('booking_sessions')
                .select(`
                    id, session_date, session_time, session_number, status, meeting_link,
                    booking:bookings!inner(
                        id,
                        student:students!inner(name),
                        gig:gigs!inner(title, subject, teacher_id, profiles!gigs_teacher_id_fkey(full_name))
                    )
                `)
                .eq('id', sessionId)
                .single()

            if (error || !data) {
                console.error('Error loading session:', error)
                setLoading(false)
                return
            }

            setSession(data as any)
            setLoading(false)

            // Load conversation with teacher
            const teacherId = (data as any).booking.gig.teacher_id
            if (teacherId) {
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(teacher_id.eq.${teacherId},parent_id.eq.${user.id})`)
                    .single()

                if (conv) {
                    setConversationId(conv.id)
                    loadMessages(conv.id)
                }
            }
        }

        loadSession()
    }, [sessionId, supabase])

    async function loadMessages(convId: string) {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
            .limit(20)

        if (data) setMessages(data)
    }

    async function sendMessage() {
        if (!newMessage.trim() || !userId || !session) return
        setSendingMessage(true)

        let convId = conversationId

        if (!convId) {
            const teacherId = session.booking.gig.teacher_id
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                    teacher_id: teacherId,
                    parent_id: userId
                })
                .select('id')
                .single()

            if (newConv) {
                convId = newConv.id
                setConversationId(convId)
            }
        }

        if (convId) {
            await supabase.from('messages').insert({
                conversation_id: convId,
                sender_id: userId,
                content: newMessage.trim()
            })

            // Notify teacher of new message
            const teacherId = session.booking.gig.teacher_id
            try {
                await fetch('/api/notifications/new-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: teacherId,
                        senderName: 'Parent',
                        messagePreview: newMessage.trim(),
                        conversationId: convId
                    })
                })
            } catch (e) {
                console.log('Notification failed')
            }

            setNewMessage('')
            loadMessages(convId)
        }

        setSendingMessage(false)
    }

    async function submitComplaint() {
        if (!complaintDescription.trim() || !userId || !session) return
        setSubmittingComplaint(true)

        await supabase.from('complaints').insert({
            session_id: session.id,
            booking_id: session.booking.id,
            user_id: userId,
            type: complaintType,
            description: complaintDescription.trim()
        })

        setSubmittingComplaint(false)
        setComplaintSubmitted(true)
        setShowComplaintForm(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Session not found</h1>
                <Button asChild>
                    <Link href="/parent/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    const isCompleted = session.status === 'completed'
    const isCancelled = session.status === 'cancelled'
    const teacherName = (session.booking.gig as any).profiles?.full_name || 'Teacher'

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6">
            <Link href="/parent/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl border p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">Session {session.session_number}</h1>
                                <p className="text-muted-foreground">{session.booking.gig.title}</p>
                            </div>
                            <Badge className={cn(
                                "font-bold text-sm capitalize",
                                isCompleted ? "bg-green-100 text-green-700" :
                                    isCancelled ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                            )}>
                                {session.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Calendar className="size-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="font-bold">{format(parseISO(session.session_date), 'EEE, MMM d, yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Clock className="size-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Time</p>
                                    <p className="font-bold">{formatTime(session.session_time)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <User className="size-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Student</p>
                                    <p className="font-bold">{session.booking.student.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <BookOpen className="size-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Teacher</p>
                                    <p className="font-bold">{teacherName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Meeting Link */}
                        {session.meeting_link && !isCompleted && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Video className="size-5 text-blue-600" />
                                        <span className="font-medium">Join your class</span>
                                    </div>
                                    <Button size="sm" asChild>
                                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                                            Join Class
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isCompleted && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-center">
                                <CheckCircle className="size-8 text-green-600 mx-auto mb-2" />
                                <p className="font-bold text-green-700 dark:text-green-400">Session Completed</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => setShowComplaintForm(true)}
                            >
                                <AlertTriangle className="size-4" />
                                Report Issue
                            </Button>
                            <Button variant="outline" className="flex-1 gap-2" asChild>
                                <a href="mailto:support@steamspark.com">
                                    <Headphones className="size-4" />
                                    Contact Support
                                </a>
                            </Button>
                        </div>

                        {complaintSubmitted && (
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                                <p className="font-bold text-yellow-700 dark:text-yellow-400">Complaint Submitted</p>
                                <p className="text-sm text-yellow-600">Our team will review and respond shortly.</p>
                            </div>
                        )}
                    </div>

                    {/* Complaint Form */}
                    {showComplaintForm && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertTriangle className="size-5 text-orange-500" />
                                Report an Issue
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold mb-2 block">Issue Type</label>
                                    <select
                                        value={complaintType}
                                        onChange={(e) => setComplaintType(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-background"
                                    >
                                        <option value="session_issue">Session Issue</option>
                                        <option value="teacher_issue">Teacher Issue</option>
                                        <option value="payment_issue">Payment Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-2 block">Description</label>
                                    <Textarea
                                        placeholder="Please describe your issue in detail..."
                                        value={complaintDescription}
                                        onChange={(e) => setComplaintDescription(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={submitComplaint}
                                        disabled={submittingComplaint || !complaintDescription.trim()}
                                        className="flex-1"
                                    >
                                        {submittingComplaint ? <Loader2 className="size-4 animate-spin" /> : 'Submit Complaint'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowComplaintForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Messaging Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl border h-[500px] flex flex-col">
                        <div className="p-4 border-b flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Message Teacher</p>
                                <p className="text-xs text-muted-foreground">{teacherName}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-8">
                                    No messages yet. Start the conversation!
                                </p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "max-w-[85%] p-3 rounded-xl text-sm",
                                            msg.sender_id === userId
                                                ? "ml-auto bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button size="icon" onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                                <Send className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
