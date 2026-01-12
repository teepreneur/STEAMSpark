"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, getDay, isBefore, startOfDay } from "date-fns"
import { Calendar as CalendarIcon, Clock, ArrowLeft, Loader2, BookOpen, Users, Target, CheckCircle, Info, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import LocationPicker from "@/components/location-picker"

interface GigData {
    id: string
    title: string
    subject: string
    description: string
    price: number
    duration: number
    total_sessions: number
    session_duration: number
    max_students: number
    cover_image: string | null
    topics: { id: string; title: string; outcome: string }[] | null
    requirements: string[] | null
    teacher_id: string
    class_type?: string
    profiles: {
        id: string
        full_name: string
        avatar_url: string | null
    }
}

interface Student {
    id: string
    name: string
    age: number | null
}

interface TeacherAvailability {
    day_of_week: number
    is_available: boolean
    start_time: string
    end_time: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function formatTime(time: string): string {
    const [hours] = time.split(':')
    const h = parseInt(hours)
    if (h === 0) return "12:00 AM"
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return "12:00 PM"
    return `${h - 12}:00 PM`
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const STORAGE_KEY = `booking_form_${id}`

    const [gig, setGig] = useState<GigData | null>(null)
    const [students, setStudents] = useState<Student[]>([])
    const [availability, setAvailability] = useState<TeacherAvailability[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State - load from localStorage if available
    const [selectedStudent, setSelectedStudent] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                return parsed.selectedStudent || null
            }
        }
        return null
    })
    const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved).sessionsPerWeek || 1
        }
        return 1
    })
    const [selectedDays, setSelectedDays] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved).selectedDays || []
        }
        return []
    })
    const [useSameTime, setUseSameTime] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved).useSameTime ?? true
        }
        return true
    })
    const [selectedTime, setSelectedTime] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved).selectedTime || ""
        }
        return ""
    })
    const [dayTimes, setDayTimes] = useState<Record<number, string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) return JSON.parse(saved).dayTimes || {}
        }
        return {}
    })
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const date = JSON.parse(saved).startDate
                return date ? new Date(date) : undefined
            }
        }
        return undefined
    })

    // Calculated session dates
    const [sessionDates, setSessionDates] = useState<Date[]>([])

    // Location for in-person sessions
    const [sessionLocation, setSessionLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)

    // Save form state to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                selectedStudent,
                sessionsPerWeek,
                selectedDays,
                useSameTime,
                selectedTime,
                dayTimes,
                startDate: startDate?.toISOString()
            }))
        }
    }, [selectedStudent, sessionsPerWeek, selectedDays, useSameTime, selectedTime, dayTimes, startDate, STORAGE_KEY])

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Fetch Gig with full details
            const { data: gigData, error: gigError } = await supabase
                .from('gigs')
                .select(`
                    id,
                    title,
                    subject,
                    description,
                    price,
                    duration,
                    total_sessions,
                    session_duration,
                    max_students,
                    cover_image,
                    topics,
                    requirements,
                    teacher_id,
                    class_type,
                    profiles:teacher_id (id, full_name, avatar_url)
                `)
                .eq('id', id)
                .single()

            if (gigError) {
                console.error("Error fetching gig:", gigError)
                setError("Course not found")
                setLoading(false)
                return
            }
            setGig(gigData as unknown as GigData)

            // Fetch Teacher Availability
            const { data: availData } = await supabase
                .from('teacher_availability')
                .select('*')
                .eq('teacher_id', gigData.teacher_id)
                .eq('is_available', true)

            if (availData) {
                setAvailability(availData as TeacherAvailability[])
                // Auto-select first available time if exists
                if (availData.length > 0) {
                    setSelectedTime(availData[0].start_time)
                }
            }

            // Fetch Students (Children)
            const { data: studentsData } = await supabase
                .from('students')
                .select('id, name, age')
                .eq('parent_id', user.id)

            if (studentsData) setStudents(studentsData)

            setLoading(false)
        }
        loadData()
    }, [id, supabase, router])

    // Calculate session dates when selection changes
    useEffect(() => {
        if (!startDate || selectedDays.length === 0 || !gig) return

        const totalSessions = gig.total_sessions || 4
        const dates: Date[] = []
        let currentDate = startOfDay(startDate)
        let sessionCount = 0

        // Generate dates until we have enough sessions
        while (sessionCount < totalSessions) {
            const dayOfWeek = getDay(currentDate)
            if (selectedDays.includes(dayOfWeek)) {
                dates.push(new Date(currentDate))
                sessionCount++
            }
            currentDate = addDays(currentDate, 1)
        }

        setSessionDates(dates)
    }, [startDate, selectedDays, gig])

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day))
        } else if (selectedDays.length < sessionsPerWeek) {
            setSelectedDays([...selectedDays, day])
        }
    }

    // Reset selected days only if current selection exceeds new limit
    useEffect(() => {
        if (selectedDays.length > sessionsPerWeek) {
            setSelectedDays(selectedDays.slice(0, sessionsPerWeek))
        }
    }, [sessionsPerWeek])

    // Get available days (where teacher is available)
    const availableDayNumbers = availability.map(a => a.day_of_week)

    // Check if a date is valid for booking (teacher is available that day of week)
    const isDateAvailable = (date: Date) => {
        const dayOfWeek = getDay(date)
        return availableDayNumbers.includes(dayOfWeek) && !isBefore(date, startOfDay(new Date()))
    }

    // Get time slots for selected days
    const getTimeSlots = () => {
        if (selectedDays.length === 0) return []

        // Find the intersection of available times for all selected days
        const slots: string[] = []
        const relevantAvailability = availability.filter(a => selectedDays.includes(a.day_of_week))

        if (relevantAvailability.length === 0) return []

        // Get min start and max end time
        const startHour = Math.max(...relevantAvailability.map(a => parseInt(a.start_time.split(':')[0])))
        const endHour = Math.min(...relevantAvailability.map(a => parseInt(a.end_time.split(':')[0])))

        for (let h = startHour; h < endHour; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`)
        }

        return slots
    }

    async function handleBooking() {
        if (!selectedStudent || !gig || selectedDays.length === 0 || !startDate || !selectedTime) {
            setError("Please complete all booking details")
            return
        }

        // Require location for in-person/hybrid bookings
        const isInPerson = gig.class_type === 'in_person' || gig.class_type === 'hybrid'
        if (isInPerson && !sessionLocation) {
            setError("Please select your location for in-person sessions")
            return
        }

        setSubmitting(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            // Create booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    gig_id: gig.id,
                    student_id: selectedStudent,
                    parent_id: user.id,
                    status: 'pending',
                    scheduled_at: startDate.toISOString(),
                    session_date: startDate.toISOString(),
                    preferred_days: selectedDays.map(d => DAY_NAMES[d]),
                    preferred_time: selectedTime,
                    total_sessions: gig.total_sessions || 1,
                    ...(sessionLocation && {
                        session_location_address: sessionLocation.address,
                        session_location_lat: sessionLocation.lat,
                        session_location_lng: sessionLocation.lng
                    })
                })
                .select()
                .single()

            if (bookingError) {
                console.error("Booking error:", bookingError)
                setError(bookingError.message || "Failed to create booking")
                setSubmitting(false)
                return
            }

            // Create individual session records (these will appear on teacher's calendar)
            const sessionInserts = sessionDates.map((date, index) => {
                const dayOfWeek = getDay(date)
                const sessionTime = useSameTime ? selectedTime : (dayTimes[dayOfWeek] || selectedTime)
                return {
                    booking_id: booking.id,
                    session_date: format(date, 'yyyy-MM-dd'),
                    session_time: sessionTime,
                    session_number: index + 1,
                    status: 'scheduled' as const
                }
            })

            await supabase.from('booking_sessions').insert(sessionInserts)

            // Get student name for notification
            const selectedStudentData = students.find(s => s.id === selectedStudent)

            // Notify teacher of pending enrollment
            try {
                await fetch('/api/notifications/pending-enrollment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teacherEmail: (gig as any).profiles?.email || null,
                        teacherName: gig.profiles?.full_name,
                        studentName: selectedStudentData?.name || 'A student',
                        gigTitle: gig.title,
                        parentName: user.email
                    })
                })
            } catch (notifyError) {
                console.log('Notification failed, but booking successful')
            }

            // Clear form localStorage since booking is complete
            localStorage.removeItem(STORAGE_KEY)

            // Redirect to dashboard with success message (payment happens after teacher accepts)
            router.push('/parent/dashboard?booking=submitted')

        } catch (err: any) {
            setError(err?.message || "An error occurred")
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!gig || error === "Course not found") {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Course not found</h1>
                <Button asChild>
                    <Link href="/parent/tutors">Browse Courses</Link>
                </Button>
            </div>
        )
    }

    // Calculate pricing with 20% markup (what parents see)
    const totalSessions = gig.total_sessions || 1
    const teacherPrice = gig.price || 50
    const pricePerSession = Math.ceil(teacherPrice * 1.2) // 20% markup
    const totalPrice = pricePerSession * totalSessions
    const sessionDuration = gig.session_duration || 1
    const topics = gig.topics || []
    const requirements = gig.requirements || []
    const timeSlots = getTimeSlots()

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
            <Link href="/parent/tutors" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="size-4" /> Back to Courses
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Course Details */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Header with Cover Image */}
                    {gig.cover_image && (
                        <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-muted">
                            <img src={gig.cover_image} alt={gig.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-3xl font-black mb-2 leading-tight">{gig.title}</h1>
                        <p className="text-lg text-muted-foreground">with {gig.profiles?.full_name}</p>
                    </div>

                    {/* Course Stats */}
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-bold capitalize">
                            {gig.subject}
                        </span>
                        <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                            <BookOpen className="size-3" /> {totalSessions} Sessions
                        </span>
                        <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                            <Clock className="size-3" /> {sessionDuration}h per session
                        </span>
                        <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1">
                            <Users className="size-3" /> {gig.max_students > 1 ? `Up to ${gig.max_students} students` : "1:1 Private"}
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">About this course</h3>
                        <p className="text-muted-foreground leading-relaxed">{gig.description}</p>
                    </div>

                    {/* Session Preview */}
                    {sessionDates.length > 0 && (selectedTime || Object.keys(dayTimes).length > 0) && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-800 dark:text-green-300">
                                <CalendarIcon className="size-5" /> Your Session Schedule
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {sessionDates.map((date, index) => {
                                    const dayOfWeek = getDay(date)
                                    const sessionTime = useSameTime ? selectedTime : (dayTimes[dayOfWeek] || selectedTime || '')
                                    return (
                                        <div key={index} className="bg-white dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400">Session {index + 1}</span>
                                            <p className="font-bold text-sm">{format(date, 'EEE, MMM d')}</p>
                                            <p className="text-xs text-muted-foreground">{sessionTime ? formatTime(sessionTime) : 'Select time'}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Curriculum */}
                    {topics.length > 0 && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <BookOpen className="size-5 text-primary" /> What you'll learn ({topics.length} lessons)
                            </h3>
                            <div className="space-y-4">
                                {topics.map((topic, index) => (
                                    <div key={topic.id || index} className="flex items-start gap-3">
                                        <span className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-semibold">{topic.title}</p>
                                            {topic.outcome && (
                                                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                                                    <Target className="size-4 shrink-0 mt-0.5 text-green-500" />
                                                    {topic.outcome}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requirements */}
                    {requirements.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-3">Requirements</h3>
                            <ul className="space-y-2">
                                {requirements.map((req, i) => (
                                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle className="size-4 text-primary" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right Col: Booking Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6 flex flex-col gap-6 sticky top-8">
                        {/* Pricing Summary */}
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Per session</span>
                                <span className="font-bold">GHS {pricePerSession.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Sessions</span>
                                <span className="font-bold">× {totalSessions}</span>
                            </div>
                            <hr className="border-primary/20 my-2" />
                            <div className="flex items-center justify-between">
                                <span className="font-bold">Total</span>
                                <span className="text-xl font-black text-primary">GHS {totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <h3 className="font-bold text-xl">Schedule Your Classes</h3>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        {/* Student Selection */}
                        <div className="space-y-3">
                            <Label className="text-base">Select Student *</Label>
                            {students.length > 0 ? (
                                <RadioGroup value={selectedStudent || ""} onValueChange={setSelectedStudent}>
                                    {students.map((student) => (
                                        <div key={student.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value={student.id} id={student.id} />
                                            <Label htmlFor={student.id} className="flex-1 cursor-pointer font-medium">
                                                {student.name} {student.age && <span className="text-muted-foreground text-sm">({student.age} yrs)</span>}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200">
                                    You haven't added any children yet. <Link href="/parent/settings" className="underline font-bold">Add a child</Link> to continue.
                                </div>
                            )}
                        </div>

                        {/* Location Selection - Only for in-person/hybrid */}
                        {(gig.class_type === 'in_person' || gig.class_type === 'hybrid') && (
                            <div className="space-y-3">
                                <Label className="text-base flex items-center gap-2">
                                    <MapPin className="size-4 text-primary" />
                                    Session Location *
                                </Label>
                                <p className="text-sm text-muted-foreground -mt-2">
                                    Where should the in-person sessions take place?
                                </p>
                                <LocationPicker
                                    onLocationSelect={(location) => setSessionLocation(location)}
                                    defaultLocation={sessionLocation || undefined}
                                />
                            </div>
                        )}

                        {/* Sessions Per Week */}
                        <div className="space-y-3">
                            <Label className="text-base">Sessions per Week *</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setSessionsPerWeek(num)}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border-2 font-bold transition-all",
                                            sessionsPerWeek === num
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Available Days */}
                        <div className="space-y-3">
                            <Label className="text-base">Select {sessionsPerWeek} Day{sessionsPerWeek > 1 ? 's' : ''} *</Label>
                            {availability.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DAY_NAMES.map((day, index) => {
                                            const isAvailable = availableDayNumbers.includes(index)
                                            const isSelected = selectedDays.includes(index)
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    disabled={!isAvailable || (!isSelected && selectedDays.length >= sessionsPerWeek)}
                                                    onClick={() => toggleDay(index)}
                                                    className={cn(
                                                        "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                                                        !isAvailable && "opacity-30 cursor-not-allowed bg-muted",
                                                        isSelected && "bg-primary text-primary-foreground border-primary",
                                                        isAvailable && !isSelected && "bg-card border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="size-3" /> Grayed out days are not available for this teacher
                                    </p>
                                </>
                            ) : (
                                <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200">
                                    Teacher has not set their availability yet.
                                </div>
                            )}
                        </div>

                        {/* Time Selection */}
                        {timeSlots.length > 0 && selectedDays.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">Session Times *</Label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setUseSameTime(true)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                                useSameTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            Same Time
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUseSameTime(false)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                                !useSameTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            Different Times
                                        </button>
                                    </div>
                                </div>

                                {useSameTime ? (
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <select
                                            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                        >
                                            {timeSlots.map(time => (
                                                <option key={time} value={time}>{formatTime(time)}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">All sessions will be at {selectedTime ? formatTime(selectedTime) : 'this time'}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedDays.sort((a, b) => a - b).map((dayNum) => {
                                            const dayAvail = availability.find(a => a.day_of_week === dayNum)
                                            const daySlots = dayAvail ? (() => {
                                                const start = parseInt(dayAvail.start_time.split(':')[0])
                                                const end = parseInt(dayAvail.end_time.split(':')[0])
                                                const slots = []
                                                for (let h = start; h < end; h++) {
                                                    slots.push(`${h.toString().padStart(2, '0')}:00`)
                                                }
                                                return slots
                                            })() : timeSlots

                                            return (
                                                <div key={dayNum} className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                                                    <span className="text-sm font-bold w-24">{DAY_NAMES[dayNum]}</span>
                                                    <div className="relative flex-1">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <select
                                                            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm appearance-none"
                                                            value={dayTimes[dayNum] || daySlots[0] || ''}
                                                            onChange={(e) => setDayTimes({ ...dayTimes, [dayNum]: e.target.value })}
                                                        >
                                                            {daySlots.map(time => (
                                                                <option key={time} value={time}>{formatTime(time)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Start Date */}
                        <div className="space-y-3">
                            <Label className="text-base">Start Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                        disabled={(date) => !isDateAvailable(date)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="lg"
                            className="w-full font-bold mt-2"
                            onClick={handleBooking}
                            disabled={submitting || !selectedStudent || selectedDays.length < sessionsPerWeek || !startDate || !selectedTime}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>Proceed to Payment - GHS {totalPrice.toFixed(2)}</>
                            )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Your booking will be confirmed after payment
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}
