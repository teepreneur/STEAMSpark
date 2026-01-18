"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search, Bell, User, UserPlus, Settings, LogOut, Menu, CheckCircle, CreditCard, Medal, MessageSquare, ClipboardCheck } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogoutButton } from "@/components/auth/logout-button"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

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

const navItems = [
    { label: "Dashboard", href: "/parent/dashboard" },
    { label: "Tutors", href: "/parent/tutors" },
    { label: "Roadmaps", href: "/parent/roadmaps" },
    { label: "Messages", href: "/parent/messages" },
]

export function ParentHeader() {
    const pathname = usePathname()

    return (
        <header className="bg-white dark:bg-[#1a2632] border-b border-border sticky top-0 z-50">
            <div className="px-4 md:px-10 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/parent/dashboard" className="flex items-center">
                        <Logo size={40} variant="full" />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        isActive ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="hidden md:flex items-center bg-secondary dark:bg-[#2a3b4d] rounded-full h-10 px-4 min-w-[240px]">
                        <Search className="text-muted-foreground size-5" />
                        <input
                            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 text-foreground placeholder:text-muted-foreground"
                            placeholder="Search tutors or subjects..."
                        />
                    </div>

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* Profile Dropdown */}
                    <ProfileDropdown />

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <MobileNav />
                    </div>
                </div>
            </div>
        </header>
    )
}

function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        async function loadNotifications() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch notifications
            const { data: notifData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (notifData) {
                setNotifications(notifData)
                setUnreadCount(notifData.filter((n: Notification) => !n.read).length)
            }
            setLoading(false)
        }

        loadNotifications()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('header-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

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
        setUnreadCount(0)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="size-10 flex items-center justify-center rounded-full hover:bg-secondary relative">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-[#1a2632] text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
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

                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
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
                    <Link href="/parent/notifications" className="w-full text-center text-xs text-primary font-medium py-2 justify-center">
                        View All Notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ProfileDropdown() {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single()
                if (data?.avatar_url) {
                    setAvatarUrl(data.avatar_url)
                }
            }
        }
        loadProfile()
    }, [])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="size-10 rounded-full bg-secondary flex items-center justify-center border-2 border-white shadow-sm cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="size-full object-cover" />
                    ) : (
                        <User className="size-5 text-muted-foreground" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                    <Link href="/parent/settings" className="flex items-center gap-2 cursor-pointer">
                        <UserPlus className="size-4" />
                        <span className="font-medium">Add Child</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/parent/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="size-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0">
                    <LogoutButton className="flex items-center gap-2 w-full px-2 py-1.5 text-red-600 hover:text-red-600" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function MobileNav() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="size-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="text-left font-bold text-xl mb-4">Menu</SheetTitle>
                <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-lg font-medium py-2 border-b border-border/50 hover:text-primary transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link href="/parent/settings" className="text-lg font-medium py-2 border-b border-border/50 hover:text-primary transition-colors flex items-center gap-2">
                        <UserPlus className="size-5" /> Add Child
                    </Link>
                </nav>
                <div className="mt-8 pt-4 border-t border-border">
                    <LogoutButton />
                </div>
            </SheetContent>
        </Sheet>
    )
}

