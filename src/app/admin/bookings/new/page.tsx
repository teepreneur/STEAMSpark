"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save, User, BookOpen, GraduationCap, Calendar, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAdminHref } from "@/lib/admin-paths"
import { createConciergeBooking } from "@/app/actions/bookings"
import { calculateDistance } from "@/lib/utils"

const SUBJECTS = ["Math", "Science", "English", "Coding", "Arts", "Music", "Other"]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function NewBookingPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [parents, setParents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])

    // Form State
    const [parentId, setParentId] = useState("")
    const [studentId, setStudentId] = useState("")
    const [teacherId, setTeacherId] = useState("")
    const [title, setTitle] = useState("")
    const [subject, setSubject] = useState("")
    const [price, setPrice] = useState("100")
    const [totalSessions, setTotalSessions] = useState("4")
    const [sessionDuration, setSessionDuration] = useState("1")
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [preferredTime, setPreferredTime] = useState("16:00")
    const [preferredDays, setPreferredDays] = useState<string[]>([])
    
    // Insights
    const [distance, setDistance] = useState<number | null>(null)

    useEffect(() => {
        async function loadData() {
            setLoading(true)

            // Fetch Parents with location
            const { data: parentsData } = await supabase
                .from('profiles')
                .select('id, full_name, email, latitude, longitude, address')
                .eq('role', 'parent')
                .order('full_name')

            // Fetch Teachers with location and rate
            const { data: teachersData } = await supabase
                .from('profiles')
                .select('id, full_name, hourly_rate, latitude, longitude, address, subjects')
                .eq('role', 'teacher')
                .order('full_name')

            setParents(parentsData || [])
            setTeachers(teachersData || [])
            setLoading(false)
        }
        loadData()
    }, [supabase])

    // Auto-price and Distance calculation
    useEffect(() => {
        if (teacherId) {
            const teacher = teachers.find(t => t.id === teacherId)
            if (teacher && teacher.hourly_rate) {
                setPrice(teacher.hourly_rate.toString())
            }
        }

        if (parentId && teacherId) {
            const parent = parents.find(p => p.id === parentId)
            const teacher = teachers.find(t => t.id === teacherId)

            if (parent?.latitude && parent?.longitude && teacher?.latitude && teacher?.longitude) {
                const dist = calculateDistance(
                    parent.latitude,
                    parent.longitude,
                    teacher.latitude,
                    teacher.longitude
                )
                setDistance(dist)
            } else {
                setDistance(null)
            }
        } else {
            setDistance(null)
        }
    }, [teacherId, parentId, teachers, parents])

    useEffect(() => {
        async function loadStudents() {
            if (!parentId) {
                setStudents([])
                setStudentId("")
                return
            }

            const { data } = await supabase
                .from('students')
                .select('id, name')
                .eq('parent_id', parentId)
                .order('name')

            setStudents(data || [])
            if (data?.length === 1) {
                setStudentId(data[0].id)
            }
        }
        loadStudents()
    }, [parentId, supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!parentId || !studentId || !teacherId) {
            alert("Please select parent, student, and teacher")
            return
        }

        setSubmitting(true)
        const result = await createConciergeBooking({
            parentId,
            studentId,
            teacherId,
            title,
            subject,
            price: Number(price),
            totalSessions: Number(totalSessions),
            sessionDuration: Number(sessionDuration),
            startDate,
            preferredTime,
            preferredDays
        })

        if (result.success) {
            router.push(getAdminHref(`/admin/bookings/${result.bookingId}`))
        } else {
            alert(result.error)
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

    return (
        <div className="space-y-6 max-w-4xl pb-12">
            <Link
                href={getAdminHref("/admin/bookings")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Bookings
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground">Create Concierge Booking</h1>
                    <p className="text-muted-foreground">Force-enroll a student into a new class session</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1: Users */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="size-5 text-primary" />
                            User Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Parent</Label>
                            <Select value={parentId} onValueChange={setParentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Parent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {parents.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.full_name} ({p.email?.split('@')[0]})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Student</Label>
                            <Select value={studentId} onValueChange={setStudentId} disabled={!parentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={parentId ? "Select Student" : "Select Parent first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Teacher</Label>
                            <Select value={teacherId} onValueChange={setTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.full_name} (GHS {t.hourly_rate}/h)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Location Insights */}
                        {(parentId || teacherId) && (
                            <div className="md:col-span-3 p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary/70">Matching Insights</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold flex items-center gap-2">
                                            <MapPin className="size-4 text-primary" />
                                            Distance Matching
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                distance === null ? "bg-muted text-muted-foreground" :
                                                distance < 5 ? "bg-green-100 text-green-700" :
                                                distance < 15 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {distance === null ? "Location missing" : `${distance.toFixed(1)} km away`}
                                            </div>
                                            {distance !== null && distance < 10 && (
                                                <span className="text-[10px] font-bold text-green-600 uppercase">Highly Recommended</span>
                                            )}
                                        </div>
                                    </div>

                                    {teacherId && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold flex items-center gap-2">
                                                <GraduationCap className="size-4 text-primary" />
                                                Teacher Expertise:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {teachers.find(t => t.id === teacherId)?.subjects?.map((s: string) => (
                                                    <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>
                                                )) || <span className="text-xs text-muted-foreground">No subjects listed</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Class Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BookOpen className="size-5 text-primary" />
                            Class Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Class Title</Label>
                            <Input
                                placeholder="e.g. Primary 4 Mathematics"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select value={subject} onValueChange={setSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBJECTS.map(s => (
                                        <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price per Session (GHS)</Label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Sessions</Label>
                                <Input
                                    type="number"
                                    value={totalSessions}
                                    onChange={e => setTotalSessions(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 3: Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Calendar className="size-5 text-primary" />
                            Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preferred Time</Label>
                                <Input
                                    type="time"
                                    value={preferredTime}
                                    onChange={e => setPreferredTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Session Duration (Hours)</Label>
                            <Input
                                type="number"
                                step="0.5"
                                value={sessionDuration}
                                onChange={e => setSessionDuration(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Preferred Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => {
                                    const isSelected = preferredDays.includes(day);
                                    return (
                                        <Button
                                            key={day}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                if (isSelected) setPreferredDays(preferredDays.filter(d => d !== day))
                                                else setPreferredDays([...preferredDays, day])
                                            }}
                                            className={cn(
                                                "h-9 px-3 font-medium transition-all",
                                                isSelected ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                                            )}
                                        >
                                            {day.slice(0, 3)}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 flex justify-end gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={submitting || !parentId || !studentId || !teacherId}
                        className="bg-primary hover:bg-primary/90 font-bold px-8"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="size-4 mr-2" />
                                Create Booking
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
