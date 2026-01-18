"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/ui/logo"

function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // No session means invalid or expired link
                setError("This password reset link is invalid or has expired. Please request a new one.")
            }
        }
        checkSession()
    }, [supabase])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (updateError) {
            setError(updateError.message)
        } else {
            setSuccess(true)
            // Sign out after password reset
            await supabase.auth.signOut()
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="size-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Password Reset Successful</h2>
                <p className="text-muted-foreground mb-6">
                    Your password has been updated. You can now log in with your new password.
                </p>
                <Button asChild>
                    <Link href="/login">Go to Login</Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <h2 className="text-2xl font-bold mb-2">Create new password</h2>
            <p className="text-muted-foreground mb-6">
                Enter your new password below.
            </p>

            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-12 pr-12 h-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-12 h-12"
                        />
                    </div>
                </div>
                <Button className="w-full h-12 font-bold" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>
        </>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card shrink-0">
                <Link href="/" className="flex items-center">
                    <Logo size={28} variant="full" />
                </Link>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Suspense fallback={<Loader2 className="size-8 animate-spin mx-auto" />}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
