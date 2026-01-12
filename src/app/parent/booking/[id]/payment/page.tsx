"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Atom, ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle, Loader2, Shield, AlertCircle, Tag, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Gig {
    id: string
    title: string
    price: number
    duration: number
    subject: string
    total_sessions: number
    teacher_id: string
    profiles?: {
        full_name: string
    }
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: bookingId } = use(params)
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [booking, setBooking] = useState<any>(null)
    const [gig, setGig] = useState<Gig | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'bank'>('mobile_money')
    const [paymentOption, setPaymentOption] = useState<'full' | 'deposit'>('full')

    useEffect(() => {
        async function loadBookingDetails() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Fetch booking with gig details
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    gigs (
                        id,
                        title,
                        price,
                        duration,
                        subject,
                        total_sessions,
                        teacher_id,
                        profiles:teacher_id (full_name)
                    ),
                    students (name)
                `)
                .eq('id', bookingId)
                .single()

            if (bookingError || !bookingData) {
                setError('Booking not found')
                setLoading(false)
                return
            }

            setBooking(bookingData)
            setGig(bookingData.gigs)
            setLoading(false)
        }

        loadBookingDetails()
    }, [bookingId, supabase, router])

    // Calculate pricing with 20% markup
    const totalSessions = booking?.total_sessions || gig?.total_sessions || 1
    const teacherPricePerSession = gig?.price || 0
    const markupMultiplier = 1.2 // 20% markup
    const parentPricePerSession = Math.ceil(teacherPricePerSession * markupMultiplier)

    const teacherTotal = teacherPricePerSession * totalSessions
    const parentTotal = parentPricePerSession * totalSessions
    const companyAmount = parentTotal - teacherTotal // 20% goes to company

    const depositAmount = Math.ceil(parentTotal / 2) // 50% deposit, rounded up
    const amountToPay = paymentOption === 'full' ? parentTotal : depositAmount

    const handlePayment = async () => {
        if (!booking || !gig) return

        setProcessing(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Update booking with payment details
            await supabase
                .from('bookings')
                .update({
                    total_price: parentTotal,
                    amount_paid: amountToPay,
                    payment_type: paymentOption,
                    teacher_amount: teacherTotal,
                    company_amount: companyAmount,
                    payment_status: 'pending'
                })
                .eq('id', bookingId)

            const response = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user?.email,
                    amount: amountToPay,
                    booking_id: bookingId,
                    payment_type: paymentOption,
                    callback_url: `${window.location.origin}/parent/booking/verify?booking_id=${bookingId}`
                })
            })

            const data = await response.json()

            if (data.error) {
                setError(data.error)
                setProcessing(false)
                return
            }

            // Redirect to Paystack payment page
            window.location.href = data.authorization_url

        } catch (err) {
            setError('Failed to initialize payment. Please try again.')
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <AlertCircle className="size-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Error</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild>
                    <Link href="/parent/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card">
                <Link href="/" className="flex items-center gap-3">
                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Atom className="size-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">STEAM Spark</h2>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="size-4 text-green-500" />
                    Secure Payment
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
                <Link href={`/parent/book/${gig?.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                    <ArrowLeft className="size-4" /> Back to Booking
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
                            <p className="text-muted-foreground">Choose your payment option and method to confirm your booking.</p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="size-4" />
                                {error}
                            </div>
                        )}

                        {/* Payment Options */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Payment Option</label>

                            {/* Full Payment - Primary */}
                            <button
                                onClick={() => setPaymentOption('full')}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all relative overflow-hidden",
                                    paymentOption === 'full'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    RECOMMENDED
                                </div>
                                <div className="size-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="size-6 text-green-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold text-lg">Pay Full Amount</p>
                                    <p className="text-sm text-muted-foreground">Pay once and you're all set!</p>
                                    <p className="text-xl font-black text-primary mt-1">GHS {parentTotal.toFixed(2)}</p>
                                </div>
                                {paymentOption === 'full' && <CheckCircle className="size-6 text-primary" />}
                            </button>

                            {/* Deposit Payment */}
                            <button
                                onClick={() => setPaymentOption('deposit')}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    paymentOption === 'deposit'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="size-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Percent className="size-6 text-orange-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold text-lg">Pay 50% Deposit</p>
                                    <p className="text-sm text-muted-foreground">
                                        Pay GHS {depositAmount.toFixed(2)} now, GHS {(parentTotal - depositAmount).toFixed(2)} before session 4
                                    </p>
                                    <p className="text-xl font-black text-orange-600 mt-1">GHS {depositAmount.toFixed(2)}</p>
                                </div>
                                {paymentOption === 'deposit' && <CheckCircle className="size-6 text-primary" />}
                            </button>

                            {paymentOption === 'deposit' && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
                                    <strong>Note:</strong> You'll receive a reminder via email and WhatsApp to pay the remaining GHS {(parentTotal - depositAmount).toFixed(2)} before the 4th session.
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Select Payment Method</label>

                            <button
                                onClick={() => setPaymentMethod('mobile_money')}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    paymentMethod === 'mobile_money'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="size-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                    <Smartphone className="size-6 text-yellow-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold">Mobile Money</p>
                                    <p className="text-sm text-muted-foreground">MTN MoMo, Vodafone Cash, AirtelTigo</p>
                                </div>
                                {paymentMethod === 'mobile_money' && <CheckCircle className="size-5 text-primary" />}
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    paymentMethod === 'card'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <CreditCard className="size-6 text-blue-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold">Debit/Credit Card</p>
                                    <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                                </div>
                                {paymentMethod === 'card' && <CheckCircle className="size-5 text-primary" />}
                            </button>

                            <button
                                onClick={() => setPaymentMethod('bank')}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    paymentMethod === 'bank'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="size-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Building2 className="size-6 text-green-600" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold">Bank Transfer</p>
                                    <p className="text-sm text-muted-foreground">Pay directly from your bank</p>
                                </div>
                                {paymentMethod === 'bank' && <CheckCircle className="size-5 text-primary" />}
                            </button>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-14 text-lg font-bold"
                            onClick={handlePayment}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="size-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>Pay GHS {amountToPay.toFixed(2)} {paymentOption === 'deposit' && '(Deposit)'}</>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Powered by Paystack. Your payment is secure and encrypted.
                        </p>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-2xl border border-border p-6 sticky top-8">
                            <h3 className="font-bold text-lg mb-4">Booking Summary</h3>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                        {gig?.subject?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold line-clamp-2">{gig?.title}</h4>
                                        <p className="text-sm text-muted-foreground">with {(gig?.profiles as any)?.full_name || 'Teacher'}</p>
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Student</span>
                                        <span className="font-medium">{booking?.students?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sessions</span>
                                        <span className="font-medium">{totalSessions} sessions</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Price per session</span>
                                        <span className="font-medium">GHS {parentPricePerSession.toFixed(2)}</span>
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Course Fee</span>
                                        <span className="font-medium">GHS {parentTotal.toFixed(2)}</span>
                                    </div>
                                    {paymentOption === 'deposit' && (
                                        <div className="flex justify-between text-sm text-orange-600">
                                            <span>Balance Due (before session 4)</span>
                                            <span className="font-medium">GHS {(parentTotal - depositAmount).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <hr className="border-border" />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Due Today</span>
                                    <span className="text-primary">GHS {amountToPay.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
