"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, User, Baby, Bot, Code, Calculator, FlaskConical, Palette, Cog, Flag, Loader2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const interests = [
    { id: "robotics", label: "Robotics", icon: Bot },
    { id: "coding", label: "Coding", icon: Code },
    { id: "math", label: "Math", icon: Calculator },
    { id: "science", label: "Science", icon: FlaskConical },
    { id: "arts", label: "Arts", icon: Palette },
    { id: "engineering", label: "Engineering", icon: Cog },
]

const goals = [
    { value: "explore", label: "Explore new hobbies" },
    { value: "grades", label: "Improve school grades" },
    { value: "career", label: "Prepare for future career" },
    { value: "workshops", label: "Find local workshops" },
]

export default function ParentSignupPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Parent fields
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Child fields
    const [childName, setChildName] = useState("")
    const [childAge, setChildAge] = useState("")
    const [childGrade, setChildGrade] = useState("")
    const [selectedInterests, setSelectedInterests] = useState<string[]>(["robotics"])
    const [primaryGoal, setPrimaryGoal] = useState("")

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // 1. Sign up user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'parent'
                    }
                }
            })

            if (signUpError) throw signUpError
            if (!authData.user) throw new Error("Signup failed")

            // 2. Wait for trigger to create profile
            await new Promise(resolve => setTimeout(resolve, 1000))

            // 3. Update profile with full details (trigger already created basic profile)
            await supabase.from('profiles').update({
                full_name: fullName,
                role: 'parent'
            }).eq('id', authData.user.id)

            // 4. Create first child if provided
            if (childName) {
                // Check if student already exists to avoid duplicate
                const { data: existingStudent } = await supabase
                    .from('students')
                    .select('id')
                    .eq('parent_id', authData.user.id)
                    .eq('name', childName)
                    .maybeSingle()

                if (!existingStudent) {
                    await supabase.from('students').insert({
                        parent_id: authData.user.id,
                        name: childName,
                        age: parseInt(childAge) || null,
                        grade: childGrade || null,
                        interests: selectedInterests,
                        primary_goal: primaryGoal || null
                    })
                }
            }

            router.push('/parent/dashboard')
            router.refresh()

        } catch (err: any) {
            setError(err.message || "An error occurred during signup")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-border bg-card shrink-0">
                <Link href="/" className="flex items-center">
                    <Logo size={28} variant="full" />
                </Link>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-sm text-muted-foreground">Already a member?</span>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Visual */}
                <div className="hidden lg:flex w-1/2 relative bg-[#111418] flex-col justify-end p-16">
                    <div className="absolute inset-0 z-0">
                        <div
                            className="w-full h-full bg-cover bg-center opacity-60 mix-blend-overlay"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop')" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#101922] via-[#101922]/80 to-transparent" />
                    </div>

                    <div className="relative z-10 max-w-lg">
                        <h1 className="text-4xl font-black text-white leading-tight mb-6">
                            Watch your child discover their passion
                        </h1>
                        <p className="text-lg text-gray-300 font-light leading-relaxed">
                            Join thousands of parents using STEAM Spark to find the best robotics, coding, and art resources tailored to their child's unique interests.
                        </p>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex -space-x-3">
                                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=4" />
                                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=5" />
                                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#101922]" src="https://i.pravatar.cc/100?img=6" />
                            </div>
                            <span className="text-sm font-medium text-white">Trusted by 10,000+ families</span>
                        </div>
                    </div>
                </div>

                {/* Right Form */}
                <div className="w-full lg:w-1/2 bg-card overflow-y-auto">
                    <div className="max-w-xl mx-auto px-6 py-10 lg:px-12 lg:py-16">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">Create parent account</h1>
                            <p className="text-muted-foreground">Let's get started with your details and your child's profile.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                            {/* Parent Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <User className="size-4" /> Parent Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Jane Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border" />

                            {/* Child Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Baby className="size-4" /> Learner Profile
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="childName">Child's Name</Label>
                                        <Input
                                            id="childName"
                                            placeholder="e.g. Leo"
                                            value={childName}
                                            onChange={(e) => setChildName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="childAge">Age</Label>
                                            <Input
                                                id="childAge"
                                                type="number"
                                                min="3"
                                                max="18"
                                                placeholder="8"
                                                value={childAge}
                                                onChange={(e) => setChildAge(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="childGrade">Grade</Label>
                                            <Select value={childGrade} onValueChange={setChildGrade}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="prek">Pre-K</SelectItem>
                                                    <SelectItem value="k">Kindergarten</SelectItem>
                                                    <SelectItem value="1-3">1st - 3rd</SelectItem>
                                                    <SelectItem value="4-6">4th - 6th</SelectItem>
                                                    <SelectItem value="7-9">7th - 9th</SelectItem>
                                                    <SelectItem value="10-12">10th - 12th</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Interests Grid */}
                                <div className="pt-2">
                                    <Label className="mb-3 block">What sparks their curiosity?</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {interests.map((interest) => (
                                            <button
                                                key={interest.id}
                                                type="button"
                                                onClick={() => toggleInterest(interest.id)}
                                                className={cn(
                                                    "p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all",
                                                    selectedInterests.includes(interest.id)
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <interest.icon className="size-5" />
                                                <span className="text-xs font-semibold">{interest.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Goal Selector */}
                                <div className="space-y-2">
                                    <Label>Primary Goal</Label>
                                    <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                                        <SelectTrigger className="w-full">
                                            <Flag className="size-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder="What do you want to achieve?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {goals.map((goal) => (
                                                <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 flex flex-col gap-4">
                                <Button type="submit" size="lg" className="w-full font-bold" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    By creating an account, you agree to our <a className="underline hover:text-primary" href="#">Terms of Service</a> and <a className="underline hover:text-primary" href="#">Privacy Policy</a>.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
