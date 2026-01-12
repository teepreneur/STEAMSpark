"use client"

import {
    ArrowLeft, ArrowRight, CloudUpload, X,
    FlaskConical, Cpu, Wrench, Palette, Calculator,
    Type, Italic, Underline, List, Link as LinkIcon,
    Lightbulb, Star, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CreateGigPage() {
    const supabase = createClient()
    const router = useRouter()

    // Form State
    const [title, setTitle] = useState("")
    const [subject, setSubject] = useState("engineer")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState(40)
    const [duration, setDuration] = useState(60)

    const [loading, setLoading] = useState(false)

    async function handleCreateGig() {
        setLoading(true)

        // internal check to get user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert("You must be logged in to create a gig.")
            setLoading(false)
            return
        }

        const { error } = await supabase.from('gigs').insert({
            title,
            description,
            price,
            duration,
            subject,
            teacher_id: user.id,
            status: 'active' // For simplicity in this demo, defaulting to active
        })

        if (error) {
            console.error("Error creating gig:", error)
            alert("Failed to create gig. Check console for details.")
        } else {
            router.push('/teacher/gigs')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">

            {/* Back Button */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/teacher/gigs" className="flex items-center gap-1 hover:text-primary transition-colors">
                    <ArrowLeft className="size-4" /> Back to My Gigs
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-2 text-foreground">Create a New Gig</h1>
                        <p className="text-muted-foreground text-lg">Share your expertise and inspire the next generation of creators.</p>
                    </div>

                    {/* Progress Bar (Static for now) */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-primary font-bold text-sm uppercase tracking-wider">Step 1 of 4</span>
                            <span className="text-muted-foreground text-sm font-medium">Basics</span>
                        </div>
                        <Progress value={25} className="h-2" />
                    </div>

                    {/* Form Container */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 flex flex-col gap-8">

                            {/* Section 1: Gig Overview */}
                            <div className="flex flex-col gap-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm">1</span>
                                    Gig Overview
                                </h3>

                                <div className="space-y-2">
                                    <Label className="font-medium text-foreground">Gig Title</Label>
                                    <Input
                                        placeholder="e.g., Intro to Robotics with Python"
                                        className="h-12 text-base"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={60}
                                    />
                                    <p className="text-xs text-muted-foreground">Keep it short and catchy. Max 60 characters.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-foreground">Primary Subject</Label>
                                    <RadioGroup value={subject} onValueChange={setSubject} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {[
                                            { id: 'science', icon: FlaskConical, label: 'Science' },
                                            { id: 'tech', icon: Cpu, label: 'Tech' },
                                            { id: 'engineer', icon: Wrench, label: 'Engineer' },
                                            { id: 'arts', icon: Palette, label: 'Arts' },
                                            { id: 'math', icon: Calculator, label: 'Math' },
                                        ].map((subj) => (
                                            <div key={subj.id}>
                                                <RadioGroupItem value={subj.id} id={subj.id} className="peer sr-only" />
                                                <Label
                                                    htmlFor={subj.id}
                                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:bg-primary/5 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all text-muted-foreground peer-data-[state=checked]:text-primary"
                                                >
                                                    <subj.icon className="size-8" />
                                                    <span className="text-sm font-semibold text-center">{subj.label}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="font-medium text-foreground">Price ($/hr)</Label>
                                        <Label className="font-medium text-foreground">Duration (min)</Label>
                                    </div>
                                    <div className="flex gap-4">
                                        <Input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            className="h-12"
                                        />
                                        <Input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-foreground">Description</Label>
                                    <Textarea
                                        placeholder="Describe your class..."
                                        rows={5}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <hr className="border-border" />

                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                                <Button variant="ghost" className="w-full sm:w-auto font-bold h-12">Cancel</Button>
                                <Button
                                    className="w-full sm:w-auto font-bold h-12 gap-2 shadow-lg"
                                    size="lg"
                                    onClick={handleCreateGig}
                                    disabled={loading || !title}
                                >
                                    {loading ? "Creating..." : "Create Gig"} <ArrowRight className="size-5" />
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Preview & Tips */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="sticky top-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Preview</h3>
                        </div>

                        {/* Preview Card */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                            <div className="h-48 w-full bg-muted relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581092921461-eab62e97a786?q=80&w=400&auto=format&fit=crop')" }}>
                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 px-2 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-sm text-foreground">
                                    ${price}/hr
                                </div>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-lg leading-tight line-clamp-2 text-foreground">{title || "Your Gig Title"}</h4>
                                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold whitespace-nowrap bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                        <Star className="size-3 fill-current" />
                                        <span>NEW</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold capitalize">{subject}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Pro Tip Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50">
                            <div className="flex gap-3">
                                <Lightbulb className="text-primary size-5 shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <h4 className="font-bold text-primary text-sm">Pro Tip</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Gigs with a specific outcome in the title (e.g., &quot;Build your first robot&quot;) get <span className="font-bold text-foreground">2x more clicks</span> than generic titles.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
