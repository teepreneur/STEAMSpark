"use client"

import { Search, ChevronDown, ChevronLeft, ChevronRight, Star, CheckCircle2, Video, MapPin, Blend, Users, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tables } from "@/lib/types/supabase"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type GigWithTeacher = Tables<'gigs'> & {
    teacher: Tables<'profiles'>
}

interface TutorsListProps {
    initialGigs: GigWithTeacher[]
    parentLocation?: {
        country: string | null
        city: string | null
        class_mode: string | null
    }
}

const classTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
    online: { label: "Online", icon: Video, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    in_person: { label: "In-Person", icon: MapPin, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    hybrid: { label: "Hybrid", icon: Blend, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
}

export default function TutorsList({ initialGigs, parentLocation }: TutorsListProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const highlightedGigId = searchParams.get('gig')
    const fromRoadmap = searchParams.get('from') === 'roadmap'

    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
    const [selectedClassType, setSelectedClassType] = useState<string | null>(null)
    const [groupOnly, setGroupOnly] = useState(false)
    const [showOnlyRecommended, setShowOnlyRecommended] = useState(!!highlightedGigId)

    // Check if teacher is nearby (same city and country)
    const isNearby = (teacher: any) => {
        if (!parentLocation?.city || !parentLocation?.country) return false
        if (!teacher?.city || !teacher?.country) return false
        return teacher.city.toLowerCase() === parentLocation.city.toLowerCase() &&
            teacher.country.toLowerCase() === parentLocation.country.toLowerCase()
    }

    // Clear the gig filter
    const clearGigFilter = () => {
        setShowOnlyRecommended(false)
        router.replace('/parent/tutors', { scroll: false })
    }

    // Client-side filtering for responsiveness (can be moved to server for large datasets)
    const filteredGigs = initialGigs
        .filter(gig => {
            // If we're showing only recommended course, filter to just that one
            if (showOnlyRecommended && highlightedGigId) {
                return gig.id === highlightedGigId
            }

            const matchesSearch =
                gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                gig.teacher?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                gig.description?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesSubject = selectedSubject ? gig.subject === selectedSubject : true
            const matchesClassType = selectedClassType ? (gig as any).class_type === selectedClassType : true
            const matchesGroup = groupOnly ? ((gig as any).max_students || 1) > 1 : true

            return matchesSearch && matchesSubject && matchesClassType && matchesGroup
        })
        // Sort: nearby teachers first for in-person/hybrid classes
        .sort((a, b) => {
            const aClassType = (a as any).class_type || 'online'
            const bClassType = (b as any).class_type || 'online'
            const aIsInPerson = aClassType === 'in_person' || aClassType === 'hybrid'
            const bIsInPerson = bClassType === 'in_person' || bClassType === 'hybrid'
            const aNearby = isNearby(a.teacher)
            const bNearby = isNearby(b.teacher)

            // If parent wants in-person, prioritize nearby teachers
            if (parentLocation?.class_mode === 'in_person' || parentLocation?.class_mode === 'hybrid') {
                if (aIsInPerson && aNearby && (!bIsInPerson || !bNearby)) return -1
                if (bIsInPerson && bNearby && (!aIsInPerson || !aNearby)) return 1
            }
            return 0
        })

    return (
        <div className="flex flex-col items-center">
            {/* Recommended Course Banner */}
            {showOnlyRecommended && highlightedGigId && (
                <div className="w-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-b border-primary/20">
                    <div className="max-w-[1280px] mx-auto py-4 px-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Recommended Course from Your Roadmap</p>
                                <p className="text-sm text-muted-foreground">This course was matched to help with your child's learning path</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={clearGigFilter} className="shrink-0 gap-2">
                            <X className="size-4" />
                            See All Classes
                        </Button>
                    </div>
                </div>
            )}

            {/* Page Header & Search Section */}
            <section className="w-full max-w-[1280px] py-8 md:py-12 flex flex-col gap-6">
                <div className="flex flex-col gap-3 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-[-0.033em] text-foreground">
                        {showOnlyRecommended ? (
                            <>Your <span className="text-primary">Recommended Class</span></>
                        ) : (
                            <>Find the perfect spark for your <span className="text-primary">learning journey</span></>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg font-normal">
                        {showOnlyRecommended
                            ? "This class was recommended based on your child's learning roadmap."
                            : "Connect with expert tutors in Science, Technology, Engineering, Arts, and Math."
                        }
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-3xl">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-14 overflow-hidden bg-white dark:bg-[#1a2632] border border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
                        <div className="text-muted-foreground flex items-center justify-center pl-4 pr-2">
                            <Search className="size-6" />
                        </div>
                        <input
                            className="flex w-full min-w-0 flex-1 resize-none bg-transparent text-foreground focus:outline-0 placeholder:text-muted-foreground px-2 text-base font-normal leading-normal border-none focus:ring-0"
                            placeholder="Search for Physics, Coding, or Piano..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button className="h-auto m-1 px-6 rounded-lg font-bold">
                            Search
                        </Button>
                    </div>
                </div>
            </section>

            {/* Content Grid: Sidebar + Results */}
            <div className="w-full max-w-[1280px] pb-20 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-1/4 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border lg:hidden">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <Button
                            variant="ghost"
                            className="text-primary text-sm font-medium p-0 h-auto"
                            onClick={() => { setSelectedSubject(null); setSelectedClassType(null); setGroupOnly(false); }}
                        >
                            Reset
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
                        {/* Class Type Filter */}
                        <details className="group rounded-xl border border-border bg-white dark:bg-[#1a2632] px-4 py-2" open>
                            <summary className="flex cursor-pointer items-center justify-between py-2 text-foreground font-medium select-none list-none [&::-webkit-details-marker]:hidden">
                                Class Type
                                <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="pt-2 pb-3 flex flex-col gap-2">
                                {Object.entries(classTypeConfig).map(([value, config]) => (
                                    <label key={value} className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="radio"
                                            name="classType"
                                            className="size-4 rounded border-border text-primary focus:ring-primary bg-transparent"
                                            checked={selectedClassType === value}
                                            onChange={() => setSelectedClassType(value === selectedClassType ? null : value)}
                                            onClick={(e) => {
                                                if (selectedClassType === value) {
                                                    setSelectedClassType(null)
                                                    e.currentTarget.checked = false
                                                }
                                            }}
                                        />
                                        <div className="flex items-center gap-2">
                                            <config.icon className="size-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors">{config.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </details>

                        {/* Group Option Filter */}
                        <div className="rounded-xl border border-border bg-white dark:bg-[#1a2632] p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Users className="size-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-foreground font-medium">Group Option</p>
                                        <p className="text-xs text-muted-foreground">Show classes open to groups</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={groupOnly}
                                    onChange={(e) => setGroupOnly(e.target.checked)}
                                    className="size-4 rounded border-border text-primary focus:ring-primary"
                                />
                            </label>
                        </div>

                        {/* Price Range Slider - Simplified for MVP */}
                        <div className="rounded-xl border border-border bg-white dark:bg-[#1a2632] p-5">
                            <p className="text-foreground text-base font-medium mb-4">Price Range</p>
                            <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                                <span>GHS 20</span>
                                <span>GHS 200+</span>
                            </div>
                        </div>

                        {/* Subject Area Accordion */}
                        <details className="group rounded-xl border border-border bg-white dark:bg-[#1a2632] px-4 py-2" open>
                            <summary className="flex cursor-pointer items-center justify-between py-2 text-foreground font-medium select-none list-none [&::-webkit-details-marker]:hidden">
                                Subject Area
                                <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="pt-2 pb-3 flex flex-col gap-2">
                                {["science", "technology", "engineering", "art", "math"].map((subject) => (
                                    <label key={subject} className="flex items-center gap-3 cursor-pointer group/item">
                                        <input
                                            type="radio"
                                            name="subject"
                                            className="size-4 rounded border-border text-primary focus:ring-primary bg-transparent"
                                            checked={selectedSubject === subject}
                                            onChange={() => setSelectedSubject(subject === selectedSubject ? null : subject)}
                                            onClick={(e) => {
                                                if (selectedSubject === subject) {
                                                    setSelectedSubject(null)
                                                    e.currentTarget.checked = false
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors capitalize">{subject}</span>
                                    </label>
                                ))}
                            </div>
                        </details>
                    </div>
                </aside>

                {/* Results Grid */}
                <div className="flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <p className="text-foreground font-medium">Showing <span className="font-bold">{filteredGigs.length}</span> classes</p>
                        {(selectedSubject || selectedClassType || groupOnly) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                                onClick={() => { setSelectedSubject(null); setSelectedClassType(null); setGroupOnly(false); }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredGigs.length > 0 ? (
                            filteredGigs.map((gig) => {
                                const classType = (gig as any).class_type || 'online'
                                const config = classTypeConfig[classType] || classTypeConfig.online
                                const ClassTypeIcon = config.icon
                                const nearbyTeacher = isNearby(gig.teacher) && (classType === 'in_person' || classType === 'hybrid')

                                return (
                                    <article key={gig.id} className="flex flex-col rounded-xl border border-border bg-white dark:bg-[#1a2632] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                                        {/* Cover Image */}
                                        <div
                                            className="h-32 w-full bg-cover bg-center relative"
                                            style={{
                                                backgroundImage: (gig as any).cover_image
                                                    ? `url('${(gig as any).cover_image}')`
                                                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            }}
                                        >
                                            <div className="h-full w-full bg-gradient-to-t from-black/40 to-transparent"></div>
                                            {/* Class Type Badge on Image */}
                                            <div className={cn("absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", config.color)}>
                                                <ClassTypeIcon className="size-3.5" />
                                                {config.label}
                                            </div>
                                            {/* Group Option Badge */}
                                            {((gig as any).max_students || 1) > 1 && (
                                                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-black/60 text-foreground backdrop-blur-sm border border-border/50">
                                                    <Users className="size-3" />
                                                    +Group
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 flex flex-col gap-3 flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="size-12 shrink-0 overflow-hidden rounded-full bg-gray-200 border-2 border-white shadow-sm -mt-8">
                                                    {gig.teacher?.avatar_url ? (
                                                        <img
                                                            alt={`Portrait of ${gig.teacher.full_name}`}
                                                            className="h-full w-full object-cover"
                                                            src={gig.teacher.avatar_url}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                            {gig.teacher?.full_name?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1 flex items-center gap-2">
                                                    <p className="text-sm text-muted-foreground truncate">{gig.teacher?.full_name || "Unknown Teacher"}</p>
                                                    {nearbyTeacher && (
                                                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            Near You
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2">{gig.title}</h3>

                                            <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                                                {gig.description}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="font-medium bg-secondary/50 capitalize">
                                                    {gig.subject}
                                                </Badge>
                                                <Badge variant="outline" className="font-medium">
                                                    {(gig as any).total_sessions || 1} sessions
                                                </Badge>
                                                <Badge variant="outline" className="font-medium">
                                                    {(gig as any).session_duration || 1}h each
                                                </Badge>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">Price</span>
                                                    <span className="text-lg font-bold text-foreground">GHS {(gig.price * 1.2).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/session</span></span>
                                                </div>
                                                <Button size="sm" className="font-bold" asChild>
                                                    <Link href={`/parent/book/${gig.id}`}>Book Now</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <Search className="size-12 opacity-20" />
                                <h3 className="text-lg font-bold">No classes found</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

