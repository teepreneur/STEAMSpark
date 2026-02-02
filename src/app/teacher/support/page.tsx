"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, Bot, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Message {
    id: string
    content: string
    sender_id: string
    is_bot: boolean
    created_at: string
}

export default function TeacherSupportChatPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const [chatId, setChatId] = useState<string | null>(null)
    const [isSupportOnline, setIsSupportOnline] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        async function initChat() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            // 1. Check Admin Status
            const { data: settings } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'is_support_online')
                .single()

            if (settings?.value) {
                const isOnline = settings.value === true || settings.value === 'true'
                setIsSupportOnline(isOnline)
            }

            // 2. Find or Create Active Chat
            const { data: existingChat } = await supabase
                .from('support_chats')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()

            let currentChatId = existingChat?.id

            if (!currentChatId) {
                const { data: newChat, error } = await supabase
                    .from('support_chats')
                    .insert({ user_id: user.id, status: 'active' })
                    .select('id')
                    .single()

                if (newChat) currentChatId = newChat.id
            }

            setChatId(currentChatId)

            // 3. Load Messages
            if (currentChatId) {
                const { data: msgs } = await supabase
                    .from('support_messages')
                    .select('*')
                    .eq('chat_id', currentChatId)
                    .order('created_at', { ascending: true })

                if (msgs) setMessages(msgs)

                // 4. Subscribe to Realtime
                const channel = supabase
                    .channel(`chat:${currentChatId}`)
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${currentChatId}` },
                        (payload) => {
                            setMessages(prev => [...prev, payload.new as Message])
                        }
                    )
                    .subscribe()

                return () => { supabase.removeChannel(channel) }
            }
            setLoading(false)
        }
        initChat()
    }, [])

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!input.trim() || !chatId || !userId) return

        setSending(true)
        const content = input.trim()
        setInput("")

        try {
            // Optimistic update
            const tempId = Math.random().toString()
            const optimisticMsg: Message = {
                id: tempId,
                content,
                sender_id: userId,
                is_bot: false,
                created_at: new Date().toISOString()
            }
            // setMessages(prev => [...prev, optimisticMsg]) // Removed optimistic update to rely on realtime

            if (isSupportOnline) {
                // Online Flow: Send to chat
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: userId,
                    content
                })
            } else {
                // Offline Flow: Create Ticket + Bot Reply

                // 1. Create User Message in Chat
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: userId,
                    content
                })

                // 2. Create Ticket
                await supabase.from('support_tickets').insert({
                    created_by: userId,
                    subject: "Support Request via Chat",
                    description: content,
                    status: 'open',
                    priority: 'medium'
                })

                // 3. Bot Reply
                const botMsg = "Thanks for your message. Our team is currently offline. We have created a support ticket for you and will respond via email shortly."
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: null, // System message
                    is_bot: true,
                    content: botMsg
                })
            }

        } catch (error) {
            console.error("Error sending message:", error)
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-xl border shadow-sm max-w-4xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                        <AvatarImage src="/logo.png" />
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-semibold text-lg">Teacher Support Chat</h1>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={cn("size-2 rounded-full", isSupportOnline ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                            <span className="text-muted-foreground">{isSupportOnline ? "Agents Online" : "Agents Offline"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <Bot className="size-12 mx-auto mb-3 opacity-20" />
                        <p>How can we help you today?</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === userId
                    const isBot = msg.is_bot

                    if (isBot) {
                        return (
                            <div key={msg.id} className="flex gap-3 max-w-[80%]">
                                <Avatar className="size-8 mt-1">
                                    <AvatarFallback className="bg-primary/10 text-primary"><Bot className="size-4" /></AvatarFallback>
                                </Avatar>
                                <div className="bg-secondary rounded-2xl rounded-tl-none p-3 text-sm">
                                    {msg.content}
                                    <div className="text-[10px] text-muted-foreground mt-1 opacity-70">
                                        {format(new Date(msg.created_at), 'p')}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                            <Avatar className="size-8 mt-1 invisible">
                                <AvatarFallback />
                            </Avatar>
                            <div className={cn(
                                "rounded-2xl p-3 text-sm",
                                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary rounded-tl-none"
                            )}>
                                {msg.content}
                                <div className={cn(
                                    "text-[10px] mt-1 opacity-70",
                                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                    {format(new Date(msg.created_at), 'p')}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-slate-900">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        placeholder={isSupportOnline ? "Type a message..." : "Leave a message (creates ticket)..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={sending}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || sending}>
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                </form>
                {!isSupportOnline && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-500">
                        <AlertCircle className="size-3" />
                        <span>Support is offline. Messages will create a ticket automatically.</span>
                    </div>
                )}
            </div>
        </div>
    )
}
