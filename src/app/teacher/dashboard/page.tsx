import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsGrid } from "./_components/stats-grid"
import { QuickActions } from "./_components/quick-actions"
import { UpcomingSessions } from "./_components/upcoming-sessions"
import { RecentInquiries } from "./_components/recent-inquiries"
import { ActivityChart } from "./_components/activity-chart"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function TeacherDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Initialize with defaults
    let profile: any = null
    let reviewData: any[] = []
    let bookings: any[] = []
    let upcomingSessions: any[] = []

    try {
        // Fetch profile for Trust Score calculation
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = profileData
    } catch (e) {
        console.error('[Teacher Dashboard] Profile fetch error:', e)
    }

    try {
        // Fetch average rating from reviews
        const { data } = await supabase
            .from('reviews')
            .select('rating')
            .eq('teacher_id', user.id)
        reviewData = data || []
    } catch (e) {
        console.error('[Teacher Dashboard] Reviews fetch error:', e)
    }

    try {
        // Fetch bookings for stats
        const { data } = await supabase
            .from('bookings')
            .select(`
                *,
                gig:gigs!inner(*),
                student:students(*)
            `)
            .eq('gig.teacher_id', user.id)
        bookings = data || []
    } catch (e) {
        console.error('[Teacher Dashboard] Bookings fetch error:', e)
    }

    try {
        // Fetch individual sessions for upcoming display
        const today = new Date().toISOString().split('T')[0]
        const { data: sessionsData } = await supabase
            .from('booking_sessions')
            .select(`
                id,
                session_date,
                session_time,
                session_number,
                status,
                booking:bookings!inner (
                    id,
                    status,
                    gig:gigs!inner (
                        title,
                        teacher_id
                    ),
                    student:students (name)
                )
            `)
            .gte('session_date', today)
            .in('status', ['scheduled', 'confirmed'])
            .order('session_date', { ascending: true })
            .order('session_time', { ascending: true })
            .limit(10)

        // Filter for this teacher's sessions
        upcomingSessions = sessionsData?.filter((s: any) =>
            s.booking?.gig?.teacher_id === user.id
        ) || []
    } catch (e) {
        console.error('[Teacher Dashboard] Sessions fetch error:', e)
    }

    // Simple calculations from bookings
    const earnings = (bookings?.reduce((acc, curr) => acc + (curr.gig?.price || 0), 0) || 0)
    const activeStudents = new Set(bookings?.map(b => b.student_id)).size
    const pendingEnrollments = bookings?.filter(b => b.status === 'pending' || b.status === 'pending_payment').length || 0
    const completedSessions = bookings?.filter(b => b.status === 'completed').length || 0

    // HYBRID RATING CALCULATION
    // 1. Trust Score (Max 50 points)
    let trustScore = 0
    if (profile) {
        // Profile Basics (20 pts, 4 each)
        if (profile.full_name) trustScore += 4
        if (profile.bio && profile.bio.length > 20) trustScore += 4
        if (profile.subjects && profile.subjects.length > 0) trustScore += 4
        if (profile.hourly_rate) trustScore += 4
        if (profile.avatar_url) trustScore += 4

        // Verification (30 pts, 10 each)
        if (profile.cv_url) trustScore += 10
        if (profile.id_url) trustScore += 10
        if (profile.photo_url) trustScore += 10
    }

    // 2. Client Rating (Max 50 points)
    let clientRatingPoints = 0
    if (reviewData && reviewData.length > 0) {
        const avgRating = reviewData.reduce((acc, curr) => acc + curr.rating, 0) / reviewData.length
        clientRatingPoints = (avgRating / 5) * 50
    } else {
        // Baseline for new teachers (4.0 stars = 40 points)
        clientRatingPoints = 40
    }

    const finalRating = (trustScore + clientRatingPoints) / 20
    const displayRating = Math.max(0, Math.min(5, finalRating)) // Clamp between 0 and 5

    const formattedSessions = upcomingSessions.slice(0, 3).map((s: any) => ({
        id: s.id,
        title: s.booking?.gig?.title || "Unknown Class",
        scheduled_at: `${s.session_date}T${s.session_time || '00:00'}:00`,
        student_name: s.booking?.student?.name || "Unknown Student",
        session_number: s.session_number
    }))

    return (
        <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="w-full">
                <div
                    className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-2xl min-h-[180px] md:min-h-[220px] shadow-sm relative group"
                    style={{
                        backgroundImage: 'linear-gradient(0deg, rgba(37, 140, 244, 0.9) 0%, rgba(37, 140, 244, 0.4) 100%), url("https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop")'
                    }}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between p-6 md:p-8 relative z-10">
                        <div className="flex flex-col gap-2">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold w-fit uppercase tracking-wider">Teacher Dashboard</span>
                            <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight">Welcome back!</h1>
                            <p className="text-white/90 text-sm md:text-base font-medium">You have {upcomingSessions.length} upcoming sessions.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-3">
                            <Button className="bg-white text-primary hover:bg-gray-100 font-bold shadow-lg" size="lg" asChild>
                                <Link href="/teacher/gigs/new">
                                    <Plus className="mr-2 size-5" /> Create Course
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <StatsGrid
                earnings={earnings}
                activeStudents={activeStudents}
                pendingEnrollments={pendingEnrollments}
                rating={displayRating}
                completedSessions={completedSessions}
                hasReviews={!!(reviewData && reviewData.length > 0)}
            />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <QuickActions />
                    <UpcomingSessions sessions={formattedSessions} />
                    <ActivityChart />
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    <RecentInquiries />
                    {/* Teacher Tip */}
                    <section>
                        <div className="bg-gradient-to-br from-indigo-500 to-primary rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                            <h3 className="font-bold text-lg mb-2 relative z-10">Engage your students!</h3>
                            <p className="text-sm opacity-90 relative z-10">Try adding a quiz at the end of your session to boost interaction scores.</p>
                            <Button variant="secondary" className="mt-4 bg-white/20 hover:bg-white/30 border-none text-white font-bold h-8 text-xs">
                                View Resources
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
