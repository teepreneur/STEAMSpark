"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, X, MessageSquare, UserPlus, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    action_url: string | null
    created_at: string
    read: boolean
}

const notificationIcons: Record<string, any> = {
    new_message: MessageSquare,
    new_enrollment: UserPlus,
    session_completed: CheckCircle,
}

const notificationColors: Record<string, string> = {
    new_message: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    new_enrollment: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    session_completed: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
}

export function LiveNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showToast, setShowToast] = useState(false)
    const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function setup() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // Load existing unread notifications
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('read', false)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) setNotifications(data)

            // Subscribe to realtime notifications
            const channel = supabase
                .channel(`notifications:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification
                        setNotifications(prev => [newNotification, ...prev])
                        setLatestNotification(newNotification)
                        setShowToast(true)

                        // Play notification sound (optional)
                        try {
                            const audio = new Audio('/notification.mp3')
                            audio.volume = 0.5
                            audio.play().catch(() => { })
                        } catch { }

                        // Auto-hide toast after 5 seconds
                        setTimeout(() => setShowToast(false), 5000)
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setup()
    }, [supabase])

    async function markAsRead(id: string) {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    async function dismissToast() {
        setShowToast(false)
        if (latestNotification) {
            await markAsRead(latestNotification.id)
        }
    }

    const Icon = latestNotification ? (notificationIcons[latestNotification.type] || Bell) : Bell
    const colorClass = latestNotification ? (notificationColors[latestNotification.type] || "bg-primary/10 text-primary") : ""

    return (
        <>
            {/* Toast Popup - Shows when new notification arrives */}
            {showToast && latestNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-card border border-border rounded-xl shadow-lg p-4 max-w-sm flex items-start gap-3">
                        <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                            <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground">{latestNotification.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{latestNotification.message}</p>
                            {latestNotification.action_url && (
                                <Link
                                    href={latestNotification.action_url}
                                    className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                                    onClick={dismissToast}
                                >
                                    View Details →
                                </Link>
                            )}
                        </div>
                        <button
                            onClick={dismissToast}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Bell Icon (for header/navbar use) */}
            {notifications.length > 0 && (
                <div className="fixed bottom-4 right-4 z-40 md:hidden">
                    <Link
                        href="/teacher/notifications"
                        className="flex items-center justify-center size-12 bg-red-500 text-white rounded-full shadow-lg animate-pulse"
                    >
                        <Bell size={24} />
                        <span className="absolute -top-1 -right-1 size-5 bg-white text-red-500 text-xs font-bold rounded-full flex items-center justify-center border-2 border-red-500">
                            {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                    </Link>
                </div>
            )}
        </>
    )
}
