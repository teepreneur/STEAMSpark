"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Calendar,
    Users,
    DollarSign,
    Settings,
    Atom,
    Ticket,
    Bell,
    MessageSquare,
    CheckCircle,
    CreditCard,
    Medal,
    ClipboardCheck,
    UserPlus,
} from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface SidebarItem {
    icon: any
    label: string
    href: string
}

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
    new_enrollment: UserPlus,
    session_completed: CheckCircle,
    payment: CreditCard,
    badge: Medal,
    new_message: MessageSquare,
    default: ClipboardCheck
}

const colorMap: Record<string, string> = {
    booking: "bg-green-50 text-green-600 dark:bg-green-900/20",
    new_enrollment: "bg-blue-50 text-primary dark:bg-blue-900/20",
    session_completed: "bg-green-50 text-green-600 dark:bg-green-900/20",
    payment: "bg-blue-50 text-primary dark:bg-blue-900/20",
    badge: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
    new_message: "bg-red-50 text-red-600 dark:bg-red-900/20",
    default: "bg-secondary text-muted-foreground"
}

const sidebarItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Home", href: "/teacher/dashboard" },
    { icon: Calendar, label: "Calendar", href: "/teacher/calendar" },
    { icon: Users, label: "Students", href: "/teacher/students" },
    { icon: Ticket, label: "My Gigs", href: "/teacher/gigs" },
    { icon: DollarSign, label: "Earnings", href: "/teacher/earnings" },
    { icon: Settings, label: "Settings", href: "/teacher/settings" },
]

export function TeacherSidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        async function loadNotifications() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch recent notifications
            const { data: notifData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (notifData) {
                setNotifications(notifData)
            }

            // Get total unread count
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false)

            setUnreadCount(count || 0)
        }

        loadNotifications()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('teacher-sidebar-notifications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    async function markAllAsRead() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    return (
        <aside className={cn("w-64 bg-white dark:bg-[#1a2632] border-r border-border flex flex-col h-screen sticky top-0", className)}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex items-center justify-center rounded-xl size-10 shrink-0 text-primary">
                            <Atom size={24} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold leading-tight tracking-tight">STEAM Spark</h1>
                            <p className="text-muted-foreground text-xs font-normal">Teacher Portal</p>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="size-9 flex items-center justify-center rounded-full hover:bg-secondary relative">
                                <Bell className="size-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 min-w-[16px] h-[16px] bg-red-500 rounded-full border-2 border-white dark:border-[#1a2632] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80">
                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {notifications.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.map((notif) => {
                                        const Icon = iconMap[notif.type] || iconMap.default
                                        const color = colorMap[notif.type] || colorMap.default

                                        return (
                                            <DropdownMenuItem key={notif.id} asChild className="p-0">
                                                <Link
                                                    href={notif.link || notif.action_url || "#"}
                                                    className={cn(
                                                        "flex gap-3 p-3 cursor-pointer",
                                                        !notif.read && "bg-primary/5"
                                                    )}
                                                >
                                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium leading-tight truncate">{notif.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {!notif.read && (
                                                        <div className="size-2 bg-primary rounded-full shrink-0 mt-2" />
                                                    )}
                                                </Link>
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </div>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/teacher/notifications" className="w-full text-center text-xs text-primary font-medium py-2 justify-center">
                                    View All Notifications
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <nav className="flex flex-col gap-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary dark:hover:bg-[#2a3845]"
                                )}
                            >
                                <item.icon size={20} className={cn(isActive && "fill-current")} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="mt-auto p-6 border-t border-border">
                <LogoutButton className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-4 bg-secondary hover:bg-red-50 hover:text-red-600 text-foreground text-sm font-bold transition-colors" />
            </div>
        </aside>
    )
}
