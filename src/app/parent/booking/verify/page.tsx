"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

function PaymentVerifyContent() {
    const searchParams = useSearchParams()

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function verifyPayment() {
            const reference = searchParams.get('reference')

            if (!reference) {
                setStatus('failed')
                setError('Missing payment reference')
                return
            }

            try {
                const response = await fetch(`/api/payments/verify?reference=${reference}`)
                const data = await response.json()

                if (data.status === 'success') {
                    setStatus('success')
                } else {
                    setStatus('failed')
                    setError(data.message || 'Payment verification failed')
                }
            } catch (err) {
                setStatus('failed')
                setError('Failed to verify payment')
            }
        }

        verifyPayment()
    }, [searchParams])

    return (
        <div className="max-w-md w-full text-center">
            {status === 'loading' && (
                <div className="space-y-4">
                    <Loader2 className="size-16 animate-spin text-primary mx-auto" />
                    <h1 className="text-2xl font-bold">Verifying Payment...</h1>
                    <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-6">
                    <div className="size-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                        <CheckCircle className="size-12 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
                        <p className="text-muted-foreground">
                            Your booking has been confirmed. You'll receive a confirmation email shortly.
                        </p>
                    </div>
                    <div className="pt-4 space-y-3">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/parent/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full">
                            <Link href="/parent/tutors">Book Another Session</Link>
                        </Button>
                    </div>
                </div>
            )}

            {status === 'failed' && (
                <div className="space-y-6">
                    <div className="size-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                        <XCircle className="size-12 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
                        <p className="text-muted-foreground">
                            {error || 'Something went wrong with your payment. Please try again.'}
                        </p>
                    </div>
                    <div className="pt-4 space-y-3">
                        <Button asChild size="lg" className="w-full">
                            <Link href="/parent/tutors">Try Again</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full">
                            <Link href="/parent/dashboard">Go to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PaymentVerifyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-center px-6 py-4 border-b border-border bg-card">
                <Link href="/" className="flex items-center gap-3">
                    <Logo size={32} />
                    <h2 className="text-xl font-bold tracking-tight">STEAM Spark</h2>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={
                    <div className="max-w-md w-full text-center space-y-4">
                        <Loader2 className="size-16 animate-spin text-primary mx-auto" />
                        <h1 className="text-2xl font-bold">Verifying Payment...</h1>
                        <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                    </div>
                }>
                    <PaymentVerifyContent />
                </Suspense>
            </main>
        </div>
    )
}
