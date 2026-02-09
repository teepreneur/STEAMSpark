"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Search, Send, Loader2, User, MessageSquare, Sparkles } from "lucide-react"
import { format, parseISO, isToday, isYesterday } from "date-fns"

interface Conversation {
    id: string
    teacher_id: string
    teacher: {
        id: string
        full_name: string | null
        email: string | null
        avatar_url: string | null
        subjects: string[] | null
    }
    last_message_at: string
    last_message?: string
    unread_count: number
    hasActiveBooking?: boolean
}

interface Message {
    id: string
    sender_id: string
    content: string
    created_at: string
    is_read: boolean
}

// Export the main page wrapped in Suspense
export default function ParentMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <ParentMessagesContent />
        </Suspense>
    )
}

function ParentMessagesContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const sharedText = searchParams.get('text')
    const teacherIdFromUrl = searchParams.get('teacher')

    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [hasSharedContent, setHasSharedContent] = useState(false)
    const [canChat, setCanChat] = useState(false)  // True if confirmed booking exists
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Pre-fill message from URL params (from roadmap share)
    useEffect(() => {
        if (sharedText && !hasSharedContent) {
            try {
                setNewMessage(decodeURIComponent(sharedText))
            } catch (e) {
                // If decode fails, use the raw text
                setNewMessage(sharedText)
            }
            setHasSharedContent(true)
        }
    }, [sharedText, hasSharedContent])

    // Load conversations
    useEffect(() => {
        async function loadConversations() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // Get conversations with teacher info
            const { data: convos } = await supabase
                .from('conversations')
                .select(`
                    id,
                    teacher_id,
                    last_message_at,
                    teacher:profiles!conversations_teacher_id_fkey(id, full_name, email, avatar_url, subjects)
                `)
                .eq('parent_id', user.id)
                .order('last_message_at', { ascending: false })

            if (convos) {
                // Enrich with last message and unread count
                const enrichedConvos = await Promise.all(
                    convos.map(async (c: any) => {
                        const { data: lastMsg } = await supabase
                            .from('messages')
                            .select('content')
                            .eq('conversation_id', c.id)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle()

                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('conversation_id', c.id)
                            .eq('is_read', false)
                            .neq('sender_id', user.id)

                        return {
                            ...c,
                            teacher: c.teacher,
                            last_message: lastMsg?.content,
                            unread_count: count || 0,
                            hasActiveBooking: false  // Will be checked when selected
                        }
                    })
                )
                setConversations(enrichedConvos)

                // Auto-select conversation if teacher ID in URL (and it's valid)
                if (teacherIdFromUrl && teacherIdFromUrl !== 'undefined' && teacherIdFromUrl !== 'null') {
                    const existingConvo = enrichedConvos.find(c => c.teacher_id === teacherIdFromUrl)
                    if (existingConvo) {
                        setSelectedConversation(existingConvo)
                    } else {
                        // Create new conversation with this teacher
                        await createConversation(teacherIdFromUrl, user.id)
                    }
                } else if (enrichedConvos.length > 0) {
                    setSelectedConversation(enrichedConvos[0])
                }
            }

            setLoading(false)
        }
        loadConversations()
    }, [supabase, teacherIdFromUrl])

    async function createConversation(teacherId: string, parentId: string) {
        // First, check if conversation already exists (handle unique constraint)
        const { data: existing } = await supabase
            .from('conversations')
            .select(`
                id,
                teacher_id,
                last_message_at,
                teacher:profiles!conversations_teacher_id_fkey(id, full_name, email, avatar_url, subjects)
            `)
            .eq('teacher_id', teacherId)
            .eq('parent_id', parentId)
            .single()

        if (existing) {
            const convo = {
                ...existing,
                teacher: existing.teacher as any,
                last_message: undefined,
                unread_count: 0
            }
            // Add to list if not already there
            if (!conversations.find(c => c.id === existing.id)) {
                setConversations([convo, ...conversations])
            }
            setSelectedConversation(convo)
            return
        }

        // Create new conversation
        const { data: newConvo, error } = await supabase
            .from('conversations')
            .insert({ teacher_id: teacherId, parent_id: parentId })
            .select(`
                id,
                teacher_id,
                last_message_at,
                teacher:profiles!conversations_teacher_id_fkey(id, full_name, email, avatar_url, subjects)
            `)
            .single()

        if (error) {
            console.error('Error creating conversation:', error)
            return
        }

        if (newConvo) {
            const convo = {
                ...newConvo,
                teacher: newConvo.teacher as any,
                last_message: undefined,
                unread_count: 0
            }
            setConversations([convo, ...conversations])
            setSelectedConversation(convo)
        }
    }

    // Load messages and subscribe to real-time updates when conversation selected
    useEffect(() => {
        if (!selectedConversation) return
        const conversationId = selectedConversation.id

        async function loadMessages() {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)
                // Mark as read
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', userId)
            }
        }

        // Check if there's a confirmed booking with this teacher
        async function checkActiveBooking() {
            const teacherId = selectedConversation?.teacher_id
            if (!teacherId) {
                setCanChat(false)
                return
            }

            // Check through gigs table
            const { data: gigs } = await supabase
                .from('gigs')
                .select('id')
                .eq('teacher_id', teacherId)

            if (gigs && gigs.length > 0) {
                const gigIds = gigs.map(g => g.id)
                const { data: confirmedBooking } = await supabase
                    .from('bookings')
                    .select('id')
                    .eq('parent_id', userId)
                    .in('status', ['confirmed', 'completed'])
                    .in('gig_id', gigIds)
                    .limit(1)
                    .maybeSingle()

                setCanChat(!!confirmedBooking)
            } else {
                setCanChat(false)
            }
        }

        loadMessages()
        checkActiveBooking()

        // Subscribe to new messages in real-time
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.find(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                    // Mark as read if from other user
                    if (newMsg.sender_id !== userId) {
                        supabase
                            .from('messages')
                            .update({ is_read: true })
                            .eq('id', newMsg.id)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedConversation, supabase, userId])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSendMessage() {
        if (!newMessage.trim() || !selectedConversation || !userId) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        const { data: msg, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: selectedConversation.id,
                sender_id: userId,
                content: content
            })
            .select()
            .single()

        if (msg && !error) {
            setMessages([...messages, msg])
            // Update last_message_at
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', selectedConversation.id)

            // Notify teacher of new message
            try {
                await fetch('/api/notifications/new-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: selectedConversation.teacher_id,
                        senderName: 'Parent',
                        messagePreview: content,
                        conversationId: selectedConversation.id,
                        senderRole: 'parent'
                    })
                })
            } catch (e) {
                console.log('Notification failed:', e)
            }
        }

        setSending(false)
    }

    function formatMessageDate(dateStr: string) {
        const date = parseISO(dateStr)
        if (isToday(date)) return format(date, 'h:mm a')
        if (isYesterday(date)) return 'Yesterday'
        return format(date, 'MMM d')
    }

    const filteredConversations = conversations.filter(c =>
        c.teacher?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teacher?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[600px] w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Conversations Sidebar */}
            <div className="w-80 md:w-96 border-r border-border flex flex-col bg-muted/10">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            className="pl-9 bg-background"
                            placeholder="Search tutors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                    <div className="flex flex-col gap-2">
                        {filteredConversations.map((convo) => (
                            <button
                                key={convo.id}
                                onClick={() => setSelectedConversation(convo)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                    selectedConversation?.id === convo.id
                                        ? "bg-primary/10 border border-primary/20"
                                        : "hover:bg-muted/50 border border-transparent"
                                )}
                            >
                                <div className="relative shrink-0">
                                    {convo.teacher?.avatar_url ? (
                                        <div className="size-12 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${convo.teacher.avatar_url}')` }}></div>
                                    ) : (
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="size-5 text-primary" />
                                        </div>
                                    )}
                                    {convo.unread_count > 0 && (
                                        <span className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                            {convo.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-bold truncate">
                                            {convo.teacher?.full_name || 'Tutor'}
                                        </p>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {formatMessageDate(convo.last_message_at)}
                                        </p>
                                    </div>
                                    {convo.teacher?.subjects && convo.teacher.subjects.length > 0 && (
                                        <p className="text-xs text-primary font-medium capitalize">
                                            {convo.teacher.subjects[0]} Tutor
                                        </p>
                                    )}
                                    <p className="text-xs truncate mt-0.5 text-muted-foreground">
                                        {convo.last_message || 'No messages yet'}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {filteredConversations.length === 0 && (
                            <div className="py-8 text-center text-muted-foreground">
                                <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No conversations yet</p>
                                <p className="text-xs mt-1">Book a course to start messaging tutors</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col bg-background overflow-hidden">
                    {/* Chat Header */}
                    <header className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-card">
                        <div className="flex items-center gap-4">
                            {selectedConversation.teacher?.avatar_url ? (
                                <div className="size-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${selectedConversation.teacher.avatar_url}')` }}></div>
                            ) : (
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="size-5 text-primary" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-foreground text-sm font-bold leading-none">
                                    {selectedConversation.teacher?.full_name || 'Tutor'}
                                </h3>
                                {selectedConversation.teacher?.subjects && (
                                    <p className="text-primary text-xs font-medium mt-1 capitalize">
                                        {selectedConversation.teacher.subjects[0]} Tutor
                                    </p>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Messages */}
                    <ScrollArea className="flex-1 h-0 p-6">
                        <div className="flex flex-col gap-4">
                            {messages.map((msg) => {
                                const isOwn = msg.sender_id === userId
                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-3 max-w-[75%]",
                                            isOwn ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "")}>
                                            <span className="text-muted-foreground text-xs">
                                                {format(parseISO(msg.created_at), 'h:mm a')}
                                            </span>
                                            <div className={cn(
                                                "p-3 rounded-xl text-sm leading-relaxed",
                                                isOwn
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : "bg-muted text-foreground rounded-bl-none"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length === 0 && (
                            <div className="py-16 text-center text-muted-foreground">
                                <MessageSquare className="size-12 mx-auto mb-3 opacity-20" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        )}
                    </ScrollArea>

                    {/* Shared Content Banner */}
                    {hasSharedContent && newMessage && (
                        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <p className="text-sm text-primary font-medium flex-1">
                                Sharing roadmap — Select a tutor and send the message
                            </p>
                            <button
                                onClick={() => { setNewMessage(''); setHasSharedContent(false); }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Input - Only enabled if confirmed booking exists */}
                    <div className="p-4 border-t border-border bg-card">
                        {canChat ? (
                            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                                <div className="flex-1 bg-muted rounded-2xl flex items-center border border-transparent focus-within:border-primary/50 focus-within:bg-background transition-all">
                                    <textarea
                                        className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground px-4 py-3 min-h-[48px] max-h-32 resize-none text-sm focus:outline-none"
                                        placeholder={`Message ${selectedConversation.teacher?.full_name || 'tutor'}...`}
                                        rows={1}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    size="icon"
                                    className="rounded-xl shadow-md"
                                    onClick={handleSendMessage}
                                    disabled={sending || !newMessage.trim()}
                                >
                                    {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-3 px-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    💬 Chat unlocked after payment
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Complete payment for your booking to start messaging this tutor
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-muted/20">
                    <div className="text-center text-muted-foreground">
                        <MessageSquare className="size-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a conversation</p>
                        <p className="text-sm">Choose a tutor to start messaging</p>
                    </div>
                </div>
            )}
        </div>
    )
}
