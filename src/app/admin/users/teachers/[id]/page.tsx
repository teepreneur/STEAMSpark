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
    Loader2, AlertCircle, BookOpen, DollarSign, Ban, Pencil,
    Save, X, Phone
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { getAdminHref } from "@/lib/admin-paths"
import { Label } from "@/components/ui/label"
import LocationPicker from "@/components/location-picker"
import { updateUserProfile } from "@/app/actions/admin-users"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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
    phone: string | null
    hourly_rate: number | null
    address: string | null
    latitude: number | null
    longitude: number | null
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

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<Partial<TeacherDetails>>({})

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
                router.push(getAdminHref('/admin/users/teachers'))
                return
            }

            setTeacher(teacherData as TeacherDetails)
            setEditData(teacherData)

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
    }, [id, router])

    async function handleSave() {
        setUpdating(true)
        const result = await updateUserProfile(id, editData)
        if (result.success) {
            setTeacher({ ...teacher!, ...editData } as TeacherDetails)
            setIsEditing(false)
        } else {
            alert(result.error || "Failed to update profile")
        }
        setUpdating(false)
    }

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

        // Log rejection
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

        alert('Teacher suspended')
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
                href={getAdminHref("/admin/users/teachers")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Teachers
            </Link>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="size-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-4 ring-white shadow-md">
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
                            {isEditing ? (
                                <Input 
                                    value={editData.full_name || ""} 
                                    onChange={e => setEditData({...editData, full_name: e.target.value})}
                                    className="text-2xl font-bold h-10 w-auto min-w-[300px]"
                                    placeholder="Teacher Full Name"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold">{teacher.full_name || 'Unnamed Teacher'}</h1>
                            )}
                            
                            {isVerified ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <CheckCircle className="size-3 mr-1" /> Verified
                                </Badge>
                            ) : hasPendingDocs ? (
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                    <Clock className="size-3 mr-1" /> Pending Review
                                </Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Unverified</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
                            <Mail className="size-4" /> {teacher.email}
                        </p>
                        {isEditing ? (
                            <div className="flex items-center gap-2 mt-2">
                                <Phone className="size-4 text-muted-foreground" />
                                <Input 
                                    value={editData.phone || ""} 
                                    onChange={e => setEditData({...editData, phone: e.target.value})}
                                    className="h-8 w-40"
                                    placeholder="Phone Number"
                                />
                            </div>
                        ) : teacher.phone && (
                            <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
                                <Phone className="size-4" /> {teacher.phone}
                            </p>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updating}>
                                <X className="size-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updating}>
                                {updating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                <Pencil className="size-4 mr-2" /> Edit Profile
                            </Button>
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
                            <Button variant="outline" onClick={handleSuspend} disabled={updating} className="text-red-500 hover:text-red-600">
                                <Ban className="size-4 mr-2" />
                                Suspend
                            </Button>
                        </>
                    )}
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

            {/* Location & Contact Info Section (New for teachers) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="size-4 text-primary" />
                            Base Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input 
                                            value={editData.country || ""} 
                                            onChange={e => setEditData({...editData, country: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City / Town</Label>
                                        <Input 
                                            value={editData.city || ""} 
                                            onChange={e => setEditData({...editData, city: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Address</Label>
                                    <Input 
                                        value={editData.address || ""} 
                                        onChange={e => setEditData({...editData, address: e.target.value})}
                                        placeholder="House No, Street Name..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Precise Location (Map)</Label>
                                    <LocationPicker 
                                        onLocationSelect={(loc) => {
                                            setEditData({
                                                ...editData,
                                                latitude: loc.lat,
                                                longitude: loc.lng,
                                                address: loc.address || editData.address
                                            })
                                        }}
                                        defaultLocation={editData.latitude && editData.longitude ? {
                                            lat: editData.latitude,
                                            lng: editData.longitude,
                                            address: editData.address || ""
                                        } : undefined}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Region</p>
                                    <p className="font-bold text-slate-900 mt-1">
                                        {[teacher.city, teacher.country].filter(Boolean).join(', ') || 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Exact Address</p>
                                    <p className="font-bold text-slate-900 mt-1">{teacher.address || 'No address pinned'}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <DollarSign className="size-4 text-emerald-600" />
                            Financial Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="space-y-2">
                                <Label>Hourly Rate (GHS)</Label>
                                <Input 
                                    type="number"
                                    value={editData.hourly_rate || ""} 
                                    onChange={e => setEditData({...editData, hourly_rate: Number(e.target.value)})}
                                    placeholder="e.g. 120"
                                />
                                <p className="text-[10px] text-muted-foreground">This rate is used for auto-populating concierge bookings.</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Default Rate</p>
                                <p className="text-2xl font-black text-emerald-600 mt-1">GHS {teacher.hourly_rate || '0'}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bio */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <h2 className="font-bold text-lg mb-2 flex items-center justify-between">
                    About
                    {isEditing && <Badge variant="outline">Editable</Badge>}
                </h2>
                {isEditing ? (
                    <Textarea 
                        value={editData.bio || ""} 
                        onChange={e => setEditData({...editData, bio: e.target.value})}
                        className="min-h-[150px]"
                        placeholder="Teacher biography..."
                    />
                ) : (
                    teacher.bio ? (
                        <p className="text-muted-foreground whitespace-pre-wrap">{teacher.bio}</p>
                    ) : (
                        <p className="text-muted-foreground italic">No bio provided</p>
                    )
                )}
            </div>

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
