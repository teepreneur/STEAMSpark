"use client"

import {
    Edit, Check, BadgeCheck, Info, AlertTriangle,
    CloudUpload, Save, Bell, User, X, Plus, Loader2, Camera, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Tables } from "@/lib/types/supabase"

export default function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)

    // Form State
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [bio, setBio] = useState("")
    const [subjects, setSubjects] = useState<string[]>([])
    const [hourlyRate, setHourlyRate] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [newSubject, setNewSubject] = useState("")
    const [isAddingSubject, setIsAddingSubject] = useState(false)

    // Class mode and location
    const [classMode, setClassMode] = useState<'online' | 'in_person' | 'hybrid'>('online')
    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setEmail(user.email || "")

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setProfile(data)
                    setFullName(data.full_name || "")
                    setBio(data.bio || "")
                    setSubjects(data.subjects || [])
                    setHourlyRate(data.hourly_rate?.toString() || "")
                    setAvatarUrl(data.avatar_url || null)
                    setClassMode((data as any).class_mode || 'online')
                    setCountry((data as any).country || "")
                    setCity((data as any).city || "")
                }
            }
            setLoading(false)
        }
        loadProfile()
    }, [supabase])

    // Calculate profile completion
    const calculateCompletion = () => {
        let completed = 0
        const total = 5
        if (fullName) completed++
        if (bio && bio.length > 20) completed++
        if (subjects.length > 0) completed++
        if (hourlyRate) completed++
        if (avatarUrl) completed++
        return Math.round((completed / total) * 100)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingAvatar(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'gig-media')
            formData.append('folder', 'avatars')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.error) {
                alert(`Upload failed: ${data.error}`)
            } else {
                setAvatarUrl(data.url)
            }
        } catch (err) {
            console.error('Upload error:', err)
            alert('Failed to upload avatar')
        } finally {
            setUploadingAvatar(false)
        }
    }

    async function handleSave() {
        if (!profile) return
        setSaving(true)

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                bio: bio,
                subjects: subjects,
                hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
                avatar_url: avatarUrl,
                class_mode: classMode,
                country: country || null,
                city: city || null
            })
            .eq('id', profile.id)

        if (error) {
            console.error(error)
            alert("Failed to save changes.")
        } else {
            alert("Profile saved successfully!")
        }
        setSaving(false)
    }

    const handleAddSubject = () => {
        if (newSubject && !subjects.includes(newSubject)) {
            setSubjects([...subjects, newSubject])
            setNewSubject("")
            setIsAddingSubject(false)
        }
    }

    const removeSubject = (subj: string) => {
        setSubjects(subjects.filter(s => s !== subj))
    }

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
    }

    const profileCompletion = calculateCompletion()

    return (
        <div className="flex flex-col gap-6 md:gap-8 pb-24">

            {/* Page Heading */}
            <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-foreground">Settings & Profile</h1>
                <p className="text-muted-foreground">Manage your personal information, teaching credentials, and account preferences.</p>
            </div>

            {/* Profile Header Card */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm relative overflow-hidden group">
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center relative z-10">
                    {/* Avatar with upload */}
                    <div className="relative group/avatar cursor-pointer shrink-0">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-md bg-muted flex items-center justify-center"
                            style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } : {}}
                        >
                            {!avatarUrl && <User className="size-12 text-muted-foreground" />}
                        </div>
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                            {uploadingAvatar ? (
                                <Loader2 className="text-white size-6 animate-spin" />
                            ) : (
                                <Camera className="text-white size-6" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                            />
                        </label>
                        {profile?.role === 'teacher' && (
                            <span className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center" title="Verified Teacher">
                                <Check className="text-white size-3.5" />
                            </span>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{fullName || "Unnamed Teacher"}</h2>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <span className="text-sm font-medium">{email}</span>
                                    <span className="mx-1">|</span>
                                    <span className="text-sm">STEAM Spark Educator</span>
                                </div>
                            </div>
                            <Button variant="outline">Public View</Button>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                    Profile Completion
                                    <Info className="text-primary size-4" />
                                </span>
                                <span className={cn("text-sm font-bold", profileCompletion === 100 ? "text-green-600" : "text-primary")}>{profileCompletion}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", profileCompletion === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${profileCompletion}%` }}></div>
                            </div>
                            {profileCompletion < 100 && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <AlertTriangle className="size-4 text-yellow-500" />
                                    Complete your profile to attract more students
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Personal Details Section */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <User className="text-primary size-5" />
                                Personal Details
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Full Name *</Label>
                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Doe" />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Hourly Rate (GHS)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">GHS</span>
                                    <Input
                                        type="number"
                                        className="pl-12"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(e.target.value)}
                                        placeholder="50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Your base hourly teaching rate</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Subjects You Teach</Label>
                                <div className="w-full rounded-lg border border-input p-2 flex flex-wrap gap-2 min-h-[50px] bg-background">
                                    {subjects.map(subject => (
                                        <Badge key={subject} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 gap-1 pr-1">
                                            {subject} <button onClick={() => removeSubject(subject)} className="hover:text-blue-900 dark:hover:text-blue-100"><X className="size-3" /></button>
                                        </Badge>
                                    ))}

                                    {isAddingSubject ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                autoFocus
                                                className="h-6 w-32 text-xs"
                                                value={newSubject}
                                                onChange={(e) => setNewSubject(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddSubject()
                                                    if (e.key === 'Escape') setIsAddingSubject(false)
                                                }}
                                            />
                                            <Button size="icon" className="size-6" onClick={handleAddSubject}><Check className="size-3" /></Button>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-muted/50 hover:bg-muted cursor-pointer gap-1" onClick={() => setIsAddingSubject(true)}>
                                            <Plus className="size-3" /> Add Subject
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Bio</Label>
                                <Textarea className="resize-none" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell parents about your teaching experience, style, and what makes you a great STEAM educator..." maxLength={500} />
                                <p className="text-right text-xs text-muted-foreground">{bio.length}/500 characters</p>
                            </div>
                        </div>
                    </section>

                    {/* Teaching Preferences */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <MapPin className="text-primary size-5" />
                                Teaching Preferences
                            </h3>
                        </div>
                        <div className="space-y-6">
                            {/* Class Mode */}
                            <div className="space-y-3">
                                <Label>Class Type</Label>
                                <p className="text-sm text-muted-foreground">How do you prefer to teach your classes?</p>
                                <div className="flex flex-wrap gap-3">
                                    {(['online', 'in_person', 'hybrid'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setClassMode(mode)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                                classMode === mode
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-muted border-border"
                                            )}
                                        >
                                            {mode === 'online' && '🌐 Online Only'}
                                            {mode === 'in_person' && '📍 In-Person Only'}
                                            {mode === 'hybrid' && '🔄 Hybrid (Both)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location (shown for in_person or hybrid) */}
                            {(classMode === 'in_person' || classMode === 'hybrid') && (
                                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="size-4 text-primary" />
                                        Your Location (for matching with nearby students)
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Country</Label>
                                            <select
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="">Select country</option>
                                                <option value="Ghana">Ghana</option>
                                                <option value="Nigeria">Nigeria</option>
                                                <option value="Kenya">Kenya</option>
                                                <option value="South Africa">South Africa</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="United States">United States</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>City / Town</Label>
                                            <Input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="e.g. Accra, Lagos, Nairobi"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notification Settings */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Bell className="text-primary size-5" />
                                Notification Preferences
                            </h3>
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-foreground font-medium">Student Bookings</p>
                                    <p className="text-muted-foreground text-sm">Receive alerts when a student books a new session.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-foreground font-medium">Course Updates</p>
                                    <p className="text-muted-foreground text-sm">Notify me about updates to curriculum resources.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-foreground font-medium">Marketing Emails</p>
                                    <p className="text-muted-foreground text-sm">Receive tips, trends, and STEAM news.</p>
                                </div>
                                <Switch />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Verification & Status */}
                <div className="flex flex-col gap-8">
                    {/* Verification Card */}
                    <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <BadgeCheck className="text-primary size-5" />
                                Verification
                            </h3>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-900/50 font-bold">PENDING</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            To ensure student safety, all STEAM Spark educators must complete a background check.
                        </p>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer mb-6 group">
                            <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <CloudUpload className="text-primary size-6" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                        </div>
                    </section>

                    {/* Quick Tips */}
                    <section className="bg-primary/5 rounded-xl border border-primary/20 p-6">
                        <h3 className="text-lg font-bold text-primary mb-3">💡 Profile Tips</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <Check className="size-4 text-primary shrink-0 mt-0.5" />
                                <span>Add a professional photo to build trust</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="size-4 text-primary shrink-0 mt-0.5" />
                                <span>Write a bio that highlights your teaching style</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="size-4 text-primary shrink-0 mt-0.5" />
                                <span>Set competitive hourly rates for your area</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-[1440px] mx-auto flex justify-end gap-4 px-6 md:px-12">
                    <Button variant="outline">Discard Changes</Button>
                    <Button className="font-medium shadow-lg gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-5" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
