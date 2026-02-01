"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
    Users, AlertCircle, TrendingUp, Search,
    Loader2, User, BookOpen, Calendar, Mail, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { format, parseISO } from "date-fns"
import Link from "next/link"

interface EnrolledStudent {
    id: string
    booking_id: string
    student: {
        id: string
        name: string
        age: number | null
        grade: string | null
    }
    parent: {
        id: string
        full_name: string | null
        email: string | null
    }
    gig: {
        id: string
        title: string
        subject: string | null
        total_sessions: number | null
    }
    status: string | null
    created_at: string
    total_sessions: number | null
    completed_sessions: number
}

export default function StudentsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <StudentsPageContent />
        </Suspense>
    )
}

function StudentsPageContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const initialFilter = searchParams.get('filter') || 'all'

    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<EnrolledStudent[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<string>(initialFilter)

    useEffect(() => {
        async function loadStudents() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // First, get all gig IDs for this teacher
            const { data: teacherGigs } = await supabase
                .from('gigs')
                .select('id')
                .eq('teacher_id', user.id)

            if (!teacherGigs || teacherGigs.length === 0) {
                setStudents([])
                setLoading(false)
                return
            }

            const gigIds = teacherGigs.map(g => g.id)

            // Fetch bookings for teacher's gigs with student and parent info
            const { data: bookingsData, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    status,
                    created_at,
                    total_sessions,
                    student:students(id, name, age, grade),
                    parent:profiles!bookings_parent_id_fkey(id, full_name, email),
                    gig:gigs(id, title, subject, total_sessions, teacher_id)
                `)
                .in('gig_id', gigIds)
                .in('status', ['confirmed', 'pending', 'pending_payment', 'completed'])

            if (error) {
                console.error('Error fetching students:', error)
                setLoading(false)
                return
            }

            if (bookingsData) {
                // Count completed sessions for each booking
                const enrichedStudents = await Promise.all(
                    bookingsData.map(async (booking: any) => {
                        const { count } = await supabase
                            .from('booking_sessions')
                            .select('*', { count: 'exact', head: true })
                            .eq('booking_id', booking.id)
                            .eq('status', 'completed')

                        // Use placeholder if student data is missing
                        const studentData = booking.student || {
                            id: booking.id,
                            name: 'Student (Data Pending)',
                            age: null,
                            grade: null
                        }

                        return {
                            id: studentData.id,
                            booking_id: booking.id,
                            student: studentData,
                            parent: booking.parent,
                            gig: booking.gig,
                            status: booking.status,
                            created_at: booking.created_at,
                            total_sessions: booking.total_sessions || booking.gig?.total_sessions || 1,
                            completed_sessions: count || 0
                        }
                    })
                )

                setStudents(enrichedStudents as EnrolledStudent[])
            }
            setLoading(false)
        }
        loadStudents()
    }, [supabase])

    // Filter and search students
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.gig.title.toLowerCase().includes(searchQuery.toLowerCase())

        if (filter === "all") return matchesSearch
        if (filter === "active") return matchesSearch && s.status === "confirmed"
        if (filter === "pending") return matchesSearch && (s.status === "pending" || s.status === "pending_payment")
        if (filter === "completed") return matchesSearch && s.status === "completed"
        return matchesSearch
    })

    // Calculate stats
    const totalStudents = students.length
    const activeStudents = students.filter(s => s.status === "confirmed").length
    const pendingStudents = students.filter(s => s.status === "pending" || s.status === "pending_payment").length
    const avgProgress = students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + (s.completed_sessions / (s.total_sessions || 1) * 100), 0) / students.length)
        : 0

    // Get unique subjects for filters
    const subjects = [...new Set(students.map(s => s.gig.subject).filter(Boolean))]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">My Classroom</h1>
                    <p className="text-muted-foreground text-base md:text-lg">Manage enrolled students and track their STEAM journey.</p>
                </div>
            </header>

            {/* Stats Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending Enrollments - Urgent */}
                {pendingStudents > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 shadow-sm flex flex-col gap-2 relative overflow-hidden group animate-pulse-subtle">
                        <div className="absolute -right-4 -top-4 bg-red-500/20 size-24 rounded-full group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <Clock className="size-5" />
                            <span className="text-sm font-bold">Pending Enrollments</span>
                        </div>
                        <p className="text-3xl font-black text-red-700 dark:text-red-300">{pendingStudents}</p>
                        <p className="text-xs font-medium text-red-600/80 dark:text-red-400/80">Awaiting your approval</p>
                    </div>
                )}
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 bg-primary/10 size-24 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="size-5" />
                        <span className="text-sm font-medium">Total Students</span>
                    </div>
                    <p className="text-3xl font-black text-foreground">{totalStudents}</p>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 bg-green-500/10 size-24 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-5 text-green-500" />
                        <span className="text-sm font-medium">Confirmed</span>
                    </div>
                    <p className="text-3xl font-black text-foreground">{activeStudents}</p>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 bg-purple-500/10 size-24 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="size-5 text-purple-500" />
                        <span className="text-sm font-medium">Avg. Progress</span>
                    </div>
                    <p className="text-3xl font-black text-foreground">{avgProgress}%</p>
                </div>
            </section>

            {/* Filters & Search */}
            <section className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-2 rounded-2xl border border-border shadow-sm">
                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                        className="pl-10 h-11 border-none shadow-none focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder="Search students or courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto px-2 md:px-0">
                    <Button
                        variant={filter === "all" ? "default" : "ghost"}
                        className="rounded-xl font-bold"
                        onClick={() => setFilter("all")}
                    >
                        All ({students.length})
                    </Button>
                    <Button
                        variant={filter === "active" ? "default" : "ghost"}
                        className="rounded-xl font-medium"
                        onClick={() => setFilter("active")}
                    >
                        Active
                    </Button>
                    <Button
                        variant={filter === "pending" ? "default" : "ghost"}
                        className="rounded-xl font-medium"
                        onClick={() => setFilter("pending")}
                    >
                        Pending
                    </Button>
                    {subjects.slice(0, 2).map(subject => (
                        <Button
                            key={subject}
                            variant={filter === subject ? "default" : "ghost"}
                            className="rounded-xl font-medium capitalize"
                            onClick={() => setFilter(subject!)}
                        >
                            {subject}
                        </Button>
                    ))}
                </div>
            </section>

            {/* Student Grid */}
            {filteredStudents.length > 0 ? (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map((enrolledStudent) => {
                        const progress = Math.round((enrolledStudent.completed_sessions / (enrolledStudent.total_sessions || 1)) * 100)
                        const isPending = enrolledStudent.status === "pending" || enrolledStudent.status === "pending_payment"

                        return (
                            <article
                                key={enrolledStudent.booking_id}
                                className={cn(
                                    "bg-card rounded-2xl p-5 border-2 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative",
                                    isPending ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" : "border-border"
                                )}
                            >
                                {isPending && (
                                    <div className="absolute top-0 right-0 size-20 bg-gradient-to-bl from-red-500/20 to-transparent rounded-bl-3xl pointer-events-none"></div>
                                )}

                                {/* Student Info */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("size-12 rounded-full flex items-center justify-center font-bold text-lg", isPending ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-primary/10 text-primary")}>
                                            {enrolledStudent.student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight text-foreground">{enrolledStudent.student.name}</h3>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {enrolledStudent.student.grade || 'No grade'}
                                                {enrolledStudent.student.age && ` • Age ${enrolledStudent.student.age}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "font-bold rounded-lg",
                                        enrolledStudent.status === 'confirmed' ? "bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-400" :
                                            enrolledStudent.status === 'pending' ? "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400" :
                                                enrolledStudent.status === 'pending_payment' ? "bg-yellow-100 text-yellow-700 border-transparent dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                    enrolledStudent.status === 'completed' ? "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400" : ""
                                    )}>
                                        {enrolledStudent.status === 'pending' ? 'Pending Approval' :
                                            enrolledStudent.status === 'pending_payment' ? 'Awaiting Payment' :
                                                enrolledStudent.status === 'confirmed' ? 'Enrolled' :
                                                    enrolledStudent.status}
                                    </Badge>
                                </div>

                                {/* Course & Progress */}
                                <div className="bg-muted/50 p-3 rounded-xl flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</span>
                                        <span className={cn("text-sm font-bold", progress >= 80 ? "text-green-500" : "text-primary")}>
                                            {enrolledStudent.completed_sessions}/{enrolledStudent.total_sessions} sessions
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold truncate text-foreground">{enrolledStudent.gig.title}</p>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all", progress >= 80 ? "bg-green-500" : "bg-primary")}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Parent Contact */}
                                <div className="flex items-center gap-2 text-sm text-foreground/80">
                                    <Mail className="size-4 text-muted-foreground" />
                                    <span className="truncate">{enrolledStudent.parent?.full_name || enrolledStudent.parent?.email || 'Parent'}</span>
                                </div>

                                {/* Enrolled Date */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="size-3" />
                                    <span>Enrolled {format(parseISO(enrolledStudent.created_at), 'MMM d, yyyy')}</span>
                                </div>

                                <div className="mt-auto pt-2 flex gap-2">
                                    <Button variant="secondary" className="flex-1 font-bold" asChild>
                                        <Link href={`/teacher/messages?parent=${enrolledStudent.parent?.id}`}>Message</Link>
                                    </Button>
                                    <Button variant="ghost" className="flex-1 font-bold text-primary hover:text-primary hover:bg-primary/10" asChild>
                                        <Link href={`/teacher/students/${enrolledStudent.booking_id}`}>View Details</Link>
                                    </Button>
                                </div>
                            </article>
                        )
                    })}
                </section>
            ) : (
                <div className="py-16 text-center">
                    <User className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {searchQuery ? "No students found" : "No enrolled students yet"}
                    </h3>
                    <p className="text-muted-foreground">
                        {searchQuery
                            ? "Try adjusting your search or filters"
                            : "Students will appear here once they book your courses"
                        }
                    </p>
                </div>
            )}
        </div>
    )
}
