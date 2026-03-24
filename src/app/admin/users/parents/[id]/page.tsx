"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, User, Mail, MapPin, Clock, Calendar,
    CheckCircle, XCircle, FileText, Image, ExternalLink,
    Loader2, AlertCircle, BookOpen, DollarSign, Ban, Pencil,
    Users, Plus, Phone, Save, X, Sparkles
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { getAdminHref } from "@/lib/admin-paths"
import LocationPicker from "@/components/location-picker"
import { updateUserProfile } from "@/app/actions/admin-users"

interface Child {
    id: string
    name: string
    date_of_birth: string | null
    grade: string | null
    interests: string[] | null
}

interface ParentDetails {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    phone: string | null
    city: string | null
    country: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    created_at: string
}

export default function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [parent, setParent] = useState<ParentDetails | null>(null)
    const [children, setChildren] = useState<Child[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<Partial<ParentDetails>>({})

    useEffect(() => {
        async function loadParent() {
            setLoading(true)

            // Fetch parent profile
            const { data: parentData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .eq('role', 'parent')
                .single()

            if (error || !parentData) {
                console.error('Error loading parent:', error)
                router.push(getAdminHref('/admin/users/parents'))
                return
            }

            setParent(parentData)
            setEditData(parentData)

            // Fetch children
            const { data: childrenData } = await supabase
                .from('students')
                .select('*')
                .eq('parent_id', id)

            setChildren(childrenData || [])

            // Fetch bookings
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select(`
                    id, 
                    status, 
                    created_at,
                    gig:gigs(title, subject, price)
                `)
                .eq('parent_id', id)
                .order('created_at', { ascending: false })

            setBookings(bookingsData || [])
            setLoading(false)
        }
        loadParent()
    }, [id, router])

    async function handleSave() {
        setUpdating(true)
        const result = await updateUserProfile(id, editData)
        if (result.success) {
            setParent({ ...parent!, ...editData })
            setIsEditing(false)
        } else {
            alert(result.error || "Failed to update profile")
        }
        setUpdating(false)
    }

    // child editing
    const [editingChild, setEditingChild] = useState<Child | null>(null)
    const [childEditData, setChildEditData] = useState<any>({})

    async function handleSaveChild() {
        if (!editingChild) return
        setUpdating(true)
        
        const { error } = await supabase
            .from('students')
            .update({
                name: childEditData.name,
                date_of_birth: childEditData.date_of_birth,
                grade: childEditData.grade,
                preferred_class_mode: childEditData.preferred_class_mode,
                latitude: childEditData.latitude,
                longitude: childEditData.longitude,
                address: childEditData.address
            })
            .eq('id', editingChild.id)

        if (!error) {
            setChildren(children.map(c => c.id === editingChild.id ? { ...c, ...childEditData } : c))
            setEditingChild(null)
        } else {
            alert("Failed to update child profile")
        }
        setUpdating(false)
    }

    if (loading || !parent) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href={getAdminHref("/admin/users/parents")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Parents
            </Link>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="size-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-4 ring-white shadow-md">
                        {parent.avatar_url ? (
                            <img src={parent.avatar_url} className="size-full object-cover" alt="" />
                        ) : (
                            <div className="size-full flex items-center justify-center">
                                <User className="size-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900">{parent.full_name || 'Unnamed Parent'}</h1>
                            <Badge className="bg-blue-100 text-blue-700">Parent</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
                            <Mail className="size-4" /> {parent.email}
                        </p>
                        {parent.phone && (
                            <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
                                <Phone className="size-4" /> {parent.phone}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updating}>
                                <X className="size-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updating} className="bg-primary text-white">
                                {updating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="size-4 mr-2" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Children */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Location Info */}
                    <Card className="shadow-sm border-0 bg-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <MapPin className="size-4 text-primary" />
                                Residential & Class Location
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
                                            placeholder="House No, Street Name, Landmark..."
                                        />
                                    </div>
                                    <div className="space-y-2 pt-2 border-t">
                                        <Label className="flex items-center justify-between mb-2">
                                            <span>Map Precise Location</span>
                                            <Badge variant="outline" className="text-[10px] text-primary">Matching Data</Badge>
                                        </Label>
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
                                            {[parent.city, parent.country].filter(Boolean).join(', ') || 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Exact Address</p>
                                        <p className="font-bold text-slate-900 mt-1">{parent.address || 'No address pinned'}</p>
                                    </div>
                                    {parent.latitude && parent.longitude && (
                                        <div className="col-span-2 pt-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle className="size-3 mr-1" /> Map Coordinates Set
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Children Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Users className="size-5 text-primary" />
                                Registered Children ({children.length})
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {children.map(child => (
                                <Card key={child.id} className="border-0 shadow-sm hover:shadow-md transition-shadow relative group">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-black text-lg text-slate-900">{child.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {child.grade ? `${child.grade} Grade` : 'Grade not set'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge className="bg-slate-100 text-slate-600 border-0">
                                                    {child.date_of_birth ? format(parseISO(child.date_of_birth), 'MMM d, yyyy') : 'DOB not set'}
                                                </Badge>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        setEditingChild(child)
                                                        setChildEditData(child)
                                                    }}
                                                >
                                                    <Pencil className="size-4 text-primary" />
                                                </Button>
                                            </div>
                                        </div>
                                        {child.interests && child.interests.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-4">
                                                {child.interests.slice(0, 3).map((i, idx) => (
                                                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] uppercase font-bold">
                                                        {i}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {children.length === 0 && (
                                <div className="col-span-2 p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Users className="size-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold">No children added yet</p>
                                </div>
                            )}
                        </div>

                        {/* Child Edit Overlay/Section */}
                        {editingChild && (
                            <Card className="border-2 border-primary bg-primary/5 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold">Editing Profile: {editingChild.name}</CardTitle>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingChild(null)}>
                                        <X className="size-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {/* Edit fields here... existing logic */}
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input 
                                                value={childEditData.name || ""} 
                                                onChange={e => setChildEditData({...childEditData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input 
                                                type="date"
                                                value={childEditData.date_of_birth || ""} 
                                                onChange={e => setChildEditData({...childEditData, date_of_birth: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Grade</Label>
                                            <Input 
                                                value={childEditData.grade || ""} 
                                                onChange={e => setChildEditData({...childEditData, grade: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Class Mode</Label>
                                            <select 
                                                className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm"
                                                value={childEditData.preferred_class_mode || ""}
                                                onChange={e => setChildEditData({...childEditData, preferred_class_mode: e.target.value})}
                                            >
                                                <option value="">Select Mode</option>
                                                <option value="Online">Online</option>
                                                <option value="In-Person">In-Person</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="flex items-center justify-between mb-2">
                                            <span>Student Class Location (Map)</span>
                                            <Badge variant="outline" className="text-[10px] text-primary">Pin exact home/school</Badge>
                                        </Label>
                                        <LocationPicker 
                                            onLocationSelect={(loc) => {
                                                setChildEditData({
                                                    ...childEditData,
                                                    latitude: loc.lat,
                                                    longitude: loc.lng,
                                                    address: loc.address || childEditData.address
                                                })
                                            }}
                                            defaultLocation={childEditData.latitude && childEditData.longitude ? {
                                                lat: childEditData.latitude,
                                                lng: childEditData.longitude,
                                                address: childEditData.address || ""
                                            } : undefined}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setEditingChild(null)}>Cancel</Button>
                                        <Button onClick={handleSaveChild} disabled={updating}>
                                            {updating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                                            Update Child Info
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Column: Bookings & Stats */}
                <div className="space-y-8">
                    {/* Stats */}
                    <Card className="border-0 shadow-sm bg-primary text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-black tracking-widest opacity-80">Parent Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black">{bookings.length}</p>
                                    <p className="text-xs font-bold opacity-80 italic">Lifetime Bookings</p>
                                </div>
                                <BookOpen className="size-10 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Booking History */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Clock className="size-5 text-primary" />
                            Recent Bookings
                        </h2>
                        <div className="space-y-3">
                            {bookings.map(booking => (
                                <div key={booking.id} className="p-4 bg-white rounded-xl border-l-4 border-l-primary shadow-sm hover:translate-x-1 transition-transform">
                                    <p className="font-bold text-sm truncate">{booking.gig?.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <Badge className={cn(
                                            "text-[10px] uppercase font-black",
                                            booking.status === 'confirmed' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {booking.status}
                                        </Badge>
                                        <p className="text-[10px] text-muted-foreground underline underline-offset-2">
                                            {format(parseISO(booking.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {bookings.length === 0 && (
                                <p className="text-sm text-muted-foreground italic px-4">No booking history yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="p-6 bg-slate-50 border rounded-2xl space-y-3">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Onboarding Details</p>
                        <div>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Parent Since</p>
                            <p className="text-sm font-black text-slate-900">{format(parseISO(parent.created_at), 'MMMM d, yyyy')}</p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-slate-500 font-medium tracking-tight">System Unique ID</p>
                            <code className="text-[10px] bg-slate-100 p-1 rounded font-mono break-all">{parent.id}</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
