"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MessageSquare, User, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, parseISO } from "date-fns"

interface Message {
    id: string
    sender_id: string
    recipient_id: string
    content: string
    created_at: string
    sender?: any
}

export default function MessagesPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])

    useEffect(() => {
        async function loadMessages() {
            setLoading(true)

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id, sender_id, recipient_id, content, created_at,
                    sender:profiles!messages_sender_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!error) {
                setMessages(data || [])
            }
            setLoading(false)
        }
        loadMessages()
    }, [supabase])

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
                <h1 className="text-2xl font-bold">Platform Messages</h1>
                <p className="text-muted-foreground">
                    View all messages between users
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border">
                {messages.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <MessageSquare className="size-12 mx-auto mb-4 opacity-50" />
                        <p>No messages found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {messages.map((message) => (
                            <div key={message.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <User className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm">
                                                {(message.sender as any)?.full_name || 'Unknown User'}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {format(parseISO(message.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
