"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ChildSwitcher } from "./_components/child-switcher"
import { ChildStats } from "./_components/child-stats"
import { ParentQuickActions } from "./_components/quick-actions"
import { ActiveRoadmaps } from "./_components/active-roadmaps"
import { ParentUpcomingSessions } from "./_components/upcoming-sessions"
import { CompletedSessions } from "./_components/completed-sessions"
import { NotificationsPanel } from "./_components/notifications-panel"
import { RecommendedTutors } from "./_components/recommended-tutors"
import { PendingBookings } from "./_components/pending-bookings"
import { CheckCircle, X, Loader2 } from "lucide-react"

// Export the main page wrapped in Suspense
export default function ParentDashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <ParentDashboardContent />
        </Suspense>
    )
}

function ParentDashboardContent() {
    const [activeChildId, setActiveChildId] = useState<string | null>(null)
    const [showBookingSuccess, setShowBookingSuccess] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams.get('booking') === 'submitted') {
            setShowBookingSuccess(true)
            // Clear the URL param
            window.history.replaceState({}, '', '/parent/dashboard')
        }
    }, [searchParams])

    return (
        <>
            {/* Booking Success Banner */}
            {showBookingSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="size-6 text-green-600" />
                        <div>
                            <p className="font-bold text-green-800 dark:text-green-300">Booking Submitted!</p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Waiting for teacher approval. You'll be notified when accepted to complete payment.
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowBookingSuccess(false)} className="text-green-600 hover:text-green-800">
                        <X className="size-5" />
                    </button>
                </div>
            )}

            {/* Header Section */}
            <ChildSwitcher onChildChange={setActiveChildId} />

            {/* Child Stats */}
            <ChildStats childId={activeChildId} />

            {/* Quick Actions */}
            <ParentQuickActions />

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <PendingBookings />
                    <ActiveRoadmaps />
                    <ParentUpcomingSessions />
                    <CompletedSessions />
                </div>

                {/* Right Column (Sidebar) */}
                <div className="flex flex-col gap-8">
                    <NotificationsPanel />
                    <RecommendedTutors />
                </div>
            </div>
        </>
    );
}
