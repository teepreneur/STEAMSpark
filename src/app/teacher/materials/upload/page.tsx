"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Upload, FileText, X, Loader2, ArrowLeft, Check, AlertCircle,
    Link2, Youtube, FolderOpen, Globe, Image, Video
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Gig {
    id: string
    title: string
}

type MaterialType = 'file' | 'link'
type LinkType = 'youtube' | 'google_drive' | 'website' | 'other'

// Detect link type from URL
function detectLinkType(url: string): LinkType {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'google_drive'
    return 'website'
}

// Extract YouTube video ID for thumbnail
function getYouTubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
}

export default function UploadMaterialPage() {
    const supabase = createClient()
    const router = useRouter()

    // Material type toggle
    const [materialType, setMaterialType] = useState<MaterialType>('file')

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [gigs, setGigs] = useState<Gig[]>([])
    const [selectedGigId, setSelectedGigId] = useState<string>("")
    const [visibility, setVisibility] = useState<string>("enrolled_students")
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    // Link-specific state
    const [linkUrl, setLinkUrl] = useState("")
    const [linkType, setLinkType] = useState<LinkType>('website')

    useEffect(() => {
        async function loadGigs() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('gigs')
                .select('id, title')
                .eq('teacher_id', user.id)
                .order('title')

            if (data) setGigs(data)
        }
        loadGigs()
    }, [supabase])

    // Auto-detect link type when URL changes
    useEffect(() => {
        if (linkUrl) {
            setLinkType(detectLinkType(linkUrl))
        }
    }, [linkUrl])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }
        }
    }, [title])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""))
            }
        }
    }

    const getFileType = (file: File): string => {
        const type = file.type
        if (type.includes('pdf')) return 'pdf'
        if (type.includes('video')) return 'video'
        if (type.includes('image')) return 'image'
        if (type.includes('document') || type.includes('word') || type.includes('text')) return 'document'
        return 'document'
    }

    const handleUpload = async () => {
        if (!title.trim()) {
            setError("Please provide a title.")
            return
        }

        if (materialType === 'file' && !selectedFile) {
            setError("Please select a file to upload.")
            return
        }

        if (materialType === 'link' && !linkUrl.trim()) {
            setError("Please provide a URL.")
            return
        }

        setUploading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            let fileUrl = ""
            let fileName = null
            let fileType = null
            let fileSize = null

            if (materialType === 'file' && selectedFile) {
                // Upload file to Supabase Storage
                const fileExt = selectedFile.name.split('.').pop()
                const storageName = `${user.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(storageName, selectedFile)

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(storageName)

                fileUrl = urlData.publicUrl
                fileName = selectedFile.name
                fileType = getFileType(selectedFile)
                fileSize = selectedFile.size
            } else {
                // Link type
                fileUrl = linkUrl
                fileType = linkType
            }

            // Insert material record
            const { error: insertError } = await supabase.from('materials').insert({
                teacher_id: user.id,
                title: title.trim(),
                description: description.trim() || null,
                file_url: fileUrl,
                file_name: fileName,
                file_type: fileType,
                file_size: fileSize,
                gig_id: selectedGigId || null,
                visibility,
                material_type: materialType,
                link_type: materialType === 'link' ? linkType : null
            })

            if (insertError) throw insertError

            router.push('/teacher/materials')
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'Failed to upload material')
        } finally {
            setUploading(false)
        }
    }

    const youtubeId = materialType === 'link' && linkType === 'youtube' ? getYouTubeId(linkUrl) : null

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/teacher/materials" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground">Upload Material</h1>
                    <p className="text-muted-foreground">Share educational resources with your students</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                {/* Material Type Toggle */}
                <div className="space-y-3">
                    <Label>Material Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setMaterialType('file')}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                materialType === 'file'
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <div className={cn(
                                "size-10 rounded-full flex items-center justify-center",
                                materialType === 'file' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <Upload className="size-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm">File Upload</p>
                                <p className="text-xs text-muted-foreground">PDF, Images, Videos</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMaterialType('link')}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                materialType === 'link'
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <div className={cn(
                                "size-10 rounded-full flex items-center justify-center",
                                materialType === 'link' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <Link2 className="size-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm">External Link</p>
                                <p className="text-xs text-muted-foreground">YouTube, Drive, Web</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* File Drop Zone */}
                {materialType === 'file' && (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                            selectedFile && "border-green-500 bg-green-50 dark:bg-green-900/10"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mov,.webm,.jpg,.jpeg,.png,.gif,.webp"
                        />
                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="size-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Check className="size-7 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{selectedFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedFile(null)
                                    }}
                                >
                                    <X className="size-4 mr-2" /> Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="size-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Drop your file here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse</p>
                                </div>
                                <p className="text-xs text-muted-foreground">PDF, DOC, PPT, XLS, MP4, JPG up to 50MB</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Link Input */}
                {materialType === 'link' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Paste URL</Label>
                            <Input
                                placeholder="https://youtube.com/watch?v=... or any URL"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="text-base"
                            />
                        </div>

                        {linkUrl && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className={cn(
                                    "size-10 rounded-lg flex items-center justify-center",
                                    linkType === 'youtube' ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                                        linkType === 'google_drive' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                                            "bg-green-100 text-green-600 dark:bg-green-900/30"
                                )}>
                                    {linkType === 'youtube' ? <Youtube className="size-5" /> :
                                        linkType === 'google_drive' ? <FolderOpen className="size-5" /> :
                                            <Globe className="size-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm capitalize">{linkType.replace('_', ' ')} Link</p>
                                    <p className="text-xs text-muted-foreground truncate">{linkUrl}</p>
                                </div>
                                <Check className="size-5 text-green-500" />
                            </div>
                        )}

                        {/* YouTube Preview */}
                        {youtubeId && (
                            <div className="rounded-xl overflow-hidden border border-border">
                                <img
                                    src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                    alt="YouTube thumbnail"
                                    className="w-full aspect-video object-cover"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Week 1 Lesson Notes"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Briefly describe this material..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Link to Course */}
                <div className="space-y-2">
                    <Label>Assign to Course (optional)</Label>
                    <Select value={selectedGigId || "none"} onValueChange={(val) => setSelectedGigId(val === "none" ? "" : val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No specific course</SelectItem>
                            {gigs.map(gig => (
                                <SelectItem key={gig.id} value={gig.id}>{gig.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Students enrolled in this course will be able to access this material.
                    </p>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                    <Label>Who can access this?</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">Only me (Private)</SelectItem>
                            <SelectItem value="enrolled_students">Students enrolled in linked course</SelectItem>
                            <SelectItem value="public">Anyone with the link (Public)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <AlertCircle className="size-4" />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="flex-1" asChild>
                        <Link href="/teacher/materials">Cancel</Link>
                    </Button>
                    <Button
                        className="flex-1 font-bold gap-2"
                        onClick={handleUpload}
                        disabled={uploading || !title.trim() || (materialType === 'file' ? !selectedFile : !linkUrl.trim())}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" /> Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="size-4" /> Upload Material
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
