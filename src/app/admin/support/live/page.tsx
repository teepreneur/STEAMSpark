"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, User, MessageSquare, Power, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"

interface Chat {
    id: string
    user_id: string
    status: string
    created_at: string
    updated_at: string
    user: {
        full_name: string | null
        avatar_url: string | null
        email: string
    }
    last_message?: string
}

interface Message {
    id: string
    content: string
    sender_id: string
    is_bot: boolean
    created_at: string
}

export default function AdminLiveSupportPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const scrollRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [chats, setChats] = useState<Chat[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const [isOnline, setIsOnline] = useState(false)
    const [adminId, setAdminId] = useState<string | null>(null)

    // Load Initial State
    useEffect(() => {
        async function loadDashboard() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setAdminId(user.id)

            // 1. Get Online Status
            const { data: settings } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'is_support_online')
                .single()

            if (settings?.value) {
                const online = settings.value === true || settings.value === 'true'
                setIsOnline(online)
            }

            // 2. Get Active Chats
            await fetchChats()

            setLoading(false)
        }
        loadDashboard()
    }, [])

    // Realtime Subscriptions
    useEffect(() => {
        // Chat List Updates
        const chatChannel = supabase
            .channel('admin-chats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_chats' },
                () => fetchChats()
            )
            .subscribe()

        // Message Updates for Selected Chat
        let messageChannel: any = null;
        if (selectedChatId) {
            messageChannel = supabase
                .channel(`admin-chat:${selectedChatId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${selectedChatId}` },
                    (payload) => {
                        setMessages(prev => [...prev, payload.new as Message])
                        // Assuming fetchChats will update last message preview eventually, or we could optimistic update
                    }
                )
                .subscribe()
        }

        return () => {
            supabase.removeChannel(chatChannel)
            if (messageChannel) supabase.removeChannel(messageChannel)
        }
    }, [selectedChatId])

    // Scroll chat to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Load messages when chat selected
    useEffect(() => {
        async function loadMessages() {
            if (!selectedChatId) return
            const { data } = await supabase
                .from('support_messages')
                .select('*')
                .eq('chat_id', selectedChatId)
                .order('created_at', { ascending: true })
            if (data) setMessages(data)
        }
        loadMessages()
    }, [selectedChatId])

    async function fetchChats() {
        // 1. Fetch Chats
        const { data: chatsData, error: chatsError } = await supabase
            .from('support_chats')
            .select('*')
            .order('updated_at', { ascending: false })

        if (chatsError) {
            console.error("Error fetching chats:", chatsError)
            return
        }

        if (chatsData && chatsData.length > 0) {
            // 2. Fetch Profiles for these users
            const userIds = Array.from(new Set(chatsData.map(c => c.user_id)))
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, email')
                .in('id', userIds)

            // 3. Map profiles to chats
            const formattedData = chatsData.map((chat) => {
                const userProfile = profilesData?.find(p => p.id === chat.user_id)
                return {
                    ...chat,
                    user: userProfile || {
                        email: 'Unknown User',
                        full_name: 'Unknown',
                        avatar_url: null
                    }
                }
            })
            setChats(formattedData)
        } else {
            setChats([])
        }
    }

    async function toggleStatus(enabled: boolean) {
        setIsOnline(enabled)
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'is_support_online',
                value: enabled,
                updated_at: new Date().toISOString()
            })

        if (error) {
            setIsOnline(!enabled) // Revert
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        } else {
            toast({ title: enabled ? "You are Online" : "You are Offline", description: enabled ? "Users can chat with you now." : "Users will be directed to tickets." })
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!input.trim() || !selectedChatId || !adminId) return

        setSending(true)
        const content = input.trim()
        setInput("")

        try {
            await supabase.from('support_messages').insert({
                chat_id: selectedChatId,
                sender_id: adminId,
                content
            })

            // Update chat timestamp
            await supabase
                .from('support_chats')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedChatId)

        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to send", variant: "destructive" })
        } finally {
            setSending(false)
        }
    }

    if (!mounted || loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="size-8 animate-spin text-primary" /></div>
    }

    const selectedChat = chats.find(c => c.id === selectedChatId)

    const [onlineUsers, setOnlineUsers] = useState<any[]>([])

    // Subscribe to Presence
    useEffect(() => {
        const channel = supabase.channel('support_presence')

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const users = Object.values(state).flat()
                setOnlineUsers(users)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Sidebar List (Chats) */}
            <div className="w-80 flex flex-col bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                {/* ... (Existing Sidebar Content) ... */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Live Chats</h2>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-medium", isOnline ? "text-green-600" : "text-muted-foreground")}>
                                {isOnline ? "Online" : "Offline"}
                            </span>
                            <Switch checked={isOnline} onCheckedChange={toggleStatus} />
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {chats.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No active chats
                            </div>
                        ) : (
                            chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3",
                                        selectedChatId === chat.id && "bg-slate-50 dark:bg-slate-800 border-l-4 border-primary pl-[13px]"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={chat.user.avatar_url || undefined} />
                                        <AvatarFallback>{chat.user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium truncate">{chat.user.full_name || chat.user.email}</span>
                                            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            Click to view
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                {!selectedChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="size-12 mb-4 opacity-20" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* ... (Existing Chat UI) ... */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedChat.user.avatar_url || undefined} />
                                    <AvatarFallback>{selectedChat.user.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{selectedChat.user.full_name}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedChat.user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                        >
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === adminId

                                if (msg.is_bot) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-4">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-xs py-1 px-3 rounded-full text-muted-foreground">
                                                Bot: {msg.content}
                                            </span>
                                        </div>
                                    )
                                }

                                return (
                                    <div key={msg.id} className={cn("flex gap-3 max-w-[80%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                                        <Avatar className="size-8 mt-1">
                                            <AvatarFallback className={cn("text-[10px]", isMe ? "bg-primary text-primary-foreground" : "")}>
                                                {isMe ? 'ME' : selectedChat.user.full_name?.[0]}
                                            </AvatarFallback>
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

                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    placeholder="Type your reply..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={sending}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!input.trim() || sending}>
                                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Online Users Panel (New) */}
            <div className="w-72 bg-white dark:bg-slate-900 rounded-xl border flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-sm">Online Visitors ({onlineUsers.length})</h3>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {onlineUsers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs">
                                No visitors currently online
                            </div>
                        ) : (
                            onlineUsers.map((user: any, idx) => (
                                <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-xs truncate max-w-[120px]">{user.user_email}</span>
                                        <span className="size-2 bg-green-500 rounded-full animate-pulse" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <span className="font-mono">{user.ip}</span>
                                        </p>
                                        <p className="text-[10px] text-primary truncate" title={user.currentPage}>
                                            {user.currentPage}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
