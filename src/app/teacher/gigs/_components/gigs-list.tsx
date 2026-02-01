"use client"

import {
    Ticket, DollarSign, Eye, Star, Search,
    Edit, Trash2, Power, Loader2, Share2
} from "lucide-react"
import { ShareButton } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tables } from "@/lib/types/supabase"

interface GigsListProps {
    initialGigs: Tables<'gigs'>[]
}

export function GigsList({ initialGigs }: GigsListProps) {
    const supabase = createClient()
    const router = useRouter()
    const [gigs, setGigs] = useState(initialGigs)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this gig? This cannot be undone.")) return

        setLoadingId(id)

        // Check if there are any bookings for this gig
        const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('gig_id', id)

        if (bookingCount && bookingCount > 0) {
            alert(`This gig has ${bookingCount} booking${bookingCount > 1 ? 's' : ''} and cannot be deleted.\n\nTo remove it from your listings, you can archive it instead by toggling it to "Draft" status.`)
            setLoadingId(null)
            return
        }

        const { error } = await supabase.from('gigs').delete().eq('id', id)

        if (!error) {
            setGigs(gigs.filter(g => g.id !== id))
        } else {
            console.error("Delete error:", error)
            alert(`Failed to delete gig: ${error.message}`)
        }
        setLoadingId(null)
    }

    async function handleToggleStatus(id: string, currentStatus: string | null) {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active'

        setLoadingId(id)
        const { error } = await supabase
            .from('gigs')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setGigs(gigs.map(g => g.id === id ? { ...g, status: newStatus } : g))
        } else {
            alert("Failed to update status.")
        }
        setLoadingId(null)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="size-5 text-primary" />
                        <p className="text-sm font-medium">Total Gigs</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{gigs.length}</p>
                </div>
                <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Power className="size-5 text-green-500" />
                        <p className="text-sm font-medium">Live</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{gigs.filter(g => g.status === 'active').length}</p>
                </div>
                <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="size-5 text-orange-500" />
                        <p className="text-sm font-medium">Drafts</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{gigs.filter(g => g.status === 'draft').length}</p>
                </div>
                <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="size-5 text-purple-500" />
                        <p className="text-sm font-medium">Avg. Rating</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">4.9</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent" placeholder="Search your gigs by title or tag..." />
                </div>
                <div className="flex gap-2 w-full md:w-auto px-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[140px] border-none bg-muted/50 rounded-lg">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Gigs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                {gigs.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <p>No gigs found. Create your first gig!</p>
                    </div>
                ) : (
                    gigs.map((gig) => (
                        <article key={gig.id} className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group">
                            <div className="relative h-48 bg-muted">
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        backgroundImage: gig.cover_image
                                            ? `url('${gig.cover_image}')`
                                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    }}
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                {gig.status === 'active' && (
                                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-green-600 border border-border/20">
                                        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> Live</span>
                                    </div>
                                )}
                                {gig.status === 'draft' && (
                                    <div className="absolute top-3 left-3 bg-muted px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Draft
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 text-white">
                                    <Badge className="bg-primary hover:bg-primary font-bold uppercase tracking-wide">{gig.subject || 'General'}</Badge>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-4 flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold text-lg text-foreground leading-tight">{gig.title}</h3>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-lg text-primary">GHS {gig.price}</span>
                                        <span className="text-xs text-muted-foreground font-normal">per session</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {gig.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground">Duration: {gig.duration || 60}m</span>
                                        {gig.class_type && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                                                gig.class_type === 'online'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : gig.class_type === 'in_person'
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                            )}>
                                                {gig.class_type === 'online' ? '💻 Online'
                                                    : gig.class_type === 'in_person' ? '🏫 In-Person'
                                                        : '🔄 Hybrid'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Toggle Live/Draft */}
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className={cn(
                                                "rounded-full size-8 transition-colors",
                                                gig.status === 'active'
                                                    ? "bg-green-100 text-green-600 hover:bg-yellow-100 hover:text-yellow-600"
                                                    : "bg-muted hover:bg-green-100 hover:text-green-600"
                                            )}
                                            onClick={() => handleToggleStatus(gig.id, gig.status)}
                                            disabled={loadingId === gig.id}
                                            title={gig.status === 'active' ? 'Take Offline' : 'Go Live'}
                                        >
                                            {loadingId === gig.id ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                                        </Button>
                                        {/* Share */}
                                        <ShareButton
                                            title={gig.title}
                                            text={`Check out my course on STEAM Spark: ${gig.title}!`}
                                            url={`/parent/book/${gig.id}`}
                                            variant="secondary"
                                            size="icon"
                                            iconOnly
                                            className="rounded-full size-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                        />
                                        {/* Edit */}
                                        <Button size="icon" variant="secondary" className="rounded-full size-8 hover:bg-primary hover:text-white transition-colors" asChild>
                                            <Link href={`/teacher/gigs/${gig.id}/edit`}>
                                                <Edit className="size-4" />
                                            </Link>
                                        </Button>
                                        {/* Delete */}
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="rounded-full size-8 hover:bg-red-500 hover:text-white transition-colors"
                                            onClick={() => handleDelete(gig.id)}
                                            disabled={loadingId === gig.id}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    )
}
