"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    ArrowLeft, ArrowRight, CloudUpload, X, Plus, Minus, Trash2,
    FlaskConical, Bot, Cog, Palette, Calculator, Lightbulb, Star, Loader2,
    Clock, Users, BookOpen, Target, GripVertical
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

export default function CreateGigPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 5

    // Step 1: Course Overview
    const [title, setTitle] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("engineering")
    const [description, setDescription] = useState("")

    // Step 2: Curriculum (Topics/Lessons)
    const [topics, setTopics] = useState<Topic[]>([
        { id: "1", title: "", outcome: "" }
    ])

    // Step 3: Schedule & Pricing
    const [totalSessions, setTotalSessions] = useState(4)
    const [sessionDuration, setSessionDuration] = useState(1) // hours
    const [price, setPrice] = useState("50") // per session
    const [groupEnabled, setGroupEnabled] = useState(true)
    const [maxStudents, setMaxStudents] = useState(5)
    const [classType, setClassType] = useState<'online' | 'in_person' | 'hybrid'>('online')
    const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'google_meet' | ''>('')
    const [meetingLink, setMeetingLink] = useState('')

    // Step 4: Requirements & Media
    const [requirements, setRequirements] = useState<string[]>([])
    const [requirementInput, setRequirementInput] = useState("")
    const [coverImage, setCoverImage] = useState<string | null>(null)
    const [coverImageName, setCoverImageName] = useState<string | null>(null)

    // Topic management
    const addTopic = () => {
        setTopics([...topics, { id: Date.now().toString(), title: "", outcome: "" }])
    }

    const removeTopic = (id: string) => {
        if (topics.length > 1) {
            setTopics(topics.filter(t => t.id !== id))
        }
    }

    const updateTopic = (id: string, field: 'title' | 'outcome', value: string) => {
        setTopics(topics.map(t => t.id === id ? { ...t, [field]: value } : t))
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

    const handleSaveAsDraft = async () => {
        await handleSubmit('draft')
    }

    const handlePublish = async () => {
        await handleSubmit('active')
    }

    const handleSubmit = async (status: 'draft' | 'active') => {
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Filter out empty topics
            const validTopics = topics.filter(t => t.title.trim())

            const gigData = {
                teacher_id: user.id,
                title: title || "Untitled Course",
                subject: selectedSubject,
                description,
                price: parseFloat(price) || 50,
                duration: sessionDuration * 60, // convert to minutes
                total_sessions: totalSessions,
                session_duration: sessionDuration,
                status,
                max_students: groupEnabled ? maxStudents : 1,
                cover_image: coverImage,
                requirements: requirements.length > 0 ? requirements : null,
                topics: validTopics.length > 0 ? validTopics : null,
                class_type: classType,
                meeting_platform: classType !== 'in_person' && meetingPlatform ? meetingPlatform : null,
                meeting_link: classType !== 'in_person' && meetingLink ? meetingLink : null
            }

            const { data, error: insertError } = await supabase.from('gigs').insert(gigData).select()

            if (insertError) {
                console.error("Supabase error:", insertError)
                setError(insertError.message || "Failed to create course. Please check all fields.")
                return
            }

            router.push('/teacher/gigs')
            router.refresh()

        } catch (err: any) {
            console.error("Error creating gig:", err)
            setError(err?.message || "An unexpected error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Calculate totals
    const pricePerSession = parseFloat(price) || 50
    const totalPrice = pricePerSession * totalSessions
    const totalHours = totalSessions * sessionDuration

    return (
        <div className="min-h-screen bg-background">
            {/* Back Button */}
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
                <Link href="/teacher/gigs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="size-4" /> Back to My Courses
                </Link>
            </div>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Header */}
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-2">Create a New Course</h1>
                            <p className="text-muted-foreground text-lg">Build a comprehensive learning experience for your students.</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <span className="text-primary font-bold text-sm uppercase tracking-wider">Step {currentStep} of {totalSteps}</span>
                                <span className="text-muted-foreground text-sm font-medium">
                                    {currentStep === 1 && "Overview"}
                                    {currentStep === 2 && "Curriculum"}
                                    {currentStep === 3 && "Schedule & Pricing"}
                                    {currentStep === 4 && "Requirements & Media"}
                                    {currentStep === 5 && "Review"}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                            </div>
                            <div className="hidden sm:flex justify-between text-xs font-medium text-muted-foreground mt-1">
                                <span className={cn(currentStep >= 1 && "text-primary")}>Overview</span>
                                <span className={cn(currentStep >= 2 && "text-primary")}>Curriculum</span>
                                <span className={cn(currentStep >= 3 && "text-primary")}>Schedule</span>
                                <span className={cn(currentStep >= 4 && "text-primary")}>Media</span>
                                <span className={cn(currentStep >= 5 && "text-primary")}>Review</span>
                            </div>
                        </div>

                        {/* Form Card */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 md:p-8 flex flex-col gap-8">
                                {/* STEP 1: Course Overview */}
                                {currentStep === 1 && (
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">1</span>
                                            Course Overview
                                        </h3>

                                        {/* Title */}
                                        <div className="space-y-2">
                                            <Label>Course Title *</Label>
                                            <Input
                                                placeholder="e.g., Build Your First Robot with Python"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                maxLength={80}
                                            />
                                            <p className="text-xs text-muted-foreground">Be specific about what students will achieve. Max 80 characters.</p>
                                        </div>

                                        {/* Subject Selection */}
                                        <div className="space-y-3">
                                            <Label>Primary Subject *</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                                                        <subject.icon className={cn("size-8", selectedSubject === subject.id ? "text-primary" : "text-muted-foreground")} />
                                                        <span className={cn("text-sm font-semibold", selectedSubject === subject.id ? "text-primary" : "text-muted-foreground")}>{subject.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label>Course Description *</Label>
                                            <Textarea
                                                placeholder="Describe what students will learn, who this course is for, and why they should take it..."
                                                rows={5}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Curriculum */}
                                {currentStep === 2 && (
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">2</span>
                                            Course Curriculum
                                        </h3>
                                        <p className="text-muted-foreground -mt-4">Add the topics/lessons you'll cover and what students will achieve in each.</p>

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
                                                        <Label className="text-xs">Student Outcome/Deliverable</Label>
                                                        <Input
                                                            placeholder="e.g., Students will build and test their first LED circuit"
                                                            value={topic.outcome}
                                                            onChange={(e) => updateTopic(topic.id, 'outcome', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button type="button" variant="outline" onClick={addTopic} className="gap-2">
                                            <Plus className="size-4" /> Add Another Lesson
                                        </Button>
                                    </div>
                                )}

                                {/* STEP 3: Schedule & Pricing */}
                                {currentStep === 3 && (
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">3</span>
                                            Schedule & Pricing
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Total Sessions */}
                                            <div className="space-y-2">
                                                <Label>Total Sessions Required *</Label>
                                                <div className="flex items-center">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-r-none"
                                                        onClick={() => setTotalSessions(Math.max(1, totalSessions - 1))}
                                                    >
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
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-l-none"
                                                        onClick={() => setTotalSessions(Math.min(52, totalSessions + 1))}
                                                    >
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Number of sessions to complete the course</p>
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
                                                            {hours} {hours === 1 ? "Hour" : "Hours"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price per Session */}
                                        <div className="space-y-2">
                                            <Label>Price per Session (GHS) *</Label>
                                            <div className="relative">
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
                                            <p className="text-xs text-muted-foreground">Suggested: GHS 30-100 per hour depending on subject complexity</p>
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
                                            <p className="text-xs text-muted-foreground mt-2">Total: {totalHours} hours of learning over {totalSessions} sessions</p>
                                        </div>

                                        {/* Group Classes Toggle */}
                                        <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-sm">Enable Group Classes</span>
                                                    <span className="text-xs text-muted-foreground">Allow multiple students to join a single session</span>
                                                </div>
                                                <Switch checked={groupEnabled} onCheckedChange={setGroupEnabled} />
                                            </div>

                                            {groupEnabled && (
                                                <div className="flex items-center gap-4 pt-3 border-t border-border">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Students</Label>
                                                        <div className="flex items-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="rounded-r-none"
                                                                onClick={() => setMaxStudents(Math.max(1, maxStudents - 1))}
                                                            >
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
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="rounded-l-none"
                                                                onClick={() => setMaxStudents(Math.min(20, maxStudents + 1))}
                                                            >
                                                                <Plus className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Class Type */}
                                        <div className="space-y-4">
                                            <Label className="text-base font-bold">Class Type</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['online', 'in_person', 'hybrid'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setClassType(type)}
                                                        className={cn(
                                                            "p-4 rounded-xl border-2 text-center transition-all",
                                                            classType === type
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/50"
                                                        )}
                                                    >
                                                        <span className="text-2xl mb-1 block">
                                                            {type === 'online' ? '💻' : type === 'in_person' ? '🏫' : '🔄'}
                                                        </span>
                                                        <span className="font-bold text-sm capitalize">
                                                            {type === 'in_person' ? 'In-Person' : type}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Meeting Platform (for online/hybrid) */}
                                        {classType !== 'in_person' && (
                                            <div className="space-y-3">
                                                <Label className="text-base font-bold">Preferred Meeting Platform</Label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMeetingPlatform('zoom')}
                                                        className={cn(
                                                            "flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all",
                                                            meetingPlatform === 'zoom'
                                                                ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                                        )}
                                                    >
                                                        <span className="text-xl">📹</span>
                                                        <span className="font-bold">Zoom</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMeetingPlatform('google_meet')}
                                                        className={cn(
                                                            "flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all",
                                                            meetingPlatform === 'google_meet'
                                                                ? "border-green-500 bg-green-100 dark:bg-green-900/40"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                                                        )}
                                                    >
                                                        <span className="text-xl">🎥</span>
                                                        <span className="font-bold">Google Meet</span>
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    You'll provide your meeting link when you accept a booking.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 4: Requirements & Media */}
                                {currentStep === 4 && (
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">4</span>
                                            Requirements & Media
                                        </h3>

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
                                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                                        {coverImageName}
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
                                )}

                                {/* STEP 5: Review */}
                                {currentStep === 5 && (
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">5</span>
                                            Review & Publish
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Course Summary */}
                                            <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Course Title</span>
                                                    <span className="font-medium text-right max-w-[60%]">{title || "Untitled Course"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Subject</span>
                                                    <span className="font-medium capitalize">{selectedSubject}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Sessions</span>
                                                    <span className="font-medium">{totalSessions} sessions</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Duration per Session</span>
                                                    <span className="font-medium">{sessionDuration} {sessionDuration === 1 ? "hour" : "hours"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Price per Session</span>
                                                    <span className="font-medium">GHS {pricePerSession.toFixed(2)}</span>
                                                </div>
                                                <hr className="border-border" />
                                                <div className="flex justify-between">
                                                    <span className="font-bold">Total Course Price</span>
                                                    <span className="font-bold text-primary">GHS {totalPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Class Type</span>
                                                    <span className="font-medium">{groupEnabled ? `Group (up to ${maxStudents})` : "1:1 Private"}</span>
                                                </div>
                                            </div>

                                            {/* Topics Preview */}
                                            {topics.filter(t => t.title).length > 0 && (
                                                <div className="bg-muted/30 rounded-xl p-6">
                                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                                        <BookOpen className="size-4" /> Curriculum ({topics.filter(t => t.title).length} lessons)
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {topics.filter(t => t.title).map((topic, i) => (
                                                            <div key={topic.id} className="flex items-start gap-3 text-sm">
                                                                <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                                                <div>
                                                                    <p className="font-medium">{topic.title}</p>
                                                                    {topic.outcome && <p className="text-xs text-muted-foreground">→ {topic.outcome}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Requirements Preview */}
                                            {requirements.length > 0 && (
                                                <div className="bg-muted/30 rounded-xl p-6">
                                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                                        <Target className="size-4" /> Requirements
                                                    </h4>
                                                    <ul className="space-y-1 text-sm">
                                                        {requirements.map((req) => (
                                                            <li key={req} className="flex items-center gap-2">
                                                                <span className="size-1.5 rounded-full bg-primary" />
                                                                {req}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                                    {currentStep === 1 ? (
                                        <Button variant="ghost" onClick={handleSaveAsDraft} disabled={loading}>
                                            Save as Draft
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" onClick={() => setCurrentStep(currentStep - 1)}>
                                            <ArrowLeft className="size-4 mr-2" /> Back
                                        </Button>
                                    )}

                                    {currentStep < totalSteps ? (
                                        <Button onClick={() => setCurrentStep(currentStep + 1)} className="w-full sm:w-auto">
                                            Next
                                            <ArrowRight className="size-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button onClick={handlePublish} disabled={loading} className="w-full sm:w-auto">
                                            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                                            {loading ? "Publishing..." : "Publish Course"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="sticky top-8 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Course Preview</h3>
                            </div>

                            {/* Preview Card */}
                            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                                <div
                                    className="h-40 w-full bg-cover bg-center relative bg-muted"
                                    style={{ backgroundImage: coverImage ? `url('${coverImage}')` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                                >
                                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-xs font-bold">
                                        {totalSessions} Sessions
                                    </div>
                                    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold shadow-sm">
                                        GHS {pricePerSession}/session
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <h4 className="font-bold text-lg leading-tight line-clamp-2">
                                        {title || "Your Course Title"}
                                    </h4>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" /> {sessionDuration}h/session
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="size-3" /> {groupEnabled ? `Up to ${maxStudents}` : "1:1"}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md capitalize">{selectedSubject}</span>
                                        {topics.filter(t => t.title).length > 0 && (
                                            <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-md">
                                                {topics.filter(t => t.title).length} lessons
                                            </span>
                                        )}
                                    </div>
                                    <hr className="border-border" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Course</span>
                                        <span className="font-bold text-primary">GHS {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Tip */}
                            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                                <div className="flex gap-3">
                                    <Lightbulb className="size-5 text-primary shrink-0" />
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-bold text-primary text-sm">Pro Tip</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Courses with clear outcomes and structured lessons get <span className="font-bold">3x more bookings</span>. Be specific about what students will build or achieve!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
