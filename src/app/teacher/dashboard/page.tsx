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

    // Fetch bookings for stats (legacy query for earnings/students count)
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            gig:gigs!inner(*),
            student:students(*)
        `)
        .eq('gig.teacher_id', user.id)

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
    const upcomingSessions = sessionsData?.filter((s: any) =>
        s.booking?.gig?.teacher_id === user.id
    ) || []

    // Simple calculations from bookings
    const earnings = (bookings?.reduce((acc, curr) => acc + (curr.gig?.price || 0), 0) || 0)
    const activeStudents = new Set(bookings?.map(b => b.student_id)).size
    const pendingEnrollments = bookings?.filter(b => b.status === 'pending' || b.status === 'pending_payment').length || 0
    const completedSessions = bookings?.filter(b => b.status === 'completed').length || 0

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
                rating={4.9}
                completedSessions={completedSessions}
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
