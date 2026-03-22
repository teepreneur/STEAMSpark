"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UnreadMessagesBadgeProps {
    userRole: "parent" | "teacher"
    className?: string
}

export function UnreadMessagesBadge({ userRole, className = "" }: UnreadMessagesBadgeProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true

        async function fetchUnreadCount() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Both parent and teacher view conversations where they are a participant.
            // A message is unread if its is_read is false and the sender is NOT the current user.
            
            // To be robust, we join on conversations to ensure we only count messages
            // in conversations that belong to this user.
            const query = supabase
                .from('messages')
                .select(`
                    id,
                    conversation:conversations!inner(
                        parent_id,
                        teacher_id
                    )
                `, { count: 'exact', head: true })
                .eq('is_read', false)
                .neq('sender_id', user.id)

            if (userRole === 'parent') {
                query.eq('conversations.parent_id', user.id)
            } else {
                query.eq('conversations.teacher_id', user.id)
            }

            const { count, error } = await query

            if (!error && isMounted) {
                setUnreadCount(count || 0)
            } else if (error) {
                console.error("Error fetching unread messages count:", error)
            }
        }

        fetchUnreadCount()

        // Subscribe to real-time changes on the messages table
        const channel = supabase
            .channel('unread-messages-badge')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    fetchUnreadCount()
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => {
                    fetchUnreadCount()
                }
            )
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [userRole])

    if (unreadCount === 0) return null

    return (
        <span className={`bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${className}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
        </span>
    )
}
