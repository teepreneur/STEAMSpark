"use client"

import { Button } from "@/components/ui/button"
import { Zap, GraduationCap, FolderOpen, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function QuickActions() {
    const [unreadMessages, setUnreadMessages] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        async function fetchMessageCount() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch unread message notifications only
            const { count: msgCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', 'new_message')
                .eq('read', false)

            setUnreadMessages(msgCount || 0)
        }

        fetchMessageCount()

        // Subscribe to realtime updates for messages only
        const channel = supabase
            .channel('teacher-messages')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => fetchMessageCount()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <Zap className="text-primary size-5" />
                <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-4 hover:border-primary/50 hover:shadow-md transition-all group" asChild>
                    <Link href="/teacher/students">
                        <div className="bg-primary/10 group-hover:bg-primary group-hover:text-white w-10 h-10 rounded-lg flex items-center justify-center text-primary transition-colors">
                            <GraduationCap size={24} />
                        </div>
                        <span className="font-semibold text-sm">View Students</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-4 hover:border-primary/50 hover:shadow-md transition-all group" asChild>
                    <Link href="/teacher/materials">
                        <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors">
                            <FolderOpen size={24} />
                        </div>
                        <span className="font-semibold text-sm">Manage Materials</span>
                    </Link>
                </Button>
                {/* Message Parents - with red notification badge */}
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-4 hover:border-primary/50 hover:shadow-md transition-all group relative" asChild>
                    <Link href="/teacher/messages">
                        <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative">
                            <MessageSquare size={24} />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {unreadMessages > 9 ? '9+' : unreadMessages}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">Message Parents</span>
                            {unreadMessages > 0 && (
                                <span className="text-xs text-red-500 font-medium">{unreadMessages} unread</span>
                            )}
                        </div>
                    </Link>
                </Button>
            </div>
        </section>
    )
}


