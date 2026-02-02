"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    CreditCard, MessageSquare, LifeBuoy, Settings,
    LogOut, ChevronLeft, Menu, Shield, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminPaths } from "@/lib/admin-paths"

const baseNavigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Teachers", href: "/admin/users/teachers", icon: GraduationCap },
    { name: "Parents", href: "/admin/users/parents", icon: Users },
    { name: "Bookings", href: "/admin/bookings", icon: BookOpen },
    { name: "Finance", href: "/admin/finance", icon: CreditCard },
    { name: "Support Tickets", href: "/admin/support/tickets", icon: LifeBuoy },
    { name: "Messages", href: "/admin/support/messages", icon: MessageSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [admin, setAdmin] = useState<{ full_name: string | null; email: string | null } | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { getPath, isAdminSubdomain } = useAdminPaths()

    // Transform navigation paths based on environment
    const navigation = useMemo(() =>
        baseNavigation.map(item => ({ ...item, href: getPath(item.href) })),
        [getPath, isAdminSubdomain]
    )


    // Skip layout for login and unauthorized pages
    // Check both /admin/login (localhost) and /login (admin subdomain)
    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/unauthorized'
        || pathname === '/login' || pathname === '/unauthorized'

    useEffect(() => {
        // Don't check auth for login/unauthorized pages
        if (isAuthPage) return

        async function loadAdmin() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role !== 'admin') {
                    router.push('/admin/unauthorized')
                    return
                }
                setAdmin(profile)
            }
        }
        loadAdmin()
    }, [supabase, router, isAuthPage, pathname])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    // For auth pages, render without sidebar
    if (isAuthPage) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="bg-white dark:bg-slate-900"
                >
                    <Menu className="size-5" />
                </Button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-white transition-all duration-300",
                sidebarOpen ? "w-64" : "w-20",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <Shield className="size-5 text-white" />
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 className="font-bold text-lg">STEAM Spark</h1>
                            <p className="text-xs text-slate-400">Admin Portal</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const itemPath = item.href
                        const isActive = pathname === itemPath || pathname.startsWith(itemPath + '/') ||
                            pathname === item.href.replace('/admin', '') || pathname.startsWith(item.href.replace('/admin', '') + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                    isActive
                                        ? "bg-primary text-white"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <item.icon className="size-5 shrink-0" />
                                {sidebarOpen && <span className="font-medium">{item.name}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Admin info & logout */}
                <div className="p-4 border-t border-slate-800">
                    {admin && sidebarOpen && (
                        <div className="mb-3">
                            <p className="font-medium text-sm truncate">{admin.full_name || 'Admin'}</p>
                            <p className="text-xs text-slate-400 truncate">{admin.email}</p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        className="w-full text-slate-300 hover:text-white hover:bg-slate-800 justify-start gap-3"
                        onClick={handleLogout}
                    >
                        <LogOut className="size-5" />
                        {sidebarOpen && "Sign Out"}
                    </Button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex absolute -right-3 top-20 size-6 rounded-full bg-slate-700 text-white items-center justify-center hover:bg-slate-600"
                >
                    <ChevronLeft className={cn("size-4 transition-transform", !sidebarOpen && "rotate-180")} />
                </button>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <main className={cn(
                "transition-all duration-300 min-h-screen",
                sidebarOpen ? "lg:pl-64" : "lg:pl-20"
            )}>
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="lg:hidden" /> {/* Spacer for mobile menu button */}
                        <div className="flex items-center gap-4 ml-auto">
                            <Button variant="ghost" size="icon">
                                <Bell className="size-5" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
