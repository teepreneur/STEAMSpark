"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, GraduationCap, Mail, MapPin, Clock, Calendar,
    CheckCircle, XCircle, FileText, Image, ExternalLink,
    Loader2, AlertCircle, BookOpen, DollarSign, Ban, Pencil
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"

interface TeacherDetails {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    bio: string | null
    subjects: string[] | null
    class_mode: string | null
    city: string | null
    country: string | null
    created_at: string
    verified_at: string | null
    cv_url: string | null
    id_url: string | null
    photo_url: string | null
}

interface Gig {
    id: string
    title: string
    subject: string | null
    price: number
    status: string | null
}

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [teacher, setTeacher] = useState<TeacherDetails | null>(null)
    const [gigs, setGigs] = useState<Gig[]>([])
    const [stats, setStats] = useState({ earnings: 0, bookings: 0, students: 0 })
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectDialog, setShowRejectDialog] = useState(false)

    useEffect(() => {
        async function loadTeacher() {
            setLoading(true)

            // Fetch teacher profile
            const { data: teacherData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .eq('role', 'teacher')
                .single()

            if (error || !teacherData) {
                console.error('Error loading teacher:', error)
                router.push('/admin/users/teachers')
                return
            }

            setTeacher(teacherData)

            // Fetch gigs
            const { data: gigsData } = await supabase
                .from('gigs')
                .select('id, title, subject, price, status')
                .eq('teacher_id', id)

            setGigs(gigsData || [])

            // Fetch stats
            const gigIds = (gigsData || []).map(g => g.id)

            if (gigIds.length > 0) {
                const { data: bookingsData } = await supabase
                    .from('bookings')
                    .select('id, status, gig:gigs!inner(price)')
                    .in('gig_id', gigIds)
                    .eq('status', 'confirmed')

                const earnings = (bookingsData || []).reduce((sum, b: any) => {
                    return sum + (b.gig?.price || 0)
                }, 0)

                const { count: studentCount } = await supabase
                    .from('bookings')
                    .select('student_id', { count: 'exact', head: true })
                    .in('gig_id', gigIds)
                    .eq('status', 'confirmed')

                setStats({
                    earnings,
                    bookings: bookingsData?.length || 0,
                    students: studentCount || 0
                })
            }

            setLoading(false)
        }
        loadTeacher()
    }, [id, supabase, router])

    async function handleVerify() {
        if (!teacher) return
        setUpdating(true)

        const { error } = await supabase
            .from('profiles')
            .update({ verified_at: new Date().toISOString() })
            .eq('id', teacher.id)

        if (!error) {
            // Log admin action
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('admin_logs').insert({
                admin_id: user?.id,
                action: 'verify_teacher',
                target_type: 'teacher',
                target_id: teacher.id,
                details: { teacher_name: teacher.full_name }
            })

            setTeacher({ ...teacher, verified_at: new Date().toISOString() })
        } else {
            alert('Failed to verify teacher')
        }
        setUpdating(false)
    }

    async function handleReject() {
        if (!teacher) return
        setUpdating(true)

        // Log rejection (could also send email notification)
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action: 'reject_verification',
            target_type: 'teacher',
            target_id: teacher.id,
            details: {
                teacher_name: teacher.full_name,
                rejection_reason: rejectionReason
            }
        })

        // Clear verification documents
        await supabase
            .from('profiles')
            .update({ cv_url: null, id_url: null, photo_url: null })
            .eq('id', teacher.id)

        setTeacher({ ...teacher, cv_url: null, id_url: null, photo_url: null })
        setShowRejectDialog(false)
        setRejectionReason("")
        setUpdating(false)
    }

    async function handleSuspend() {
        if (!teacher) return
        const reason = prompt('Enter suspension reason:')
        if (!reason) return

        setUpdating(true)

        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('admin_logs').insert({
            admin_id: user?.id,
            action: 'suspend_teacher',
            target_type: 'teacher',
            target_id: teacher.id,
            details: {
                teacher_name: teacher.full_name,
                reason
            }
        })

        // Could update a 'suspended' field on profiles
        alert('Teacher suspended (functionality can be extended)')
        setUpdating(false)
    }

    if (loading || !teacher) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const isVerified = !!teacher.verified_at
    const hasPendingDocs = teacher.cv_url || teacher.id_url

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/admin/users/teachers"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Teachers
            </Link>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="size-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        {teacher.avatar_url ? (
                            <img src={teacher.avatar_url} className="size-full object-cover" alt="" />
                        ) : (
                            <div className="size-full flex items-center justify-center">
                                <GraduationCap className="size-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{teacher.full_name || 'Unnamed Teacher'}</h1>
                            {isVerified ? (
                                <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="size-3 mr-1" /> Verified
                                </Badge>
                            ) : hasPendingDocs ? (
                                <Badge className="bg-orange-100 text-orange-700">
                                    <Clock className="size-3 mr-1" /> Pending Review
                                </Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-600">Unverified</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="size-4" /> {teacher.email}
                        </p>
                        {(teacher.city || teacher.country) && (
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <MapPin className="size-4" /> {[teacher.city, teacher.country].filter(Boolean).join(', ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                    {!isVerified && hasPendingDocs && (
                        <>
                            <Button onClick={handleVerify} disabled={updating} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="size-4 mr-2" />
                                Verify Teacher
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 border-red-300"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={updating}
                            >
                                <XCircle className="size-4 mr-2" />
                                Reject
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={handleSuspend} disabled={updating}>
                        <Ban className="size-4 mr-2" />
                        Suspend
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`mailto:${teacher.email}`}>
                            <Mail className="size-4 mr-2" />
                            Email
                        </a>
                    </Button>
                </div>
            </div>

            {/* Rejection dialog */}
            {showRejectDialog && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                    <h3 className="font-bold text-lg text-red-700 dark:text-red-400 mb-2">Reject Verification</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                        Provide a reason for rejection. The teacher will need to resubmit documents.
                    </p>
                    <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mb-4"
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleReject}
                            disabled={updating || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Confirm Rejection
                        </Button>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Earnings</p>
                            <p className="text-xl font-bold">GHS {stats.earnings.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <BookOpen className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Completed Bookings</p>
                            <p className="text-xl font-bold">{stats.bookings}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <GraduationCap className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                            <p className="text-xl font-bold">{stats.students}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Documents */}
            {hasPendingDocs && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h2 className="font-bold text-lg mb-4">Verification Documents</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {teacher.cv_url && (
                            <a
                                href={teacher.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <FileText className="size-8 text-blue-500" />
                                <div>
                                    <p className="font-medium">CV / Resume</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        View document <ExternalLink className="size-3" />
                                    </p>
                                </div>
                            </a>
                        )}
                        {teacher.id_url && (
                            <a
                                href={teacher.id_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <FileText className="size-8 text-green-500" />
                                <div>
                                    <p className="font-medium">ID Document</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        View document <ExternalLink className="size-3" />
                                    </p>
                                </div>
                            </a>
                        )}
                        {teacher.photo_url && (
                            <a
                                href={teacher.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <Image className="size-8 text-purple-500" />
                                <div>
                                    <p className="font-medium">Profile Photo</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        View image <ExternalLink className="size-3" />
                                    </p>
                                </div>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Bio */}
            {teacher.bio && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h2 className="font-bold text-lg mb-2">About</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{teacher.bio}</p>
                </div>
            )}

            {/* Subjects */}
            {teacher.subjects && teacher.subjects.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                    <h2 className="font-bold text-lg mb-3">Subjects</h2>
                    <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map((subject, i) => (
                            <Badge key={i} variant="secondary" className="text-sm">{subject}</Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Gigs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h2 className="font-bold text-lg mb-4">Courses ({gigs.length})</h2>
                {gigs.length === 0 ? (
                    <p className="text-muted-foreground">No courses created yet</p>
                ) : (
                    <div className="space-y-3">
                        {gigs.map((gig) => (
                            <div key={gig.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{gig.title}</p>
                                    <p className="text-sm text-muted-foreground">{gig.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">GHS {gig.price}</p>
                                    <Badge variant="secondary" className="capitalize">{gig.status || 'draft'}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h2 className="font-bold text-lg mb-4">Account Details</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Account ID</p>
                        <p className="font-mono text-xs">{teacher.id}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p>{format(parseISO(teacher.created_at), 'MMMM d, yyyy')}</p>
                    </div>
                    {teacher.verified_at && (
                        <div>
                            <p className="text-muted-foreground">Verified On</p>
                            <p>{format(parseISO(teacher.verified_at), 'MMMM d, yyyy')}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground">Class Mode</p>
                        <p className="capitalize">{teacher.class_mode || 'Not specified'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
