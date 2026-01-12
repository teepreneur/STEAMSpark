"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, Loader2, Calendar, Clock, User, BookOpen,
    MessageSquare, CheckCircle, Send, Video
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
        parent_id: string
        student: {
            name: string
        }
        gig: {
            title: string
            subject: string | null
        }
        parent: {
            id: string
            full_name: string | null
            email: string | null
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

export default function TeacherSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params)
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<SessionData | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)

    // Messaging state
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)

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
                        id, parent_id,
                        student:students!inner(name),
                        gig:gigs!inner(title, subject),
                        parent:profiles!bookings_parent_id_fkey(id, full_name, email)
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

            // Load conversation with parent
            const parentId = (data as any).booking.parent_id
            if (parentId) {
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(teacher_id.eq.${user.id},parent_id.eq.${parentId})`)
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

    async function markComplete() {
        if (!session || !userId) return
        setUpdating(true)

        // Update session status
        await supabase
            .from('booking_sessions')
            .update({ status: 'completed' })
            .eq('id', session.id)

        // Create notification for parent
        await supabase.from('notifications').insert({
            user_id: session.booking.parent.id,
            type: 'session_completed',
            title: 'Session Completed!',
            message: `Session ${session.session_number} of "${session.booking.gig.title}" has been marked complete.`,
            read: false
        })

        // Update earnings - count completed sessions for this booking
        const { data: completedSessions } = await supabase
            .from('booking_sessions')
            .select('id')
            .eq('booking_id', session.booking.id)
            .eq('status', 'completed')

        const completedCount = (completedSessions?.length || 0) + 1

        // Update all earnings records for this booking
        await supabase
            .from('teacher_earnings')
            .update({ sessions_completed: completedCount })
            .eq('booking_id', session.booking.id)

        // Release earnings where sessions_completed >= sessions_required
        await supabase
            .from('teacher_earnings')
            .update({ status: 'available', released_at: new Date().toISOString() })
            .eq('booking_id', session.booking.id)
            .eq('status', 'held')
            .lte('sessions_required', completedCount)

        setSession({ ...session, status: 'completed' })
        setUpdating(false)
    }

    async function sendMessage() {
        if (!newMessage.trim() || !userId || !session) return
        setSendingMessage(true)

        let convId = conversationId

        // Create conversation if doesn't exist
        if (!convId) {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({
                    teacher_id: userId,
                    parent_id: session.booking.parent_id
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

            // Create notification for parent about new message
            await supabase.from('notifications').insert({
                user_id: session.booking.parent_id,
                type: 'new_message',
                title: 'New Message',
                message: `You have a new message about "${session.booking.gig.title}"`,
                read: false,
                action_url: `/parent/sessions/${session.id}`
            })

            setNewMessage('')
            loadMessages(convId)
        }

        setSendingMessage(false)
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
                    <Link href="/teacher/calendar">Back to Calendar</Link>
                </Button>
            </div>
        )
    }

    const isCompleted = session.status === 'completed'
    const isCancelled = session.status === 'cancelled'
    const canComplete = !isCompleted && !isCancelled

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6">
            <Link href="/teacher/calendar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="size-4" /> Back to Calendar
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
                                    <p className="text-xs text-muted-foreground">Subject</p>
                                    <p className="font-bold capitalize">{session.booking.gig.subject || 'General'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Meeting Link */}
                        {session.meeting_link && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Video className="size-5 text-blue-600" />
                                        <span className="font-medium">Meeting Link</span>
                                    </div>
                                    <Button size="sm" asChild>
                                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                                            Join Class
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {canComplete && (
                            <Button
                                onClick={markComplete}
                                disabled={updating}
                                className="w-full bg-green-600 hover:bg-green-700 font-bold gap-2"
                                size="lg"
                            >
                                {updating ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                                Mark Session Complete
                            </Button>
                        )}

                        {isCompleted && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                                <CheckCircle className="size-8 text-green-600 mx-auto mb-2" />
                                <p className="font-bold text-green-700 dark:text-green-400">Session Completed</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Parent has been notified</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Messaging Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl border h-[500px] flex flex-col">
                        <div className="p-4 border-b flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Message Parent</p>
                                <p className="text-xs text-muted-foreground">{session.booking.parent.full_name || 'Parent'}</p>
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
