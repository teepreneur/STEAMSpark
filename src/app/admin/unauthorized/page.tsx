"use client"

import { Button } from "@/components/ui/button"
import { ShieldX, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center max-w-md px-4">
                <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center mb-6">
                    <ShieldX className="size-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground mb-6">
                    You don't have permission to access the admin portal.
                    This area is restricted to authorized administrators only.
                </p>
                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link href="https://app.steamsparkgh.com">
                            <ArrowLeft className="size-4 mr-2" />
                            Return to App
                        </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        If you believe this is an error, please contact support.
                    </p>
                </div>
            </div>
        </div>
    )
}
