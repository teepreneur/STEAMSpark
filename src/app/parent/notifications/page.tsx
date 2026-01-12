"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, CheckCircle, Medal, Bell, CreditCard, MessageSquare, ArrowLeft, Check } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    created_at: string
    read: boolean
    link?: string
    action_url?: string
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
    new_message: "bg-red-50 text-red-600 dark:bg-red-900/20",
    default: "bg-secondary text-muted-foreground"
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    useEffect(() => {
        const supabase = createClient()

        async function loadNotifications() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data: notifData, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (notifData) {
                setNotifications(notifData)
            }
            setLoading(false)
        }

        loadNotifications()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('notifications-page')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    async function markAsRead(id: string) {
        const supabase = createClient()
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    async function markAllAsRead() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications

    const unreadCount = notifications.filter(n => !n.read).length

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
        const date = format(new Date(notif.created_at), 'yyyy-MM-dd')
        const label = format(new Date(notif.created_at), 'EEEE, MMMM d, yyyy')
        if (!groups[date]) {
            groups[date] = { label, items: [] }
        }
        groups[date].items.push(notif)
        return groups
    }, {} as Record<string, { label: string, items: Notification[] }>)

    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/parent/dashboard"
                        className="size-10 rounded-full bg-card border flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="size-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="gap-2"
                        >
                            <Check className="size-4" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border hover:bg-secondary'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border hover:bg-secondary'
                            }`}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>

                {/* Notifications List */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="size-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-1">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {filter === 'unread'
                                    ? "You're all caught up!"
                                    : "We'll notify you about bookings, messages, and updates"
                                }
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([date, { label, items }]) => (
                            <div key={date}>
                                <div className="px-4 py-2 bg-secondary/50 border-b">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {label}
                                    </p>
                                </div>
                                {items.map((notif) => {
                                    const Icon = iconMap[notif.type] || iconMap.default
                                    const color = colorMap[notif.type] || colorMap.default

                                    return (
                                        <div
                                            key={notif.id}
                                            className={`flex gap-4 p-4 border-b last:border-b-0 transition-colors ${!notif.read ? 'bg-primary/5' : 'hover:bg-secondary/50'
                                                }`}
                                        >
                                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {(notif.link || notif.action_url) ? (
                                                    <Link href={notif.link || notif.action_url || '#'} className="hover:underline">
                                                        <p className="font-medium">{notif.title}</p>
                                                    </Link>
                                                ) : (
                                                    <p className="font-medium">{notif.title}</p>
                                                )}
                                                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="size-8 rounded-full hover:bg-secondary flex items-center justify-center shrink-0"
                                                    title="Mark as read"
                                                >
                                                    <Check className="size-4 text-muted-foreground" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
