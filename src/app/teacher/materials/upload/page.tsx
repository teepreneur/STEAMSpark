"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, FileText, X, Loader2, ArrowLeft, Check, AlertCircle } from "lucide-react"
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

export default function UploadMaterialPage() {
    const supabase = createClient()
    const router = useRouter()

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [gigs, setGigs] = useState<Gig[]>([])
    const [selectedGigId, setSelectedGigId] = useState<string>("")
    const [visibility, setVisibility] = useState<string>("enrolled_students")
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

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
            setSelectedFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
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
        if (!selectedFile || !title.trim()) {
            setError("Please provide a title and select a file.")
            return
        }

        setUploading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Upload file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('materials')
                .upload(fileName, selectedFile)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('materials')
                .getPublicUrl(fileName)

            // Insert material record
            const { error: insertError } = await supabase.from('materials').insert({
                teacher_id: user.id,
                title: title.trim(),
                description: description.trim() || null,
                file_url: urlData.publicUrl,
                file_name: selectedFile.name,
                file_type: getFileType(selectedFile),
                file_size: selectedFile.size,
                gig_id: selectedGigId || null,
                visibility
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
                {/* File Drop Zone */}
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
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mov,.jpg,.jpeg,.png,.gif"
                    />
                    {selectedFile ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-14 rounded-full bg-green-100 flex items-center justify-center">
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
                    <Label>Link to Course (optional)</Label>
                    <Select value={selectedGigId} onValueChange={setSelectedGigId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">No specific course</SelectItem>
                            {gigs.map(gig => (
                                <SelectItem key={gig.id} value={gig.id}>{gig.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                        disabled={uploading || !selectedFile || !title.trim()}
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
