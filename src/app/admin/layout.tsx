"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    CreditCard, MessageSquare, LifeBuoy, Settings,
    LogOut, ChevronLeft, Menu, Shield, Bell, Headphones
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Navigation configuration - will be transformed at render time
const baseNavigation = [
    { name: "Dashboard", basePath: "/dashboard", icon: LayoutDashboard },
    { name: "Teachers", basePath: "/users/teachers", icon: GraduationCap },
    { name: "Parents", basePath: "/users/parents", icon: Users },
    { name: "Bookings", basePath: "/bookings", icon: BookOpen },
    { name: "Finance", basePath: "/finance", icon: CreditCard },
    { name: "Live Support", basePath: "/support/live", icon: Headphones },
    { name: "Support Tickets", basePath: "/support/tickets", icon: LifeBuoy },
    { name: "Messages", basePath: "/support/messages", icon: MessageSquare },
    { name: "Settings", basePath: "/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()

    // Prevent hydration mismatch items
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const [admin, setAdmin] = useState<{ full_name: string | null; email: string | null } | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Check if we're on admin subdomain (handled in effect to avoid hydration mismatch)
    const [isAdminSubdomain, setIsAdminSubdomain] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSub = window.location.hostname.includes('admin.') || window.location.hostname.startsWith('admin.')
            setIsAdminSubdomain(isSub)

        }
    }, [pathname])

    // Get the correct path for this environment
    const getHref = (basePath: string) => {
        if (isAdminSubdomain) {
            return basePath // /dashboard, /users/teachers, etc.
        }
        return `/admin${basePath}` // /admin/dashboard, /admin/users/teachers, etc.
    }

    // Skip layout for login and unauthorized pages
    // Must check BEFORE any hooks that could cause issues
    // On admin subdomain, root path / shows login (no sidebar)
    const isRootOnSubdomain = isAdminSubdomain && pathname === '/'
    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/unauthorized'
        || pathname === '/login' || pathname === '/unauthorized' || isRootOnSubdomain

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
                    const redirectPath = isAdminSubdomain ? '/unauthorized' : '/admin/unauthorized'
                    router.push(redirectPath)
                    return
                }
                setAdmin(profile)
            }
        }
        loadAdmin()
    }, [supabase, router, isAuthPage, pathname, isAdminSubdomain])

    async function handleLogout() {
        await supabase.auth.signOut()
        const loginPath = isAdminSubdomain ? '/login' : '/admin/login'
        router.push(loginPath)
    }

    // For auth pages, render without sidebar
    if (isAuthPage) {
        // If not mounted yet, render null to prevent mismatch
        if (!mounted) return null
        return <>{children}</>
    }

    if (!mounted) return null

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
                    {baseNavigation.map((item) => {
                        const href = getHref(item.basePath)
                        // Check if current path matches this nav item
                        const isActive = pathname === href ||
                            pathname.startsWith(href + '/') ||
                            pathname === item.basePath ||
                            pathname.startsWith(item.basePath + '/')
                        return (
                            <Link
                                key={item.name}
                                href={href}
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
