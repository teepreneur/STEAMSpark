"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    ArrowLeft, CloudUpload, X, Plus, Minus, Trash2,
    FlaskConical, Bot, Cog, Palette, Calculator, Loader2, Save,
    Video, MapPin, Blend
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const subjects = [
    { id: "science", label: "Science", icon: FlaskConical },
    { id: "technology", label: "Tech", icon: Bot },
    { id: "engineering", label: "Engineer", icon: Cog },
    { id: "art", label: "Arts", icon: Palette },
    { id: "math", label: "Math", icon: Calculator },
]

interface Topic {
    id: string
    title: string
    outcome: string
}

export default function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [title, setTitle] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("engineering")
    const [description, setDescription] = useState("")

    // Curriculum
    const [topics, setTopics] = useState<Topic[]>([{ id: "1", title: "", outcome: "" }])

    // Schedule & Pricing
    const [totalSessions, setTotalSessions] = useState(4)
    const [sessionDuration, setSessionDuration] = useState(1)
    const [price, setPrice] = useState("50")
    const [groupEnabled, setGroupEnabled] = useState(true)
    const [maxStudents, setMaxStudents] = useState(5)
    const [classType, setClassType] = useState("online")

    // Requirements & Media
    const [requirements, setRequirements] = useState<string[]>([])
    const [requirementInput, setRequirementInput] = useState("")
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [coverImageName, setCoverImageName] = useState<string | null>(null)

    useEffect(() => {
        async function loadGig() {
            setLoading(true)
            const { data, error } = await supabase
                .from('gigs')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setTitle(data.title || "")
                setDescription(data.description || "")
                setSelectedSubject(data.subject || "engineering")
                setPrice(data.price?.toString() || "50")
                setTotalSessions((data as any).total_sessions || 4)
                setSessionDuration((data as any).session_duration || 1)
                setMaxStudents((data as any).max_students || 5)
                setGroupEnabled((data as any).max_students > 1)
                setClassType((data as any).class_type || "online")
                setCoverImage((data as any).cover_image || null)

                // Load topics
                if ((data as any).topics && Array.isArray((data as any).topics)) {
                    setTopics((data as any).topics)
                }

                // Load requirements
                if ((data as any).requirements && Array.isArray((data as any).requirements)) {
                    setRequirements((data as any).requirements)
                }
            }
            setLoading(false)
        }
        loadGig()
    }, [id, supabase])

    // Topic management
    const addTopic = () => {
        setTopics([...topics, { id: Date.now().toString(), title: "", outcome: "" }])
    }

    const removeTopic = (topicId: string) => {
        if (topics.length > 1) {
            setTopics(topics.filter(t => t.id !== topicId))
        }
    }

    const updateTopic = (topicId: string, field: 'title' | 'outcome', value: string) => {
        setTopics(topics.map(t => t.id === topicId ? { ...t, [field]: value } : t))
    }

    // Requirements management
    const addRequirement = () => {
        if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
            setRequirements([...requirements, requirementInput.trim()])
            setRequirementInput("")
        }
    }

    const removeRequirement = (req: string) => {
        setRequirements(requirements.filter(r => r !== req))
    }

    // File upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'gig-media')
            formData.append('folder', 'covers')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.error) {
                setError(data.error)
            } else {
                setCoverImage(data.url)
                setCoverImageName(file.name)
                setError(null)
            }
        } catch (err) {
            console.error('Upload error:', err)
            setError('Failed to upload file')
        } finally {
            setUploading(false)
        }
    }

    async function handleSave() {
        if (!title || !price) {
            setError("Please fill in required fields (title, price)")
            return
        }

        setSaving(true)
        setError(null)

        const validTopics = topics.filter(t => t.title.trim())

        const { error: updateError } = await supabase
            .from('gigs')
            .update({
                title,
                subject: selectedSubject,
                description,
                price: parseFloat(price) || 50,
                duration: sessionDuration * 60,
                total_sessions: totalSessions,
                session_duration: sessionDuration,
                max_students: groupEnabled ? maxStudents : 1,
                cover_image: coverImage,
                requirements: requirements.length > 0 ? requirements : null,
                topics: validTopics.length > 0 ? validTopics : null,
                class_type: classType
            })
            .eq('id', id)

        if (updateError) {
            console.error("Update error:", updateError)
            setError(updateError.message || "Failed to save changes")
        } else {
            router.push('/teacher/gigs')
            router.refresh()
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const pricePerSession = parseFloat(price) || 50
    const totalPrice = pricePerSession * totalSessions

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
            <Link href="/teacher/gigs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
                <ArrowLeft className="size-4" /> Back to My Courses
            </Link>

            <div>
                <h1 className="text-3xl font-black text-foreground">Edit Course</h1>
                <p className="text-muted-foreground">Update your course details below.</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {/* Section 1: Course Overview */}
            <div className="bg-card rounded-xl border p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="text-lg font-bold">Course Overview</h3>

                {/* Title */}
                <div className="space-y-2">
                    <Label>Course Title *</Label>
                    <Input
                        placeholder="e.g., Build Your First Robot with Python"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={80}
                    />
                </div>

                {/* Subject Selection */}
                <div className="space-y-3">
                    <Label>Primary Subject *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                type="button"
                                onClick={() => setSelectedSubject(subject.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    selectedSubject === subject.id
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent bg-muted hover:bg-primary/5"
                                )}
                            >
                                <subject.icon className={cn("size-6", selectedSubject === subject.id ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn("text-sm font-semibold", selectedSubject === subject.id ? "text-primary" : "text-muted-foreground")}>{subject.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Class Type Selection */}
                <div className="space-y-3">
                    <Label>Class Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setClassType("online")}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                classType === "online"
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-transparent bg-muted hover:bg-muted/80"
                            )}
                        >
                            <Video className={cn("size-6", classType === "online" ? "text-blue-500" : "text-muted-foreground")} />
                            <span className={cn("text-sm font-semibold", classType === "online" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>Online</span>
                            <span className="text-xs text-muted-foreground text-center">Via video call</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setClassType("in_person")}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                classType === "in_person"
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-transparent bg-muted hover:bg-muted/80"
                            )}
                        >
                            <MapPin className={cn("size-6", classType === "in_person" ? "text-green-500" : "text-muted-foreground")} />
                            <span className={cn("text-sm font-semibold", classType === "in_person" ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>In-Person</span>
                            <span className="text-xs text-muted-foreground text-center">At location</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setClassType("hybrid")}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                classType === "hybrid"
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-transparent bg-muted hover:bg-muted/80"
                            )}
                        >
                            <Blend className={cn("size-6", classType === "hybrid" ? "text-purple-500" : "text-muted-foreground")} />
                            <span className={cn("text-sm font-semibold", classType === "hybrid" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")}>Hybrid</span>
                            <span className="text-xs text-muted-foreground text-center">Both options</span>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label>Course Description</Label>
                    <Textarea
                        placeholder="Describe what students will learn..."
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            {/* Section 2: Curriculum */}
            <div className="bg-card rounded-xl border p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="text-lg font-bold">Curriculum</h3>
                <p className="text-muted-foreground text-sm -mt-4">Add the topics/lessons you'll cover.</p>

                <div className="space-y-4">
                    {topics.map((topic, index) => (
                        <div key={topic.id} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-primary">Lesson {index + 1}</span>
                                {topics.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTopic(topic.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Topic/Lesson Title</Label>
                                <Input
                                    placeholder="e.g., Introduction to Circuit Boards"
                                    value={topic.title}
                                    onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Student Outcome</Label>
                                <Input
                                    placeholder="e.g., Students will build their first LED circuit"
                                    value={topic.outcome}
                                    onChange={(e) => updateTopic(topic.id, 'outcome', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addTopic} className="gap-2 w-fit">
                    <Plus className="size-4" /> Add Another Lesson
                </Button>
            </div>

            {/* Section 3: Schedule & Pricing */}
            <div className="bg-card rounded-xl border p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="text-lg font-bold">Schedule & Pricing</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total Sessions */}
                    <div className="space-y-2">
                        <Label>Total Sessions *</Label>
                        <div className="flex items-center">
                            <Button type="button" variant="outline" size="icon" className="rounded-r-none" onClick={() => setTotalSessions(Math.max(1, totalSessions - 1))}>
                                <Minus className="size-4" />
                            </Button>
                            <Input
                                type="number"
                                className="w-20 rounded-none text-center border-x-0"
                                value={totalSessions}
                                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
                                min={1}
                                max={52}
                            />
                            <Button type="button" variant="outline" size="icon" className="rounded-l-none" onClick={() => setTotalSessions(Math.min(52, totalSessions + 1))}>
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Duration per Session */}
                    <div className="space-y-2">
                        <Label>Duration per Session *</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3].map((hours) => (
                                <button
                                    key={hours}
                                    type="button"
                                    onClick={() => setSessionDuration(hours)}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all",
                                        sessionDuration === hours
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    {hours}h
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Price per Session */}
                <div className="space-y-2">
                    <Label>Price per Session (GHS) *</Label>
                    <div className="relative max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">GHS</span>
                        <Input
                            type="number"
                            className="pl-14"
                            placeholder="50"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min={1}
                        />
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Price per session</span>
                        <span className="font-bold">GHS {pricePerSession.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Number of sessions</span>
                        <span className="font-bold">× {totalSessions}</span>
                    </div>
                    <hr className="border-primary/20 my-2" />
                    <div className="flex items-center justify-between">
                        <span className="font-bold">Total Course Price</span>
                        <span className="text-xl font-black text-primary">GHS {totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                {/* Group Classes Toggle */}
                <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm">Enable Group Classes</span>
                            <span className="text-xs text-muted-foreground">Allow multiple students per session</span>
                        </div>
                        <Switch checked={groupEnabled} onCheckedChange={setGroupEnabled} />
                    </div>

                    {groupEnabled && (
                        <div className="flex items-center gap-4 pt-3 border-t border-border">
                            <div className="flex flex-col gap-1">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Students</Label>
                                <div className="flex items-center">
                                    <Button type="button" variant="outline" size="icon" className="rounded-r-none" onClick={() => setMaxStudents(Math.max(1, maxStudents - 1))}>
                                        <Minus className="size-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        className="w-14 rounded-none text-center border-x-0"
                                        value={maxStudents}
                                        onChange={(e) => setMaxStudents(parseInt(e.target.value) || 1)}
                                        min={1}
                                        max={20}
                                    />
                                    <Button type="button" variant="outline" size="icon" className="rounded-l-none" onClick={() => setMaxStudents(Math.min(20, maxStudents + 1))}>
                                        <Plus className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 4: Requirements & Media */}
            <div className="bg-card rounded-xl border p-6 flex flex-col gap-6 shadow-sm">
                <h3 className="text-lg font-bold">Requirements & Media</h3>

                {/* Student Requirements */}
                <div className="space-y-3">
                    <Label>Student Requirements (Optional)</Label>
                    <p className="text-xs text-muted-foreground -mt-1">What should students have or know before taking this course?</p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Laptop with internet access"
                            value={requirementInput}
                            onChange={(e) => setRequirementInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                        />
                        <Button type="button" variant="outline" onClick={addRequirement}>
                            <Plus className="size-4" />
                        </Button>
                    </div>
                    {requirements.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {requirements.map((req) => (
                                <span key={req} className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                                    {req}
                                    <button onClick={() => removeRequirement(req)} className="hover:text-red-500">
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    {coverImage ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="sm" onClick={() => { setCoverImage(null); setCoverImageName(null) }}>
                                    <X className="size-4 mr-2" /> Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all bg-muted/30">
                            <div className="flex flex-col items-center gap-2 text-center p-4">
                                {uploading ? (
                                    <>
                                        <Loader2 className="size-8 animate-spin text-primary" />
                                        <p className="text-sm font-semibold">Uploading...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 group-hover:scale-110 transition-transform">
                                            <CloudUpload className="size-6" />
                                        </div>
                                        <p className="text-sm font-semibold">Click to upload</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF (max. 10MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Save Actions */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                    <Link href="/teacher/gigs">Cancel</Link>
                </Button>
                <Button onClick={handleSave} disabled={saving || !title || !price} className="gap-2 font-bold">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    )
}
