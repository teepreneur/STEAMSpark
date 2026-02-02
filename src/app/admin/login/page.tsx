"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
    const supabase = createClient()
    const router = useRouter()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Sign in with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (authError) {
            setError("Invalid email or password")
            setLoading(false)
            return
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user?.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            // Sign out if not admin
            await supabase.auth.signOut()
            setError("Access denied. Admin privileges required.")
            setLoading(false)
            return
        }

        // Redirect to admin dashboard
        router.push('/admin/dashboard')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
                        <ShieldCheck className="size-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-slate-400 mt-1">STEAM Spark Administration</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                Email
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@steamsparkgh.com"
                                required
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle className="size-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </div>
                </form>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Authorized personnel only
                </p>
            </div>
        </div>
    )
}
