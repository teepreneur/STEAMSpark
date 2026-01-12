"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, CheckCircle, Medal, Bell, CreditCard, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    created_at: string
    read: boolean
    link?: string
}

const iconMap: Record<string, any> = {
    booking: CheckCircle,
    booking_accepted: CheckCircle,
    session_completed: CheckCircle,
    payment: CreditCard,
    badge: Medal,
    new_message: MessageSquare,
    default: ClipboardCheck
}

const colorMap: Record<string, string> = {
    booking: "bg-green-50 text-green-600 dark:bg-green-900/20",
    booking_accepted: "bg-blue-50 text-primary dark:bg-blue-900/20",
    session_completed: "bg-green-50 text-green-600 dark:bg-green-900/20",
    payment: "bg-blue-50 text-primary dark:bg-blue-900/20",
    badge: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
    new_message: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    default: "bg-secondary text-muted-foreground"
}

export function NotificationsPanel() {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadNotifications() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Try to load from notifications table, fallback to recent bookings if table doesn't exist
            const { data: notifData, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (notifData) {
                setNotifications(notifData)
            } else if (error) {
                // Fallback: generate notifications from recent bookings
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('id, status, created_at, gigs(title)')
                    .eq('parent_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3)

                if (bookings) {
                    const generatedNotifs = bookings.map((b: any) => ({
                        id: b.id,
                        type: 'booking',
                        title: b.status === 'confirmed' ? 'Session Confirmed' : 'Booking Created',
                        message: `${b.gigs?.title || 'Session'} - ${b.status}`,
                        created_at: b.created_at,
                        read: false
                    }))
                    setNotifications(generatedNotifs)
                }
            }
            setLoading(false)
        }

        loadNotifications()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('parent-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    if (loading) {
        return (
            <div className="bg-card rounded-xl border shadow-sm p-5">
                <h3 className="text-lg font-bold mb-4">Notifications</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="size-8 rounded-full bg-muted" />
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded w-24 mb-2" />
                                <div className="h-3 bg-muted rounded w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="bg-card rounded-xl border shadow-sm p-5">
                <h3 className="text-lg font-bold mb-4">Notifications</h3>
                <div className="text-center py-6">
                    <Bell className="size-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll notify you about bookings and updates</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border shadow-sm p-5">
            <h3 className="text-lg font-bold mb-4">Notifications</h3>
            <div className="space-y-4">
                {notifications.map((notif) => {
                    const Icon = iconMap[notif.type] || iconMap.default
                    const color = colorMap[notif.type] || colorMap.default

                    return (
                        <div key={notif.id} className={`flex gap-3 ${notif.link ? 'cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}>
                            {notif.link ? (
                                <Link href={notif.link} className="flex gap-3 w-full">
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight mb-1">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </Link>
                            ) : (
                                <>
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight mb-1">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
            <Button variant="ghost" className="w-full mt-5 text-primary hover:text-primary/80 border-t rounded-none h-auto py-3 text-xs font-bold uppercase tracking-wide">
                View All Notifications
            </Button>
        </div>
    )
}
