"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createChildProfile, verifyOnboardingLink } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Bot, Code, Calculator, FlaskConical, Palette, Cog, CheckCircle2, Loader2, Sparkles, GraduationCap, Target, MapPin, Globe, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import LocationPicker from "@/components/location-picker"
import { Badge } from "@/components/ui/badge"

const interests = [
    { id: "robotics", label: "Robotics", icon: Bot },
    { id: "coding", label: "Coding", icon: Code },
    { id: "math", label: "Math", icon: Calculator },
    { id: "science", label: "Science", icon: FlaskConical },
    { id: "arts", label: "Arts", icon: Palette },
    { id: "engineering", label: "Engineering", icon: Cog },
]

const grades = [
    { value: "prek", label: "Pre-K" },
    { value: "k", label: "Kindergarten" },
    { value: "1-3", label: "1st - 3rd Grade" },
    { value: "4-6", label: "4th - 6th Grade" },
    { value: "7-9", label: "7th - 9th Grade" },
    { value: "10-12", label: "10th - 12th Grade" },
]

const primaryGoals = [
    { value: "explore", label: "Explore new hobbies" },
    { value: "grades", label: "Improve school grades" },
    { value: "career", label: "Prepare for future career" },
    { value: "competition", label: "Prepare for competitions" },
    { value: "confidence", label: "Build confidence" },
    { value: "skills", label: "Develop specific skills" },
]

function OnboardingContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const parentId = searchParams.get("id")
    
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [parentName, setParentName] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedInterests, setSelectedInterests] = useState<string[]>([])

    // Location & Mode State
    const [preferredClassMode, setPreferredClassMode] = useState<'online' | 'in_person' | null>(null)
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [address, setAddress] = useState("")

    useEffect(() => {
        if (!parentId) {
            setError("Missing onboarding link details.")
            setVerifying(false)
            return
        }

        async function verify() {
            const result = await verifyOnboardingLink(parentId!)
            if (result.error) {
                setError(result.error)
            } else if (result.full_name) {
                setParentName(result.full_name)
            }
            setVerifying(false)
        }

        verify()
    }, [parentId])

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (preferredClassMode === 'in_person' && (!latitude || !longitude)) {
            alert("Please pin your location on the map for in-person classes.")
            return
        }

        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        // Add manual fields
        selectedInterests.forEach(i => formData.append('interests', i))
        formData.append('parent_id', parentId || '')
        
        // Add location & mode
        if (preferredClassMode) formData.append('preferred_class_mode', preferredClassMode)
        if (latitude) formData.append('latitude', latitude.toString())
        if (longitude) formData.append('longitude', longitude.toString())
        if (address) formData.append('address', address)

        const result = await createChildProfile(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl border-t-4 border-t-green-500">
                    <div className="mx-auto size-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="size-10 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Awesome!</h1>
                        <p className="text-muted-foreground mt-2">
                            {parentName}, your child's profile has been updated. Our STEAM Spark instructors are ready to help!
                        </p>
                    </div>
                    <Button className="w-full font-bold shadow-lg" onClick={() => router.push('/login')}>
                        Log In to your Dashboard
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <Logo size={48} variant="full" />
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to the Family!</h1>
                        <p className="text-slate-500 font-medium max-w-md">
                            Hi <span className="text-primary font-bold">{parentName}</span>, let's build your learner's profile to find the best classes for them.
                        </p>
                    </div>
                </div>

                {error && (
                    <Card className="border-destructive/20 bg-destructive/5 text-destructive p-4 text-center">
                        {error}
                    </Card>
                )}

                {!error && (
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
                            <CardHeader className="bg-slate-900 text-white p-8">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary-foreground animate-pulse" />
                                    Learner Profile
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Tell us about your child so we can tailor their experience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Child's Name *</Label>
                                        <Input id="name" name="name" required placeholder="e.g. Ama" className="h-12 text-lg" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dob">Date of Birth *</Label>
                                            <Input id="dob" name="dob" type="date" required className="h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <select name="gender" className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not_to_say">Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="school">Current School</Label>
                                        <Input id="school" name="school" placeholder="What school do they attend?" className="h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="grade">Grade</Label>
                                        <select name="grade" className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                            <option value="">Select Grade</option>
                                            {grades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Interests */}
                                <div className="space-y-4">
                                    <Label className="text-base font-bold text-slate-900">What sparks their curiosity?</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {interests.map((interest) => (
                                            <button
                                                key={interest.id}
                                                type="button"
                                                onClick={() => toggleInterest(interest.id)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group",
                                                    selectedInterests.includes(interest.id)
                                                        ? "bg-primary/5 border-primary text-primary shadow-inner"
                                                        : "border-slate-100 hover:border-primary/50 text-slate-500 hover:text-slate-900 bg-white"
                                                )}
                                            >
                                                <interest.icon className={cn("size-6 group-hover:scale-110 transition-transform", selectedInterests.includes(interest.id) && "animate-bounce")} />
                                                <span className="text-xs font-black uppercase tracking-wider">{interest.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Academic Preferences */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-base font-bold text-slate-900">Top 2 subjects they enjoy the most?</Label>
                                        <p className="text-xs text-muted-foreground mb-2">Select or type subjects your child loves.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input name="favorite_subjects" placeholder="Subject 1" className="h-11" />
                                            <Input name="favorite_subjects" placeholder="Subject 2" className="h-11" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-base font-bold text-slate-900">Top 2 subjects they dislike the most?</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input name="disliked_subjects" placeholder="Subject 1" className="h-11" />
                                            <Input name="disliked_subjects" placeholder="Subject 2" className="h-11" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Lifestyle & Habits */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="spare_time_activities" className="text-base font-bold text-slate-900">What do they do in their spare time?</Label>
                                        <Textarea 
                                            id="spare_time_activities" 
                                            name="spare_time_activities" 
                                            placeholder="Reading, gaming, sports, tech, etc..." 
                                            className="min-h-[80px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-base font-bold text-slate-900">Which personal devices do they have?</Label>
                                        <div className="flex flex-wrap gap-4">
                                            {['Laptop', 'Desktop', 'Tablet', 'Phone'].map(device => (
                                                <label key={device} className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="checkbox" name="personal_devices" value={device.toLowerCase()} className="size-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{device}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="study_habits" className="text-base font-bold text-slate-900">How do they handle studying for long hours?</Label>
                                        <Textarea 
                                            id="study_habits" 
                                            name="study_habits" 
                                            placeholder="e.g. Needs frequent breaks, very focused, prefers evenings..." 
                                            className="min-h-[80px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Class Mode & Location */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <Sparkles className="size-5 text-primary" />
                                            How should your child learn? *
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                key="online"
                                                type="button"
                                                onClick={() => setPreferredClassMode('online')}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                                                    preferredClassMode === 'online'
                                                        ? "bg-primary text-white border-primary shadow-lg scale-105"
                                                        : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                                                )}
                                            >
                                                <Globe className="size-8" />
                                                <div className="text-center">
                                                    <p className="font-bold">Online</p>
                                                    <p className="text-[10px] opacity-80 uppercase font-black">Virtual Classrooms</p>
                                                </div>
                                            </button>
                                            <button
                                                key="in_person"
                                                type="button"
                                                onClick={() => setPreferredClassMode('in_person')}
                                                className={cn(
                                                    "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                                                    preferredClassMode === 'in_person'
                                                        ? "bg-primary text-white border-primary shadow-lg scale-105"
                                                        : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                                                )}
                                            >
                                                <Home className="size-8" />
                                                <div className="text-center">
                                                    <p className="font-bold">In-Person</p>
                                                    <p className="text-[10px] opacity-80 uppercase font-black">Home Tuition</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {preferredClassMode === 'in_person' && (
                                        <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <MapPin className="size-4 text-primary" />
                                                    Set Class Location
                                                </Label>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">Required</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Please pin the exact location where the classes will take place (e.g. your home).
                                            </p>
                                            <LocationPicker
                                                onLocationSelect={(loc) => {
                                                    setLatitude(loc.lat)
                                                    setLongitude(loc.lng)
                                                    setAddress(loc.address)
                                                }}
                                                defaultLocation={latitude && longitude ? {
                                                    lat: latitude,
                                                    lng: longitude,
                                                    address: address
                                                } : undefined}
                                            />
                                            {address && (
                                                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-100 flex items-start gap-3">
                                                    <CheckCircle2 className="size-4 text-green-500 mt-0.5" />
                                                    <div className="text-xs">
                                                        <p className="font-bold text-slate-900">Location Selected:</p>
                                                        <p className="text-slate-500">{address}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Goals */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="primary_goal" className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <Target className="size-5 text-green-500" />
                                            Primary Learning Goal
                                        </Label>
                                        <select name="primary_goal" className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                            <option value="">What's the main objective?</option>
                                            {primaryGoals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="goals" className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <GraduationCap className="size-5 text-primary" />
                                            Tell us more about their learning needs
                                        </Label>
                                        <Textarea 
                                            id="goals" 
                                            name="goals" 
                                            placeholder="Any specific topics or skills you want them to master?" 
                                            className="min-h-[100px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-base"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 p-8 border-t border-slate-100">
                                <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-black shadow-xl hover:translate-y-[-2px] transition-all">
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-5 mr-2 animate-spin" />
                                            Saving Profile...
                                        </>
                                    ) : (
                                        <>
                                            Complete Profile
                                            <Sparkles className="size-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                )}
            </div>
        </div>
    )
}

export default function ChildOnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}
