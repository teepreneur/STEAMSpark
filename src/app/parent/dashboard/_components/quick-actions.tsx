"use client"

import { Button } from "@/components/ui/button"
import { Search, Map, CalendarPlus, UserPlus, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const actions = [
    { label: "Find Tutors", sub: "Browse experts", icon: Search, color: "bg-blue-50 text-primary dark:bg-blue-900/20", href: "/parent/tutors" },
    { label: "Add Child", sub: "Manage family", icon: UserPlus, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20", href: "/parent/settings" },
    { label: "Book Session", sub: "Schedule now", icon: CalendarPlus, color: "bg-green-50 text-green-600 dark:bg-green-900/20", href: "/parent/tutors" },
    { label: "Roadmaps", sub: "View progress", icon: Map, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20", href: "/parent/roadmaps" },
]

export function ParentQuickActions() {
    const [unreadMessages, setUnreadMessages] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        async function fetchUnread() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', 'new_message')
                .eq('read', false)

            setUnreadMessages(count || 0)
        }

        fetchUnread()

        // Subscribe to realtime
        const channel = supabase
            .channel('parent-message-count')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnread())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {actions.map((action) => (
                <Button key={action.label} variant="outline" className="h-auto p-4 flex items-center justify-start gap-4 hover:border-primary/50 hover:shadow-md transition-all group" asChild>
                    <Link href={action.href}>
                        <div className={`size-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${action.color}`}>
                            <action.icon size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold leading-tight">{action.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-normal">{action.sub}</p>
                        </div>
                    </Link>
                </Button>
            ))}
            {/* Messages Card with notification */}
            <Button variant="outline" className="h-auto p-4 flex items-center justify-start gap-4 hover:border-primary/50 hover:shadow-md transition-all group relative" asChild>
                <Link href="/parent/messages">
                    <div className="size-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform bg-orange-50 text-orange-600 dark:bg-orange-900/20 relative">
                        <MessageSquare size={24} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                        )}
                    </div>
                    <div className="text-left">
                        <p className="font-bold leading-tight">Messages</p>
                        <p className="text-xs text-muted-foreground mt-1 font-normal">
                            {unreadMessages > 0 ? `${unreadMessages} unread` : 'Chat with tutors'}
                        </p>
                    </div>
                </Link>
            </Button>
        </div>
    )
}

