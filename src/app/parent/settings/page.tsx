"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, User, Loader2, Save, Camera, Check, Bell, Shield, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { Tables } from "@/lib/types/supabase"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function ParentSettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [students, setStudents] = useState<Tables<'students'>[]>([])
    const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)

    // Profile Form State
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    // New Student Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newStudentName, setNewStudentName] = useState("")
    const [newStudentAge, setNewStudentAge] = useState("")
    const [newStudentGrade, setNewStudentGrade] = useState("")
    const [newStudentGoals, setNewStudentGoals] = useState("")
    const [adding, setAdding] = useState(false)

    // Class mode and location
    const [classMode, setClassMode] = useState<'online' | 'in_person' | 'hybrid'>('online')
    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setEmail(user.email || "")

                // Load profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setFullName(profileData.full_name || "")
                    setAvatarUrl(profileData.avatar_url || null)
                    setPhone((profileData as any).phone || "")
                    setClassMode((profileData as any).class_mode || 'online')
                    setCountry((profileData as any).country || "")
                    setCity((profileData as any).city || "")
                }

                // Load students
                const { data: studentsData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('parent_id', user.id)
                    .order('created_at', { ascending: false })

                if (studentsData) setStudents(studentsData)
            }
            setLoading(false)
        }
        loadData()
    }, [supabase])

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

    async function handleSaveProfile() {
        if (!profile) return
        setSaving(true)

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                avatar_url: avatarUrl,
                class_mode: classMode,
                country: country || null,
                city: city || null
            })
            .eq('id', profile.id)

        if (error) {
            console.error(error)
            alert("Failed to save profile.")
        } else {
            alert("Profile saved successfully!")
        }
        setSaving(false)
    }

    async function handleAddStudent() {
        if (!newStudentName || !profile) return

        setAdding(true)
        const { data, error } = await supabase
            .from('students')
            .insert({
                parent_id: profile.id,
                name: newStudentName,
                age: newStudentAge ? parseInt(newStudentAge) : null,
                grade: newStudentGrade,
                learning_goals: newStudentGoals
            })
            .select()

        if (error) {
            console.error("Add student error:", error)
            alert(error.message || "Failed to add child.")
        } else if (data) {
            setStudents([data[0], ...students])
            setIsDialogOpen(false)
            setNewStudentName("")
            setNewStudentAge("")
            setNewStudentGrade("")
            setNewStudentGoals("")
        }
        setAdding(false)
    }

    async function handleDeleteStudent(id: string) {
        if (!confirm("Are you sure you want to remove this profile?")) return

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id)

        if (!error) {
            setStudents(students.filter(s => s.id !== id))
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
    }

    // Calculate profile completion
    const calculateCompletion = () => {
        let completed = 0
        const total = 3
        if (fullName) completed++
        if (avatarUrl) completed++
        if (students.length > 0) completed++
        return Math.round((completed / total) * 100)
    }

    const profileCompletion = calculateCompletion()

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8 pb-24">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and family settings.</p>
            </div>

            {/* Profile Section */}
            <section className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                    {/* Avatar with upload */}
                    <div className="relative group/avatar cursor-pointer shrink-0">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 md:h-28 md:w-28 ring-4 ring-background shadow-md bg-muted flex items-center justify-center"
                            style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } : {}}
                        >
                            {!avatarUrl && <User className="size-10 text-muted-foreground" />}
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
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={email} disabled className="bg-muted" />
                            </div>
                        </div>

                        {/* Profile Completion */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-muted-foreground">Profile Completion</span>
                                <span className={cn("text-sm font-bold", profileCompletion === 100 ? "text-green-600" : "text-primary")}>{profileCompletion}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", profileCompletion === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${profileCompletion}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* My Family Section */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">My Family</h2>
                        <p className="text-muted-foreground text-sm">Manage your children's profiles for accurate bookings.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 font-bold shadow-lg">
                                <Plus className="size-4" /> Add Child
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add a New Student</DialogTitle>
                                <DialogDescription>
                                    Create a profile for your child to book classes tailored to them.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="e.g. Alex Johnson" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input id="age" type="number" value={newStudentAge} onChange={(e) => setNewStudentAge(e.target.value)} placeholder="e.g. 10" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="grade">Grade</Label>
                                        <Input id="grade" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)} placeholder="e.g. 5th Grade" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="goals">Learning Goals / Interests</Label>
                                    <Textarea id="goals" value={newStudentGoals} onChange={(e) => setNewStudentGoals(e.target.value)} placeholder="e.g. Loves robots, wants to learn Python..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddStudent} disabled={adding || !newStudentName} className="font-bold">
                                    {adding ? "Saving..." : "Save Profile"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <Card key={student.id} className="relative group overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {student.name[0]}
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-xl">{student.name}</CardTitle>
                                    <CardDescription>{student.grade} • {student.age} years old</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                    {student.learning_goals || "No learning goals specified."}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 pt-0">
                                <Button variant="outline" size="sm" className="h-8 px-3 font-medium" asChild>
                                    <Link href={`/parent/children/${student.id}`}>Edit Profile</Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" onClick={() => handleDeleteStudent(student.id)}>
                                    <Trash2 className="size-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {students.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/20">
                            <User className="size-12 opacity-20 mx-auto mb-2" />
                            <p>No children added yet. Add a profile to start booking.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Class Preferences */}
            <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <MapPin className="text-primary size-5" />
                        Class Preferences
                    </h3>
                </div>
                <div className="space-y-6">
                    {/* Class Mode */}
                    <div className="space-y-3">
                        <Label>Preferred Class Type</Label>
                        <p className="text-sm text-muted-foreground">How would you like your child to attend classes?</p>
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
                                Your Location (for finding nearby tutors)
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
                        Notifications
                    </h3>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-foreground font-medium">Session Reminders</p>
                            <p className="text-muted-foreground text-sm">Get notified before upcoming classes.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-foreground font-medium">Booking Confirmations</p>
                            <p className="text-muted-foreground text-sm">Receive alerts when bookings are confirmed.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-foreground font-medium">Marketing Emails</p>
                            <p className="text-muted-foreground text-sm">Receive tips and STEAM news.</p>
                        </div>
                        <Switch />
                    </div>
                </div>
            </section>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-5xl mx-auto flex justify-end gap-4 px-4">
                    <Button variant="outline">Discard Changes</Button>
                    <Button className="font-medium shadow-lg gap-2" onClick={handleSaveProfile} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-5" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
