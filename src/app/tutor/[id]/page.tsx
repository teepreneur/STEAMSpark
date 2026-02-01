import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import {
    Check, Star, MapPin, BookOpen, Clock, Users,
    ArrowLeft, BadgeCheck, FileText, Globe, Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Tables } from "@/lib/types/supabase"
import { ShareButton } from "@/components/share-button"

interface ProfilePageProps {
    params: Promise<{ id: string }>
}

export default async function TutorProfilePage({ params }: ProfilePageProps) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Teacher Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) return notFound()
    const teacher = profile as Tables<'profiles'>

    // 2. Fetch Active Gigs
    const { data: gigs } = await supabase
        .from('gigs')
        .select('*')
        .eq('teacher_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    // 3. Fetch Reviews for rating
    const { data: reviewData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('teacher_id', id)

    // HYBRID RATING CALCULATION (Sync with Dashboard logic)
    let trustScore = 0
    // Profile Basics (20 pts)
    if (teacher.full_name) trustScore += 4
    if (teacher.bio && (teacher.bio as string).length > 20) trustScore += 4
    if (teacher.subjects && (teacher.subjects as string[]).length > 0) trustScore += 4
    if (teacher.hourly_rate) trustScore += 4
    if (teacher.avatar_url) trustScore += 4
    // Verification (30 pts)
    if (teacher.cv_url) trustScore += 10
    if (teacher.id_url) trustScore += 10
    if (teacher.photo_url) trustScore += 10

    let clientRatingPoints = (reviewData && reviewData.length > 0)
        ? (reviewData.reduce((acc, curr) => acc + curr.rating, 0) / reviewData.length / 5) * 50
        : 40 // Baseline 4.0

    const finalRating = (trustScore + clientRatingPoints) / 20
    const displayRating = Math.max(0, Math.min(5, finalRating)).toFixed(1)

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/parent/tutors" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="size-4" /> Back to Tutors
                    </Link>
                    <div className="flex items-center gap-4">
                        <ShareButton
                            title={`${teacher.full_name} - STEAM Spark Educator`}
                            text={`Check out ${teacher.full_name}'s teaching profile on STEAM Spark. Expert in ${teacher.subjects?.join(', ')}.`}
                            url={`/tutor/${teacher.id}`}
                            className="hidden sm:flex"
                        />
                        <Button size="sm" className="font-bold">Contact Teacher</Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

                    {/* Left Column: Profile Card & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm sticky top-24">
                            {/* Profile Header Background */}
                            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-background"></div>

                            <div className="px-6 pb-6">
                                {/* Avatar */}
                                <div className="relative -mt-12 mb-4">
                                    <div className="size-24 md:size-32 rounded-2xl bg-muted border-4 border-card overflow-hidden shadow-md">
                                        {teacher.avatar_url ? (
                                            <img src={teacher.avatar_url} alt={teacher.full_name || ""} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/30">
                                                {teacher.full_name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 p-1.5 bg-green-500 rounded-lg border-2 border-card shadow-sm" title="Verified Educator">
                                        <BadgeCheck className="size-5 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h1 className="text-2xl font-black text-foreground">{teacher.full_name}</h1>
                                    <p className="text-muted-foreground font-medium">STEAM Spark Educator</p>
                                </div>

                                {/* Rating & Activity */}
                                <div className="flex items-center gap-4 py-4 border-y border-border/50">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="size-4 fill-amber-400 text-amber-400" />
                                            <span className="font-bold text-lg">{displayRating}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Trust Score</span>
                                    </div>
                                    <div className="w-px h-8 bg-border"></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{gigs?.length || 0}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active Courses</span>
                                    </div>
                                </div>

                                {/* Quick Badges */}
                                <div className="mt-6 space-y-3">
                                    {teacher.cv_url && (
                                        <div className="flex items-center gap-3 text-sm text-foreground/80">
                                            <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                                                <FileText className="size-4" />
                                            </div>
                                            <span>Background Checked</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="size-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <Check className="size-4" />
                                        </div>
                                        <span>Identity Verified</span>
                                    </div>
                                    {teacher.country && (
                                        <div className="flex items-center gap-3 text-sm text-foreground/80">
                                            <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                <MapPin className="size-4" />
                                            </div>
                                            <span>Based in {teacher.city}, {teacher.country}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bio & Gigs */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Bio Section */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                <Award className="size-5" /> About Me
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {teacher.bio || "This teacher hasn't added a bio yet."}
                            </p>

                            {/* Subjects */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {teacher.subjects?.map(subject => (
                                    <Badge key={subject} variant="secondary" className="px-3 py-1 bg-secondary/30 text-foreground font-medium capitalize">
                                        {subject}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Courses Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                    <BookOpen className="size-5" /> My Courses
                                </h2>
                                <Badge variant="outline" className="font-bold">{gigs?.length || 0} Classes available</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {gigs && gigs.length > 0 ? (
                                    gigs.map(gig => (
                                        <Link
                                            key={gig.id}
                                            href={`/parent/book/${gig.id}`}
                                            className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                        >
                                            {/* Cover Image */}
                                            <div className="h-40 bg-muted relative overflow-hidden">
                                                {gig.cover_image ? (
                                                    <img src={gig.cover_image} alt={gig.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary/20 text-4xl font-black">
                                                        STEAM
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{gig.subject}</p>
                                                    <h3 className="font-bold line-clamp-1">{gig.title}</h3>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="p-4 grid grid-cols-3 divide-x divide-border">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Clock className="size-3.5 text-primary" />
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{gig.total_sessions} Sessions</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <Users className="size-3.5 text-primary" />
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{gig.max_students > 1 ? 'Group' : '1:1'}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-foreground">GHS {gig.price}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Price</span>
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="px-4 pb-4 mt-auto flex items-center gap-2">
                                                <Button variant="secondary" size="sm" className="flex-1 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-colors" asChild>
                                                    <Link href={`/parent/book/${gig.id}`}>View & Book</Link>
                                                </Button>
                                                <ShareButton
                                                    title={gig.title}
                                                    text={`Sign up for this course: ${gig.title} on STEAM Spark!`}
                                                    url={`/parent/book/${gig.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    iconOnly
                                                    className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                                                />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 px-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-center flex flex-col items-center gap-4">
                                        <div className="p-4 bg-muted rounded-full text-muted-foreground">
                                            <Sparkles className="size-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground italic">No active courses yet</h3>
                                            <p className="text-sm text-muted-foreground mt-1">This teacher is currently preparing their next educational adventure.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
