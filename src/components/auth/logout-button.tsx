"use client"

import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LogoutButton({ className }: { className?: string }) {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            className={className || "flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left font-medium text-muted-foreground"}
        >
            <LogOut className="size-5" />
            <span>Sign Out</span>
        </button>
    )
}
