"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    ArrowLeft, Loader2, Calendar, Clock, User, 
    BookOpen, FileText, Download, CheckCircle, MapPin, 
    Phone, Mail, MessageSquare, GraduationCap 
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAdminHref } from "@/lib/admin-paths"
import { format } from "date-fns"
import { generateInvoice, generateBookingConfirmation } from "@/lib/pdf-generator"

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [booking, setBooking] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadBooking() {
            setLoading(true)
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    student:student_id (id, name, date_of_birth, grade),
                    parent:parent_id (id, full_name, email, phone_number, whatsapp_number, address),
                    gig:gig_id (
                        id, title, subject, price, total_sessions, 
                        teacher:teacher_id (id, full_name, email, phone_number, address)
                    )
                `)
                .eq('id', id)
                .single()

            if (error) {
                console.error("Error fetching booking:", error)
                setError("Booking not found")
            } else {
                setBooking(data)
            }
            setLoading(false)
        }
        loadBooking()
    }, [id, supabase])

    const handleGenerateInvoice = async () => {
        if (!booking) return
        
        await generateInvoice({
            invoiceNumber: booking.id.slice(0, 8).toUpperCase(),
            date: new Date(),
            parentName: booking.parent.full_name,
            parentEmail: booking.parent.email,
            studentName: booking.student.name,
            teacherName: booking.gig.teacher.full_name,
            courseTitle: booking.gig.title,
            subject: booking.gig.subject,
            totalSessions: booking.total_sessions || booking.gig.total_sessions,
            pricePerSession: booking.gig.price,
            totalAmount: (booking.total_sessions || booking.gig.total_sessions) * booking.gig.price,
            startDate: format(new Date(booking.session_date || booking.scheduled_at), 'PPP'),
            preferredDays: booking.preferred_days || [],
            preferredTime: booking.preferred_time || '',
            location: booking.session_location_address || booking.parent.address
        })
    }

    const handleGenerateConfirmation = async () => {
        if (!booking) return
        
        await generateBookingConfirmation({
            invoiceNumber: booking.id.slice(0, 8).toUpperCase(),
            date: new Date(),
            parentName: booking.parent.full_name,
            parentEmail: booking.parent.email,
            studentName: booking.student.name,
            teacherName: booking.gig.teacher.full_name,
            courseTitle: booking.gig.title,
            subject: booking.gig.subject,
            totalSessions: booking.total_sessions || booking.gig.total_sessions,
            pricePerSession: booking.gig.price,
            totalAmount: (booking.total_sessions || booking.gig.total_sessions) * booking.gig.price,
            startDate: format(new Date(booking.session_date || booking.scheduled_at), 'PPP'),
            preferredDays: booking.preferred_days || [],
            preferredTime: booking.preferred_time || '',
            location: booking.session_location_address || booking.parent.address
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !booking) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">{error || "Something went wrong"}</p>
                <Link href={getAdminHref("/admin/bookings")} className="text-primary hover:underline mt-4 inline-block">
                    Return to Bookings
                </Link>
            </div>
        )
    }

    const totalPrice = (booking.total_sessions || booking.gig.total_sessions) * booking.gig.price

    return (
        <div className="space-y-6 max-w-5xl pb-12">
            <Link
                href={getAdminHref("/admin/bookings")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Bookings
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-foreground">Booking Detail</h1>
                        <Badge className={cn(
                            "uppercase text-[10px] font-bold",
                            booking.status === 'confirmed' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        )}>
                            {booking.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium">#{booking.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleGenerateInvoice} className="gap-2">
                        <FileText className="size-4" />
                        Invoice
                    </Button>
                    <Button variant="outline" onClick={handleGenerateConfirmation} className="gap-2">
                        <CheckCircle className="size-4" />
                        Confirmation
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                        <CheckCircle className="size-4" />
                        Complete Booking
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="size-5 text-primary" />
                                Class Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Class Title</Label>
                                    <p className="font-bold text-lg">{booking.gig.title}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Subject</Label>
                                    <p className="font-bold text-lg capitalize">{booking.gig.subject}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</Label>
                                    <p className="font-bold">{booking.total_sessions || booking.gig.total_sessions}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rate</Label>
                                    <p className="font-bold text-primary">GHS {booking.gig.price}/session</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</Label>
                                    <p className="font-black text-primary">GHS {totalPrice.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="size-3" /> Location
                                </Label>
                                <p className="font-medium mt-1">
                                    {booking.session_location_address || booking.parent.address || "No specific address provided"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="size-5 text-primary" />
                                Schedule & Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold">Start Date</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(booking.session_date || booking.scheduled_at), 'PPP')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold">Preferred Time</p>
                                        <p className="text-sm text-muted-foreground">{booking.preferred_time || "Not set"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Days</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {booking.preferred_days?.map((day: string) => (
                                        <Badge key={day} variant="secondary" className="font-bold">{day}</Badge>
                                    ))}
                                    {(!booking.preferred_days || booking.preferred_days.length === 0) && (
                                        <span className="text-sm text-muted-foreground">No days selected</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Users */}
                <div className="space-y-6">
                    {/* Student */}
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <GraduationCap className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Student</p>
                                    <h4 className="font-black text-lg">{booking.student.name}</h4>
                                    <p className="text-xs font-medium text-muted-foreground">Grade: {booking.student.grade || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Parent */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Parent</p>
                                    <h4 className="font-bold">{booking.parent.full_name}</h4>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-border">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Phone className="size-3" />
                                    {booking.parent.phone_number || "No phone"}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Mail className="size-3" />
                                    {booking.parent.email}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                <MessageSquare className="size-3" /> Chat with Parent
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Teacher */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Teacher</p>
                                    <h4 className="font-bold">{booking.gig.teacher.full_name}</h4>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-border">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Phone className="size-3" />
                                    {booking.gig.teacher.phone_number || "No phone"}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Mail className="size-3" />
                                    {booking.gig.teacher.email}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                <MessageSquare className="size-3" /> Chat with Teacher
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
