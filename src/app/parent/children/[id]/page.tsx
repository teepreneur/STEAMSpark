"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
    ArrowLeft, Loader2, Save, User, Brain, Heart, AlertCircle,
    BookOpen, Lightbulb, Star, Clock, Target
} from "lucide-react"

const interestOptions = [
    "Robotics", "Coding", "Mathematics", "Science", "Art & Design",
    "Music", "Engineering", "Physics", "Chemistry", "Biology",
    "Creative Writing", "3D Modeling", "AI/ML", "Electronics", "Data Science"
]

const learningStyleOptions = [
    { value: "visual", label: "Visual - Learns best through images, diagrams, videos" },
    { value: "auditory", label: "Auditory - Learns best through listening and discussion" },
    { value: "reading", label: "Reading/Writing - Learns best through reading and notes" },
    { value: "kinesthetic", label: "Kinesthetic - Learns best through hands-on activities" },
]

const paceOptions = [
    { value: "slow", label: "Takes time - Prefers slower, thorough explanations" },
    { value: "moderate", label: "Moderate - Balanced pace works well" },
    { value: "fast", label: "Quick learner - Can handle faster pace" },
]

interface Student {
    id: string
    name: string
    age: number | null
    grade: string | null
    interests: string[] | null
    primary_goal: string | null
    learning_goals: string | null
    // Extended fields
    learning_style: string | null
    learning_pace: string | null
    strengths: string | null
    challenges: string | null
    special_needs: string | null
    personality_notes: string | null
    preferred_schedule: string | null
    parent_notes: string | null
}

export default function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [student, setStudent] = useState<Student | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [age, setAge] = useState("")
    const [grade, setGrade] = useState("")
    const [interests, setInterests] = useState<string[]>([])
    const [primaryGoal, setPrimaryGoal] = useState("")
    const [learningGoals, setLearningGoals] = useState("")
    const [learningStyle, setLearningStyle] = useState("")
    const [learningPace, setLearningPace] = useState("")
    const [strengths, setStrengths] = useState("")
    const [challenges, setChallenges] = useState("")
    const [specialNeeds, setSpecialNeeds] = useState("")
    const [personalityNotes, setPersonalityNotes] = useState("")
    const [preferredSchedule, setPreferredSchedule] = useState("")
    const [parentNotes, setParentNotes] = useState("")

    useEffect(() => {
        async function loadStudent() {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setStudent(data)
                setName(data.name || "")
                setAge(data.age?.toString() || "")
                setGrade(data.grade || "")
                setInterests(data.interests || [])
                setPrimaryGoal(data.primary_goal || "")
                setLearningGoals(data.learning_goals || "")
                setLearningStyle(data.learning_style || "")
                setLearningPace(data.learning_pace || "")
                setStrengths(data.strengths || "")
                setChallenges(data.challenges || "")
                setSpecialNeeds(data.special_needs || "")
                setPersonalityNotes(data.personality_notes || "")
                setPreferredSchedule(data.preferred_schedule || "")
                setParentNotes(data.parent_notes || "")
            }
            setLoading(false)
        }

        loadStudent()
    }, [id, supabase])

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        )
    }

    const handleSave = async () => {
        setSaving(true)

        const { error } = await supabase
            .from('students')
            .update({
                name,
                age: age ? parseInt(age) : null,
                grade,
                interests,
                primary_goal: primaryGoal,
                learning_goals: learningGoals,
                learning_style: learningStyle,
                learning_pace: learningPace,
                strengths,
                challenges,
                special_needs: specialNeeds,
                personality_notes: personalityNotes,
                preferred_schedule: preferredSchedule,
                parent_notes: parentNotes
            })
            .eq('id', id)

        if (!error) {
            router.push('/parent/settings')
        } else {
            alert("Failed to save. Please try again.")
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

    if (!student) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Student not found</h1>
                <Button asChild>
                    <Link href="/parent/settings">Back to Settings</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <Link href="/parent/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="size-4" /> Back to Settings
                </Link>
                <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save Changes
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold mb-2">Edit Profile: {student.name}</h1>
                <p className="text-muted-foreground">
                    Complete your child's profile to help AI make better recommendations and give teachers insights.
                </p>
            </div>

            {/* Basic Information */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <User className="size-5 text-primary" />
                    Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Child's name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Age</Label>
                            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="10" />
                        </div>
                        <div className="space-y-2">
                            <Label>Grade</Label>
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
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
            </section>

            {/* Interests */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Heart className="size-5 text-pink-500" />
                    Interests & Passions
                </h2>
                <p className="text-sm text-muted-foreground mb-4">Select all that apply. This helps us recommend the best tutors and courses.</p>
                <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                                interests.includes(interest)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50"
                            )}
                        >
                            {interest}
                        </button>
                    ))}
                </div>
            </section>

            {/* Learning Style */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Brain className="size-5 text-purple-500" />
                    Learning Style
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>How does your child learn best?</Label>
                        <Select value={learningStyle} onValueChange={setLearningStyle}>
                            <SelectTrigger><SelectValue placeholder="Select learning style" /></SelectTrigger>
                            <SelectContent>
                                {learningStyleOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Learning Pace</Label>
                        <Select value={learningPace} onValueChange={setLearningPace}>
                            <SelectTrigger><SelectValue placeholder="Select pace" /></SelectTrigger>
                            <SelectContent>
                                {paceOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* Strengths & Challenges */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="size-5 text-yellow-500" />
                    Strengths & Challenges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Strengths</Label>
                        <Textarea
                            value={strengths}
                            onChange={(e) => setStrengths(e.target.value)}
                            placeholder="What is your child good at? e.g., Creative thinking, problem solving, patient..."
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Areas for Improvement</Label>
                        <Textarea
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            placeholder="What does your child struggle with? e.g., Focus, math skills, reading..."
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            {/* Special Considerations */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="size-5 text-orange-500" />
                    Special Considerations
                </h2>
                <p className="text-sm text-muted-foreground mb-4">This information helps teachers adapt their approach. All information is kept confidential.</p>
                <div className="space-y-2">
                    <Label>Special Needs or Accommodations (Optional)</Label>
                    <Textarea
                        value={specialNeeds}
                        onChange={(e) => setSpecialNeeds(e.target.value)}
                        placeholder="e.g., ADHD - needs frequent breaks, Dyslexia - prefers audio materials, Anxiety - needs encouragement..."
                        rows={3}
                    />
                </div>
            </section>

            {/* Goals */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="size-5 text-green-500" />
                    Goals & Aspirations
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Primary Goal</Label>
                        <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                            <SelectTrigger><SelectValue placeholder="What's the main goal?" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="explore">Explore new hobbies</SelectItem>
                                <SelectItem value="grades">Improve school grades</SelectItem>
                                <SelectItem value="career">Prepare for future career</SelectItem>
                                <SelectItem value="competition">Prepare for competitions</SelectItem>
                                <SelectItem value="confidence">Build confidence</SelectItem>
                                <SelectItem value="skills">Develop specific skills</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Detailed Learning Goals</Label>
                        <Textarea
                            value={learningGoals}
                            onChange={(e) => setLearningGoals(e.target.value)}
                            placeholder="What do you hope your child will achieve? e.g., Learn Python basics, build a robot, improve math grades..."
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            {/* Additional Notes */}
            <section className="bg-card rounded-xl border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="size-5 text-blue-500" />
                    Notes for Teachers
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Personality & Communication Style</Label>
                        <Textarea
                            value={personalityNotes}
                            onChange={(e) => setPersonalityNotes(e.target.value)}
                            placeholder="e.g., Shy at first but opens up, very talkative, needs clear instructions..."
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Preferred Schedule</Label>
                        <Textarea
                            value={preferredSchedule}
                            onChange={(e) => setPreferredSchedule(e.target.value)}
                            placeholder="e.g., Best focus in mornings, avoid Mondays, max 1 hour sessions..."
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Anything else teachers should know?</Label>
                        <Textarea
                            value={parentNotes}
                            onChange={(e) => setParentNotes(e.target.value)}
                            placeholder="Any other information that would help a teacher work better with your child..."
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 font-bold px-8">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save Profile
                </Button>
            </div>
        </div>
    )
}
