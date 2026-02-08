"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Video, Image, File, Upload, Trash2, Share2, Loader2, FolderOpen, Search, Filter, Youtube, Globe, Link2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"

interface Material {
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string | null
    file_type: string | null
    file_size: number | null
    gig_id: string | null
    visibility: string
    created_at: string
    material_type?: string | null
    link_type?: string | null
    gig?: { title: string } | null
}

const fileIcons: Record<string, React.ElementType> = {
    pdf: FileText,
    video: Video,
    image: Image,
    document: FileText,
    youtube: Youtube,
    google_drive: FolderOpen,
    website: Globe,
    link: Link2,
    default: File
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MaterialsPage() {
    const supabase = createClient()
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadMaterials = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('materials')
            .select(`
                *,
                gig:gigs(title)
            `)
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false })

        if (data) setMaterials(data)
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        loadMaterials()
    }, [loadMaterials])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this material?")) return
        setDeletingId(id)

        const { error } = await supabase.from('materials').delete().eq('id', id)
        if (!error) {
            setMaterials(materials.filter(m => m.id !== id))
        }
        setDeletingId(null)
    }

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">My Materials</h1>
                    <p className="text-muted-foreground text-base font-normal">Upload and share educational resources with your students.</p>
                </div>
                <Link href="/teacher/materials/upload">
                    <Button className="font-bold gap-2 shadow-lg" size="lg">
                        <Upload className="size-5" /> Upload New
                    </Button>
                </Link>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                        className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FolderOpen className="size-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No materials yet</h3>
                    <p className="text-muted-foreground mb-6">Upload your first educational resource to share with students.</p>
                    <Link href="/teacher/materials/upload">
                        <Button className="font-bold gap-2">
                            <Upload className="size-4" /> Upload Material
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map(material => {
                        const iconType = material.material_type === 'link'
                            ? (material.link_type || 'link')
                            : (material.file_type || 'default')
                        const IconComponent = fileIcons[iconType] || fileIcons.default
                        const isLink = material.material_type === 'link'
                        return (
                            <div key={material.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "size-12 rounded-lg flex items-center justify-center",
                                        material.link_type === 'youtube' ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                                            material.link_type === 'google_drive' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                                                material.link_type === 'website' ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                                                    material.file_type === 'pdf' ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                                                        material.file_type === 'video' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" :
                                                            material.file_type === 'image' ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                                                                "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                    )}>
                                        <IconComponent className="size-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{material.title}</h3>
                                        {material.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{material.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <Badge variant="outline" className="text-xs">
                                                {formatFileSize(material.file_size)}
                                            </Badge>
                                            {material.gig && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {material.gig.title}
                                                </Badge>
                                            )}
                                            <Badge variant={material.visibility === 'public' ? 'default' : 'outline'} className="text-xs capitalize">
                                                {material.visibility.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(material.created_at), 'MMM d, yyyy')}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                                                View
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(material.id)}
                                            disabled={deletingId === material.id}
                                        >
                                            {deletingId === material.id ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
