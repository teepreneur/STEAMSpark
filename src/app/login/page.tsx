"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, Loader2, Rocket, Brain, Palette, ArrowLeft, CheckCircle } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState("")
    const [resetLoading, setResetLoading] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [resetError, setResetError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'teacher') {
                router.push('/teacher/dashboard')
            } else if (profile?.role === 'parent') {
                router.push('/parent/dashboard')
            } else {
                router.push('/')
            }
        }

        router.refresh()
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setResetLoading(true)
        setResetError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
            setResetError(error.message)
        } else {
            setResetSent(true)
        }
        setResetLoading(false)
    }

    // Forgot Password Modal
    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card shrink-0">
                    <Link href="/" className="flex items-center gap-3">
                        <Logo size={32} />
                        <h2 className="text-xl font-bold tracking-tight">STEAM Spark</h2>
                    </Link>
                </header>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        {resetSent ? (
                            <div className="text-center">
                                <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="size-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                                <p className="text-muted-foreground mb-6">
                                    We've sent a password reset link to <strong>{resetEmail}</strong>
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowForgotPassword(false)
                                        setResetSent(false)
                                        setResetEmail("")
                                    }}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to login
                                </Button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to login
                                </button>

                                <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
                                <p className="text-muted-foreground mb-6">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>

                                {resetError && (
                                    <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                        {resetError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className="pl-12 h-12"
                                            />
                                        </div>
                                    </div>
                                    <Button className="w-full h-12 font-bold" type="submit" disabled={resetLoading}>
                                        {resetLoading ? (
                                            <>
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            "Send reset link"
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }


    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card shrink-0">
                <Link href="/" className="flex items-center gap-3">
                    <Logo size={32} />
                    <h2 className="text-xl font-bold tracking-tight">STEAM Spark</h2>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-sm text-muted-foreground">Don't have an account?</span>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/">Sign Up</Link>
                    </Button>
                </div>
            </header>

            {/* Main Content - Split Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Visual (Hidden on mobile) */}
                <div className="hidden lg:flex w-1/2 relative bg-[#111418] flex-col justify-end p-16">
                    <div className="absolute inset-0 z-0">
                        <div
                            className="w-full h-full bg-cover bg-center opacity-60 mix-blend-overlay"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1200&auto=format&fit=crop')" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101922] via-[#101922]/80 to-transparent" />
                    </div>

                    <div className="relative z-10 max-w-lg">
                        {/* Floating Icons */}
                        <div className="flex gap-2 mb-6">
                            <span className="inline-flex items-center justify-center size-12 rounded-full bg-primary/20 text-primary backdrop-blur-sm border border-primary/30">
                                <Rocket className="size-5" />
                            </span>
                            <span className="inline-flex items-center justify-center size-12 rounded-full bg-purple-500/20 text-purple-400 backdrop-blur-sm border border-purple-500/30">
                                <Brain className="size-5" />
                            </span>
                            <span className="inline-flex items-center justify-center size-12 rounded-full bg-orange-500/20 text-orange-400 backdrop-blur-sm border border-orange-500/30">
                                <Palette className="size-5" />
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Welcome back to<br />STEAM Spark
                        </h1>
                        <p className="text-lg text-gray-300 font-light leading-relaxed">
                            Continue inspiring curiosity and fueling the future of young learners.
                        </p>

                        {/* Stats */}
                        <div className="mt-10 flex gap-8">
                            <div>
                                <p className="text-3xl font-black text-white">10K+</p>
                                <p className="text-sm text-gray-400">Active Families</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">500+</p>
                                <p className="text-sm text-gray-400">Expert Tutors</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">50K+</p>
                                <p className="text-sm text-gray-400">Sessions Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form */}
                <div className="w-full lg:w-1/2 bg-card flex items-center justify-center p-6 lg:p-16">
                    <div className="w-full max-w-md">
                        {/* Mobile Hero */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <Logo size={64} />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                            <p className="text-muted-foreground">Sign in to continue to STEAM Spark</p>
                        </div>

                        {/* Desktop Heading */}
                        <div className="hidden lg:block mb-8">
                            <h2 className="text-3xl font-bold mb-2">Sign in</h2>
                            <p className="text-muted-foreground">Enter your credentials to access your account</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 pr-12 h-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button className="w-full h-12 font-bold text-base mt-2" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link href="/" className="font-medium text-primary hover:underline">
                                    Create one now
                                </Link>
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login (Placeholder) */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-11" disabled>
                                <svg className="size-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>
                            <Button variant="outline" className="h-11" disabled>
                                <svg className="size-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                </svg>
                                GitHub
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

