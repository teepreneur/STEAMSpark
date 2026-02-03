"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, Bot, X, MessageSquare, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"

interface Message {
    id: string
    content: string
    sender_id: string
    is_bot: boolean
    created_at: string
}

export function SupportWidget() {
    const supabase = createClient()
    const { toast } = useToast()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const [chatId, setChatId] = useState<string | null>(null)
    const [isSupportOnline, setIsSupportOnline] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [hasUnread, setHasUnread] = useState(false)

    // Scroll to bottom on new message
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    // Initialize chat on mount
    useEffect(() => {
        let channel: any = null

        async function initChat() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                setUserId(user.id)

                // Get user profile for name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                if (profile?.full_name) {
                    setUserName(profile.full_name)
                }

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
                    const { data: newChat, error: chatError } = await supabase
                        .from('support_chats')
                        .insert({ user_id: user.id, status: 'active' })
                        .select('id')
                        .single()

                    if (chatError) {
                        console.error("Error creating chat:", chatError)
                    }
                    if (newChat) currentChatId = newChat.id
                }

                setChatId(currentChatId || null)

                // 3. Load Messages
                if (currentChatId) {
                    const { data: msgs } = await supabase
                        .from('support_messages')
                        .select('*')
                        .eq('chat_id', currentChatId)
                        .order('created_at', { ascending: true })

                    if (msgs) setMessages(msgs)

                    // 4. Subscribe to Realtime
                    channel = supabase
                        .channel(`widget-chat:${currentChatId}`)
                        .on(
                            'postgres_changes',
                            { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${currentChatId}` },
                            (payload) => {
                                const newMsg = payload.new as Message
                                setMessages(prev => [...prev, newMsg])
                                if (!isOpen && !newMsg.is_bot && newMsg.sender_id !== user.id) {
                                    setHasUnread(true)
                                }
                            }
                        )
                        .subscribe()
                }
            } catch (error) {
                console.error("Chat init error:", error)
            } finally {
                setLoading(false)
            }
        }

        initChat()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, []) // Run once on mount

    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

    // Presence State
    const [presenceState, setPresenceState] = useState<{
        ip: string
        userAgent: string
        currentPage: string
    }>({ ip: '', userAgent: '', currentPage: '' })

    // Presence Logic
    useEffect(() => {
        let channel: any = null

        async function setupPresence() {
            try {
                // 1. Get IP
                const res = await fetch('/api/get-ip')
                const { ip } = await res.json()

                // 2. Get User
                const { data: { user } } = await supabase.auth.getUser()

                // 3. Prepare State
                const initialState = {
                    ip: ip || 'unknown',
                    userAgent: navigator.userAgent,
                    currentPage: window.location.pathname,
                    user_id: user?.id || 'anon',
                    user_email: user?.email || 'Anonymous',
                    online_at: new Date().toISOString()
                }
                setPresenceState(initialState)

                // 4. Join Channel
                channel = supabase.channel('support_presence', {
                    config: {
                        presence: {
                            key: user?.id || ip || 'anon'
                        }
                    }
                })

                channel.on('presence', { event: 'sync' }, () => { })
                    .subscribe(async (status: string) => {
                        if (status === 'SUBSCRIBED') {
                            await channel.track(initialState)
                        }
                    })

            } catch (err) {
                console.error("Presence setup error:", err)
            }
        }

        setupPresence()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    // Update Presence on Path Change
    useEffect(() => {
        if (!presenceState.ip) return

        const updateChannel = async () => {
            const channel = supabase.channel('support_presence')
            try {
                await channel.track({
                    ...presenceState,
                    currentPage: window.location.pathname,
                    updated_at: new Date().toISOString()
                })
            } catch (e) {
                // Channel might not be ready
            }
        }
        updateChannel()
    }, [pathname, presenceState.ip])

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!input.trim() || !chatId || !userId) return

        setSending(true)
        const content = input.trim()
        setInput("")

        try {
            if (isSupportOnline) {
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: userId,
                    content
                })
            } else {
                // Offline Logic
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: userId,
                    content
                })

                await supabase.from('support_tickets').insert({
                    created_by: userId,
                    subject: "Support Request via Widget",
                    description: content,
                    status: 'open',
                    priority: 'medium'
                })

                const botMsg = "We're offline right now. A ticket has been created and we'll reply via email!"
                await supabase.from('support_messages').insert({
                    chat_id: chatId,
                    sender_id: null,
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

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Bot className="size-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Support Chat</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("size-2 rounded-full", isSupportOnline ? "bg-green-400" : "bg-white/50")} />
                                    <span className="text-[10px] text-primary-foreground/80">{isSupportOnline ? "We're Online" : "We're Offline"}</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 size-8" onClick={() => setIsOpen(false)}>
                            <X className="size-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 h-[400px] flex flex-col">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50"
                        >
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 px-4">
                                    <div className="bg-primary/10 size-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bot className="size-6 text-primary" />
                                    </div>
                                    <p className="font-medium text-sm text-foreground">
                                        Hi{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                                    </p>
                                    <p className="text-xs mt-1">
                                        {isSupportOnline
                                            ? "How can we help you today? Type your message below."
                                            : "We're offline, but leave a message and we'll get back to you!"
                                        }
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === userId
                                    const isBot = msg.is_bot

                                    if (isBot) {
                                        return (
                                            <div key={msg.id} className="flex gap-2 max-w-[85%]">
                                                <Avatar className="size-6 mt-1">
                                                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]"><Bot className="size-3" /></AvatarFallback>
                                                </Avatar>
                                                <div className="bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-none p-2.5 text-xs shadow-sm">
                                                    {msg.content}
                                                    <div className="text-[9px] text-muted-foreground mt-1 opacity-70">
                                                        {format(new Date(msg.created_at), 'p')}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                                            <div className={cn(
                                                "rounded-2xl p-2.5 text-xs shadow-sm",
                                                isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white dark:bg-slate-800 border rounded-tl-none"
                                            )}>
                                                {msg.content}
                                                <div className={cn(
                                                    "text-[9px] mt-1 opacity-70",
                                                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )} suppressHydrationWarning>
                                                    {format(new Date(msg.created_at), 'p')}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-3 bg-white dark:bg-slate-900 border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                            <Input
                                placeholder={isSupportOnline ? "Type a message..." : "Leave a message..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={sending}
                                className="flex-1 h-9 text-sm"
                            />
                            <Button type="submit" size="icon" className="size-9 shrink-0" disabled={!input.trim() || sending}>
                                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </form>
                    </CardFooter>
                    {!isSupportOnline && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-[10px] text-amber-600 dark:text-amber-500 flex items-center justify-center gap-1.5 border-t border-amber-100 dark:border-amber-900/50">
                            <AlertCircle className="size-3" />
                            <span>Ticket will be created automatically.</span>
                        </div>
                    )}
                </Card>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    size="lg"
                    className="h-14 rounded-full shadow-lg gap-2 pl-4 pr-6 animate-in zoom-in duration-300"
                >
                    <div className="relative">
                        <Avatar className="size-8 border-2 border-primary-foreground/20">
                            <AvatarFallback className="bg-primary-foreground text-primary"><Bot className="size-5" /></AvatarFallback>
                        </Avatar>
                        {isSupportOnline && <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-primary rounded-full" />}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm leading-none">Need Help?</span>
                        <span className="text-[10px] opacity-80 leading-none mt-1">Chat locally</span>
                    </div>
                </Button>
            )}
        </div>
    )
}
