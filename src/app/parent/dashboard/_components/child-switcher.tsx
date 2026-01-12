"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { User, UserPlus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/types/supabase"
import Link from "next/link"

interface ChildSwitcherProps {
    onChildChange?: (childId: string | null) => void
}

export function ChildSwitcher({ onChildChange }: ChildSwitcherProps) {
    const supabase = createClient()
    const [children, setChildren] = useState<Tables<'students'>[]>([])
    const [activeChild, setActiveChild] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [parentName, setParentName] = useState("there")

    useEffect(() => {
        async function loadChildren() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Get parent name from profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                if (profile?.full_name) {
                    setParentName(profile.full_name.split(' ')[0])
                }

                // Get children
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('parent_id', user.id)
                    .order('created_at', { ascending: true })

                if (studentsData && studentsData.length > 0) {
                    setChildren(studentsData)
                    setActiveChild(studentsData[0].id)
                    onChildChange?.(studentsData[0].id)
                }
            }
            setLoading(false)
        }
        loadChildren()
    }, [supabase, onChildChange])

    const handleChildSelect = (childId: string) => {
        setActiveChild(childId)
        onChildChange?.(childId)
    }

    if (loading) {
        return (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="flex flex-col gap-2">
                    <div className="h-10 w-64 bg-muted animate-pulse rounded-lg"></div>
                    <div className="h-5 w-96 bg-muted animate-pulse rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Welcome back, {parentName}!</h1>
                <p className="text-muted-foreground text-base">
                    {children.length > 0
                        ? "Here's what's happening with your children's learning today."
                        : "Add your first child to start tracking their learning journey."
                    }
                </p>
            </div>

            {/* Tabs/Child Switcher */}
            <div className="flex gap-6 self-start md:self-end">
                {children.length > 0 ? (
                    children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => handleChildSelect(child.id)}
                            className={cn(
                                "group flex flex-col items-center gap-2 pb-2 border-b-[3px] transition-all",
                                activeChild === child.id ? "border-primary" : "border-transparent hover:border-border"
                            )}
                        >
                            <div className={cn(
                                "size-10 rounded-full flex items-center justify-center transition-colors font-bold text-sm",
                                activeChild === child.id
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                            )}>
                                {child.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={cn(
                                "text-sm font-bold transition-colors",
                                activeChild === child.id ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {child.name}
                            </span>
                        </button>
                    ))
                ) : (
                    <Link
                        href="/parent/settings"
                        className="group flex flex-col items-center gap-2 pb-2 border-b-[3px] border-transparent hover:border-primary transition-all"
                    >
                        <div className="size-10 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <UserPlus size={20} />
                        </div>
                        <span className="text-sm font-bold text-primary">Add Child</span>
                    </Link>
                )}

                {/* Add another child button when children exist */}
                {children.length > 0 && (
                    <Link
                        href="/parent/settings"
                        className="group flex flex-col items-center gap-2 pb-2 border-b-[3px] border-transparent hover:border-border transition-all"
                    >
                        <div className="size-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <UserPlus size={20} />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add</span>
                    </Link>
                )}
            </div>
        </div>
    )
}
